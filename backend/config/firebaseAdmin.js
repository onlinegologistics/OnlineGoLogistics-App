const admin = require('firebase-admin');

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
  console.warn('Firebase Admin env variables are missing');
}

if (firebaseProjectId && firebaseClientEmail && firebasePrivateKey) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseProjectId,
        clientEmail: firebaseClientEmail,
        privateKey: firebasePrivateKey,
      }),
    });
  }
} else {
  console.warn('Firebase Admin is NOT initialized because env variables are missing. Firebase features will not work.');
}

module.exports = admin;
