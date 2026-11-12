// firebase/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCX2v9y-GyucmNwtPfH5onSo2LHtsD5Lps",
  authDomain: "apiotravez.firebaseapp.com",
  projectId: "apiotravez",
  storageBucket: "apiotravez.firebasestorage.app",
  messagingSenderId: "27795366209",
  appId: "1:27795366209:web:bb820fc0ae79903c7ac1c0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
