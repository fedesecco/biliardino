import type { Badge, BadgeKind } from './monthly-badges';
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
): RecognitionSnapshot {
  return {
    playerId,
    playerName,
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
    imageUrl: `/awards/${kind}.webp`,
  };
}
