/* Website Deals - Firebase helper (Auth + Firestore).
   Loads the Firebase SDK lazily from Google's CDN, only when a real config is present.
   Exposes window.WDFirebase. Load shared/firebase-config.js before this file. */
(function () {
  var SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
  var cfg = window.WD_FIREBASE_CONFIG || {};
  var loc = window.WD_FIREBASE_DOC || { collection: "site", id: "data" };
  var enabled = !!(cfg.apiKey && cfg.projectId && String(cfg.apiKey).indexOf("PASTE_") !== 0);
  var ready = null;

  function init() {
    if (!enabled) return Promise.reject(new Error("Firebase is not configured yet (shared/firebase-config.js)."));
    if (ready) return ready;
    ready = Promise.all([
      import(SDK + "firebase-app.js"),
      import(SDK + "firebase-auth.js"),
      import(SDK + "firebase-firestore.js")
    ]).then(function (m) {
      var app = m[0].initializeApp(cfg);
      return { app: app, A: m[1], F: m[2], auth: m[1].getAuth(app), db: m[2].getFirestore(app) };
    });
    return ready;
  }

  /* Resolves with the signed-in user (or null) once Firebase has restored the session. */
  function currentUser() {
    return init().then(function (c) {
      return new Promise(function (res) {
        var off = c.A.onAuthStateChanged(c.auth, function (u) { off(); res(u); });
      });
    });
  }

  function signIn(email, password) {
    return init().then(function (c) {
      return c.A.signInWithEmailAndPassword(c.auth, email, password);
    });
  }

  function signOut() {
    return init().then(function (c) { return c.A.signOut(c.auth); });
  }

  /* Reads the published bundle {banners, packages, homepage, settings}; null if missing. */
  function readData() {
    return init().then(function (c) {
      return c.F.getDoc(c.F.doc(c.db, loc.collection, loc.id)).then(function (s) {
        return s.exists() ? (s.data().bundle || null) : null;
      });
    });
  }

  /* Writes the bundle (admin only - enforced by firestore.rules). */
  function writeData(bundle) {
    return init().then(function (c) {
      return c.F.setDoc(c.F.doc(c.db, loc.collection, loc.id), {
        bundle: bundle,
        updatedAt: c.F.serverTimestamp(),
        updatedBy: (c.auth.currentUser && c.auth.currentUser.email) || null
      });
    });
  }

  /* Images added in Site Editor are stored as small documents in the "media" collection. */
  function writeMedia(id, dataUrl) {
    return init().then(function (c) {
      return c.F.setDoc(c.F.doc(c.db, "media", id), { data: dataUrl, updatedAt: c.F.serverTimestamp() });
    });
  }
  function readMedia(id) {
    return init().then(function (c) {
      return c.F.getDoc(c.F.doc(c.db, "media", id)).then(function (s) { return s.exists() ? (s.data().data || null) : null; });
    });
  }


  /* Customer orders from the checkout. Anyone can create one; only the admin can read or change them. */
  function addOrder(o) {
    return init().then(function (c) {
      var d = { order: o.order, pkg: o.pkg, price: Number(o.price) || 0, name: o.name, phone: o.phone, email: o.email || "", biz: o.biz || "", method: o.method || "", tx: o.tx || "", from: o.from || "", status: "new", createdAt: c.F.serverTimestamp() };
      return c.F.setDoc(c.F.doc(c.db, "orders", o.order), d);
    });
  }
  function listOrders() {
    return init().then(function (c) {
      return c.F.getDocs(c.F.query(c.F.collection(c.db, "orders"), c.F.orderBy("createdAt", "desc"), c.F.limit(300))).then(function (s) {
        return s.docs.map(function (d) { var x = d.data(); x.id = d.id; x.ts = x.createdAt && x.createdAt.toMillis ? x.createdAt.toMillis() : 0; delete x.createdAt; return x; });
      });
    });
  }
  function updateOrder(id, patch) {
    return init().then(function (c) { return c.F.updateDoc(c.F.doc(c.db, "orders", id), patch); });
  }
  function deleteOrder(id) {
    return init().then(function (c) { return c.F.deleteDoc(c.F.doc(c.db, "orders", id)); });
  }

  window.WDFirebase = {
    addOrder: addOrder, listOrders: listOrders, updateOrder: updateOrder, deleteOrder: deleteOrder,
    writeMedia: writeMedia,
    readMedia: readMedia,
    enabled: enabled,
    init: init,
    currentUser: currentUser,
    signIn: signIn,
    signOut: signOut,
    readData: readData,
    writeData: writeData
  };
})();
