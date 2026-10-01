/*
 * The Firebase project that holds synced Grimoires. These values identify the
 * project; they aren't secrets (Firebase web config is public by design), and
 * the security rules in firestore.rules decide who can read what. Every
 * Grimoire is encrypted on the device before it's uploaded.
 *
 * Set `apiKey` to "" to build the app without sync.
 */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDi_MdL7IBatyeHwIRqkY0Eq9wQNXXP_mM",
  authDomain: "the-lunar-grimoire.firebaseapp.com",
  projectId: "the-lunar-grimoire",
  storageBucket: "the-lunar-grimoire.firebasestorage.app",
  messagingSenderId: "1060107263657",
  appId: "1:1060107263657:web:aa802ae55939cc53edd3b8",
};

export const SYNC_AVAILABLE = FIREBASE_CONFIG.apiKey !== "";
