/* Website Deals - Firebase config.
   Firebase Console -> Project settings -> Your apps -> Web app -> "firebaseConfig"
   Paste your real values below. These web keys are meant to be public;
   security comes from Firebase Auth + the rules in firestore.rules.
   While apiKey still says PASTE_..., the site keeps working with the old JSON/localStorage data. */
window.WD_FIREBASE_CONFIG = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

/* Firestore location of the published site data (one document). */
window.WD_FIREBASE_DOC = { collection: "site", id: "data" };
