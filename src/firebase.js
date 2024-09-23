// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY, // 環境変数から取得
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN, // 環境変数から取得
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID, // 環境変数から取得
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET, // 環境変数から取得
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID, // 環境変数から取得
  appId: process.env.REACT_APP_FIREBASE_APP_ID, // 環境変数から取得
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
