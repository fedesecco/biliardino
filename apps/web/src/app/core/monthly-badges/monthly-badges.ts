import type { AvatarType, MonthlyEloRanking, PlayerStatistic } from '../models';
import { AVATAR_SETS, type AvatarVariants } from '../avatar-assets/avatar-assets';

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

const CHAMPION_BADGE = {
  kind: 'monthly-champion',
  label: 'Bomboclat',
  variant: 'bomboclat',
} as const;

const LAST_BADGE = {
  kind: 'monthly-last',
  label: 'Scemo del Villaggio',
  variant: 'scemo',
} as const;

const WIN_STREAK_BADGES: readonly {
  minimum: number;
  kind: BadgeKind;
  variant: AvatarVariants['hair'];
}[] = [
  {
    minimum: 10,
    kind: 'win-streak-10',
    variant: 'winstreak-10',
  },
  {
    minimum: 5,
    kind: 'win-streak-5',
    variant: 'winstreak-5',
  },
  {
    minimum: 3,
    kind: 'win-streak-3',
    variant: 'winstreak-3',
  },
];

export function calculateMonthlyBadgesFromStandings(
  monthlyStandings: MonthlyEloRanking[],
  players: readonly Pick<PlayerStatistic, 'id' | 'type'>[],
): Map<string, Badge[]> {
  const badges = new Map<string, Badge[]>();
  const playerTypes = new Map(players.map(({ id, type }) => [id, type]));

  const addBadge = (
    playerId: string,
    elo: number | null,
    type: AvatarType,
    badge: typeof CHAMPION_BADGE | typeof LAST_BADGE,
  ): void => {
    const playerBadges = badges.get(playerId) ?? [];
    playerBadges.push({
      kind: badge.kind,
      label: badge.label,
      imageUrl: AVATAR_SETS[type].face[badge.variant].imageUrl,
      elo,
    });
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
    const type = playerTypes.get(standing.player_id);
    if (!type) {
      continue;
    }

    const position = index + 1;

    if (position === 1) {
      addBadge(standing.player_id, standing.elo_gained, type, CHAMPION_BADGE);
    }

    if (
      lastMonthlyPosition > 1 &&
      position === lastMonthlyPosition
    ) {
      addBadge(standing.player_id, standing.elo_gained, type, LAST_BADGE);
    }
  }

  return badges;
}

export function calculateWinStreakBadges(
  statistics: PlayerStatistic[],
): Map<string, Badge[]> {
  const badges = new Map<string, Badge[]>();

  for (const statistic of statistics) {
    const badge = WIN_STREAK_BADGES.find(
      ({ minimum }) => statistic.current_win_streak >= minimum,
    );

    if (!badge) {
      continue;
    }

    badges.set(statistic.id, [
      {
        kind: badge.kind,
        label: `Winstreak: ${statistic.current_win_streak}`,
        description: `${statistic.current_win_streak} vittorie consecutive`,
        elo: null,
        imageUrl: AVATAR_SETS[statistic.type].hair[badge.variant].imageUrl,
      },
    ]);
  }

  return badges;
}
