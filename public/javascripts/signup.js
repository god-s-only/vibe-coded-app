// Wait for Firebase SDK to load
console.log("Script is running");

const firebaseConfig = {
  apiKey: "AIzaSyD5M_N2iv1bn4iDb_GqH-m9OS9Uo46pS5E",
  authDomain: "cyberhatch02.firebaseapp.com",
  projectId: "cyberhatch02",
  storageBucket: "cyberhatch02.firebasestorage.app",
  messagingSenderId: "871387273716",
  appId: "1:871387273716:web:0df10f4c61d38154efc1a1",
  measurementId: "G-T14ZTLG2Z2"
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
        balance: "0.00",
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        // Add pending payment fields
        pendingPayment1: false,
        pendingPayment2: false,
        pendingPayment3: false,
        howMuchScammed: 0
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
  
  // Google Sign Up - Enhanced with pending payment fields
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
          // Force account selection and request profile information
          prompt: 'select_account'
        });
        
        // Request additional scopes to ensure we get profile information
        provider.addScope('profile');
        provider.addScope('email');
        
        console.log("Google provider created with profile scopes");
        
        // Use signInWithPopup to show the Google login popup
        const userCredential = await auth.signInWithPopup(provider);
        console.log("Google sign-in complete");
        
        // Extract user and additional info
        const user = userCredential.user;
        const isNewUser = userCredential.additionalUserInfo?.isNewUser;
        const profile = userCredential.additionalUserInfo?.profile;
        
        console.log("User signed in with Google:", user.uid);
        console.log("Is new user:", isNewUser);
        console.log("User display name:", user.displayName);
        console.log("Profile data:", profile);
        
        // Ensure we have the user's full name
        let fullName = user.displayName || '';
        
        // If displayName is not available, try to construct from profile data
        if (!fullName && profile) {
          if (profile.given_name && profile.family_name) {
            fullName = `${profile.given_name} ${profile.family_name}`;
          } else if (profile.name) {
            fullName = profile.name;
          }
        }
        
        console.log("Final full name to save:", fullName);
        
        // Always ensure user data exists in Firestore
        if (db) {
          console.log("Firestore available, proceeding with user data storage");
          
          try {
            // Reference to the user document
            const userDocRef = db.collection('users').doc(user.uid);
            
            // Check if the document exists
            const docSnapshot = await userDocRef.get();
            
            if (!docSnapshot.exists || isNewUser) {
              console.log("Creating new user record in Firestore");
              
              // Create comprehensive user data object with pending payment fields
              const userData = {
                fullName: fullName,
                email: user.email || '',
                balance: "$0.00",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                provider: 'google',
                photoURL: user.photoURL || null,
                emailVerified: user.emailVerified || true,
                uid: user.uid,
                // Add pending payment fields
                pendingPayment1: false,
                pendingPayment2: false,
                pendingPayment3: false,
                howMuchScammed: 0
              };
              
              console.log("User data to save:", userData);
              
              // Create the document
              await userDocRef.set(userData);
              console.log("Successfully created user document in Firestore");
              
              // Show success message for new users
              if (successMessage) {
                successMessage.textContent = `Welcome ${fullName}! Your account has been created successfully.`;
                successMessage.classList.remove('hidden');
              }
              
            } else {
              console.log("User document exists, updating login timestamp and name if needed");
              
              // For existing users, update last login and ensure name is saved
              const updateData = {
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
              };
              
              // Update the full name if it's missing or different
              const existingData = docSnapshot.data();
              if (!existingData.fullName || existingData.fullName !== fullName) {
                updateData.fullName = fullName;
                console.log("Updating full name for existing user:", fullName);
              }
              
              // Add pending payment fields if they don't exist
              if (!existingData.hasOwnProperty('pendingPayment1')) {
                updateData.pendingPayment1 = false;
                updateData.pendingPayment2 = false;
                updateData.pendingPayment3 = false;
                updateData.howMuchScammed = 0;
                console.log("Adding pending payment fields to existing user");
              }
              
              await userDocRef.update(updateData);
              console.log("Updated existing user document");
              
              // Show welcome back message
              if (successMessage) {
                successMessage.textContent = `Welcome back, ${fullName}!`;
                successMessage.classList.remove('hidden');
              }
            }
            
            // Verify the data was saved correctly
            const verifySnapshot = await userDocRef.get();
            if (verifySnapshot.exists) {
              const savedData = verifySnapshot.data();
              console.log("Verified saved user data:", {
                fullName: savedData.fullName,
                email: savedData.email,
                balance: savedData.balance,
                pendingPayment1: savedData.pendingPayment1,
                pendingPayment2: savedData.pendingPayment2,
                pendingPayment3: savedData.pendingPayment3
              });
            }
            
          } catch (firestoreError) {
            console.error("Firestore operation failed:", firestoreError);
            console.error("Error code:", firestoreError.code);
            console.error("Error message:", firestoreError.message);
            
            // Show error but don't prevent login
            if (errorMessage) {
              errorMessage.textContent = 'Account created but failed to save profile data. Please contact support if issues persist.';
              errorMessage.classList.remove('hidden');
            }
          }
        } else {
          console.error("Firestore not initialized - cannot save user data");
          if (errorMessage) {
            errorMessage.textContent = 'Account created but profile data could not be saved. Please contact support.';
            errorMessage.classList.remove('hidden');
          }
        }
        
        // Get ID token for server-side authentication
        try {
          const idToken = await user.getIdToken();
          console.log("Got ID token");
          
          // Store token in cookie with secure settings
          document.cookie = `firebaseToken=${idToken}; path=/; max-age=3600; SameSite=Strict`;
          console.log("Authentication cookie set");
        } catch (tokenError) {
          console.error("Failed to get ID token:", tokenError);
        }
        
        // Small delay to show success message, then redirect
        setTimeout(() => {
          console.log("Redirecting to dashboard...");
          window.location.href = '/dashboard';
        }, 1500);
        
      } catch (error) {
        console.error("Google sign-in error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        
        // Handle specific error cases
        let errorText = 'Google sign-in failed. Please try again.';
        
        if (error.code === 'auth/popup-closed-by-user') {
          errorText = 'Sign-in was cancelled. Please try again if you want to continue.';
        } else if (error.code === 'auth/popup-blocked') {
          errorText = 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
        } else if (error.code === 'auth/network-request-failed') {
          errorText = 'Network error. Please check your connection and try again.';
        }
        
        // Show error message to user
        if (errorMessage) {
          errorMessage.textContent = errorText;
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