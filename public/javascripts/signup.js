// Wait for Firebase SDK to load
console.log("Script is running");

const firebaseConfig = {
  apiKey: "AIzaSyCnj0IErUeGXEGl72I8495ZS1RHeuOBwfY",
  authDomain: "fir-demo-app-f3342.firebaseapp.com",
  databaseURL: "https://fir-demo-app-f3342-default-rtdb.firebaseio.com",
  projectId: "fir-demo-app-f3342",
  storageBucket: "fir-demo-app-f3342.firebasestorage.app",
  messagingSenderId: "690323727261",
  appId: "1:690323727261:web:4bdeea8a182e62cd4e8574",
  measurementId: "G-BXYG86T6S0"
};

// Initialize Firebase with compat version
console.log("Initializing Firebase");
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized");
} else {
  console.log("Firebase already initialized");
}

// Get auth and firestore instances
const auth = firebase.auth();
console.log("Auth initialized");
let db = null;
// Check if Firestore is available and initialize it
try {
  if (firebase.firestore) {
    db = firebase.firestore();
    console.log("Firestore initialized:", !!db);
  } else {
    console.warn("Firestore is not available in the loaded Firebase SDK");
  }
} catch (error) {
  console.error("Error initializing Firestore:", error);
}

document.addEventListener('DOMContentLoaded', () => {
  // Debug element presence
  console.log("DOM Content Loaded");
  
  const signupForm = document.getElementById('signup-form');
  console.log("Signup form found:", !!signupForm);
  
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const signupButton = document.getElementById('signup-button');
  const loadingSpinner = document.getElementById('loading-spinner');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');
  const togglePassword = document.querySelector('.toggle-password');
  const googleButton = document.querySelector('.google-button');
  
  // Password requirements elements
  const minLengthReq = document.getElementById('min-length-req');
  const uppercaseReq = document.getElementById('uppercase-req');
  const lowercaseReq = document.getElementById('lowercase-req');
  const numberReq = document.getElementById('number-req');
  const specialReq = document.getElementById('special-req');
  
  console.log("Elements found:", {
    nameInput: !!nameInput,
    emailInput: !!emailInput,
    passwordInput: !!passwordInput,
    confirmPasswordInput: !!confirmPasswordInput,
    signupButton: !!signupButton,
    loadingSpinner: !!loadingSpinner,
    errorMessage: !!errorMessage,
    successMessage: !!successMessage,
    togglePassword: !!togglePassword,
    googleButton: !!googleButton
  });
  
  // Check if user is already signed in
  auth.onAuthStateChanged(user => {
    if (user && user.emailVerified) {
      // User is signed in and verified, redirect to dashboard
      window.location.href = '/dashboard';
    }
  });
  
  // Handle password visibility toggle
  if (togglePassword) {
    console.log("Toggle password button found");
    togglePassword.addEventListener('click', () => {
      console.log("Toggle password button clicked");
      if (passwordInput && confirmPasswordInput) {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        confirmPasswordInput.setAttribute('type', type);
        togglePassword.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
      }
    });
  }
  
  // Validate password requirements in real-time
  if (passwordInput) {
    console.log("Password input found");
    passwordInput.addEventListener('input', validatePasswordRequirements);
  }
  
  function validatePasswordRequirements() {
    console.log("Validating password requirements");
    const password = passwordInput.value;
    
    // Check if all UI elements exist
    if (!minLengthReq || !uppercaseReq || !lowercaseReq || !numberReq || !specialReq) {
      console.warn("Some password requirement UI elements are missing");
      return;
    }
    
    // Minimum length
    if (password.length >= 8) {
      minLengthReq.classList.add('requirement-met');
    } else {
      minLengthReq.classList.remove('requirement-met');
    }
    
    // Uppercase letter
    if (/[A-Z]/.test(password)) {
      uppercaseReq.classList.add('requirement-met');
    } else {
      uppercaseReq.classList.remove('requirement-met');
    }
    
    // Lowercase letter
    if (/[a-z]/.test(password)) {
      lowercaseReq.classList.add('requirement-met');
    } else {
      lowercaseReq.classList.remove('requirement-met');
    }
    
    // Number
    if (/[0-9]/.test(password)) {
      numberReq.classList.add('requirement-met');
    } else {
      numberReq.classList.remove('requirement-met');
    }
    
    // Special character
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      specialReq.classList.add('requirement-met');
    } else {
      specialReq.classList.remove('requirement-met');
    }
  }
  
  // Function to save user data to Firestore
  async function saveUserToFirestore(user, name) {
    if (!db) {
      console.error("Firestore is not initialized");
      throw new Error("Firestore is not available");
    }
    
    try {
      console.log("Saving user data to Firestore for user:", user.uid);
      // Create a document in the users collection with the user's UID as the document ID
      await db.collection('users').doc(user.uid).set({
        fullName: name,
        // Don't store passwords in Firestore - removed for security
        balance: "$0.00",
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("User data saved to Firestore successfully");
    } catch (error) {
      console.error("Error saving user data to Firestore:", error);
      throw error;
    }
  }
  
  // Handle form submission
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      console.log("Form submitted");
      e.preventDefault();
      
      // Reset messages
      if (errorMessage) errorMessage.classList.add('hidden');
      if (successMessage) successMessage.classList.add('hidden');
      
      const name = nameInput ? nameInput.value : '';
      const email = emailInput ? emailInput.value : '';
      const password = passwordInput ? passwordInput.value : '';
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
      
      console.log("Form data:", { name, email, passwordLength: password.length });
      
      // Validate password
      if (!validatePassword(password)) {
        if (errorMessage) {
          errorMessage.textContent = 'Password does not meet all requirements.';
          errorMessage.classList.remove('hidden');
        }
        return;
      }
      
      // Check if passwords match
      if (password !== confirmPassword) {
        if (errorMessage) {
          errorMessage.textContent = 'Passwords do not match.';
          errorMessage.classList.remove('hidden');
        }
        return;
      }
      
      // Show loading state
      if (signupButton) signupButton.disabled = true;
      if (loadingSpinner) loadingSpinner.classList.remove('hidden');
      
      try {
        console.log("Creating user with email and password");
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log("User created successfully");
        
        // Update profile with name
        await user.updateProfile({
          displayName: name
        });
        console.log("User profile updated with display name");
        
        // Save user data to Firestore
        if (db) {
          await saveUserToFirestore(user, name);
        } else {
          console.warn("Firestore not initialized, skipping user data save");
        }
        
        // Send email verification
        await user.sendEmailVerification();
        console.log("Verification email sent");
        
        // Display success message
        if (successMessage) {
          successMessage.textContent = 'Account created successfully! A verification email has been sent to your email address. Please verify your email before signing in.';
          successMessage.classList.remove('hidden');
        }
        
        // Reset form
        signupForm.reset();
        
        // Redirect to sign-in page after a delay
        setTimeout(() => {
          window.location.href = '/signin';
        }, 5000);
        
      } catch (error) {
        // Handle sign-up errors
        console.error("Signup error:", error);
        if (errorMessage) {
          errorMessage.textContent = getErrorMessage(error);
          errorMessage.classList.remove('hidden');
        }
        
        // Reset loading state
        if (signupButton) signupButton.disabled = false;
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
      }
    });
  }
  
  // Google Sign Up
  // Enhanced Google signup with improved Firestore storage
