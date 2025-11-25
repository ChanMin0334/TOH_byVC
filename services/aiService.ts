import { AICharacterResponse, AIBattleResponse, Character, WorldType } from '../types';

/**
 * ADOTX (https://guest-api.sktax.chat) integration details
 * - Set VITE_ADOTX_API_KEY in your .env.local before running Vite.
 * - Requests are sent directly from the browser; to avoid leaking secrets in production,
 *   proxy the call through your own backend instead.
 */
const API_URL = import.meta.env.VITE_ADOTX_API_URL ?? '/api/chat';
const API_KEY = import.meta.env.VITE_ADOTX_API_KEY ?? 'sktax-XyeKFrq67ZjS4EpsDlrHHXV8it';
const API_MODEL = import.meta.env.VITE_ADOTX_MODEL ?? 'ax4';

// Proxy를 사용하므로 항상 실시간 호출을 사용한다.
const USE_MOCK_AI = false;

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const callAdotxChat = async (messages: ChatMessage[]): Promise<string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (API_KEY) {
    headers.Authorization = `Bearer ${API_KEY}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
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
  const systemPrompt = `당신은 웹 기반 텍스트 PvP 게임 "Tale of Heroes"의 전속 게임 디자이너 AI입니다.
플레이어가 제공한 긴 한국어 설명을 분석해 캐릭터 설정과 스킬을 설계하십시오.
게임에는 수치 스탯이 없으며 모든 표현은 서술형이어야 합니다.
전투는 턴제가 아니므로 "턴" 기반 표현을 사용하지 마십시오.
출력은 반드시 아래 JSON 스키마와 동일한 구조 하나만 포함해야 하며, JSON 밖의 텍스트는 절대 추가하지 마십시오.

{
  "name": "",
  "title": "",
  "background": "",
  "personality": "",
  "combatStyle": "",
  "role": "",
  "strengths": [""],
  "weaknesses": [""],
  "skills": [
    {
      "name": "",
      "type": "",
      "description": "",
      "mechanics": "",
      "impact": "",
      "frequency": "",
      "risk": "",
      "tags": [""],
      "drawbacks": "",
      "synergyNote": ""
    }
  ]
}`;

  const userContent = `세계관: ${world}
선호 이름: ${name || '없음'}
플레이어 입력: ${userPrompt}

설계 규칙:
1. 캐릭터 기본 정보에 name/title/background/personality/combatStyle/role/strengths(2~4개)/weaknesses(2~4개)를 채워 넣는다.
2. role은 "공격형" | "지원형" | "제어형" | "생존형" | "하이브리드" 중 하나 또는 둘 조합으로 표현한다.
3. 스킬은 총 4개를 만들고 type은 "attack" | "support" | "control" | "mobility" | "special" 중에서 선택한다.
4. mechanics는 전투 시스템이 이해할 수 있게 서술형으로 목적과 결과를 작성한다.
5. impact는 "low" | "normal" | "high" | "ultimate" 중 하나, frequency는 "자주 사용 가능" | "조건부 사용" | "전투당 1회" 중 하나, risk는 "low" | "medium" | "high" 중 하나를 사용한다.
6. impact가 "high" 이상이면 risk는 최소 "medium"이고 frequency 또는 drawbacks에 강한 제약을 둔다.
7. "턴"이라는 표현을 쓰지 말고 "잠시", "일정 시간" 등의 서술형 시간을 사용한다.
8. 스킬 간 상호작용과 시너지를 드러내고, 모든 스킬에는 명확한 drawbacks와 synergyNote를 작성한다.
9. 숫자 스탯이나 공격력 수치를 절대 언급하지 말고, 서술형으로 강약을 표현하라.
10. 출력은 위 JSON 형식 하나뿐이며, 추가 텍스트를 절대 포함하지 않는다.`;

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

