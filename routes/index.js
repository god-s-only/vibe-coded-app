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
      
      console.log(`User authenticated: ${uid}, Email verified: ${emailVerified}`);
      
      // If email is verified, redirect to dashboard
      if (emailVerified) {
        return res.redirect('/dashboard');
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