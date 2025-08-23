// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB1e_nM-v-G5EYZSrXjElyHo61I4qb5rNc",
  authDomain: "mycarbuddycustomer.firebaseapp.com",
  databaseURL: "https://mycarbuddycustomer-default-rtdb.firebaseio.com",
  projectId: "mycarbuddycustomer",
  storageBucket: "mycarbuddycustomer.appspot.com", // <-- fix here too
  messagingSenderId: "98137449003",
  appId: "1:98137449003:web:f14e6f91c0126ef8f8806e",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
