import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCqXd18gcz8CTuzdWIxv0OTEf2tsuUcmqY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'toh-byruru.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'toh-byruru',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'toh-byruru.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '463083517800',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:463083517800:web:040b5036cb0f950d3a88dd',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-NSVR5996M7',
};

// Prevent re-initialization during hot reload
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
