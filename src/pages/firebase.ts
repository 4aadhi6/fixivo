import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer,
  connectFirestoreEmulator
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure persistence to handle refresh and iframe issues
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error("Auth Persistence Error:", err);
});

// Use initializeFirestore with experimentalForceLongPolling to bypass potential WebSocket restrictions
// This is critical for environments with restrictive proxies like AI Studio
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection to Firestore
async function testConnection() {
  const currentProjectId = firebaseConfig.projectId;
  console.log(`[Firebase] Initializing with Project: ${currentProjectId}`);
  
  try {
    await getDocFromServer(doc(db, '_internal_', 'ping'));
    console.log('[Firebase] ✅ Connection verified');
  } catch (error: any) {
    if (error.code === 'unavailable' || error.message?.includes('the client is offline')) {
      console.warn(`[Firebase] ⚠️ Connection issues detected. Please check "Authorized Domains" in the ${currentProjectId} console.`);
    } else {
      console.log('[Firebase] Firestore reachability OK');
    }
  }
}
testConnection();
