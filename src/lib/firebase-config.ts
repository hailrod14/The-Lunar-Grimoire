/*
 * The Firebase project that holds synced Grimoires. These values identify the
 * project; they aren't secrets (Firebase web config is public by design), and
 * the security rules in firestore.rules decide who can read what. Every
 * Grimoire is encrypted on the device before it's uploaded.
 *
 * Leave `apiKey` empty to build the app without sync.
 */
export const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export const SYNC_AVAILABLE = FIREBASE_CONFIG.apiKey !== "";
