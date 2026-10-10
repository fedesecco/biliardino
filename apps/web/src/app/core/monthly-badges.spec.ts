import type { MonthlyEloRanking, PlayerStatistic } from './models';
import {
  calculateMonthlyBadgesFromStandings,
  calculateWinStreakBadges,
} from './monthly-badges';

describe('badges', () => {
  it('calculates monthly awards without global ranking medals', () => {
    const badges = calculateMonthlyBadgesFromStandings([
      standing('monthly-leader', 1, 24),
      standing('monthly-runner', 2, 12),
      standing('monthly-last', 3, -18),
    ]);

    expect(badges.get('monthly-leader')?.map(({ kind }) => kind)).toEqual([
      'monthly-champion',
    ]);
    expect(badges.get('monthly-runner')).toBeUndefined();
    expect(badges.get('monthly-last')?.map(({ kind }) => kind)).toEqual([
      'monthly-last',
    ]);
  });

  it('resolves tied source ranks to one monthly award per position', () => {
    const badges = calculateMonthlyBadgesFromStandings([
      standing('alpha', 1, 24),
      standing('beta', 1, 24),
      standing('gamma', 3, 6),
      standing('omega', 4, -18),
    ]);

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
    const before = calculateMonthlyBadgesFromStandings([
      standing('alice', 1, 30),
      standing('bob', 2, 20),
      standing('carlo', 3, 10),
      standing('dora', 4, -10),
    ]);
    const after = calculateMonthlyBadgesFromStandings([
      standing('bob', 1, 32),
      standing('alice', 2, 30),
      standing('carlo', 3, 10),
      standing('dora', 4, -10),
    ]);

    expect(before.get('alice')?.map(({ kind }) => kind)).toEqual([
      'monthly-champion',
    ]);
    expect(after.get('alice')).toBeUndefined();
    expect(after.get('bob')?.map(({ kind }) => kind)).toEqual([
      'monthly-champion',
    ]);
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
    expect(badges.get('streak-ten')?.map(({ kind }) => kind)).toEqual([
      'win-streak-10',
    ]);
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
});

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
): PlayerStatistic {
  return {
    id,
    name: id,
    avatar_color: '#a8e6cf',
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
