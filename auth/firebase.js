// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD5dSwStjtvt0yfBWBBTk1ItMIfJgut7VE",
  authDomain: "nexmoney-71b87.firebaseapp.com",
  projectId: "nexmoney-71b87",
  storageBucket: "nexmoney-71b87.appspot.com",
  messagingSenderId: "384439012291",
  appId: "1:384439012291:android:ecd979bb10ee98721c0b76"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
