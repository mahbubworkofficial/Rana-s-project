// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOhTQjLQu47W3nYamCqiQIZiOtNXFnklM",
  authDomain: "smart-deals-b8b21.firebaseapp.com",
  projectId: "smart-deals-b8b21",
  storageBucket: "smart-deals-b8b21.firebasestorage.app",
  messagingSenderId: "847742063109",
  appId: "1:847742063109:web:88464e5ca14fd450c8426c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
 export const auth = getAuth(app);