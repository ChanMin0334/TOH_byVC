import { Character, BattleResult, BattleLog, AIBattleResponse } from '../types';
import * as Storage from './storageService';
import * as AIService from './geminiService';

const K_FACTOR = 32; // Standard K-factor for Elo

export const calculateEloChange = (myRating: number, opponentRating: number, actualScore: number): number => {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
  return Math.round(K_FACTOR * (actualScore - expectedScore));
};

export const processBattle = async (charAId: string, charBId: string, isSimulation: boolean = false): Promise<BattleResult> => {
  const charA = Storage.getCharacterById(charAId);
  const charB = Storage.getCharacterById(charBId);

  if (!charA || !charB) throw new Error("Character not found");

  // 1. AI Simulation
  const aiResult: AIBattleResponse = await AIService.simulateBattleAI(charA, charB);

  // 2. Create Battle Logs
  const battleLogs: BattleLog[] = aiResult.logs.map((desc, idx) => ({
    turn: idx + 1,
    attackerName: idx % 2 === 0 ? charA.name : charB.name,
    defenderName: idx % 2 === 0 ? charB.name : charA.name,
    description: desc
  }));

  // 3. Determine Winner
  const winner = aiResult.winnerIndex === 0 ? charA : charB;
  const loser = aiResult.winnerIndex === 0 ? charB : charA;

  // 4. Calculate Elo (only if not simulation)
  let changeA = 0;
  let changeB = 0;

  if (!isSimulation) {
    changeA = calculateEloChange(charA.elo, charB.elo, aiResult.winnerIndex === 0 ? 1 : 0);
    changeB = calculateEloChange(charB.elo, charA.elo, aiResult.winnerIndex === 1 ? 1 : 0);

    // Update Stats
    charA.elo += changeA;
    charA.matches += 1;
    charB.elo += changeB;
    charB.matches += 1;

    if (aiResult.winnerIndex === 0) {
      charA.wins += 1;
      charB.losses += 1;
    } else {
      charB.wins += 1;
      charA.losses += 1;
    }

    Storage.saveCharacter(charA);
    Storage.saveCharacter(charB);
  }

  // 5. Create Record
  const result: BattleResult = {
    id: crypto.randomUUID(),
    charAId: charA.id,
    charBId: charB.id,
    charAName: charA.name,
    charBName: charB.name,
    winnerId: winner.id,
    logs: battleLogs,
    timestamp: Date.now(),
    eloChangeA: changeA,
    eloChangeB: changeB,
    isSimulation
  };

  if (!isSimulation) {
    Storage.saveBattle(result);
  }

  return result;
};

export const checkUnlockable = (char: Character): boolean => {
  return char.wins >= 15 && char.losses >= 15;
};