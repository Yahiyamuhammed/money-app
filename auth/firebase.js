import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyD5dSwStjtvt0yfBWBBTk1ItMIfJgut7VE",
  authDomain: "nexmoney-71b87.firebaseapp.com",
  projectId: "nexmoney-71b87",
  storageBucket: "nexmoney-71b87.appspot.com",
  messagingSenderId: "384439012291",
  appId: "1:384439012291:android:ecd979bb10ee98721c0b76",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword };
export const db = getFirestore(app);
