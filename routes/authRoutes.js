const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin initialization
try {
  // Use service account instead of applicationDefault
  const serviceAccount = {
  "type": "service_account",
  "project_id": "fir-demo-app-f3342",
  "private_key_id": "de277b67d51cfaf99ad53e38ad29e07cf68388c7",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDNCg+kRoH4Nchz\n11dyNKGtrXtImrLptMTKp5UGn1uNDVCTMH+hhj8xF3WEDF6kGaVsQbwXzK6Yb/dF\nIUoFhOlrsjWkRVaKMK7FJtcofHeuPe3bHbEukUmeNTX8Pa8AVZSKxsNQpKkvlfzo\nlAkCFOfEXCTEzTEspncWo7qoJV6qFxaiMQqcZHwA6yI9O3H02UlJ73JE5ikuL7L8\nX9UTbqAliQuEDtNIlYJj3a+I3hDXqdoR7wsHBiOHemp106WYL+WN8bDWVw8JbliI\nBpRgnYAkEjJnZ2J4a9oPzRI+NXAkVKs07pOn8SmJmczxb/PjopVkUVa84DoDAzed\nfaVfKJMZAgMBAAECggEAYQHOFbRQIH1dqcTrt/pDthZ6Wgbq99xRMOopfTkfCPSQ\nNxs+f06zDghhzohFrJD/rWDKW145CqEKlZfi3Aqenxfw/hfaEkZnIZq3OA3vV64w\nHzeEkRonAOV+9ai/Z8KVpTTVyo0lCIEHZ4hGXMhEQSgxMzU7ezsE496x3ITVrVWn\nSCm97EdG6cWh2TQNptrlzRpxneuHoPdNKkpgHEWoAsVifUKfUz8cEZ5NZK/+axBd\nx7Kywu7imJGDu9r1Aeau+uQAJveuOVanOvBop55aW/yPfjPPfHIdKgCBamq8GEj6\n9nQzCxDMt4lkDBxXQkVMyJfv0MYFgDiYaYfFqM37SwKBgQDpnTxKIprE85fTbDTN\nuqIJjDSniPOS8H2vO5f/Ay33jbp3697dWD37/bswPmYkEPiqOrS6nsu2O/RJXK2D\n1tDqIpJjY1y8/suW6Op+tf0RhNGlfL3BbfrpxkK/LF0/ITRAyZgS94Appvzq+8Fa\nbVgPMk/eVykslUgRKXkaY7Li2wKBgQDgr9ubQpjKYkQl9AE0tshoC17E5vY+eNpC\nUqph7b425Dlrav/gBxFnzaEDV7/sYzrYlDpSmzsDTPONVv/sNLkJ/tBkr9Uet0S5\ncV9ipwfvBqFfZbZmaiGZNfzpIzCXh+u+DFjyU8PunUNK4IWf1cVftZXJru3vJYMZ\n2l2pAonSGwKBgQCoBniTldodqFreLSi5g/ABz/8bNOyEFkc/3ywOthm8wQqKMHNm\nXo6OjUuygl7yt+YygfD1fTtmAi9NCMSgW8R9coo5xACyysxh6Xqn0nuHuzESxuqw\nkkrzE690UxNqUZaEtrqTgcKDsuCcnqDOSnEY1QYPFD/AGkrwVRUOfwDuGwKBgQDP\n6Ip6UZaWd3V99RqEj7pD5HmOE/W5+xRjmKDGuzpvCqJDTqB0ybWGaxVZxYH3mB6k\nuAx70d46gKNBn0ZzaJnssNhewwGfSZCTVGAiJlNGD8mVP8YXYI+0eOuNQ528Ke6v\nTjekDHTaQLU6/SVIsIPRu3JeTLsotnpomtJeCNZFDwKBgQC5TMcbiQmGAt8CHP0R\nPhwsapL7/z1k3XdHS8kdNuqS7L8IAZO6uSGkaRtBEbUcll3oA3OHWR4O9egDpCY2\neens1sdXNF1w9PZspUtRFfquhEqwu8GSCFNgbhGDZ154ZI4on+NQzAXCkw0QW1bJ\n5fw7yI+kYzoNdbmdPZBvYOaErQ==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-vqzaf@fir-demo-app-f3342.iam.gserviceaccount.com",
  "client_id": "102992217084113271250",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-vqzaf%40fir-demo-app-f3342.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

  
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://fir-demo-app-f3342-default-rtdb.firebaseio.com"
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