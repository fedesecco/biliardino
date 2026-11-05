import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppStore } from './app-store.service';
import type { Database } from './database.types';
import { SupabaseService } from './supabase.service';

type Play = Database['public']['Tables']['active_play']['Row'];
type Snapshot = { data: Play; error: null };

const players = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
  id,
  name: id,
  avatar_color: '#123456',
  type: 'male' as const,
  current_elo: 1000,
  current_win_streak: 0,
  active: true,
  created_at: '2026-11-05T10:00:00Z',
  updated_at: '2026-11-05T10:00:00Z',
}));

function state(revision: number, changes: Partial<Play> = {}): Play {
  return {
    id: true,
    round_id: 'round-one',
    revision,
    phase: 'playing',
    candidates: players.map((player) => player.id),
    red_preferences: ['a'],
    blue_preferences: ['c'],
    balance_by_elo: true,
    red_players: ['a', 'b'],
    blue_players: ['c', 'd'],
    red_score: 0,
    blue_score: 0,
    updated_at: '2026-11-05T10:00:00Z',
    ...changes,
  };
}

function setup(authorized = true) {
  let onState: (payload: { new: Play }) => void = () => undefined;
  let onStatus: (status: string) => void = () => undefined;
  let onSystem: (payload: { extension: string; status: string }) => void = () => undefined;
  const readSnapshot = vi.fn<() => Promise<Snapshot>>().mockResolvedValue({
    data: state(1), error: null,
  });
  const rpc = vi.fn();
  const companyUser = signal(authorized);
  const playSubscriptions = vi.fn();
  const client = {
    channel(name: string) {
      const channel = {
        state: 'joined',
        on(event: string, filter: { table?: string }, callback: unknown) {
          if (filter.table === 'active_play') onState = callback as typeof onState;
          if (event === 'system') onSystem = callback as typeof onSystem;
          return channel;
        },
        subscribe(callback?: typeof onStatus) {
          if (callback) onStatus = callback;
          if (name === 'active-play-live') playSubscriptions();
          return channel;
        },
      };
      return channel;
    },
    removeChannel: vi.fn().mockResolvedValue('ok'),
    rpc,
    from(table: string) {
      const result = { data: table === 'players' ? players : [], error: null };
      const query = {
        select: () => query,
        eq: () => query,
        order: () => Promise.resolve(result),
        single: readSnapshot,
      };
      return query;
    },
  };
  TestBed.configureTestingModule({
    providers: [{
      provide: SupabaseService,
      useValue: { configured: signal(true), companyUser, client },
    }],
  });
  const store = TestBed.inject(AppStore);
  TestBed.tick();
  return {
    store, readSnapshot, rpc, companyUser, playSubscriptions,
    receive: (value: Play) => onState({ new: value }),
    status(value: string, databaseReady = true) {
      onStatus(value);
      if (value === 'SUBSCRIBED' && databaseReady) {
        onSystem({ extension: 'postgres_changes', status: 'ok' });
      }
    },
    system: (status: string) => onSystem({ extension: 'postgres_changes', status }),
  };
}

