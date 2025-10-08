import { initializeApp, getApps, cert } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, writeBatch, addDoc } from 'firebase/firestore';

let firestoreInstance = null;

function getDb() {
  if (firestoreInstance) return firestoreInstance;


  if (!getApps().length) {
    initializeApp({
        apiKey: "AIzaSyByFclJNRr9lK5x3uHUi6UHmva4SvGFBNM",
        authDomain: "janio-675b1.firebaseapp.com",
        projectId: "janio-675b1",
        storageBucket: "janio-675b1.firebasestorage.app",
        messagingSenderId: "967848614097",
        appId: "1:967848614097:web:acdfeb9670659c7a8d8df0",
        measurementId: "G-XNNJWJFCSG"
      });
  }

  firestoreInstance = getFirestore();
  return firestoreInstance;
}

export { getDb, doc, getDoc, collection, query, where, getDocs, writeBatch, addDoc };