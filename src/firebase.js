// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAhD6i-ktlJpP4bgmKFKk6sNLYezhM4_tY",
  authDomain: "ram-lost-and-found.firebaseapp.com",
  projectId: "ram-lost-and-found",
  storageBucket: "ram-lost-and-found.firebasestorage.app",
  messagingSenderId: "131706129314",
  appId: "1:131706129314:web:5cbe6f8bcc71939f7740fb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);
export { app, auth, db, functions, storage };
