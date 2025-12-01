// [확인용] 깃허브 연동 테스트 주석입니다.
import React, { useState, useEffect } from 'react';
import { User, Character, WorldType, BattleResult } from './types';
import * as Storage from './services/storageService';
import * as GameService from './services/gameService';
import * as AIService from './services/aiService';
import * as AuthService from './services/authService';
import { firestoreService } from './services/firestoreService';
import { generateId } from './utils/id';
import { Button, Card, Input, TextArea, Container, BottomNav, Badge, Tabs, Avatar, ProgressBar, ScreenLayout } from './components/UIComponents';
import { Swords, Trophy, Zap, ChevronLeft, Plus, Crown, Clock, Share2, Trash2, Copy, Check } from 'lucide-react';
import tohLogo from './src/assets/TOH.png';

// --- SUB-PAGES ---

// 1. Login Page
type LoginPageProps = {
  onLogin: () => void;
  onSetFirebaseUid: (uid: string) => void;
};

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSetFirebaseUid }) => {
  const [oauthLoading, setOauthLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleOAuthLogin = async () => {
    setLoginError(null);
    setOauthLoading(true);
    try {
      const firebaseUser = await AuthService.signInWithGoogle();
      const fallbackName = firebaseUser.email ? firebaseUser.email.split('@')[0] : `모험가_${firebaseUser.uid.slice(0, 6)}`;
      const usernameFromProvider = (firebaseUser.displayName || fallbackName).trim();
      const createdAt = firebaseUser.metadata?.creationTime
        ? new Date(firebaseUser.metadata.creationTime).getTime()
        : Date.now();
      const oauthUser: User = {
        id: firebaseUser.uid,
        username: usernameFromProvider,
        createdAt,
      };
      Storage.saveOrUpdateUser(oauthUser);
      Storage.setCurrentUser(oauthUser);
      onSetFirebaseUid(firebaseUser.uid);
      onLogin();
    } catch (err) {
      console.error(err);
      setLoginError('OAuth 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setOauthLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser: User = {
      id: generateId(),
      username: `게스트_${Date.now().toString().slice(-4)}`,
      createdAt: Date.now(),
    };
    Storage.saveOrUpdateUser(guestUser);
    Storage.setCurrentUser(guestUser);
    onLogin();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] p-6 text-center">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full"></div>
        <Swords size={80} className="text-blue-500 relative z-10" />
      </div>
      <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
        TALE OF<br /><span className="text-blue-500">HEROES</span>
      </h1>
      <p className="text-slate-400 mb-10 text-sm">운명을 건 서사시가 시작됩니다</p>
      
      <div className="w-full max-w-xs space-y-4">
        <Button
          className="w-full text-sm flex items-center justify-center gap-2"
          variant="secondary"
          isLoading={oauthLoading}
          onClick={handleOAuthLogin}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
          Google 계정으로 시작하기
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-slate-700"></div>
          <span className="text-xs text-slate-500 uppercase">또는</span>
          <div className="flex-1 h-px bg-slate-700"></div>
        </div>
        
        <Button
          className="w-full text-sm"
          variant="ghost"
          onClick={handleGuestLogin}
        >
          게스트로 시작하기
        </Button>
        
        {loginError && (
          <p className="text-xs text-rose-400 text-center">{loginError}</p>
        )}
      </div>
    </div>
  );
};

// 2. Create Page
const CreatePage: React.FC<{ user: User; onFinish: () => void }> = ({ user, onFinish }) => {
  const [step, setStep] = useState<'input' | 'loading' | 'preview'>('input');
  const [world, setWorld] = useState<WorldType>(WorldType.FANTASY);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generatedChar, setGeneratedChar] = useState<Partial<Character> | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || !name.trim()) return;
    setStep('loading');
    try {
      const aiData = await AIService.generateCharacterAI(world, name, prompt);
      
      // Assign a random placeholder color/image based on world
      const colors = ['red', 'blue', 'green', 'purple', 'yellow'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      setGeneratedChar({
        ...aiData,
        world,
        prompt,
        ownerId: user.id,
        ownerName: user.username,
        elo: 1000,
        wins: 0,
        losses: 0,
        matches: 0,
        themeColor: randomColor,
        avatarUrl: `https://placehold.co/400x600/${randomColor === 'white' ? '333' : randomColor === 'yellow' ? 'ca8a04' : randomColor === 'red' ? '991b1b' : randomColor === 'green' ? '166534' : '1e3a8a'}/ffffff?text=${encodeURIComponent(aiData.name.slice(0,2))}`
      });
      setStep('preview');
    } catch (e) {
      alert("생성 실패! 다시 시도해주세요.");
      setStep('input');
    }
  };

  const handleSave = async () => {
    if (generatedChar && firebaseUid) {
      try {
        // Firestore에 저장 (자동 ID 생성)
        const characterId = await firestoreService.createCharacter({
          ...generatedChar,
          createdAt: Date.now()
        } as Omit<Character, 'id'>, firebaseUid);
        
        // 로컬 저장도 유지 (ID 포함)
        const newChar: Character = {
          ...generatedChar,
          id: characterId,
          userId: firebaseUid,
          createdAt: Date.now()
        } as Character;
        Storage.saveCharacter(newChar);
        
        console.log('캐릭터 저장 완료:', characterId);
        onFinish();
      } catch (error) {
        console.error('캐릭터 저장 실패:', error);
        alert('캐릭터 저장에 실패했습니다. 다시 시도해주세요.');
      }
    } else {
      // Firebase UID가 없으면 로컬만 저장
      const newChar: Character = {
        ...generatedChar,
        id: generateId(),
        userId: firebaseUid || '',
        createdAt: Date.now()
      } as Character;
      Storage.saveCharacter(newChar);
      onFinish();
    }
  };

  const handleReset = () => {
    setStep('input');
    setGeneratedChar(null);
  };

  if (step === 'loading') {
    return (
      <Container className="flex flex-col items-center justify-center text-center gap-6 min-h-screen">
        <div className="relative">
          <div className="w-28 h-28 rounded-full border-4 border-indigo-500/30 border-t-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border border-indigo-500/20"></div>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold text-lg">AI가 영웅을 설계 중...</p>
          <p className="text-sm text-slate-400">약 5~10초 정도 소요될 수 있습니다.</p>
        </div>
        <Button variant="ghost" onClick={handleReset}>취소</Button>
      </Container>
    );
  }

  if (step === 'preview' && generatedChar) {
    return (
      <Container>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">AI Generated</p>
            <h2 className="text-3xl font-black text-white">{generatedChar.name}</h2>
            <p className="text-slate-400 text-sm">{generatedChar.personality || '성격 정보 없음'}</p>
          </div>

          <Card title="영웅 배경">
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">{generatedChar.bio || '배경 정보가 전달되지 않았습니다.'}</p>
          </Card>

          {generatedChar.skills && generatedChar.skills.length > 0 && (
            <Card title="주요 스킬">
              <div className="space-y-4">
                {generatedChar.skills.slice(0, 4).map((skill, idx) => (
                  <div key={idx} className="border border-white/5 rounded-2xl p-4 bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-bold">{skill.name}</h3>
                      <span className="text-[11px] text-slate-400">#{idx + 1}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{skill.description}</p>
                    {skill.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {skill.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/40">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="space-y-3">
            <Button variant="blue" fullWidth size="lg" onClick={handleSave}>
              이 영웅으로 확정하기
            </Button>
            <Button variant="secondary" fullWidth onClick={handleReset}>
              다시 입력하기
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="text-xl font-bold mb-6 pt-2">새로운 영웅 생성</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">세계관</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(WorldType).map(w => (
              <button 
                key={w}
                onClick={() => setWorld(w)}
                className={`p-3 rounded-xl text-sm font-bold border transition-all ${world === w ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#1e293b] border-slate-700 text-slate-400'}`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">이름</label>
          <Input 
            placeholder="이름을 입력하세요" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            maxLength={20}
            required
          />
          <div className="text-right text-[11px] text-slate-500 mt-1">{name.length}/20</div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">설명</label>
          <div className="relative">
            <TextArea 
              placeholder="예: 은발의 여기사, 차가운 성격이지만 고양이를 좋아함, 전설의 검을 찾고 있음." 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)} 
              className="h-32 pr-16"
              maxLength={1000}
            />
            <div className="absolute bottom-2 right-4 text-[11px] text-slate-500">
              {prompt.length}/1000
            </div>
          </div>
        </div>

        <Button
          variant="blue"
          fullWidth
          size="lg"
          onClick={handleGenerate}
          disabled={!prompt || !name}
        >
          운명 생성하기
        </Button>
        <p className="text-center text-xs text-slate-500 mt-2">
           2번 더 생성 가능합니다 (최대 4개)
        </p>
      </div>
    </Container>
  );
};

// 3. Battle View
const BattleView: React.FC<{
  myChar: Character;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  user: User;
  onProfile: () => void;
}> = ({ myChar, onClose, currentView, onNavigate, user, onProfile }) => {
  const [opponent, setOpponent] = useState<Character | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fake progress animation
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    const startBattle = async () => {
      const enemy = Storage.getRandomOpponent(myChar.id);
      if (!enemy) {
        alert('상대가 없습니다.');
        onClose();
        return;
      }
      setOpponent(enemy);
      try {
        const result = await GameService.processBattle(myChar.id, enemy.id, false);
        await new Promise((r) => setTimeout(r, 2000));
        setBattleResult(result);
      } catch (e) {
        alert('오류 발생');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    startBattle();
    return () => clearInterval(timer);
  }, []);

  const handleNavigate = (target: string) => {
    onClose();
    onNavigate(target);
  };

  return (
    <>
      <TopBar user={user} onProfile={onProfile} />
      <ScreenLayout
        currentView={currentView}
        onNavigate={handleNavigate}
        className="pb-32 pt-20"
        containerProps={{
          contentClassName: 'p-0',
          className: 'px-5 pt-5 pb-8 space-y-6',
          frameClassName: 'rounded-none border border-slate-900/30',
        }}
      >
      <div className="rounded-[28px] border border-slate-800 bg-[#11151f] p-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-900 text-white border border-slate-700"
        >
          <ChevronLeft />
        </button>
        <span className="font-bold text-white tracking-wide">배틀 진행 중</span>
        <Badge color="bg-slate-800" className="px-3">AI 시뮬레이션</Badge>
      </div>

      {opponent ? (
        <>
          <div className="relative min-h-[260px] rounded-[32px] border border-slate-800 overflow-hidden bg-[#0b1224]">
            <div className="absolute inset-0 flex">
              <div className="w-1/2 h-full bg-indigo-900/20 relative overflow-hidden">
                <img src={myChar.avatarUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
              </div>
              <div className="w-1/2 h-full bg-red-900/20 relative overflow-hidden">
                <img src={opponent.avatarUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
              </div>
            </div>

            <div className="absolute inset-0 flex items-end justify-between p-5 pb-10 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent">
              <div className="text-left z-10">
                <div className="text-indigo-400 font-bold text-lg">{myChar.name}</div>
                <Badge color="bg-indigo-600">{myChar.elo} RP</Badge>
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-16 h-16 bg-[#11151f] rounded-full border-4 border-slate-700 flex items-center justify-center">
                  <span className="font-black text-red-500 text-2xl italic pr-1">VS</span>
                </div>
              </div>
              <div className="text-right z-10">
                <div className="text-red-400 font-bold text-lg">{opponent.name}</div>
                <Badge color="bg-red-600">{opponent.elo} RP</Badge>
              </div>
            </div>
          </div>

          <div className="bg-[#11151f] border border-slate-800/70 rounded-[28px] p-5 space-y-4">
            <div>
              <ProgressBar
                progress={loading ? progress : 100}
                label={loading ? '전투 시뮬레이션 중...' : '전투 종료'}
              />
              <div className="text-slate-500 text-[11px] mt-2 text-right">
                {loading ? 'AI 연산 중...' : '결과 산출 완료'}
              </div>
            </div>

            {battleResult ? (
              <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1">
                {battleResult.winnerId === myChar.id ? (
                  <div className="bg-indigo-900/30 border border-indigo-500/50 p-4 rounded-xl text-center">
                    <h3 className="text-2xl font-black text-indigo-400 uppercase mb-1">VICTORY</h3>
                    <p className="text-indigo-200 text-sm">승리하여 Elo 점수를 획득했습니다!</p>
                  </div>
                ) : (
                  <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl text-center">
                    <h3 className="text-2xl font-black text-red-500 uppercase mb-1">DEFEAT</h3>
                    <p className="text-red-200 text-sm">패배하여 Elo 점수가 하락했습니다.</p>
                  </div>
                )}

                {battleResult.logs.map((log, i) => (
                  <div
                    key={i}
                    className={`text-sm p-3 rounded-lg ${
                      log.attackerName === myChar.name
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    <span
                      className={`font-bold mr-2 ${
                        log.attackerName === myChar.name ? 'text-indigo-400' : 'text-red-400'
                      }`}
                    >
                      {log.attackerName}
                    </span>
                    {log.description}
                  </div>
                ))}
              </div>
            ) : (
              <div className="min-h-[180px] flex items-center justify-center text-slate-600">
                <div className="animate-pulse">로그 생성 대기 중...</div>
              </div>
            )}

            {!loading && (
              <Button fullWidth onClick={onClose} variant="blue">
                결과 확인
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-slate-400">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p>상대를 찾는 중...</p>
        </div>
      )}
      </ScreenLayout>
    </>
  );
};

// Shared Top Bar
const TopBar: React.FC<{ user: User; onProfile: () => void }> = ({ user, onProfile }) => (
  <div className="fixed top-0 left-0 right-0 z-40">
    <div className="w-full max-w-[520px] mx-auto px-4 bg-[#11151f]">
      <div className="border border-slate-900/30 grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3">
        <div />
        <div className="flex justify-center">
          <img
            src={tohLogo}
            alt="TOH 로고"
            className="h-14 object-contain"
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onProfile}
            className="rounded-full p-0.5 border border-white/10 hover:border-cyan-300 transition"
          >
            <Avatar alt={user.username} className="bg-indigo-600" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// 4. Detailed Character View
const CharacterDetail: React.FC<{
  char: Character;
  onBack: () => void;
  onBattle: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  user: User;
  onProfile: () => void;
}> = ({ char, onBack, onBattle, currentView, onNavigate, user, onProfile }) => {
  const [tab, setTab] = useState('소개');

  const { rankPosition, totalChars } = React.useMemo(() => {
    const roster = Storage.getAllCharacters().sort((a, b) => b.elo - a.elo);
    const idx = roster.findIndex((c) => c.id === char.id);
    return {
      rankPosition: idx >= 0 ? idx + 1 : null,
      totalChars: roster.length,
    };
  }, [char.id, char.elo]);

  const winRate =
    char.matches > 0
      ? Math.round((char.wins / Math.max(1, char.matches)) * 100)
      : 0;
  const tier = (() => {
    if (char.elo >= 1900) return { label: 'SS랭크', subtitle: '신화의 존재' };
    if (char.elo >= 1600) return { label: 'S랭크', subtitle: '전설의 영웅' };
    if (char.elo >= 1400) return { label: 'A랭크', subtitle: '정예 용사' };
    if (char.elo >= 1200) return { label: 'B랭크', subtitle: '숙련된 전사' };
    if (char.elo >= 1000) return { label: 'C랭크', subtitle: '길들여진 영웅' };
    return { label: 'E랭크', subtitle: '이름 없는 자' };
  })();

  const epithetSource = char.personality || char.prompt || '';
  const epithet = epithetSource
    ? `『${epithetSource.slice(0, 12)}${epithetSource.length > 12 ? '…' : ''}』`
    : '『미상』';

  const statCards = [
    {
      label: '전체 랭킹',
      value: rankPosition ? `#${rankPosition.toLocaleString()}` : '집계 중',
      sub: totalChars
        ? `총 ${totalChars.toLocaleString()}명 중`
        : '데이터 없음',
      accent: 'text-[#8ab4ff]'
    },
    {
      label: 'Elo Score',
      value: char.elo.toLocaleString(),
      sub: '실시간 전투 지표',
      accent: 'text-yellow-300',
      icon: <Zap size={14} className="text-yellow-300" />
    },
    {
      label: '승률',
      value: `${winRate}%`,
      sub: `${char.wins}승 ${char.losses}패`,
      accent: 'text-emerald-300'
    },
    {
      label: '전체 전투수',
      value: char.matches.toLocaleString(),
      sub: '시뮬레이션 포함',
      accent: 'text-violet-300'
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0f172a] pb-20 pt-20 text-slate-100">
      <TopBar user={user} onProfile={onProfile} />
      <Container
        contentClassName="p-0"
        frameClassName="rounded-none border border-slate-900/30"
      >
        <section className="bg-[#11151f] rounded-[10px] px-5 pt-5 pb-8 space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="p-2 rounded-full bg-slate-900 text-white border border-slate-700"
            >
              <ChevronLeft />
            </button>
            <div className="w-10" />
          </div>

          <div className="relative w-full max-w-[360px] mx-auto aspect-square rounded-[20px] overflow-hidden bg-slate-900 border border-slate-700">
            <img
              src={char.avatarUrl}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70"></div>
          </div>

          <div className="text-center space-y-2">
            <div className="text-[11px] tracking-[0.35em] text-slate-500 uppercase">
              {epithet}
            </div>
            <h1 className="text-3xl font-black text-white">{char.name}</h1>
            <div className="flex items-center justify-center gap-2">
              <span className="px-4 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-xs font-semibold text-slate-200">
                {tier.label}
              </span>
              <Badge color="bg-indigo-600/80">{char.world}</Badge>
            </div>
          </div>
        </section>

        <section className="bg-[#11151f] rounded-[10px] border-t border-slate-800/70 px-6 py-6 space-y-4 mt-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 text-slate-100 text-xs font-semibold tracking-wide hover:border-cyan-300 hover:text-white transition">
              <Share2 size={14} />
              <span>프로필 공유</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="border border-white/5 bg-[#1e2939] p-4 rounded-2xl"
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
                  {card.label}
                </div>
                <div className={`text-2xl font-black ${card.accent || 'text-white'} flex items-center gap-2`}>
                  {card.icon}
                  {card.value}
                </div>
                <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-800/70 px-6 py-6">
          <Tabs options={['소개', '능력']} active={tab} onChange={setTab} />

          {tab === '소개' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-slate-300 leading-relaxed text-sm">
                {char.bio}
              </div>

              <div className="bg-[#141d35] border border-slate-800 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-white">Ep.3 완성까지</h4>
                  <span className="text-xs text-indigo-400 font-bold">
                    승리 {char.wins}/30
                  </span>
                </div>
                <p className="text-slate-400 text-xs italic mb-3">
                  "넘어진 그 자리에서 다시 일어서라"
                </p>
                <ProgressBar progress={(char.wins / 30) * 100} />
              </div>

              <div className="flex items-start gap-4 bg-[#141d35] border border-slate-800 p-4 rounded-2xl">
                <Avatar src={char.avatarUrl} alt={char.name} size="md" />
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {char.name} 탄생 스토리
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {char.prompt}
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === '능력' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-wrap gap-2 mb-4">
                {char.skills.map((s, i) => (
                  <div
                    key={i}
                    className="w-full bg-[#141d35] p-4 border border-slate-800 rounded-2xl"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-indigo-300 font-bold">
                        {s.name}
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {s.tags.map((t) => (
                          <Badge key={t} color="bg-slate-700">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs">{s.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border border-dashed border-slate-700 p-6 text-center rounded-2xl">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-600">
                  <Plus />
                </div>
                <p className="text-slate-500 text-sm">
                  승리 15회 달성 시
                  <br />
                  새로운 스킬 슬롯 해금
                </p>
              </div>
            </div>
          )}
        </section>
      </Container>

      <div className="fixed bottom-32 left-0 right-0">
        <div className="w-full max-w-[520px] mx-auto px-6 py-4 flex justify-center">
          <Button
            variant="blue"
            size="lg"
            className="w-[40%] min-w-[170px] py-4 text-base whitespace-nowrap"
            onClick={onBattle}
          >
            <Swords className="mr-2 flex-shrink-0" />
            <span className="whitespace-nowrap">배틀 시작</span>
          </Button>
        </div>
      </div>

      <BottomNav
        current={currentView}
        onChange={(target) => {
          onNavigate(target);
        }}
        maxWidthClass="max-w-[520px]"
      />
    </div>
  );
};

// 5. Home Page
const HomePage: React.FC<{ user: User; onSelectChar: (c: Character) => void; onCreate: () => void; onDeleteChar: (id: string) => void }> = ({ user, onSelectChar, onCreate, onDeleteChar }) => {
  const [chars, setChars] = useState<Character[]>([]);

  useEffect(() => {
    setChars(Storage.getUserCharacters(user.id));
  }, [user]);

  const handleDelete = (char: Character) => {
    if (window.confirm(`${char.name}을 삭제할까요?`)) {
      onDeleteChar(char.id);
      setChars(Storage.getUserCharacters(user.id));
    }
  };

  return (
    <>
      <Container className="space-y-6">
        <div className="space-y-6">
          {chars.map((char) => (
            <div
              key={char.id}
              className="relative rounded-[16px] border border-white/10 bg-gradient-to-b from-[#0d1222] to-[#04070f] overflow-hidden cursor-pointer group"
              onClick={() => onSelectChar(char)}
            >
              <button
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 border border-white/10 text-slate-200 hover:text-red-300 transition z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(char);
                }}
              >
                <Trash2 size={18} />
              </button>

              <div className="relative w-full aspect-[30/13]">
                <img
                  src={char.avatarUrl}
                  alt={char.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"></div>
                <div className="absolute bottom-0 left-0 p-4 w-full text-white">
                  <div className="text-[11px] tracking-[0.3em] uppercase text-slate-300">
                    {char.world}
                  </div>
                  <div className="text-2xl font-black leading-tight mt-1.5">
                    {char.name}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-widest">
                    전투 지표
                  </div>
                  <div className="flex gap-4 mt-1.5 text-sm text-slate-200">
                    <span className="flex items-center gap-1">
                      <Trophy size={14} className="text-yellow-400" />
                      {char.wins} 승
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap size={14} className="text-cyan-300" />
                      {char.elo} RP
                    </span>
                  </div>
                </div>
                {GameService.checkUnlockable(char) && (
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-semibold">
                    보상 수령 가능
                  </span>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={onCreate}
            className="w-full rounded-[32px] border-2 border-dashed border-white/20 bg-white/5 px-6 py-12 text-center text-slate-200 flex flex-col items-center gap-3 hover:border-cyan-300/50 hover:text-cyan-200 transition"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-cyan-300">
              <Plus size={26} />
            </div>
            <div className="text-lg font-bold">새로운 영웅 생성</div>
            <p className="text-sm text-slate-400">
              새로운 모험을 시작해보세요<br />
              2번 더 만들 수 있어요 (최대 4개)
            </p>
          </button>
        </div>

        {chars.length > 0 && (
          <div className="p-4 bg-indigo-900/20 rounded-2xl border border-indigo-500/30 flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white">
              <Crown size={22} />
            </div>
            <div>
              <div className="text-indigo-200 font-semibold text-sm">
                첫 번째 승부사가 되어보세요
              </div>
              <div className="text-slate-400 text-xs">
                배틀에서 승리하고 데일리 랭킹에 도전하세요.
              </div>
            </div>
          </div>
        )}
      </Container>
    </>
  );
};

// 6. Ranking Page
const RankingPage: React.FC = () => {
  const [rankings, setRankings] = useState<Character[]>([]);
  const [tab, setTab] = useState('데일리 탑');

  useEffect(() => {
    const all = Storage.getAllCharacters();
    const sorted = all.sort((a, b) => b.elo - a.elo);
    setRankings(sorted);
  }, []);

  const topRank = rankings[0];

  return (
    <Container className="pt-2">
      <div className="text-center mb-6 pt-4">
        <h2 className="text-white font-bold">랭킹</h2>
      </div>

      {/* Top Banner Area */}
      {topRank && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-center mb-6 border border-indigo-500/30 relative overflow-hidden">
           <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-yellow-500 blur-3xl opacity-20 rounded-full"></div>
           <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
           <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Current Champion</div>
           <h3 className="text-2xl font-black text-white mb-1">{topRank.name}</h3>
           <p className="text-slate-400 text-sm">{topRank.ownerName}</p>
        </div>
      )}

      {/* Ranking Tabs */}
      <Tabs options={['데일리 탑', '전체 랭킹']} active={tab} onChange={setTab} />

      {/* Daily Info */}
      <div className="bg-[#1e293b] rounded-xl p-4 flex items-center justify-between mb-4 border border-slate-700">
         <div className="flex items-center gap-3">
           <div className="bg-blue-500/20 p-2 rounded-full text-blue-400"><Swords size={18}/></div>
           <div>
             <div className="text-white font-bold text-sm">데일리 탑 진행중!</div>
             <div className="text-slate-500 text-xs">하루 한 번, 최강을 가린다</div>
           </div>
         </div>
         <div className="text-yellow-500 font-mono font-bold flex items-center gap-1">
           <Clock size={14} /> 15:09:14
         </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {rankings.map((char, idx) => (
          <div key={char.id} className="flex items-center gap-4 bg-[#1e293b] p-3 rounded-2xl border border-slate-800">
             <div className="w-8 text-center font-black text-lg italic text-slate-600">
               {idx === 0 ? <span className="text-yellow-400">1</span> : 
                idx === 1 ? <span className="text-slate-300">2</span> : 
                idx === 2 ? <span className="text-amber-700">3</span> : idx + 1}
             </div>
             <Avatar src={char.avatarUrl} alt={char.name} />
             <div className="flex-1">
               <div className="text-white font-bold">{char.name}</div>
               <div className="text-slate-500 text-xs">{char.ownerName} • {char.world}</div>
             </div>
             <div className="text-right">
               <div className="text-indigo-400 font-bold">{char.elo}</div>
               <div className="text-slate-600 text-[10px]">RP</div>
             </div>
          </div>
        ))}
      </div>
    </Container>
  );
};

const ProfilePage: React.FC<{ user: User; firebaseUid?: string | null; onLogout: () => void; isLoggingOut: boolean }> = ({ user, firebaseUid, onLogout, isLoggingOut }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUid = async () => {
    if (!firebaseUid) return;
    try {
      await navigator.clipboard?.writeText(firebaseUid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy UID', err);
    }
  };

  return (
    <Container className="pt-10" contentClassName="p-8">
      <div className="w-full max-w-sm mx-auto space-y-6 text-center">
        <div className="bg-gradient-to-b from-[#1f2937] via-[#111827] to-[#050a12] rounded-3xl p-6 border border-white/5 shadow-2xl shadow-cyan-500/10">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-2xl"></div>
              <Avatar alt={user.username} size="xl" className="relative border-2 border-cyan-400/30" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">Hero</p>
              <h2 className="text-3xl font-black text-white mt-1">{user.username}</h2>
              <p className="text-sm text-slate-400 mt-2">프로필 페이지가 곧 확장됩니다.</p>
            </div>
          </div>
        </div>

        {firebaseUid && (
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-5 text-left space-y-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <span>Firebase UID</span>
              {copied && <span className="text-emerald-400 font-semibold tracking-normal">복사됨!</span>}
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-sm text-white break-all bg-black/30 border border-slate-800 rounded-2xl px-3 py-2">
                {firebaseUid}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="border border-white/10 px-3"
                onClick={handleCopyUid}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
          </div>
        )}

        <Button variant="secondary" className="w-full" onClick={onLogout} isLoading={isLoggingOut}>
          로그아웃
        </Button>
      </div>
    </Container>
  );
};

// --- MAIN APP COMPONENT ---

const allowedViews = new Set(['home', 'create', 'ranking', 'profile']);

const getViewFromHash = () => {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace('#', '').toLowerCase();
  return allowedViews.has(hash) ? hash : 'home';
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<string>(() => getViewFromHash());
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [isBattling, setIsBattling] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  const handleDeleteCharacter = (charId: string) => {
    Storage.deleteCharacter(charId);
    handleNavigate('home');
  }; 

  const handleNavigate = (target: string) => {
    const next = allowedViews.has(target) ? target : 'home';
    if (typeof window !== 'undefined') {
      window.location.hash = next;
    }
    setSelectedChar(null);
    setIsBattling(false);
    setView(next);
  };

  const handleProfile = () => {
    handleNavigate('profile');
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await AuthService.signOutFirebase().catch(() => undefined);
    } finally {
      Storage.setCurrentUser(null);
      setSelectedChar(null);
      setIsBattling(false);
      setUser(null);
      setFirebaseUid(null);
      setView('home');
      if (typeof window !== 'undefined') {
        window.location.hash = 'home';
      }
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    Storage.seedDatabase(); 
    const loadedUser = Storage.getCurrentUser();
    if (loadedUser) setUser(loadedUser);
    const fbUser = AuthService.getCurrentFirebaseUser?.();
    if (fbUser?.uid) {
      setFirebaseUid(fbUser.uid);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.hash) {
      window.location.hash = 'home';
    }
    const handleHashChange = () => {
      const next = getViewFromHash();
      setSelectedChar(null);
      setIsBattling(false);
      setView(next);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!user) {
    return <LoginPage onLogin={() => setUser(Storage.getCurrentUser())} onSetFirebaseUid={setFirebaseUid} />;
  }

  // Handle detailed view or battle view overrides
  if (isBattling && selectedChar) {
    return (
      <BattleView 
        myChar={selectedChar} 
        onClose={() => {
          setIsBattling(false);
          // Keeping selectedChar allows us to return to the detail view once battle ends
        }}
        currentView={view}
        onNavigate={handleNavigate}
        user={user}
        onProfile={handleProfile}
      />
    );
  }

  if (selectedChar && !isBattling) {
    return (
      <CharacterDetail 
        char={selectedChar} 
        onBack={() => setSelectedChar(null)} 
        onBattle={() => setIsBattling(true)}
        currentView={view}
        onNavigate={handleNavigate}
        user={user}
        onProfile={handleProfile}
      />
    );
  }

  return (
    <div className="bg-[#0f172a] min-h-screen text-slate-200 font-sans pb-20 pt-20">
      <TopBar user={user} onProfile={handleProfile} />
      {view === 'home' && (
        <HomePage 
          user={user} 
          onCreate={() => handleNavigate('create')} 
          onSelectChar={setSelectedChar} 
          onDeleteChar={handleDeleteCharacter}
        />
      )}
      {view === 'create' && <CreatePage user={user} onFinish={() => handleNavigate('home')} />}
      {view === 'ranking' && <RankingPage />}
      {view === 'profile' && (
        <ProfilePage
          user={user}
          firebaseUid={firebaseUid}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
      )}
      
      <BottomNav current={view} onChange={handleNavigate} />
    </div>
  );
};

export default App;