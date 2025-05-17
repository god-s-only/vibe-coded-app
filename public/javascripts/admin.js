// server.js (Node.js backend only)
const admin = require("firebase-admin");
const serviceAccount = require("./hacking-app/fir-demo-app-f3342-firebase-adminsdk-vqzaf-de277b67d5.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fir-demo-app-f3342-default-rtdb.firebaseio.com"
});

// Example: Verify ID token
const idToken = "token_from_frontend_cookie_or_header";
admin.auth().verifyIdToken(idToken)
  .then(decodedToken => {
    const uid = decodedToken.uid;
    console.log("Verified UID:", uid);
  })
  .catch(error => {
    console.error("Token verification failed:", error);
  });
