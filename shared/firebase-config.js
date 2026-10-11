/* Website Deals - Firebase config.
   Web app config for Firebase project "packagewebsitesdeal".
   These web keys are meant to be public; security comes from Firebase Auth
   + the rules in firestore.rules (only the admin email can write). */
window.WD_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB8iACV9PoNcKo3LofA5WwknT-0nKgpvCU",
  authDomain: "packagewebsitesdeal.firebaseapp.com",
  projectId: "packagewebsitesdeal",
  storageBucket: "packagewebsitesdeal.firebasestorage.app",
  messagingSenderId: "64961162232",
  appId: "1:64961162232:web:472987554d99c45218440d",
  measurementId: "G-BLVL7VVRES"
};

/* Firestore location of the published site data (one document). */
window.WD_FIREBASE_DOC = { collection: "site", id: "data" };
