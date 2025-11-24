import { Character, User, BattleResult } from '../types';
import { generateId } from '../utils/id';

const KEYS = {
  USERS: 'toh_users',
  CHARACTERS: 'toh_characters',
  BATTLES: 'toh_battles',
  CURRENT_USER: 'toh_current_user'
};

// User Management
export const saveOrUpdateUser = (user: User): User => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  return user;
};

export const registerUser = (username: string): User => {
  const users = getUsers();
  const existing = users.find(u => u.username === username);
  if (existing) return existing;

  const newUser: User = {
    id: generateId(),
    username,
    createdAt: Date.now()
  };
  return saveOrUpdateUser(newUser);
};

export const getUsers = (): User[] => {
  const str = localStorage.getItem(KEYS.USERS);
  return str ? JSON.parse(str) : [];
};

export const getCurrentUser = (): User | null => {
  const str = localStorage.getItem(KEYS.CURRENT_USER);
  return str ? JSON.parse(str) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
};

// Character Management
export const saveCharacter = (char: Character) => {
  const chars = getAllCharacters();
  const index = chars.findIndex(c => c.id === char.id);
  if (index >= 0) {
    chars[index] = char;
  } else {
    chars.push(char);
  }
  localStorage.setItem(KEYS.CHARACTERS, JSON.stringify(chars));
};

export const getAllCharacters = (): Character[] => {
  const str = localStorage.getItem(KEYS.CHARACTERS);
  return str ? JSON.parse(str) : [];
};

export const getUserCharacters = (userId: string): Character[] => {
  return getAllCharacters().filter(c => c.ownerId === userId);
};

export const getCharacterById = (id: string): Character | undefined => {
  return getAllCharacters().find(c => c.id === id);
};

export const getRandomOpponent = (myCharId: string): Character | null => {
  const all = getAllCharacters();
  const candidates = all.filter(c => c.id !== myCharId);
  if (candidates.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
};

export const deleteCharacter = (charId: string) => {
  const remaining = getAllCharacters().filter(c => c.id !== charId);
  localStorage.setItem(KEYS.CHARACTERS, JSON.stringify(remaining));
};

// Battle Management
export const saveBattle = (battle: BattleResult) => {
  const battles = getBattles();
  battles.push(battle);
  localStorage.setItem(KEYS.BATTLES, JSON.stringify(battles));
};

export const getBattles = (): BattleResult[] => {
  const str = localStorage.getItem(KEYS.BATTLES);
  return str ? JSON.parse(str) : [];
};

// Initial Seed Data
export const seedDatabase = () => {
  if (getAllCharacters().length > 0) return;

  const demoUser = registerUser("DemoMaster");
  
  // Use placeholder images that look somewhat like game art
  // Using placehold.co with custom text/colors for stability
  const demoChars: Character[] = [
    {
      id: 'seed-1',
      ownerId: demoUser.id,
      ownerName: demoUser.username,
      name: '불꽃의 기사 렌',
      world: '판타지' as any,
      prompt: '화염을 다루는 열혈 기사',
      bio: '왕국의 최연소 기사단장. 그의 검은 꺼지지 않는 불꽃으로 감싸져 있다. 전장의 선봉에서 언제나 아군을 지킨다.',
      personality: '정의롭지만 성격이 급함. 약자를 절대 지나치지 않음.',
      skills: [
        { name: '플레임 스트라이크', description: '검에 불을 붙여 강하게 내려친다.', tags: ['화염', '공격'] },
        { name: '불굴의 의지', description: '치명적인 피해를 입어도 한 번 버텨낸다.', tags: ['패시브'] }
      ],
      elo: 1200, wins: 5, losses: 2, matches: 7, createdAt: Date.now(),
      avatarUrl: 'https://placehold.co/400x600/7f1d1d/ffffff?text=Ren',
      themeColor: 'red'
    },
    {
      id: 'seed-2',
      ownerId: demoUser.id,
      ownerName: demoUser.username,
      name: '코드명: 제로',
      world: '사이버펑크' as any,
      prompt: '해킹과 은신에 특화된 안드로이드',
      bio: '메가코프에서 탈출한 프로토타입 암살자. 네트워크를 통해 물리적 한계를 초월한다.',
      personality: '감정이 없고 냉철함. 임무 완수율 99.9%.',
      skills: [{ name: '시스템 오버로드', description: '상대방의 신경계를 해킹하여 마비시킨다.', tags: ['해킹', 'CC'] }],
      elo: 1250, wins: 8, losses: 1, matches: 9, createdAt: Date.now(),
      avatarUrl: 'https://placehold.co/400x600/1e3a8a/ffffff?text=Zero',
      themeColor: 'blue'
    },
    {
      id: 'seed-3',
      ownerId: demoUser.id,
      ownerName: demoUser.username,
      name: '숲의 마녀 엘라',
      world: '판타지' as any,
      prompt: '자연을 조종하는 신비로운 마녀',
      bio: '천 년을 살아온 숲의 수호자. 그녀의 노래는 상처를 치유하고, 분노는 숲을 가시덤불로 뒤덮는다.',
      personality: '온화하지만 자연을 해치는 자에게는 자비가 없음.',
      skills: [{ name: '덩굴 속박', description: '거대한 덩굴을 소환하여 적을 묶는다.', tags: ['자연', '제어'] }],
      elo: 1150, wins: 3, losses: 4, matches: 7, createdAt: Date.now(),
      avatarUrl: 'https://placehold.co/400x600/14532d/ffffff?text=Ella',
      themeColor: 'green'
    }
  ];
  
  demoChars.forEach(saveCharacter);
};