// [확인용] 깃허브 연동 테스트 주석입니다.
import React, { useState, useEffect } from 'react';
import { User, Character, WorldType, BattleResult } from './types';
import * as Storage from './services/storageService';
import * as GameService from './services/gameService';
import * as AIService from './services/aiService';
import { generateId } from './utils/id';
import { Button, Card, Input, TextArea, Container, BottomNav, Badge, Tabs, Avatar, ProgressBar } from './components/UIComponents';
import { Swords, Trophy, Skull, Zap, ChevronLeft, Plus, Crown, Clock, Share2 } from 'lucide-react';

// --- SUB-PAGES ---

// 1. Login Page
const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleLogin = () => {
    if (!username.trim()) return;
    const user = Storage.registerUser(username);
    Storage.setCurrentUser(user);
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
        <Input 
          placeholder="닉네임을 입력하세요" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
          className="text-center"
        />
        <Button className="w-full" variant="blue" onClick={handleLogin}>
          시작하기
        </Button>
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
    if (!prompt.trim()) return;
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

  const handleSave = () => {
    if (generatedChar) {
      const newChar: Character = {
        ...generatedChar,
        id: generateId(),
        createdAt: Date.now()
      } as Character;
      Storage.saveCharacter(newChar);
      onFinish();
    }
  };

  if (step === 'loading') {
    return (
      <Container className="flex flex-col items-center justify-center h-[80vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8 relative z-10"></div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">영웅을 소환 중...</h2>
        <p className="text-slate-400 text-sm text-center max-w-xs">
          AI가 당신의 이야기를 바탕으로<br/>새로운 영웅의 운명을 짓고 있습니다.
        </p>
      </Container>
    );
  }

  if (step === 'preview' && generatedChar) {
    return (
      <Container>
        <div className="sticky top-0 bg-[#0f172a] z-10 py-4 flex items-center justify-between">
          <button onClick={() => setStep('input')} className="p-2 -ml-2 text-slate-400"><ChevronLeft /></button>
          <h2 className="font-bold text-white">생성 완료</h2>
          <div className="w-8"></div>
        </div>

        <div className="bg-[#1e293b] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl mb-6">
          <div className="aspect-[3/4] bg-slate-800 relative">
             <img src={generatedChar.avatarUrl} alt="Hero" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent"></div>
             <div className="absolute bottom-0 left-0 p-6">
               <Badge color="bg-indigo-500" className="mb-2">{generatedChar.world}</Badge>
               <h1 className="text-3xl font-black text-white leading-none mb-1">{generatedChar.name}</h1>
               <p className="text-slate-300 text-sm opacity-90">{generatedChar.personality}</p>
             </div>
          </div>
          <div className="p-6 space-y-6">
             <div>
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">배경 스토리</h3>
               <p className="text-sm text-slate-300 leading-relaxed">{generatedChar.bio}</p>
             </div>
             <div>
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">보유 스킬</h3>
               <div className="flex flex-wrap gap-2">
                 {generatedChar.skills?.map((s, i) => (
                   <span key={i} className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs font-bold text-indigo-300 border border-slate-700">
                     {s.name}
                   </span>
                 ))}
               </div>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-10">
          <Button variant="secondary" onClick={() => setStep('input')}>다시 하기</Button>
          <Button variant="blue" onClick={handleSave}>영웅 영입</Button>
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
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">이름 (선택)</label>
          <Input 
            placeholder="비워두면 AI가 작명합니다" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">설정 / 키워드</label>
          <TextArea 
            placeholder="예: 은발의 여기사, 차가운 성격이지만 고양이를 좋아함, 전설의 검을 찾고 있음." 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)} 
            className="h-32"
          />
        </div>

        <Button variant="blue" fullWidth size="lg" onClick={handleGenerate} disabled={!prompt}>
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
const BattleView: React.FC<{ myChar: Character; onClose: () => void }> = ({ myChar, onClose }) => {
  const [opponent, setOpponent] = useState<Character | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fake progress animation
    const timer = setInterval(() => {
      setProgress(old => {
        if (old >= 100) {
          clearInterval(timer);
          return 100;
        }
        return old + 2;
      });
    }, 50);

    const startBattle = async () => {
      const enemy = Storage.getRandomOpponent(myChar.id);
      if (!enemy) {
        alert("상대가 없습니다.");
        onClose();
        return;
      }
      setOpponent(enemy);
      try {
        const result = await GameService.processBattle(myChar.id, enemy.id, false);
        await new Promise(r => setTimeout(r, 2000)); // Ensure animation plays a bit
        setBattleResult(result);
      } catch (e) {
        alert("오류 발생");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    startBattle();
    return () => clearInterval(timer);
  }, []);

  if (!opponent) return <div className="fixed inset-0 bg-[#0f172a] z-50"></div>;

  return (
    <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[520px] max-h-[95vh] bg-[#0f172a] rounded-[32px] border border-slate-900/50 shadow-[0_30px_80px_rgba(2,6,23,0.85)] overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-4 flex justify-between items-center border-b border-slate-800">
          <button onClick={onClose} className="p-2 rounded-full bg-slate-900 text-white border border-slate-700">
            <ChevronLeft />
          </button>
          <span className="font-bold text-white tracking-wide">배틀 진행 중</span>
          <div className="w-10"></div>
        </div>

        {/* VS Visual Area */}
        <div className="relative flex-1 min-h-[260px] bg-[#0b1224]">
          <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full bg-indigo-900/20 relative overflow-hidden">
              <img src={myChar.avatarUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
            </div>
            <div className="w-1/2 h-full bg-red-900/20 relative overflow-hidden">
              <img src={opponent.avatarUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
            </div>
          </div>

          <div className="absolute inset-0 flex items-end justify-between p-4 pb-10 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent">
            <div className="text-left z-10">
              <div className="text-indigo-400 font-bold text-lg">{myChar.name}</div>
              <Badge color="bg-indigo-600">{myChar.elo} RP</Badge>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-16 h-16 bg-[#050b18] rounded-full border-4 border-slate-700 flex items-center justify-center shadow-xl">
                <span className="font-black text-red-500 text-2xl italic pr-1">VS</span>
              </div>
            </div>
            <div className="text-right z-10">
              <div className="text-red-400 font-bold text-lg">{opponent.name}</div>
              <Badge color="bg-red-600">{opponent.elo} RP</Badge>
            </div>
          </div>
        </div>

        {/* Progress & Logs Area */}
        <div className="bg-[#050b18] border-t border-slate-900/60 px-5 pt-5 pb-6 flex flex-col gap-4">
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
            <div className="max-h-[220px] flex items-center justify-center text-slate-600">
              <div className="animate-pulse">로그 생성 대기 중...</div>
            </div>
          )}

          {!loading && (
            <Button fullWidth onClick={onClose} variant="blue">
              결과 확인
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// 4. Detailed Character View
const CharacterDetail: React.FC<{
  char: Character;
  onBack: () => void;
  onBattle: () => void;
  onDelete: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}> = ({ char, onBack, onBattle, onDelete, currentView, onNavigate }) => {
  const [tab, setTab] = useState('소개');

  const { rankPosition, totalChars } = React.useMemo(() => {
    const roster = Storage.getAllCharacters().sort((a, b) => b.elo - a.elo);
    const idx = roster.findIndex((c) => c.id === char.id);
    return {
      rankPosition: idx >= 0 ? idx + 1 : null,
      totalChars: roster.length,
    };
  }, [char.id, char.elo]);

  const handleDelete = () => {
    if (
      window.confirm(
        `${char.name} 캐릭터를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      onDelete();
    }
  };

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
    },
    {
      label: 'Elo Score',
      value: char.elo.toLocaleString(),
      sub: '실시간 전투 지표',
    },
    {
      label: '승률',
      value: `${winRate}%`,
      sub: `${char.wins}승 ${char.losses}패`,
    },
    {
      label: '전체 전투수',
      value: char.matches.toLocaleString(),
      sub: '시뮬레이션 포함',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] pb-40 text-slate-100">
      <Container
        contentClassName="p-0"
        frameClassName="rounded-none shadow-[0_24px_60px_rgba(2,6,23,0.75)] border border-slate-900/30"
      >
        <section className="px-5 pt-5 pb-8 space-y-6">
          <div className="rounded-[32px] border border-slate-800 bg-[#050b18] shadow-[0_24px_40px_rgba(2,6,23,0.6)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="p-2 rounded-full bg-slate-900 text-white border border-slate-700"
              >
                <ChevronLeft />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-full bg-slate-900 text-red-200 border border-red-500/40"
                  title="캐릭터 삭제"
                >
                  <Skull size={18} />
                </button>
              </div>
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
          </div>
        </section>

        <section className="border-t border-slate-800/70 px-6 py-6 space-y-4">
          <div className="flex justify-end">
            <button className="w-1/4 min-w-[120px] flex items-center justify-center gap-1 px-3 py-2 rounded-2xl border border-slate-600 text-slate-300 text-[11px] font-semibold hover:border-indigo-500 hover:text-white transition">
              <Share2 size={14} /> 프로필 공유
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="border border-slate-800 bg-[#030918] p-4 rounded-2xl"
              >
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                  {card.label}
                </div>
                <div className="text-2xl font-black text-white">
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
            className="w-[40%] min-w-[170px] shadow-2xl shadow-blue-900/50 py-4 text-base whitespace-nowrap"
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
const HomePage: React.FC<{ user: User; onSelectChar: (c: Character) => void; onCreate: () => void }> = ({ user, onSelectChar, onCreate }) => {
  const [chars, setChars] = useState<Character[]>([]);

  useEffect(() => {
    setChars(Storage.getUserCharacters(user.id));
  }, [user]);

  return (
    <Container className="pt-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-white italic tracking-wider">TALE OF<br/>HEROES</h1>
        </div>
        <Avatar alt={user.username} className="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Create Card */}
        <button 
          onClick={onCreate}
          className="aspect-[3/4] rounded-3xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all bg-[#1e293b]/50 group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
            <Plus size={24} />
          </div>
          <span className="text-sm font-bold">새로운 영웅 생성</span>
        </button>

        {/* Character Cards */}
        {chars.map(char => (
          <div 
            key={char.id} 
            onClick={() => onSelectChar(char)}
            className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-slate-800 cursor-pointer group shadow-lg border border-slate-700/50"
          >
            <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 p-4 w-full">
              <div className="text-xs text-indigo-400 font-bold mb-1">{char.world}</div>
              <div className="text-white font-bold text-lg leading-tight truncate">{char.name}</div>
              <div className="flex gap-2 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-0.5"><Trophy size={10} className="text-yellow-500"/> {char.wins}</span>
                <span className="flex items-center gap-0.5"><Zap size={10} className="text-blue-500"/> {char.elo}</span>
              </div>
            </div>
            
            {GameService.checkUnlockable(char) && (
              <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            )}
          </div>
        ))}
      </div>
      
      {chars.length > 0 && (
         <div className="mt-8 p-4 bg-indigo-900/20 rounded-xl border border-indigo-500/30 flex items-center gap-4">
           <div className="bg-indigo-600 p-2 rounded-lg text-white"><Crown size={20} /></div>
           <div>
             <div className="text-indigo-300 font-bold text-sm">첫 번째 승부사가 되어보세요</div>
             <div className="text-slate-400 text-xs">배틀에서 승리하고 데일리 랭킹에 도전하세요.</div>
           </div>
         </div>
      )}
    </Container>
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

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<string>('home');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [isBattling, setIsBattling] = useState(false);

  const handleDeleteCharacter = (charId: string) => {
    Storage.deleteCharacter(charId);
    setSelectedChar(null);
    setView('home');
  }; 

  useEffect(() => {
    Storage.seedDatabase(); 
    const loadedUser = Storage.getCurrentUser();
    if (loadedUser) setUser(loadedUser);
  }, []);

  if (!user) {
    return <LoginPage onLogin={() => setUser(Storage.getCurrentUser())} />;
  }

  // Handle detailed view or battle view overrides
  if (isBattling && selectedChar) {
    return (
      <BattleView 
        myChar={selectedChar} 
        onClose={() => {
          setIsBattling(false);
          // If we want to go back to char detail, just don't set selectedChar to null
        }} 
      />
    );
  }

  if (selectedChar && !isBattling) {
    return (
      <CharacterDetail 
        char={selectedChar} 
        onBack={() => setSelectedChar(null)} 
        onBattle={() => setIsBattling(true)}
        onDelete={() => handleDeleteCharacter(selectedChar.id)}
        currentView={view}
        onNavigate={(target) => {
          setSelectedChar(null);
          setView(target);
        }}
      />
    );
  }

  return (
    <div className="bg-[#0f172a] min-h-screen text-slate-200 font-sans pb-20">
      {view === 'home' && (
        <HomePage 
          user={user} 
          onCreate={() => setView('create')} 
          onSelectChar={setSelectedChar} 
        />
      )}
      {view === 'create' && <CreatePage user={user} onFinish={() => setView('home')} />}
      {view === 'ranking' && <RankingPage />}
      
      <BottomNav current={view} onChange={(v) => {
        setView(v);
        setSelectedChar(null);
      }} />
    </div>
  );
};

export default App;