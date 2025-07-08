// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5M_N2iv1bn4iDb_GqH-m9OS9Uo46pS5E",
  authDomain: "cyberhatch02.firebaseapp.com",
  projectId: "cyberhatch02",
  storageBucket: "cyberhatch02.firebasestorage.app",
  messagingSenderId: "871387273716",
  appId: "1:871387273716:web:0df10f4c61d38154efc1a1",
  measurementId: "G-T14ZTLG2Z2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded - SignIn page initialized');
  
  const signinForm = document.getElementById('signin-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const signinButton = document.getElementById('signin-button');
  const loadingSpinner = document.getElementById('loading-spinner');
  const errorMessage = document.getElementById('error-message');
  const togglePassword = document.querySelector('.toggle-password');
  const googleButton = document.querySelector('.google-button');
  const githubButton = document.querySelector('.github-button');
  const resendVerificationLink = document.getElementById('resend-verification');

  // For debugging
  console.log('Current path:', window.location.pathname);
  console.log('Is sign-in page:', window.location.pathname.endsWith('/signin'));

  // Handle password visibility toggle
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePassword.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });
  }

  // Function to handle resending verification email
  const resendVerificationEmail = async (user) => {
    try {
      await user.sendEmailVerification();
      showMessage('Verification email sent! Please check your inbox.', 'success');
    } catch (error) {
      console.error('Error sending verification email:', error);
      showMessage('Failed to send verification email. Please try again later.', 'error');
    }
  };

  // Handle email verification check and redirection
  const handleUserAuthenticated = async (user) => {
    console.log('User authenticated:', user.email);
    console.log('Email verified:', user.emailVerified);
    
    if (user.emailVerified) {
      // Email is verified, proceed with normal flow
      try {
        // Get the user's ID token
        const idToken = await user.getIdToken();
        
        // Store the token in a cookie for server-side authentication
        document.cookie = `firebaseToken=${idToken}; path=/; max-age=3600; SameSite=Strict`;
        
        // Redirect to dashboard
        console.log('Email verified. Redirecting to dashboard');
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Error getting ID token:', error);
        showMessage('Authentication error. Please try again.', 'error');
      }
    } else {
      // Email is not verified, show verification message
      console.log('Email not verified, showing verification message');
      showMessage(
        'Please verify your email address before signing in. Check your inbox for a verification link.',
        'warning'
      );
      
      // Add resend verification link if it doesn't exist
      if (!document.getElementById('resend-verification')) {
        const messageContainer = document.getElementById('error-message');
        if (messageContainer) {
          const resendLink = document.createElement('a');
          resendLink.id = 'resend-verification';
          resendLink.href = '#';
          resendLink.textContent = 'Resend verification email';
          resendLink.className = 'verification-link';
          resendLink.style.display = 'block';
          resendLink.style.marginTop = '10px';
          resendLink.style.textDecoration = 'underline';
          resendLink.style.color = '#4a6cf7';
          
          resendLink.addEventListener('click', (e) => {
            e.preventDefault();
            resendVerificationEmail(user);
          });
          
          messageContainer.appendChild(resendLink);
        }
      }
      
      // Reset loading state
      if (signinButton) signinButton.disabled = false;
      if (loadingSpinner) loadingSpinner.classList.add('hidden');
      
      // Sign out the user since they're not verified
      auth.signOut();
    }
  };

  // Helper function to show messages
  const showMessage = (message, type = 'error') => {
    if (!errorMessage) return;
    
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    
    // Update class based on message type
    errorMessage.className = '';
    switch (type) {
      case 'success':
        errorMessage.classList.add('success-message');
        break;
      case 'warning':
        errorMessage.classList.add('warning-message');
        break;
      case 'error':
      default:
        errorMessage.classList.add('error-message');
        break;
    }
  };

  // Check if user is already signed in
  auth.onAuthStateChanged(user => {
    console.log('Auth state changed. User:', user ? 'Logged in' : 'Not logged in');
    
    if (user && window.location.pathname.endsWith('/signin')) {
      console.log('User is authenticated and on signin page, checking email verification');
      handleUserAuthenticated(user);
    }
  });

  // Handle form submission
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Sign-in form submitted');
      
      // Show loading state
      if (signinButton) signinButton.disabled = true;
      if (loadingSpinner) loadingSpinner.classList.remove('hidden');
      if (errorMessage) errorMessage.classList.add('hidden');
      
      const email = emailInput.value;
      const password = passwordInput.value;
      
      try {
        console.log('Attempting to sign in with email and password');
        // Attempt to sign in with email and password
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Sign-in successful');
        
        // Check email verification status
        if (userCredential.user.emailVerified) {
          // Email is verified, proceed with normal flow
          handleUserAuthenticated(userCredential.user);
        } else {
          // Email is not verified
          showMessage(
            'Please verify your email address before signing in. Check your inbox for a verification link.',
            'warning'
          );
          
          // Add resend verification link
          if (!document.getElementById('resend-verification')) {
            const resendLink = document.createElement('a');
            resendLink.id = 'resend-verification';
            resendLink.href = '#';
            resendLink.textContent = 'Resend verification email';
            resendLink.className = 'verification-link';
            resendLink.style.display = 'block';
            resendLink.style.marginTop = '10px';
            resendLink.style.textDecoration = 'underline';
            resendLink.style.color = '#4a6cf7';
            
            resendLink.addEventListener('click', (e) => {
              e.preventDefault();
              resendVerificationEmail(userCredential.user);
            });
            
            errorMessage.appendChild(resendLink);
          }
          
          // Reset loading state
          if (signinButton) signinButton.disabled = false;
          if (loadingSpinner) loadingSpinner.classList.add('hidden');
          
          // Sign out the user since they're not verified
          auth.signOut();
        }
      } catch (error) {
        console.error('Sign-in error:', error);
        // Handle sign-in errors
        showMessage(getErrorMessage(error), 'error');
        
        // Reset loading state
        if (signinButton) signinButton.disabled = false;
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
      }
    });
  } else {
    console.error('Sign-in form not found in the DOM');
  }

  // Google Sign In
  if (googleButton) {
    googleButton.addEventListener('click', async () => {
      console.log('Google sign-in button clicked');
      const provider = new firebase.auth.GoogleAuthProvider();
      
      try {
        if (errorMessage) errorMessage.classList.add('hidden');
        const result = await auth.signInWithPopup(provider);
        console.log('Google sign-in successful');
        
        // Since Google sign-in automatically verifies email, we can redirect right away
        // Get the user's ID token
        const idToken = await result.user.getIdToken();
        
        // Store the token in a cookie for server-side authentication
        document.cookie = `firebaseToken=${idToken}; path=/; max-age=3600; SameSite=Strict`;
        
        // Directly redirect to dashboard
        console.log('Redirecting to dashboard after Google sign-in');
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Google sign-in error:', error);
        showMessage(getErrorMessage(error), 'error');
      }
    });
  }

  // GitHub Sign In
  if (githubButton) {
    githubButton.addEventListener('click', async () => {
      console.log('GitHub sign-in button clicked');
      const provider = new firebase.auth.GithubAuthProvider();
      
      try {
        if (errorMessage) errorMessage.classList.add('hidden');
        const result = await auth.signInWithPopup(provider);
        console.log('GitHub sign-in successful');
        
        // Since GitHub sign-in typically verifies email, we can redirect right away
        // Get the user's ID token
        const idToken = await result.user.getIdToken();
        
        // Store the token in a cookie for server-side authentication
        document.cookie = `firebaseToken=${idToken}; path=/; max-age=3600; SameSite=Strict`;
        
        // Directly redirect to dashboard
        console.log('Redirecting to dashboard after GitHub sign-in');
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('GitHub sign-in error:', error);
        showMessage(getErrorMessage(error), 'error');
      }
    });
  }
  
  // Helper function to convert Firebase error codes to user-friendly messages
  function getErrorMessage(error) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later.';
      default:
        console.error('Auth error:', error);
        return 'An error occurred. Please try again.';
    }
  }
});