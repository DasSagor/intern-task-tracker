import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCz6iWJm6jBMXRfMtKIPUjmkB8yXQlQirw",
  authDomain: "intern-task-tracker-448c0.firebaseapp.com",
  projectId: "intern-task-tracker-448c0",
  storageBucket: "intern-task-tracker-448c0.firebasestorage.app",
  messagingSenderId: "269660995015",
  appId: "1:269660995015:web:f71f94582714f8cbbeade2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
