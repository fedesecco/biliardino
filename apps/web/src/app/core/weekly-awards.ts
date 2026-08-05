import type { MatchRecord } from './models';
import { romeWeekKey } from './rome-calendar';

export type WeeklyBadgeKind = 'weekly-champion' | 'weekly-loser';

export interface WeeklyBadge {
  kind: WeeklyBadgeKind;
  label: string;
  elo: number;
}
export interface WeeklyEloStanding {
  playerId: string;
  elo: number;
}



export function calculateWeeklyEloStandings(
  matches: MatchRecord[],
  now = new Date(),
): WeeklyEloStanding[] {
  const currentWeek = romeWeekKey(now);
  const eloByPlayer = new Map<string, number>();

  for (const match of matches) {
    if (romeWeekKey(new Date(match.played_at)) !== currentWeek) {
      continue;
    }

    for (const participant of match.participants) {
      eloByPlayer.set(
        participant.player_id,
        (eloByPlayer.get(participant.player_id) ?? 0) + participant.elo_delta,
      );
    }
  }

  return [...eloByPlayer]
    .map(([playerId, elo]) => ({
      playerId,
      elo: Math.round(elo * 100) / 100,
    }))
    .sort(
      (first, second) =>
        second.elo - first.elo || first.playerId.localeCompare(second.playerId),
    );
}

export function calculateWeeklyBadgesFromStandings(
  standings: WeeklyEloStanding[],
): Map<string, WeeklyBadge> {
  const highestElo = Math.max(0, ...standings.map(({ elo }) => elo));
  const lowestElo = Math.min(0, ...standings.map(({ elo }) => elo));
  const badges = new Map<string, WeeklyBadge>();

  for (const { playerId, elo } of standings) {
    if (highestElo > 0 && Math.abs(elo - highestElo) < 0.001) {
      badges.set(playerId, {
        kind: 'weekly-champion',
        label: 'Bomboclat',
        elo,
      });
    } else if (lowestElo < 0 && Math.abs(elo - lowestElo) < 0.001) {
      badges.set(playerId, {
        kind: 'weekly-loser',
        label: 'Scemo del Villaggio',
        elo,
      });
    }
  }

  return badges;
}

export function calculateWeeklyBadges(
  matches: MatchRecord[],
  now = new Date(),
): Map<string, WeeklyBadge> {
  return calculateWeeklyBadgesFromStandings(
    calculateWeeklyEloStandings(matches, now),
  );
}
