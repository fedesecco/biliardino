import type { MonthlyEloRanking, PlayerStatistic } from './models';

export type MonthlyBadgeKind =
  | 'monthly-champion'
  | 'monthly-last'
  | 'global-gold'
  | 'global-silver'
  | 'global-bronze';

export interface MonthlyBadge {
  kind: MonthlyBadgeKind;
  label: string;
  elo: number | null;
  imageUrl: string;
}

const GLOBAL_MEDAL_BY_POSITION: Record<
  1 | 2 | 3,
  Pick<MonthlyBadge, 'kind' | 'label' | 'imageUrl'>
> = {
  1: {
    kind: 'global-gold',
    label: "Medaglia d'oro",
    imageUrl: '/awards/oro.webp',
  },
  2: {
    kind: 'global-silver',
    label: "Medaglia d'argento",
    imageUrl: '/awards/argento.webp',
  },
  3: {
    kind: 'global-bronze',
    label: 'Medaglia di bronzo',
    imageUrl: '/awards/bronzo.webp',
  },
};

const MINIMUM_GAMES_FOR_GLOBAL_RANKING = 10;

const CHAMPION_BADGE: Pick<
  MonthlyBadge,
  'kind' | 'label' | 'imageUrl'
> = {
  kind: 'monthly-champion',
  label: 'Bomboclat',
  imageUrl: '/awards/bomboclat.webp',
};

const LAST_BADGE: Pick<MonthlyBadge, 'kind' | 'label' | 'imageUrl'> = {
  kind: 'monthly-last',
  label: 'Scemo del Villaggio',
  imageUrl: '/awards/scemo.webp',
};

export function calculateMonthlyBadgesFromStandings(
  monthlyStandings: MonthlyEloRanking[],
  globalStatistics: PlayerStatistic[],
): Map<string, MonthlyBadge[]> {
  const badges = new Map<string, MonthlyBadge[]>();

  const addBadge = (
    playerId: string,
    elo: number | null,
    badge: Pick<MonthlyBadge, 'kind' | 'label' | 'imageUrl'>,
  ): void => {
    const playerBadges = badges.get(playerId) ?? [];
    playerBadges.push({ ...badge, elo });
    badges.set(playerId, playerBadges);
  };

  const orderedMonthlyStandings = [
    ...new Map(
      [...monthlyStandings]
        .sort((left, right) => {
          const rankDifference = left.rank - right.rank;
          if (rankDifference !== 0) {
            return rankDifference;
          }

          if (left.player_id < right.player_id) {
            return -1;
          }

          if (left.player_id > right.player_id) {
            return 1;
          }

          return 0;
        })
        .map((standing) => [standing.player_id, standing] as const),
    ).values(),
  ];
  const lastMonthlyPosition = orderedMonthlyStandings.length;

  for (const [index, standing] of orderedMonthlyStandings.entries()) {
    const position = index + 1;

    if (position === 1) {
      addBadge(standing.player_id, standing.elo_gained, CHAMPION_BADGE);
    }

    if (
      lastMonthlyPosition > 1 &&
      position === lastMonthlyPosition
    ) {
      addBadge(standing.player_id, standing.elo_gained, LAST_BADGE);
    }
  }

  const orderedGlobalStatistics = [
    ...new Map(
      globalStatistics
        .filter(
          (statistic) =>
            statistic.games >= MINIMUM_GAMES_FOR_GLOBAL_RANKING,
        )
        .sort((left, right) => {
          const eloDifference = right.current_elo - left.current_elo;
          if (eloDifference !== 0) {
            return eloDifference;
          }

          if (left.id < right.id) {
            return -1;
          }

          if (left.id > right.id) {
            return 1;
          }

          return 0;
        })
        .map((statistic) => [statistic.id, statistic] as const),
    ).values(),
  ].slice(0, 3);

  for (const [index, statistic] of orderedGlobalStatistics.entries()) {
    const medal = GLOBAL_MEDAL_BY_POSITION[
      (index + 1) as 1 | 2 | 3
    ];
    addBadge(statistic.id, null, medal);
  }

  return badges;
}
