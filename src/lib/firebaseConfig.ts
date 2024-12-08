// src/lib/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC8DQBQCaA-yg8n8vx0b3m2okuskgoTTgQ",
  authDomain: "pokerplannigpro.firebaseapp.com",
  databaseURL: "https://pokerplannigpro-default-rtdb.firebaseio.com",
  projectId: "pokerplannigpro",
  storageBucket: "pokerplannigpro.firebasestorage.app",
  messagingSenderId: "96710765299",
  appId: "1:96710765299:web:40fbd8e314ff25eb136586",
  measurementId: "G-MVPZ8GE2FY",
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
