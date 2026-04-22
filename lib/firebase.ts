import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCbLeO7zhPSPGK7ZUCuWeHqm3waWYy-T40",
  authDomain: "ds-gems-4dbb1.firebaseapp.com",
  databaseURL: "https://ds-gems-4dbb1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ds-gems-4dbb1",
  storageBucket: "ds-gems-4dbb1.firebasestorage.app",
  messagingSenderId: "223993211805",
  appId: "1:223993211805:web:fee9fd0d4708926d7a5d74",
  measurementId: "G-BDD3YJRZQY"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);