// Replace the Google button event listener in your signup.js file

if (googleButton) {
  console.log("Google button found");
  googleButton.addEventListener('click', async () => {
    console.log("Google button clicked");
    
    try {
      // Show loading state
      if (signupButton) signupButton.disabled = true;
      if (loadingSpinner) loadingSpinner.classList.remove('hidden');
      if (errorMessage) errorMessage.classList.add('hidden');
      if (successMessage) successMessage.classList.add('hidden');
      
      // Create Google auth provider
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({
        // Force account selection even if one account is available
        prompt: 'select_account'
      });
      console.log("Google provider created with forced selection");
      
      // Use signInWithPopup to show the Google login popup
      const userCredential = await auth.signInWithPopup(provider);
      console.log("Google sign-in complete");
      
      // Extract user and additional info
      const user = userCredential.user;
      const isNewUser = userCredential.additionalUserInfo?.isNewUser;
      const profile = userCredential.additionalUserInfo?.profile;
      
      console.log("User signed in with Google:", user.uid);
      console.log("Is new user:", isNewUser);
      
      // Always ensure user data exists in Firestore
      if (db) {
        // Check if Firestore is properly initialized
        console.log("Checking Firestore:", !!db);
        
        try {
          // First check if the document exists
          const userDocRef = db.collection('users').doc(user.uid);
          const docSnapshot = await userDocRef.get();
          
          if (!docSnapshot.exists) {
            console.log("No existing user record found, creating new one");
            
            // Create user data object with all required fields
            const userData = {
              fullName: user.displayName || '',
              email: user.email,
              balance: "$0.00",
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
              provider: 'google',
              photoURL: user.photoURL || null,
              emailVerified: true // Google auth automatically verifies email
            };
            
            console.log("Saving user data:", userData);
            
            // Set the document with merge option to avoid overwriting existing data
            await userDocRef.set(userData, { merge: true });
            console.log("Successfully saved user data to Firestore");
            
            // Show success message
            if (successMessage) {
              successMessage.textContent = 'Account created successfully with Google!';
              successMessage.classList.remove('hidden');
            }
          } else {
            console.log("Existing user found, updating last login");
            // Update last login timestamp for existing users
            await userDocRef.update({
              lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
        } catch (firestoreError) {
          // Log the detailed error but continue with authentication
          console.error("Firestore operation failed:", firestoreError);
          console.error("Error code:", firestoreError.code);
          console.error("Error message:", firestoreError.message);
        }
      } else {
        console.error("Firestore not initialized properly!");
      }
      
      // Get ID token for server-side authentication
      const idToken = await user.getIdToken();
      console.log("Got ID token, length:", idToken.length);
      
      // Store token in cookie with secure settings
      document.cookie = `firebaseToken=${idToken}; path=/; max-age=3600; SameSite=Strict`;
      console.log("Authentication cookie set");
      
      // Redirect to dashboard
      console.log("Redirecting to dashboard...");
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error("Google sign-in error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // Show error message to user
      if (errorMessage) {
        errorMessage.textContent = getErrorMessage(error);
        errorMessage.classList.remove('hidden');
      }
      
      // Reset loading state
      if (signupButton) signupButton.disabled = false;
      if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
  });
}

  
  // Validate password against requirements
  function validatePassword(password) {
    // Password must be at least 8 characters long
    // Contains at least one uppercase letter
    // Contains at least one lowercase letter
    // Contains at least one number
    // Contains at least one special character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    return regex.test(password);
  }
  
  // Helper function to convert Firebase error codes to user-friendly messages
  function getErrorMessage(error) {
    if (!error || !error.code) {
      return 'An unknown error occurred. Please try again.';
    }
    
    console.error("Handling error:", error.code);
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/weak-password':
        return 'Password is too weak. Please follow the password requirements.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/popup-closed-by-user':
        return 'Sign-up was cancelled. Please try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      case 'auth/timeout':
        return 'The operation has timed out. Please try again.';
      case 'auth/user-token-expired':
        return 'Your session has expired. Please sign in again.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/invalid-credential':
        return 'Invalid login credentials. Please try again.';
      case 'firestore/permission-denied':
        return 'Failed to save user data. Please check your connection and try again.';
      default:
        console.error('Unhandled auth error:', error);
        return `An error occurred (${error.code}). Please try again.`;
    }
  }
});