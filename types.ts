export enum WorldType {
  FANTASY = '판타지',
  CYBERPUNK = '사이버펑크',
  MODERN = '현대/느와르',
  MURIM = '무협',
  SCI_FI = 'SF/스페이스 오페라'
}

export interface Skill {
  name: string;
  description: string;
  tags: string[];
}

export interface Character {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  world: WorldType;
  prompt: string; 
  bio: string; 
  personality: string; 
  skills: Skill[];
  
  // Visuals
  avatarUrl?: string;
  themeColor?: string;

  // Stats
  elo: number;
  wins: number;
  losses: number;
  matches: number;
  
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  createdAt: number;
}

export interface BattleLog {
  turn: number;
  attackerName: string;
  defenderName: string;
  description: string;
}

export interface BattleResult {
  id: string;
  charAId: string;
  charBId: string;
  charAName: string;
  charBName: string;
  winnerId: string;
  logs: BattleLog[];
  timestamp: number;
  eloChangeA: number;
  eloChangeB: number;
  isSimulation: boolean;
}

// For AI Generation Responses
export interface AICharacterResponse {
  name: string;
  bio: string;
  personality: string;
  skills: Skill[];
}

export interface AIBattleResponse {
  winnerIndex: 0 | 1; 
  logs: string[]; 
  summary: string;
}