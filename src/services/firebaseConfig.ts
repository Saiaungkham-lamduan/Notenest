import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase project config — from Firebase Console > Project Settings > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyBBD4Rw8MO9MYZAPH3Xj400KXdlj6V-Yhk",
  authDomain: "notenest-79910.firebaseapp.com",
  projectId: "notenest-79910",
  storageBucket: "notenest-79910.firebasestorage.app",
  messagingSenderId: "143684213624",
  appId: "1:143684213624:web:fac800a3635f69e456868d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
