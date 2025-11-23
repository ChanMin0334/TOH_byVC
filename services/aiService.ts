import { AICharacterResponse, AIBattleResponse, Character, WorldType } from '../types';

/**
 * ADOTX (https://guest-api.sktax.chat) integration details
 * - Set VITE_ADOTX_API_KEY in your .env.local before running Vite.
 * - Requests are sent directly from the browser; to avoid leaking secrets in production,
 *   proxy the call through your own backend instead.
 */
const API_URL = 'https://guest-api.sktax.chat/v1/chat/completions';
const API_MODEL = 'ax4';
// NOTE: 사용자 요청으로 API 키를 하드코딩합니다.
const API_KEY = 'sktax-XyeKFrq67ZjS4EpsDlrHHXV8it';

// 하드코딩된 키가 항상 존재하므로 mock 모드는 기본적으로 비활성화됩니다.
const USE_MOCK_AI = false;

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const callAdotxChat = async (messages: ChatMessage[]): Promise<string> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: API_MODEL,
      messages
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ADOTX API 오류: ${response.status} ${body}`);
  }

  const data = await response.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('ADOTX API 응답에 content가 없습니다.');
  }

  return content.trim();
};

const extractJson = (raw: string): any => {
  const trimmed = raw.trim();
  const jsonLike = trimmed.startsWith('{') ? trimmed : trimmed.replace(/^[^\{]*({[\s\S]*})[^\}]*$/, '$1');
  return JSON.parse(jsonLike);
};

export const generateCharacterAI = async (world: WorldType, name: string, userPrompt: string): Promise<AICharacterResponse> => {
  if (USE_MOCK_AI) {
    return mockCharacterGeneration(world, name, userPrompt);
  }
  const systemPrompt = '당신은 텍스트 PvP 게임의 캐릭터 디자이너입니다. 반드시 JSON만 출력하세요.';
  const userContent = `세계관: ${world}
선호 이름: ${name || '없음'}
유저 설정: ${userPrompt}

다음 스키마를 정확히 지키는 JSON을 생성하세요:
{
  "name": string,
  "bio": string,
  "personality": string,
  "skills": [
    {"name": string, "description": string, "tags": string[]}
  ]
}`;

  try {
    const content = await callAdotxChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]);
    return extractJson(content) as AICharacterResponse;
  } catch (error) {
    console.error('캐릭터 생성 API 오류, mock으로 대체합니다.', error);
    return mockCharacterGeneration(world, name, userPrompt);
  }
};

export const simulateBattleAI = async (charA: Character, charB: Character): Promise<AIBattleResponse> => {
  if (USE_MOCK_AI) {
    return mockBattleSimulation(charA, charB);
  }
  const systemPrompt = '당신은 턴제 전투 해설가입니다. JSON 형식만 반환하세요.';
  const userContent = `아래 두 영웅의 결투를 5~8개의 로그로 시뮬레이션하세요.

[A]
이름: ${charA.name}
세계관: ${charA.world}
배경: ${charA.bio}
스킬: ${charA.skills.map(s => `${s.name}(${s.tags.join('/')})`).join(', ')}

[B]
이름: ${charB.name}
세계관: ${charB.world}
배경: ${charB.bio}
스킬: ${charB.skills.map(s => `${s.name}(${s.tags.join('/')})`).join(', ')}

출력 JSON (winnerIndex는 A=0, B=1):
{
  "winnerIndex": 0 | 1,
  "logs": string[],
  "summary": string
}`;

  try {
    const content = await callAdotxChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]);
    return extractJson(content) as AIBattleResponse;
  } catch (error) {
    console.error('전투 시뮬레이션 API 오류, mock으로 대체합니다.', error);
    return mockBattleSimulation(charA, charB);
  }
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