describe('AppStore shared game synchronization', () => {
  it('does not read or subscribe to a game while logged out, including reconnect events', async () => {
    const { store, companyUser, playSubscriptions, readSnapshot, status } = setup(false);
    await store.retryPlaySync();
    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(readSnapshot).not.toHaveBeenCalled();
    expect(playSubscriptions).not.toHaveBeenCalled();
    expect(store.playDraft()).toBeNull();
    companyUser.set(true);
    TestBed.tick();
    status('SUBSCRIBED');
    await vi.waitFor(() => expect(store.playConnected()).toBe(true));
    expect(store.playDraft()?.red.map((player) => player.id)).toEqual(['a', 'b']);
  });

  it('clears the game on logout and ignores late events and pending snapshots', async () => {
    const { store, companyUser, readSnapshot, status, receive } = setup();
    let resolve!: (snapshot: Snapshot) => void;
    readSnapshot.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    status('SUBSCRIBED');
    companyUser.set(false);
    TestBed.tick();
    receive(state(9, { red_score: 5 }));
    resolve({ data: state(8, { red_score: 4 }), error: null });
    await Promise.resolve();
    expect(store.playDraft()).toBeNull();
    expect(store.playScore()).toEqual({ red: 0, blue: 0 });
    expect(store.playReady()).toBe(false);
    expect(store.playConnected()).toBe(false);
    companyUser.set(true);
    TestBed.tick();
    status('SUBSCRIBED');
    await vi.waitFor(() => expect(store.playConnected()).toBe(true));
    expect(store.playScore()).toEqual({ red: 0, blue: 0 });
  });

  it('loads an already running game including the shared bench and preferences', async () => {
    const { store, status } = setup();
    status('SUBSCRIBED');
    await vi.waitFor(() => expect(store.playConnected()).toBe(true));
    expect(store.playDraft()?.red.map((player) => player.id)).toEqual(['a', 'b']);
    expect(store.playDraft()?.benched.map((player) => player.id)).toEqual(['e']);
    expect(store.playSelection().get('a')).toBe('red');
    expect(store.playSelection().get('c')).toBe('blue');
  });

  it('does not replace a newer realtime score with a delayed initial snapshot', async () => {
    const { store, readSnapshot, receive, status } = setup();
    let resolve!: (snapshot: Snapshot) => void;
    readSnapshot.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    status('SUBSCRIBED');
    receive(state(4, { red_score: 3 }));
    resolve({ data: state(2, { red_score: 1 }), error: null });
    await vi.waitFor(() => expect(store.playConnected()).toBe(true));
    expect(store.playScore()).toEqual({ red: 3, blue: 0 });
    receive(state(3, { red_score: 2 }));
    expect(store.playScore()).toEqual({ red: 3, blue: 0 });
  });

  it('blocks offline edits and recovers missed scores on a new subscription', async () => {
    const { store, readSnapshot, status } = setup();
    status('SUBSCRIBED');
    await vi.waitFor(() => expect(store.playConnected()).toBe(true));
    status('CHANNEL_ERROR');
    await expect(store.changePlay('goal', 'red')).rejects.toThrow('sincronizzazione');
    expect(store.playScore()).toEqual({ red: 0, blue: 0 });
    readSnapshot.mockResolvedValueOnce({ data: state(7, { blue_score: 4 }), error: null });
    status('SUBSCRIBED');
    await vi.waitFor(() => expect(store.playConnected()).toBe(true));
    expect(store.playScore()).toEqual({ red: 0, blue: 4 });
    expect(store.playSyncError()).toBeNull();
  });

  it('rejects a stale command and displays the authoritative score instead of optimistic data', async () => {
    const { store, readSnapshot, status, rpc } = setup();
    status('SUBSCRIBED');
    await vi.waitFor(() => expect(store.playConnected()).toBe(true));
    rpc.mockResolvedValueOnce({ data: null, error: new Error('Partita aggiornata da un altro dispositivo') });
    readSnapshot.mockResolvedValueOnce({ data: state(2, { red_score: 1 }), error: null });
    await expect(store.changePlay('goal', 'red')).rejects.toThrow('altro dispositivo');
    expect(store.playScore()).toEqual({ red: 1, blue: 0 });
    expect(store.playConnected()).toBe(true);
  });

  it('waits for a fresh subscription before enabling edits after manual recovery', async () => {
    const { store, readSnapshot, status, receive } = setup();
    status('SUBSCRIBED');
    await vi.waitFor(() => expect(store.playConnected()).toBe(true));
    await store.retryPlaySync();
    expect(store.playConnected()).toBe(false);
    await expect(store.changePlay('goal', 'red')).rejects.toThrow('sincronizzazione');
    readSnapshot.mockResolvedValueOnce({ data: state(2, { red_score: 1 }), error: null });
    status('SUBSCRIBED');
    await vi.waitFor(() => expect(store.playConnected()).toBe(true));
    receive(state(3, { red_score: 2 }));
    expect(store.playScore()).toEqual({ red: 2, blue: 0 });
  });

  it('does not confuse a joined socket with an active database subscription', async () => {
    const { store, status, system } = setup();
    status('SUBSCRIBED', false);
    expect(store.playConnected()).toBe(false);
    system('error');
    expect(store.playSyncError()).toContain('Impossibile attivare');
    await expect(store.startPlay(['a', 'b', 'c', 'd'], [], [], 'random')).rejects.toThrow('sincronizzazione');
    system('ok');
    await vi.waitFor(() => expect(store.playConnected()).toBe(true));
    expect(store.playDraft()?.red.map((player) => player.id)).toEqual(['a', 'b']);
  });

  it('does not unlock editing when a snapshot completes after the connection was lost', async () => {
    const { store, readSnapshot, status } = setup();
    let resolve!: (snapshot: Snapshot) => void;
    readSnapshot.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    status('SUBSCRIBED');
    status('CHANNEL_ERROR');
    resolve({ data: state(1), error: null });
    await Promise.resolve();
    expect(store.playConnected()).toBe(false);
    await expect(store.startPlay(['a', 'b', 'c', 'd'], [], [], 'random')).rejects.toThrow('sincronizzazione');
  });
});
