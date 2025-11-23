import { AICharacterResponse, AIBattleResponse, Character, WorldType } from '../types';
// import { GoogleGenAI } from "@google/genai"; // Uncomment when using real API

/**
 * NOTE: Since we don't have a backend to proxy API requests and cannot 
 * expose an API Key in client-side code safely for this demo,
 * we default to a MOCK implementation.
 * 
 * To use Real Gemini API:
 * 1. Set USE_MOCK_AI = false
 * 2. Provide a valid API key in `process.env.API_KEY` or hardcode (for local testing only).
 */
const USE_MOCK_AI = true; 
// const API_KEY = "YOUR_GEMINI_API_KEY_HERE"; 

export const generateCharacterAI = async (world: WorldType, name: string, userPrompt: string): Promise<AICharacterResponse> => {
  if (USE_MOCK_AI) {
    return mockCharacterGeneration(world, name, userPrompt);
  }
  
  // Real Implementation Placeholder
  /*
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-2.5-flash";
  const prompt = `
    Create a game character for a PVP text RPG.
    World Setting: ${world}
    User Name Input: ${name}
    User Description: ${userPrompt}
    
    Output JSON format:
    {
      "name": "Refined Name",
      "bio": "Backstory (max 2 sentences)",
      "personality": "Personality traits",
      "skills": [
        { "name": "Skill Name", "description": "What it does", "tags": ["Tag1", "Tag2"] }
      ]
    }
  `;
  
  // Call API... parse JSON... return result
  */
  throw new Error("Real AI not implemented in this demo.");
};

export const simulateBattleAI = async (charA: Character, charB: Character): Promise<AIBattleResponse> => {
  if (USE_MOCK_AI) {
    return mockBattleSimulation(charA, charB);
  }

  // Real Implementation Placeholder
  /*
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `
    Simulate a battle between two characters.
    
    [Character A]
    Name: ${charA.name} (${charA.world})
    Bio: ${charA.bio}
    Skills: ${charA.skills.map(s => s.name).join(', ')}
    
    [Character B]
    Name: ${charB.name} (${charB.world})
    Bio: ${charB.bio}
    Skills: ${charB.skills.map(s => s.name).join(', ')}
    
    Decide a winner based on skills and bio synergy.
    Output JSON:
    {
      "winnerIndex": 0 or 1,
      "logs": ["Round 1 description...", "Round 2...", ... "Conclusion"],
      "summary": "Why the winner won"
    }
  `;
  */
   throw new Error("Real AI not implemented in this demo.");
};


// --- MOCK IMPLEMENTATIONS ---

const mockCharacterGeneration = async (world: WorldType, name: string, prompt: string): Promise<AICharacterResponse> => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Fake loading

  const adjectives = ["전설의", "어둠의", "빛나는", "방랑하는", "미친", "고독한"];
  const refinedName = name.trim() || `${adjectives[Math.floor(Math.random()*adjectives.length)]} 모험가`;

  return {
    name: refinedName,
    bio: `[${world}] 세계관에서 ${prompt}의 운명을 타고난 존재입니다. 과거의 기억을 잃었지만 본능적으로 싸우는 법을 알고 있습니다.`,
    personality: "냉소적이지만 결정적인 순간에 뜨거워지는 성격.",
    skills: [
      { name: "운명의 일격", description: "결정적인 순간에 적의 급소를 가격합니다.", tags: ["공격", "치명타"] },
      { name: "생존 본능", description: "체력이 낮아지면 회피율이 급격히 상승합니다.", tags: ["패시브", "생존"] },
      { name: world === WorldType.FANTASY ? "마나 폭발" : "전술 해킹", description: "주변의 에너지를 과부하시켜 적을 혼란에 빠뜨립니다.", tags: ["특수"] }
    ]
  };
};

const mockBattleSimulation = async (charA: Character, charB: Character): Promise<AIBattleResponse> => {
  await new Promise(resolve => setTimeout(resolve, 2500)); // Fake loading

  const isAWin = Math.random() > 0.5;
  const winnerName = isAWin ? charA.name : charB.name;
  const loserName = isAWin ? charB.name : charA.name;

  const logs = [
    `${charA.name}와(과) ${charB.name}의 전투가 시작됩니다!`,
    `${charA.name}이(가) 먼저 기선을 제압하려 시도합니다.`,
    `${charB.name}은(는) 침착하게 대응하며 반격을 준비합니다.`,
    `격렬한 공방이 오고 갑니다! 서로의 스킬이 충돌합니다.`,
    `${winnerName}의 결정적인 일격이 적중했습니다!`,
    `${loserName}은(는) 더 이상 싸울 수 없습니다.`
  ];

  return {
    winnerIndex: isAWin ? 0 : 1,
    logs: logs,
    summary: `${winnerName}의 전략적 판단이 승리를 가져왔습니다.`
  };
};