import type { Badge, BadgeKind } from '../monthly-badges/monthly-badges';
import type { AvatarType, PlayerAvatarMedal } from '../models';
import { AVATAR_SETS } from '../avatar-assets/avatar-assets';

export interface GlobalMedalDetails {
  label: string;
  alt: string;
  description: string;
}

export const GLOBAL_MEDAL_DETAILS: Record<
  PlayerAvatarMedal,
  GlobalMedalDetails
> = {
  gold: {
    label: 'Oro in classifica',
    alt: 'Medaglia di classifica oro per il primo posto nella classifica globale',
    description: 'Medaglia di classifica: primo posto globale',
  },
  silver: {
    label: 'Argento in classifica',
    alt: 'Medaglia di classifica argento per il secondo posto nella classifica globale',
    description: 'Medaglia di classifica: secondo posto globale',
  },
  bronze: {
    label: 'Bronzo in classifica',
    alt: 'Medaglia di classifica bronzo per il terzo posto nella classifica globale',
    description: 'Medaglia di classifica: terzo posto globale',
  },
};

export type RecognitionKind = BadgeKind | 'global-medal';

const BADGE_DIALOG_NAMES: Record<BadgeKind, string> = {
  'monthly-champion': 'Bomboclat',
  'monthly-last': 'Scemo del Villaggio',
  'win-streak-3': 'Winstreak',
  'win-streak-5': 'Winstreak',
  'win-streak-10': 'Winstreak',
};

export interface NewRecognition {
  playerId: string;
  playerName: string;
  kind: RecognitionKind;
  label: string;
  description: string;
  imageUrl: string;
}

export function recognitionDialogTitle(
  recognition: Pick<NewRecognition, 'kind' | 'playerName'>,
): string {
  if (recognition.kind === 'global-medal') {
    return `Nuova medaglia di classifica per ${recognition.playerName}!`;
  }

  return `Nuovo badge ${BADGE_DIALOG_NAMES[recognition.kind]} per ${recognition.playerName}!`;
}

export interface RecognitionSnapshot {
  playerId: string;
  playerName: string;
  avatarType: AvatarType;
  currentWinStreak: number;
  badges: Badge[];
  globalMedal: PlayerAvatarMedal | null;
}

const MEDAL_RANK: Record<PlayerAvatarMedal, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

function medalRank(medal: PlayerAvatarMedal | null): number {
  return medal ? MEDAL_RANK[medal] : 0;
}

function badgeDescription(badge: Badge): string {
  if (badge.description) {
    return badge.description;
  }

  if (badge.kind === 'monthly-champion') {
    return 'In testa alla classifica mensile';
  }

  if (badge.kind === 'monthly-last') {
    return 'Ultima posizione nella classifica mensile';
  }

  return 'Nuovo badge';
}

export function findNewRecognitions(
  before: readonly RecognitionSnapshot[],
  after: readonly RecognitionSnapshot[],
): NewRecognition[] {
  const beforeByPlayerId = new Map(
    before.map((snapshot) => [snapshot.playerId, snapshot]),
  );

  return after.flatMap((current) => {
    const previous = beforeByPlayerId.get(current.playerId);
    const previousBadgeKinds = new Set(
      previous?.badges.map(({ kind }) => kind) ?? [],
    );
    const recognitions: NewRecognition[] = [];

    if (
      current.globalMedal &&
      medalRank(current.globalMedal) > medalRank(previous?.globalMedal ?? null)
    ) {
      const medal = GLOBAL_MEDAL_DETAILS[current.globalMedal];
      recognitions.push({
        playerId: current.playerId,
        playerName: current.playerName,
        kind: 'global-medal',
        label: medal.label,
        description: medal.description,
        imageUrl: AVATAR_SETS[current.avatarType].head[current.globalMedal].imageUrl,
      });
    }

    for (const badge of current.badges) {
      if (previousBadgeKinds.has(badge.kind)) {
        continue;
      }

      if (
        badge.kind.startsWith('win-streak-') &&
        current.currentWinStreak <= (previous?.currentWinStreak ?? 0)
      ) {
        continue;
      }

      recognitions.push({
        playerId: current.playerId,
        playerName: current.playerName,
        kind: badge.kind,
        label: badge.label,
        description: badgeDescription(badge),
        imageUrl: badge.imageUrl,
      });
    }

    return recognitions;
  });
}
