import { AICharacterResponse, AIBattleResponse, Character, WorldType } from '../types';

/**
 * ADOTX (https://guest-api.sktax.chat) integration details
 * 
 * [CORS 문제 해결]
 * 브라우저에서 직접 외부 API를 호출하면 CORS 정책에 의해 차단됩니다.
 * 이를 우회하기 위해 'corsproxy.io' 프록시 서버를 경유하여 요청을 보냅니다.
 * 주의: 프로덕션 환경에서는 반드시 자체 백엔드 서버를 구축하여 API를 호출해야 합니다.
 */
const TARGET_URL = 'https://guest-api.sktax.chat/v1/chat/completions';
const PROXY_URL = 'https://corsproxy.io/?';
const API_URL = PROXY_URL + encodeURIComponent(TARGET_URL);

const API_MODEL = 'ax4';
// NOTE: 사용자 요청으로 API 키를 하드코딩합니다.
const API_KEY = 'sktax-XyeKFrq67ZjS4EpsDlrHHXV8it';

// API 연결 실패 시 자동으로 mock으로 전환됩니다.
const USE_MOCK_AI = false;

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const callAdotxChat = async (messages: ChatMessage[]): Promise<string> => {
  console.log('[AI 요청 시작]', messages);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: API_MODEL,
        messages,
        temperature: 0.7 
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI API 오류] 상태 코드: ${response.status}, 내용: ${errorText}`);
      throw new Error(`ADOTX API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log('[AI 응답 데이터]', data);
    
    const content: string | undefined = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[AI 응답 오류] choices나 message.content가 없습니다.', data);
      throw new Error('ADOTX API 응답에 유효한 내용이 없습니다.');
    }

    return content.trim();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('[치명적 오류] CORS 문제로 인해 요청이 차단되었습니다. 프록시 설정을 확인하세요.');
    }
    throw error;
  }
};

const extractJson = (raw: string): any => {
  try {
    // 1. 순수 JSON인 경우 시도
    return JSON.parse(raw);
  } catch (e) {
    // 2. 마크다운 코드 블록이나 잡담이 섞인 경우 추출 시도
    try {
      // 첫 번째 '{' 부터 마지막 '}' 까지 추출
      const firstOpen = raw.indexOf('{');
      const lastClose = raw.lastIndexOf('}');
      
      if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        const jsonString = raw.substring(firstOpen, lastClose + 1);
        return JSON.parse(jsonString);
      }
    } catch (e2) {
      console.error('[JSON 파싱 실패] 원본 텍스트:', raw);
    }
  }
  throw new Error('AI 응답에서 JSON을 추출할 수 없습니다.');
};

export const testConnection = async () => {
  console.log("--- [AI 연결 테스트 시작] ---");
  try {
    const response = await callAdotxChat([
      { role: 'user', content: "대한민국의 현재 대통령은 누구야? 한 줄로 대답해." }
    ]);
    console.log("%c--- [AI 연결 테스트 성공] ---", "color: green; font-weight: bold;");
    console.log("응답:", response);
    return response;
  } catch (error) {
    console.error("--- [AI 연결 테스트 실패] ---", error);
    // 실패해도 앱이 멈추지 않도록 에러를 다시 던지지 않음 (로그만 출력)
  }
};

export const generateCharacterAI = async (world: WorldType, name: string, userPrompt: string): Promise<AICharacterResponse> => {
  if (USE_MOCK_AI) {
    return mockCharacterGeneration(world, name, userPrompt);
  }
  
  const systemPrompt = `당신은 텍스트 기반 PvP 게임의 캐릭터 데이터 생성기입니다. 
사용자의 요청을 분석하여 게임 내 캐릭터 정보를 JSON 형식으로만 응답해야 합니다. 
설명이나 인사말 없이 오직 JSON 데이터만 반환하세요.`;

  const userContent = `
[요청 정보]
- 세계관: ${world}
- 캐릭터 이름: ${name || '(알아서 어울리는 이름으로 작명)'}
- 유저 설정/키워드: "${userPrompt}"

[필수 출력 스키마 (JSON)]
{
  "name": "캐릭터 이름 (문자열)",
  "bio": "캐릭터 배경 스토리 (100자 내외)",
  "personality": "성격 묘사 (한 문장)",
  "skills": [
    { "name": "스킬명", "description": "스킬 설명", "tags": ["공격", "방어", "마법" 등 1~2개 태그] },
    { "name": "스킬명", "description": "스킬 설명", "tags": ["태그"] },
    { "name": "스킬명", "description": "스킬 설명", "tags": ["태그"] }
  ]
}
스킬은 2~3개를 생성하세요.`;

  try {
    const content = await callAdotxChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]);
    return extractJson(content) as AICharacterResponse;
  } catch (error) {
    console.error('캐릭터 생성 API 오류 발생, Mock 데이터로 전환합니다.', error);
    return mockCharacterGeneration(world, name, userPrompt);
  }
};

