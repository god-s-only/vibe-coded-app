const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

/* GET home page. */
router.get('/', function(req, res, next) {
  // Check if user has a firebase token cookie
  const firebaseToken = req.cookies.firebaseToken;
  
  // If no token, redirect to signin
  if (!firebaseToken) {
    console.log('No authentication token found, redirecting to signin');
    return res.redirect('/signin');
  }
  
  // Verify the token
  admin.auth().verifyIdToken(firebaseToken)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      const emailVerified = decodedToken.email_verified;
      const provider = decodedToken.firebase.sign_in_provider;
      
      console.log(`User authenticated: ${uid}, Email verified: ${emailVerified}, Provider: ${provider}`);
      
      // Google and GitHub sign-ins are considered verified automatically
      const isOAuthProvider = provider === 'google.com' || provider === 'github.com';
      
      // If email is verified or it's an OAuth provider, redirect to dashboard
      if (emailVerified || isOAuthProvider) {
        // Check if user data exists in Firestore
        const db = admin.firestore();
        db.collection('users').doc(uid).get()
          .then((docSnapshot) => {
            if (!docSnapshot.exists && isOAuthProvider) {
              // If OAuth user but no Firestore record, we need to create one
              console.log(`Creating Firestore record for OAuth user: ${uid}`);
              
              // Get additional user information from Auth
              return admin.auth().getUser(uid)
                .then((userRecord) => {
                  // Save user data to Firestore
                  return db.collection('users').doc(uid).set({
                    fullName: userRecord.displayName || '',
                    email: userRecord.email,
                    balance: "$0.00",
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                  }).then(() => {
                    console.log(`Created Firestore record for OAuth user: ${uid}`);
                    return res.redirect('/dashboard');
                  });
                });
            } else {
              // User data exists or it's not an OAuth provider
              return res.redirect('/dashboard');
            }
          })
          .catch((error) => {
            console.error('Error checking/creating user data:', error);
            return res.redirect('/dashboard');
          });
      } else {
        // If email is not verified, redirect to signin
        // The frontend signin page will handle showing verification message
        return res.redirect('/signin');
      }
    })
    .catch((error) => {
      console.error('Error verifying token:', error);
      // Invalid token, redirect to signin
      res.redirect('/signin');
    });
});

module.exports = router;