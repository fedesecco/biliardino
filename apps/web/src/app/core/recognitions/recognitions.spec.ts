import type { Badge, BadgeKind } from '../monthly-badges/monthly-badges';
import { calculateWinStreakBadges } from '../monthly-badges/monthly-badges';
import type { AvatarType, PlayerStatistic } from '../models';
import { AVATAR_SETS, type AvatarVariants } from '../avatar-assets/avatar-assets';
import {
  findNewRecognitions,
  recognitionDialogTitle,
  type RecognitionSnapshot,
} from './recognitions';

describe('recognitions', () => {
  it('detects a new medal and a higher streak tier', () => {
    const recognitions = findNewRecognitions(
      [snapshot('player-one', 'Mario Rossi', 5, [badge('win-streak-5')])],
      [
        snapshot(
          'player-one',
          'Mario Rossi',
          10,
          [badge('win-streak-10', 'Winstreak: 10')],
          'gold',
        ),
      ],
    );

    expect(recognitions.map(({ kind, label }) => ({ kind, label }))).toEqual([
      { kind: 'global-medal', label: 'Oro in classifica' },
      { kind: 'win-streak-10', label: 'Winstreak: 10' },
    ]);
    expect(recognitions[0].imageUrl).toBe(AVATAR_SETS.male.head.gold.imageUrl);
    expect(recognitions[1].imageUrl).toBe(
      AVATAR_SETS.male.hair['winstreak-10'].imageUrl,
    );
  });

  it('uses the recipient type for a new medal and preserves female badge artwork', () => {
    const statistic: PlayerStatistic = {
      id: 'female-player',
      name: 'Anna Verdi',
      avatar_color: '#a8e6cf',
      type: 'female',
      current_elo: 1100,
      current_win_streak: 5,
      games: 12,
      wins: 8,
      losses: 4,
      goals_for: 60,
      goals_against: 42,
      goal_diff: 18,
      win_rate: 66.7,
    };
    const badges = calculateWinStreakBadges([statistic]).get(statistic.id) ?? [];
    const recognitions = findNewRecognitions(
      [],
      [snapshot(statistic.id, statistic.name, 5, badges, 'silver', statistic.type)],
    );

    expect(recognitions.map(({ kind, imageUrl }) => ({ kind, imageUrl }))).toEqual([
      {
        kind: 'global-medal',
        imageUrl: AVATAR_SETS.female.head.silver.imageUrl,
      },
      {
        kind: 'win-streak-5',
        imageUrl: AVATAR_SETS.female.hair['winstreak-5'].imageUrl,
      },
    ]);
  });

  it('ignores streak progress inside the same tier and downgrades', () => {
    const recognitions = findNewRecognitions(
      [
        snapshot('same-tier', 'Luigi Bianchi', 3, [badge('win-streak-3')]),
        snapshot('downgrade', 'Anna Verdi', 5, [badge('win-streak-5')]),
      ],
      [
        snapshot('same-tier', 'Luigi Bianchi', 4, [badge('win-streak-3')]),
        snapshot('downgrade', 'Anna Verdi', 3, [badge('win-streak-3')]),
      ],
    );

    expect(recognitions).toEqual([]);
  });

  it('detects a new monthly badge', () => {
    const recognitions = findNewRecognitions(
      [snapshot('player-one', 'Mario Rossi', 0, [])],
      [
        snapshot('player-one', 'Mario Rossi', 0, [
          badge('monthly-champion', 'Bomboclat'),
        ]),
      ],
    );

    expect(recognitions).toMatchObject([
      {
        kind: 'monthly-champion',
        playerName: 'Mario Rossi',
        label: 'Bomboclat',
        description: 'In testa alla classifica mensile',
      },
    ]);
  });

  it('uses the glossary in recognition dialog titles', () => {
    expect(
      recognitionDialogTitle({
        kind: 'global-medal',
        playerName: 'Mario Rossi',
      }),
    ).toBe('Nuova medaglia di classifica per Mario Rossi!');
    expect(
      recognitionDialogTitle({
        kind: 'monthly-champion',
        playerName: 'Mario Rossi',
      }),
    ).toBe('Nuovo badge Bomboclat per Mario Rossi!');
    expect(
      recognitionDialogTitle({
        kind: 'win-streak-10',
        playerName: 'Mario Rossi',
      }),
    ).toBe('Nuovo badge Winstreak per Mario Rossi!');
  });
});

function snapshot(
  playerId: string,
  playerName: string,
  currentWinStreak: number,
  badges: Badge[],
  globalMedal: RecognitionSnapshot['globalMedal'] = null,
  avatarType: AvatarType = 'male',
): RecognitionSnapshot {
  return {
    playerId,
    playerName,
    avatarType,
    currentWinStreak,
    badges,
    globalMedal,
  };
}

function badge(kind: BadgeKind, label: string = kind): Badge {
  return {
    kind,
    label,
    elo: null,
    imageUrl: kind.startsWith('monthly-')
      ? AVATAR_SETS.male.face[kind === 'monthly-champion' ? 'bomboclat' : 'scemo'].imageUrl
      : AVATAR_SETS.male.hair[
          kind.replace('win-streak-', 'winstreak-') as AvatarVariants['hair']
        ].imageUrl,
  };
}
