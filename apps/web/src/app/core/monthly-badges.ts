import type { MonthlyEloRanking, PlayerStatistic } from './models';

export type BadgeKind =
  | 'monthly-champion'
  | 'monthly-last'
  | 'win-streak-3'
  | 'win-streak-5'
  | 'win-streak-10';

export interface Badge {
  kind: BadgeKind;
  label: string;
  description?: string;
  elo: number | null;
  imageUrl: string;
}

const CHAMPION_BADGE: Pick<
  Badge,
  'kind' | 'label' | 'imageUrl'
> = {
  kind: 'monthly-champion',
  label: 'Bomboclat',
  imageUrl: '/awards/bomboclat.webp',
};

const LAST_BADGE: Pick<Badge, 'kind' | 'label' | 'imageUrl'> = {
  kind: 'monthly-last',
  label: 'Scemo del Villaggio',
  imageUrl: '/awards/scemo.webp',
};

const WIN_STREAK_BADGES: readonly {
  minimum: number;
  kind: BadgeKind;
  imageUrl: string;
}[] = [
  {
    minimum: 3,
    kind: 'win-streak-3',
    imageUrl: '/awards/winstreak-3.webp',
  },
  {
    minimum: 5,
    kind: 'win-streak-5',
    imageUrl: '/awards/winstreak-5.webp',
  },
  {
    minimum: 10,
    kind: 'win-streak-10',
    imageUrl: '/awards/winstreak-10.webp',
  },
];

export function calculateMonthlyBadgesFromStandings(
  monthlyStandings: MonthlyEloRanking[],
): Map<string, Badge[]> {
  const badges = new Map<string, Badge[]>();

  const addBadge = (
    playerId: string,
    elo: number | null,
    badge: Pick<Badge, 'kind' | 'label' | 'imageUrl'>,
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

  return badges;
}

export function calculateWinStreakBadges(
  statistics: PlayerStatistic[],
): Map<string, Badge[]> {
  const badges = new Map<string, Badge[]>();

  for (const statistic of statistics) {
    const badge = [...WIN_STREAK_BADGES]
      .reverse()
      .find(({ minimum }) => statistic.current_win_streak >= minimum);

    if (!badge) {
      continue;
    }

    badges.set(statistic.id, [
      {
        kind: badge.kind,
        label: `Winstreak: ${statistic.current_win_streak}`,
        description: `${statistic.current_win_streak} vittorie consecutive`,
        elo: null,
        imageUrl: badge.imageUrl,
      },
    ]);
  }

  return badges;
}
