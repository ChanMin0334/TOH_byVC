import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { firebaseApp } from './firebase';
import { Character } from '../types';

const db = getFirestore(firebaseApp);

export const firestoreService = {
  // 캐릭터 생성 (Firestore 자동 ID 생성)
  async createCharacter(character: Omit<Character, 'id'>, userId: string): Promise<string> {
    try {
      // Firestore가 자동으로 고유 ID를 생성해줍니다
      const docRef = await addDoc(collection(db, 'characters'), {
        ...character,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log('캐릭터 생성됨, ID:', docRef.id);
      return docRef.id; // 자동 생성된 ID 반환
    } catch (error) {
      console.error('캐릭터 생성 실패:', error);
      throw error;
    }
  },

  // 캐릭터 조회
  async getCharacter(characterId: string): Promise<Character | null> {
    try {
      const docRef = doc(db, 'characters', characterId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Character;
      } else {
        return null;
      }
    } catch (error) {
      console.error('캐릭터 조회 실패:', error);
      throw error;
    }
  },

  // 사용자별 캐릭터 목록 조회
  async getUserCharacters(userId: string): Promise<Character[]> {
    try {
      const q = query(
        collection(db, 'characters'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Character[];
    } catch (error) {
      console.error('사용자 캐릭터 조회 실패:', error);
      throw error;
    }
  },

  // 캐릭터 업데이트
  async updateCharacter(characterId: string, updates: Partial<Character>): Promise<void> {
    try {
      const docRef = doc(db, 'characters', characterId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      console.log('캐릭터 업데이트됨:', characterId);
    } catch (error) {
      console.error('캐릭터 업데이트 실패:', error);
      throw error;
    }
  },

  // 캐릭터 삭제
  async deleteCharacter(characterId: string): Promise<void> {
    try {
      const docRef = doc(db, 'characters', characterId);
      await deleteDoc(docRef);
      console.log('캐릭터 삭제됨:', characterId);
    } catch (error) {
      console.error('캐릭터 삭제 실패:', error);
      throw error;
    }
  }
};