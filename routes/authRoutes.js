const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config(); // Load .env

// Load the path to the service account from .env
const serviceAccountPath = path.resolve(__dirname, '../' + process.env.FIREBASE_KEY_PATH);

// Check if key exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Firebase service account key file not found at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
  });
} catch (error) {
  console.log('Firebase admin initialization error:', error.message);
}


/* GET sign-in page */
router.get('/signin', function(req, res, next) {
  res.render('signin', { title: 'Sign In' });
});

/* GET sign-up page */
router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Sign Up' });
});

/* GET dashboard page - protected route */
router.get('/dashboard', authenticateUser, function(req, res, next) {
  res.render('dashboard', { 
    title: 'Dashboard', 
    user: req.user 
  });
});

/* GET logout route */
router.get('/logout', function(req, res, next) {
  // Client-side logout is handled by Firebase Auth
  res.redirect('/signin');
});

/* Middleware to verify Firebase ID token */
async function authenticateUser(req, res, next) {
  const idToken = req.cookies.firebaseToken;
  
  if (!idToken) {
    return res.redirect('/signin');
  }

  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.redirect('/signin');
  }
}

module.exports = router;