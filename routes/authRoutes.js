const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin initialization
try {
  // Use service account instead of applicationDefault
  const serviceAccount = {
    "type": "service_account",
    "project_id": "cyberhatch02",
    "private_key_id": "4a4920388c246696046d741f9beff8310e87e4f3",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCUfn0gRlN10hHZ\nNglX4PhzBRAPWW0jBx1PfJxJ4BnFKk7m5yBqrWSRT5el5Nu+Z5X5UJ6j869aE4Le\nuyEtD7AuDFLPbDml/RM9g4hdjbb0Qiv0nwuo/L4CndOfmDMYRtnQNqHIpfJ4Gn8g\n7WRKtp8hsnPtwiXKyDivAO3gPOVbxDXH/9HXSBFs/7NYkbgEiPBQiZ1/YSdkyivW\nJDwy/ZlgIjVkwmzei/hKJdwX5O8mWUzxETBily+KiWMYBeVr0CoDg6VZZG3Kp+Bl\nNPd+n2gITNvRx0g+jbd67878bw2un1GG/PqnVg7GJkZhPQPj34qa/jd3d74SM8sg\nQTf9vS4nAgMBAAECggEAPJIV3w7gp1wfbK8Wg5KgNWaYxPIQyutxgMVPCPFRAbQ+\nx//6IJmGvqEtNf2SxumA6tgARdc2LTNtPAYvw641Cqt7MeGu6C7BZOOcwbB3Ms41\nGMyxWGZz6SRQuLZADUSFP2Gxf2N1cpk4RwmeUb2JTpj4ocCCYuNl/7iMz113nwTc\nDeXncCoVDLVFtu6Gtgh0HFIX4Uh1cINzhq5tRo0V/f3TigZMHB/kxIVEfcnp8KV3\ntGqoEQZBNZlveDLtxplPC4XEQRQ3N3qepCC/X8JneW7lfhMTG+2bY+f/CZSqxUlP\nTP2wLzAL3+ttHChEV8xQzx84b6SB59lN1WIIQtLT+QKBgQDQzPTj4OkyDxhDMfjk\nXpT5rB2bV/dtoSD65Pfsu2qPZ9Wq3IAcfn1kiEKD+Wg5ioN0Y+vCKpqOPgn+qs57\n0ZLasGnPDdRrP+z8p4LVB2TKqSv8TI/pPkM85OUqVKpS4GwD0GEQuxW1sewT7Jee\nH+d20+2SaIMzSDxmsZ/mn6uiCQKBgQC2D6pwkaL97U6Tgm/OF+j6XWbUmbQeET1y\nez2dhPfeNcMFAXf0Y+gXQEzp8751X+5qXLIqNKa0NqmCKismdSUITGKJxGW2jnJ9\nvuEsdqC1+Y2feo/cE/L6A4d3fhSkHCV6sMqgJJskDN1x6tknJ5cjuQuBqSUM/FYE\n9D2kFHCarwKBgQCLt/pO2ltxIeSsYi4YMqohf+i34F8zPtTgzoKQKMEfgO3bTX10\nk7e4o+1OfoAdsPBR2+MQpI2TjTQG86kD9bL9H3tOEAUKV1Zvom/LuQzbB+TlCR5r\nhzxa7RfkAY+PsZjV3IR3O5lFYe+FTZYPO24Zd6rLg5/3mujAFy/WlRW2cQKBgHX+\nwz0/9n5SjimmUSYmcvXJETta/tS54bRP0YhExIz9FQ8qe38mPSbMoszCD79s1E2V\nFFesVhrYjpXxFJRROhYdw4N8iVt/CQ8cZj32CITIX5Rrz88YEtMc9HBqg6A1KclR\nyZFvCCmeOOt7BRCOZTNe2+lGIeA/rtR5I3YzVSO7AoGAHU1ZJItuoFcrKvXuJYOk\nrps7Zg0+tnTw5UYLj7mx6kXYArdi1Jj83tr+FbNy1DWkFPfWPK1J7TheFwBxL4Nv\nI7qyMOvfHbzxg5VOwRVv0dwaop9qyXuF67YdjBkD41I8duxwhqbSRc2I3M/84Ay9\nytEtSWkWrpe3QxJz0r/19Cw=\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@cyberhatch02.iam.gserviceaccount.com",
    "client_id": "109810156956553444892",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40cyberhatch02.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  }
  

  
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
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