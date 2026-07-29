export type TeamColor = 'red' | 'blue';
export type SelectionMode = 'off' | 'any' | TeamColor;
export type TeamPickingMode = 'random' | 'elo-balanced';

export interface Player {
  id: string;
  name: string;
  avatar_color: string;
  current_elo: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PickedPlayer {
  player_id: string;
  team: TeamColor;
  daily_games: number;
}

export interface MatchParticipant {
  player_id: string;
  team: TeamColor;
  elo_before: number;
  elo_delta: number;
  player: Pick<Player, 'id' | 'name' | 'avatar_color'>;
}

export interface MatchRecord {
  id: string;
  played_at: string;
  red_score: number;
  blue_score: number;
  created_at: string;
  created_by: string;
  edited_at: string | null;
  edited_by: string | null;
  participants: MatchParticipant[];
}

export interface PlayerStatistic {
  id: string;
  name: string;
  avatar_color: string;
  current_elo: number;
  games: number;
  wins: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  win_rate: number;
}

export interface TeamDraft {
  red: Player[];
  blue: Player[];
  benched: Player[];
}
