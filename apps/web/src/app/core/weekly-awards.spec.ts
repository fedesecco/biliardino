import type { MatchRecord, TeamColor } from './models';
import { romeWeekKey } from './rome-calendar';
import {
  calculateWeeklyBadges,
  calculateWeeklyEloStandings,
} from './weekly-awards';

describe('weekly awards', () => {
  it('resets on Monday midnight in Europe/Rome', () => {
    expect(romeWeekKey(new Date('2026-08-02T21:59:59.000Z'))).toBe(
      '2026-07-27',
    );
    expect(romeWeekKey(new Date('2026-08-02T22:00:00.000Z'))).toBe(
      '2026-08-03',
    );
  });

  it('awards the highest and lowest net weekly ELO and ignores Sunday', () => {
    const badges = calculateWeeklyBadges(
      [
        match('sunday', '2026-08-02T21:59:59.000Z', [
          ['winner', 100],
          ['loser', -100],
        ]),
        match('monday', '2026-08-02T22:00:00.000Z', [
          ['winner', 12.5],
          ['runner-up', 7],
          ['loser', -19.5],
        ]),
        match('friday', '2026-08-07T12:00:00.000Z', [
          ['winner', -2.5],
          ['runner-up', 2],
          ['loser', -0.5],
        ]),
      ],
      new Date('2026-08-08T12:00:00.000Z'),
    );

    expect(badges.get('winner')).toEqual({
      kind: 'weekly-champion',
      label: 'Bomboclat',
      elo: 10,
    });
    expect(badges.get('loser')).toEqual({
      kind: 'weekly-loser',
      label: 'Scemo del Villaggio',
      elo: -20,
    });
    expect(badges.has('runner-up')).toBe(false);
  });

  it('sorts the current week by net ELO', () => {
    const standings = calculateWeeklyEloStandings(
      [
        match('monday', '2026-08-03T12:00:00.000Z', [
          ['second', 4],
          ['first', 9],
          ['third', -13],
        ]),
        match('friday', '2026-08-07T12:00:00.000Z', [
          ['second', 3],
          ['first', -1],
          ['third', -2],
        ]),
      ],
      new Date('2026-08-08T12:00:00.000Z'),
    );

    expect(standings).toEqual([
      { playerId: 'first', elo: 8 },
      { playerId: 'second', elo: 7 },
      { playerId: 'third', elo: -15 },
    ]);
  });

  it('supports exact ties and gives no badge at zero', () => {
    const badges = calculateWeeklyBadges(
      [
        match('tie', '2026-08-05T12:00:00.000Z', [
          ['first', 8],
          ['second', 8],
          ['third', -8],
          ['fourth', -8],
          ['zero', 0],
        ]),
      ],
      new Date('2026-08-05T18:00:00.000Z'),
    );

    expect(badges.get('first')?.kind).toBe('weekly-champion');
    expect(badges.get('second')?.kind).toBe('weekly-champion');
    expect(badges.get('third')?.kind).toBe('weekly-loser');
    expect(badges.get('fourth')?.kind).toBe('weekly-loser');
    expect(badges.has('zero')).toBe(false);
  });
});

function match(
  id: string,
  playedAt: string,
  participants: Array<[string, number]>,
): MatchRecord {
  return {
    id,
    played_at: playedAt,
    red_score: 6,
    blue_score: 4,
    created_at: playedAt,
    created_by: 'user-id',
    edited_at: null,
    edited_by: null,
    participants: participants.map(([playerId, eloDelta], index) => ({
      player_id: playerId,
      team: (index % 2 === 0 ? 'red' : 'blue') as TeamColor,
      elo_before: 1000,
      elo_delta: eloDelta,
      player: {
        id: playerId,
        name: playerId,
        avatar_color: '#a8e6cf',
      },
    })),
  };
}