export const simulateBattleAI = async (charA: Character, charB: Character): Promise<AIBattleResponse> => {
  if (USE_MOCK_AI) {
    return mockBattleSimulation(charA, charB);
  }
  
  const systemPrompt = `당신은 턴제 전투 시뮬레이션 엔진입니다. 
두 캐릭터의 능력치와 설정을 비교하여 전투 과정을 시뮬레이션하고 결과를 JSON으로 반환하세요.
무승부는 없으며 반드시 승자가 결정되어야 합니다.`;

  const userContent = `
[Player A]
이름: ${charA.name}
설명: ${charA.bio}
성격: ${charA.personality}
스킬: ${charA.skills.map(s => `${s.name}(${s.tags.join(',')})`).join(', ')}
점수(Elo): ${charA.elo}

[Player B]
이름: ${charB.name}
설명: ${charB.bio}
성격: ${charB.personality}
스킬: ${charB.skills.map(s => `${s.name}(${s.tags.join(',')})`).join(', ')}
점수(Elo): ${charB.elo}

[요청 사항]
5~7턴의 전투 로그를 작성하세요.
각 턴마다 서로 스킬을 주고받으며, 마지막에 승패가 갈립니다.

[필수 출력 스키마 (JSON)]
{
  "winnerIndex": 0 (A승리) 또는 1 (B승리),
  "logs": [
    "1턴: A가 [스킬명]을 사용하여 공격...",
    "2턴: B가 이를 회피하고...",
    ...
  ],
  "summary": "전투 총평 (한 문장)"
}`;

  try {
    const content = await callAdotxChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]);
    return extractJson(content) as AIBattleResponse;
  } catch (error) {
    console.error('전투 시뮬레이션 API 오류 발생, Mock 데이터로 전환합니다.', error);
    return mockBattleSimulation(charA, charB);
  }
};


// --- MOCK IMPLEMENTATIONS (Fallback) ---

const mockCharacterGeneration = async (world: WorldType, name: string, prompt: string): Promise<AICharacterResponse> => {
  await new Promise(resolve => setTimeout(resolve, 1500)); 

  const adjectives = ["전설의", "어둠의", "빛나는", "방랑하는", "미친", "고독한"];
  const jobs = ["검사", "마법사", "해커", "요원", "무도가"];
  const refinedName = name.trim() || `${adjectives[Math.floor(Math.random()*adjectives.length)]} ${jobs[Math.floor(Math.random()*jobs.length)]}`;

  return {
    name: refinedName,
    bio: `[API 연결 실패 - Mock 데이터] ${world} 세계관에서 ${prompt}의 운명을 타고난 존재입니다. (실제 AI 응답을 받지 못했습니다)`,
    personality: "냉소적이지만 결정적인 순간에 뜨거워지는 성격.",
    skills: [
      { name: "임시 타격", description: "API 오류로 인해 생성된 임시 스킬입니다.", tags: ["공격"] },
      { name: "오프라인 모드", description: "네트워크가 없을 때 발동합니다.", tags: ["패시브"] },
      { name: "재시도", description: "잠시 후 다시 시도하면 강력한 일격을 날립니다.", tags: ["특수"] }
    ]
  };
};

const mockBattleSimulation = async (charA: Character, charB: Character): Promise<AIBattleResponse> => {
  await new Promise(resolve => setTimeout(resolve, 2000));

  const eloDiff = charA.elo - charB.elo;
  const winProbabilityA = 1 / (1 + Math.pow(10, -eloDiff / 400));
  const isAWin = Math.random() < winProbabilityA;
  
  const winnerName = isAWin ? charA.name : charB.name;
  const loserName = isAWin ? charB.name : charA.name;

  const logs = [
    `(Mock) ${charA.name}와(과) ${charB.name}의 전투가 시작됩니다.`,
    `${charA.name}이(가) 견제 공격을 시도합니다.`,
    `${charB.name}은(는) 가볍게 피하고 반격합니다.`,
    `치열한 공방이 이어집니다! (API 연결 확인 필요)`,
    `${winnerName}의 결정적인 스킬이 적중했습니다!`,
    `${loserName}은(는) 쓰러집니다.`
  ];

  return {
    winnerIndex: isAWin ? 0 : 1,
    logs: logs,
    summary: `(Mock 결과) ${winnerName}의 승리입니다.`
  };
};