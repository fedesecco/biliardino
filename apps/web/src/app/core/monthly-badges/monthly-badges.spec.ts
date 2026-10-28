import type { AvatarType, MonthlyEloRanking, PlayerStatistic } from '../models';
import { AVATAR_SETS } from '../avatar-assets/avatar-assets';
import {
  calculateMonthlyBadgesFromStandings,
  calculateWinStreakBadges,
} from './monthly-badges';

describe('badges', () => {
  it('calculates monthly awards without global ranking medals', () => {
    const badges = calculateMonthlyBadgesFromStandings(
      [
        standing('monthly-leader', 1, 24),
        standing('monthly-runner', 2, 12),
        standing('monthly-last', 3, -18),
      ],
      [
        { id: 'monthly-leader', type: 'female' },
        { id: 'monthly-runner', type: 'male' },
        { id: 'monthly-last', type: 'female' },
      ],
    );

    expect(badges.get('monthly-leader')?.map(({ kind }) => kind)).toEqual([
      'monthly-champion',
    ]);
    expect(badges.get('monthly-leader')?.[0].imageUrl).toBe(
      AVATAR_SETS.female.face.bomboclat.imageUrl,
    );
    expect(badges.get('monthly-runner')).toBeUndefined();
    expect(badges.get('monthly-last')?.map(({ kind }) => kind)).toEqual([
      'monthly-last',
    ]);
    expect(badges.get('monthly-last')?.[0].imageUrl).toBe(
      AVATAR_SETS.female.face.scemo.imageUrl,
    );
  });

  it('resolves tied source ranks to one monthly award per position', () => {
    const badges = calculateMonthlyBadgesFromStandings(
      [
        standing('alpha', 1, 24),
        standing('beta', 1, 24),
        standing('gamma', 3, 6),
        standing('omega', 4, -18),
      ],
      players('alpha', 'beta', 'gamma', 'omega'),
    );

    expect(badges.get('alpha')?.map(({ kind }) => kind)).toEqual([
      'monthly-champion',
    ]);
    expect(badges.get('beta')).toBeUndefined();
    expect(badges.get('gamma')).toBeUndefined();
    expect(badges.get('omega')?.map(({ kind }) => kind)).toEqual([
      'monthly-last',
    ]);

    const assignedKinds = [...badges.values()].flat().map(({ kind }) => kind);
    expect(
      assignedKinds.filter((kind) => kind === 'monthly-champion'),
    ).toHaveLength(1);
    expect(
      assignedKinds.filter((kind) => kind === 'monthly-last'),
    ).toHaveLength(1);
  });

  it('removes the old leader badge when the monthly ranking changes', () => {
    const recipients = players('alice', 'bob', 'carlo', 'dora');
    const before = calculateMonthlyBadgesFromStandings(
      [
        standing('alice', 1, 30),
        standing('bob', 2, 20),
        standing('carlo', 3, 10),
        standing('dora', 4, -10),
      ],
      recipients,
    );
    const after = calculateMonthlyBadgesFromStandings(
      [
        standing('bob', 1, 32),
        standing('alice', 2, 30),
        standing('carlo', 3, 10),
        standing('dora', 4, -10),
      ],
      recipients,
    );

    expect(before.get('alice')?.map(({ kind }) => kind)).toEqual([
      'monthly-champion',
    ]);
    expect(after.get('alice')).toBeUndefined();
    expect(after.get('bob')?.map(({ kind }) => kind)).toEqual([
      'monthly-champion',
    ]);
  });

  it('skips unknown monthly recipients without promoting other positions', () => {
    const badges = calculateMonthlyBadgesFromStandings(
      [
        standing('unknown-leader', 1, 24),
        standing('known-runner', 2, 12),
        standing('unknown-last', 3, -18),
      ],
      players('known-runner'),
    );

    expect(badges.size).toBe(0);
  });

  it('assigns the highest matching current win streak badge', () => {
    const badges = calculateWinStreakBadges([
      statistic('below-threshold', 1000, 12, 2),
      statistic('streak-three', 1000, 12, 3),
      statistic('streak-five', 1000, 12, 5),
      statistic('streak-ten', 1000, 12, 10),
      statistic('streak-longer', 1000, 12, 14),
    ]);

    expect(badges.get('below-threshold')).toBeUndefined();
    expect(badges.get('streak-three')?.map(({ kind }) => kind)).toEqual([
      'win-streak-3',
    ]);
    expect(badges.get('streak-five')?.map(({ kind }) => kind)).toEqual([
      'win-streak-5',
    ]);
    expect(badges.get('streak-five')?.[0].imageUrl).toBe(
      AVATAR_SETS.male.hair['winstreak-5'].imageUrl,
    );
    expect(badges.get('streak-ten')?.map(({ kind }) => kind)).toEqual([
      'win-streak-10',
    ]);
    expect(badges.get('streak-ten')?.[0].imageUrl).toBe(
      AVATAR_SETS.male.hair['winstreak-10'].imageUrl,
    );
    expect(badges.get('streak-longer')?.map(({ kind }) => kind)).toEqual([
      'win-streak-10',
    ]);
    expect(badges.get('streak-three')?.[0].label).toBe('Winstreak: 3');
    expect(badges.get('streak-five')?.[0].label).toBe('Winstreak: 5');
    expect(badges.get('streak-longer')?.[0].label).toBe('Winstreak: 14');
    expect(badges.get('streak-longer')?.[0].description).toBe(
      '14 vittorie consecutive',
    );
    expect(badges.get('streak-ten')?.[0].description).toBe(
      '10 vittorie consecutive',
    );
  });

  it.each([
    [3, 'winstreak-3', 'win-streak-3'],
    [5, 'winstreak-5', 'win-streak-5'],
    [10, 'winstreak-10', 'win-streak-10'],
  ] as const)('uses female hair for a streak of %i wins', (wins, variant, kind) => {
    const badges = calculateWinStreakBadges([
      statistic('female-player', 1000, 12, wins, 'female'),
    ]);

    expect(badges.get('female-player')).toMatchObject([
      { kind, imageUrl: AVATAR_SETS.female.hair[variant].imageUrl },
    ]);
    expect(badges.get('female-player')?.[0].imageUrl).not.toBe(
      AVATAR_SETS.male.hair[variant].imageUrl,
    );
  });
});

function players(...ids: string[]): Pick<PlayerStatistic, 'id' | 'type'>[] {
  return ids.map((id) => ({ id, type: 'male' }));
}

function standing(
  playerId: string,
  rank: number,
  eloGained: number,
): MonthlyEloRanking {
  return {
    month_start: '2026-10-01',
    player_id: playerId,
    elo_gained: eloGained,
    rank,
  };
}

function statistic(
  id: string,
  currentElo: number,
  games: number,
  currentWinStreak: number,
  type: AvatarType = 'male',
): PlayerStatistic {
  return {
    id,
    name: id,
    avatar_color: '#a8e6cf',
    type,
    current_elo: currentElo,
    current_win_streak: currentWinStreak,
    games,
    wins: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    goal_diff: 0,
    win_rate: 0,
  };
}
