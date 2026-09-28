import type { MonthlyEloRanking, PlayerStatistic } from './models';
import { calculateMonthlyBadgesFromStandings } from './monthly-badges';

describe('monthly badges', () => {
  it('combines monthly awards with medals from the global ranking', () => {
    const badges = calculateMonthlyBadgesFromStandings(
      [
        standing('monthly-leader', 1, 24),
        standing('monthly-runner', 2, 12),
        standing('monthly-last', 3, -18),
      ],
      [
        statistic('unranked', 1400, 9),
        statistic('monthly-leader', 1300, 10),
        statistic('global-second', 1200, 10),
        statistic('global-third', 1100, 10),
        statistic('monthly-runner', 1000, 10),
      ],
    );

    expect(badges.get('monthly-leader')?.map(({ kind }) => kind)).toEqual([
      'monthly-champion',
      'global-gold',
    ]);
    expect(badges.get('monthly-runner')).toBeUndefined();
    expect(badges.get('monthly-last')?.map(({ kind }) => kind)).toEqual([
      'monthly-last',
    ]);
    expect(badges.get('global-second')?.map(({ kind }) => kind)).toEqual([
      'global-silver',
    ]);
    expect(badges.get('global-third')?.map(({ kind }) => kind)).toEqual([
      'global-bronze',
    ]);
  });

  it('resolves tied source ranks to one monthly award per position', () => {
    const badges = calculateMonthlyBadgesFromStandings(
      [
        standing('alpha', 1, 24),
        standing('beta', 1, 24),
        standing('gamma', 3, 6),
        standing('omega', 4, -18),
      ],
      [],
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
    const before = calculateMonthlyBadgesFromStandings(
      [
        standing('alice', 1, 30),
        standing('bob', 2, 20),
        standing('carlo', 3, 10),
        standing('dora', 4, -10),
      ],
      [],
    );
    const after = calculateMonthlyBadgesFromStandings(
      [
        standing('bob', 1, 32),
        standing('alice', 2, 30),
        standing('carlo', 3, 10),
        standing('dora', 4, -10),
      ],
      [],
    );

    expect(before.get('alice')?.map(({ kind }) => kind)).toEqual([
      'monthly-champion',
    ]);
    expect(after.get('alice')).toBeUndefined();
    expect(after.get('bob')?.map(({ kind }) => kind)).toEqual([
      'monthly-champion',
    ]);
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
): PlayerStatistic {
  return {
    id,
    name: id,
    avatar_color: '#a8e6cf',
    current_elo: currentElo,
    games,
    wins: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    goal_diff: 0,
    win_rate: 0,
  };
}
