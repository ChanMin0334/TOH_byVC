import { AICharacterResponse, AIBattleResponse, Character, WorldType } from '../types';

/**
 * ADOTX (https://guest-api.sktax.chat) integration details
 * - Set VITE_ADOTX_API_KEY in your .env.local before running Vite.
 * - Requests are sent directly from the browser; to avoid leaking secrets in production,
 *   proxy the call through your own backend instead.
 */
const API_URL = '/api/chat';
const API_MODEL = 'ax4';

// Proxy를 사용하므로 항상 실시간 호출을 사용한다.
const USE_MOCK_AI = false;

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const callAdotxChat = async (messages: ChatMessage[]): Promise<string> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
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

  const refinedName = name.trim() || '목업입니다.';
  const placeholder = '목업입니다.';

  return {
    name: refinedName,
    bio: placeholder,
    personality: placeholder,
    skills: [
      { name: placeholder, description: placeholder, tags: [placeholder] }
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

export const testConnection = async () => {
  if (USE_MOCK_AI) {
    console.info('[AI TEST] Mock 모드에서는 테스트 호출이 생략됩니다.');
    return;
  }

  try {
    const content = await callAdotxChat([
      { role: 'user', content: '여름철 에어컨 적정 온도는? 한줄로 대답해.' }
    ]);
    console.info('[AI TEST] 응답:', content);
  } catch (error) {
    console.error('[AI TEST] 호출 실패:', error);
  }
};

