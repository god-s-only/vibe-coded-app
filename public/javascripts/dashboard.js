// CLIENT-SIDE ONLY - Remove all Firebase Admin code!

const firebaseConfig = {
  apiKey: "AIzaSyD5M_N2iv1bn4iDb_GqH-m9OS9Uo46pS5E",
  authDomain: "cyberhatch02.firebaseapp.com",
  projectId: "cyberhatch02",
  storageBucket: "cyberhatch02.firebasestorage.app",
  messagingSenderId: "871387273716",
  appId: "1:871387273716:web:0df10f4c61d38154efc1a1",
  measurementId: "G-T14ZTLG2Z2"
};

// Initialize Firebase CLIENT SDK
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const balanceAmount = document.getElementById('balance-amount');
const btcBalanceAmount = document.getElementById('btc-balance');
const balanceToggle = document.getElementById('balance-toggle');
const withdrawBtn = document.getElementById('withdraw-btn');
const withdrawModal = document.getElementById('withdraw-modal');
const modalClose = document.getElementById('modal-close');
const withdrawForm = document.getElementById('withdraw-form');
const logoutBtn = document.getElementById('logout-btn');
const userAvatar = document.getElementById('user-avatar');
const supportModal = document.getElementById('support-modal');
const supportModalClose = document.getElementById('support-modal-close');
const supportForm = document.getElementById('support-form');

// Default avatar placeholder URL
const DEFAULT_AVATAR_URL = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

// Function to update user avatar
function updateUserAvatar(user) {
  if (!userAvatar) return;
  
  console.log('Updating avatar for user:', user);
  console.log('Photo URL:', user.photoURL);
  
  // Check if user has Google provider data
  const googleProvider = user.providerData.find(provider => provider.providerId === 'google.com');
  console.log('Google provider data:', googleProvider);
  
  if (googleProvider && googleProvider.photoURL) {
    // Use Google photo URL
    console.log('Using Google photo URL:', googleProvider.photoURL);
    userAvatar.src = googleProvider.photoURL;
  } else if (user.photoURL) {
    // Fallback to user's photoURL
    console.log('Using user photo URL:', user.photoURL);
    userAvatar.src = user.photoURL;
  } else {
    // Use default avatar
    console.log('Using default avatar');
    userAvatar.src = DEFAULT_AVATAR_URL;
  }
  
  // Add error handling for avatar loading
  userAvatar.onerror = (error) => {
    console.error('Error loading avatar:', error);
    userAvatar.src = DEFAULT_AVATAR_URL;
  };
}

// Add event listener for transaction history action card
document.addEventListener('DOMContentLoaded', () => {
  const transactionHistoryCard = document.querySelector('.action-card:first-child');
  if (transactionHistoryCard) {
    transactionHistoryCard.addEventListener('click', () => {
      alert('No transactions yet');
    });
  }

  // Add event listener for settings card
  const settingsCard = document.querySelector('.action-card:nth-child(2)');
  if (settingsCard) {
    settingsCard.addEventListener('click', () => {
      window.location.href = '/settings';
    });
  }

  // Add event listener for support card
  const supportCard = document.querySelector('.action-card:last-child');
  if (supportCard) {
    supportCard.addEventListener('click', () => {
      supportModal.classList.add('active');
    });
  }

  // Close support modal
  if (supportModalClose) {
    supportModalClose.addEventListener('click', () => {
      supportModal.classList.remove('active');
    });
  }

  // Handle support form submission
  if (supportForm) {
    supportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const message = document.getElementById('support-message').value;
      const userEmail = currentUser?.email || 'No email provided';
      
      try {
        showLoading();
        
        const response = await fetch('/api/support', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            userEmail,
            userName: currentUser?.displayName || 'Anonymous User'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send support message');
        }

        // Clear form and close modal
        supportForm.reset();
        supportModal.classList.remove('active');
        
        // Show success message
        alert('Your message has been sent successfully. We will get back to you soon!');
      } catch (error) {
        console.error('Error sending support message:', error);
        alert('Failed to send message. Please try again later.');
      } finally {
        hideLoading();
      }
    });
  }

  const depositBtn = document.getElementById('deposit-btn');
  if (depositBtn) {
    depositBtn.addEventListener('click', (e) => {
      e.preventDefault();
      createDepositModal();
    });
  }
});

let balanceVisible = true;
let currentUser = null;
let userBalance = '0.00';
let userData = null;
let cryptoPriceData = {};
let priceUpdateInterval;

// Bitcoin wallet configuration
const BTC_WALLET_ADDRESS = "1PBsPfkLt31euJGFRqKYanFtyR8zHLMB99";
const BTC_QR_CODE_URL = "https://firebasestorage.googleapis.com/v0/b/social-media-2f8e1.appspot.com/o/images_path%2F1624cfb5-a7ed-4ed4-8371-9c85dacaa812.jpeg?alt=media&token=295a6845-c804-4950-ad08-7e4dc743a1ae"

// Crypto configuration with icon URLs
const CRYPTO_SYMBOLS = ['bitcoin', 'ethereum', 'dogecoin'];
const CRYPTO_DISPLAY = {
  bitcoin: { 
    symbol: 'BTC', 
    icon: '₿',
    iconUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/32/icon/btc.png'
  },
  ethereum: { 
    symbol: 'ETH', 
    icon: 'Ξ',
    iconUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/32/icon/eth.png'
  },
  dogecoin: { 
    symbol: 'DOGE', 
    icon: 'Ð',
    iconUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/32/icon/doge.png'
  }
};

// Show loading immediately
showLoading();

// Add snackbar HTML to the page if not present
function showWelcomeSnackbar(displayName) {
  // Set localStorage flag so snackbar only shows once per user
  localStorage.setItem('welcomeSnackbarShown', 'true');
  let snackbar = document.getElementById('welcome-snackbar');
  if (!snackbar) {
    snackbar = document.createElement('div');
    snackbar.id = 'welcome-snackbar';
    snackbar.style.position = 'fixed';
    snackbar.style.top = '32px';
    snackbar.style.left = '50%';
    snackbar.style.transform = 'translateX(-50%)';
    snackbar.style.background = '#27ae60';
    snackbar.style.color = '#fff';
    snackbar.style.padding = '1rem 2.5rem';
    snackbar.style.borderRadius = '8px';
    snackbar.style.fontSize = '1.1rem';
    snackbar.style.fontWeight = '600';
    snackbar.style.boxShadow = '0 4px 24px rgba(39,174,96,0.18)';
    snackbar.style.zIndex = '9999';
    snackbar.style.opacity = '0';
    snackbar.style.transition = 'opacity 0.3s';
    document.body.appendChild(snackbar);
  }
  snackbar.textContent = `Welcome Back, ${displayName || 'User'}!`;
  snackbar.style.opacity = '1';
  setTimeout(() => {
    snackbar.style.opacity = '0';
  }, 3500);
}

// Auth state listener
auth.onAuthStateChanged(async (user) => {
  if (!user) return window.location.href = '/signin';

  currentUser = user;
  console.log('Auth state changed - User:', user);
  console.log('User photo URL:', user.photoURL);
  console.log('User provider data:', user.providerData);

  // Show welcome snackbar only if not already shown in this browser
  if (!localStorage.getItem('welcomeSnackbarShown')) {
    showWelcomeSnackbar(user.displayName);
  }

  try {
    await loadUserData(user);
    await initializeCryptoPrices();

    // Refresh userData to ensure howMuchScammed is current
    const freshDoc = await db.collection('users').doc(user.uid).get();
    userData = freshDoc.data();

    // Enable withdraw button if present
    if (withdrawBtn) withdrawBtn.removeAttribute('disabled');
  } catch (err) {
    console.error(err);
  } finally {
    hideLoading();
  }
});

// Load user data from Firestore
async function loadUserData(user) {
  try {
    console.log('Loading user data for:', user.uid);
    console.log('User provider data:', user.providerData);
    
    // Update user info in header
    if (userName) userName.textContent = `Welcome back, ${user.displayName || 'User'}`;
    if (userEmail) userEmail.textContent = user.email;
    
    // Update avatar
    updateUserAvatar(user);
    
    // Load user data from Firestore
    console.log('Fetching user document from Firestore...');
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      console.log('User document found:', userDoc.data());
      userData = userDoc.data();
      userBalance = userData.balance || '$0.00';
      
      // Remove currency symbol for display and update balance
      const balanceValue = userBalance.replace('$', '');
      updateBalanceDisplay(balanceValue);
      
    } else {
      console.log('User document not found, creating default...');
      
      // Create user document if it doesn't exist
      const newUserData = {
        fullName: user.displayName || '',
        email: user.email,
        balance: '$0.00',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        pendingPayment1: false,
        pendingPayment2: false,
        pendingPayment3: false,
        howMuchScammed: 0
      };
      
      await db.collection('users').doc(user.uid).set(newUserData);
      console.log('Created new user document');
      
      userData = newUserData;
      userBalance = '$0.00';
      updateBalanceDisplay('0.00');
    }
    
  } catch (error) {
    console.error('Error loading user data:', error);
    
    // Set default values if error
    userData = {
      pendingPayment1: false,
      pendingPayment2: false,
      pendingPayment3: false,
      howMuchScammed: 0
    };
    userBalance = '$0.00';
    updateBalanceDisplay('0.00');
    
    // Show balance visibility by default
    balanceVisible = true;
  }
}

// Update balance display with USD and BTC conversion
function updateBalanceDisplay(balanceValue) {
  if (balanceAmount) {
    balanceAmount.textContent = balanceValue;
    balanceAmount.setAttribute('data-balance', balanceValue);
  }
  
  // Update BTC balance
  updateBtcBalance(parseFloat(balanceValue) || 0);
}

// Update BTC balance based on current USD balance and BTC price
function updateBtcBalance(usdAmount) {
  if (btcBalanceAmount && cryptoPriceData.bitcoin) {
    const btcPrice = cryptoPriceData.bitcoin.usd;
    const btcAmount = btcPrice > 0 ? (usdAmount / btcPrice) : 0;
    const formattedBtcAmount = btcAmount.toFixed(8);
    
    btcBalanceAmount.textContent = balanceVisible ? formattedBtcAmount : '••••••••';
    btcBalanceAmount.setAttribute('data-btc-balance', formattedBtcAmount);
  }
}

// Initialize crypto prices
async function initializeCryptoPrices() {
  console.log('Initializing crypto prices...');
  try {
    // First, try to load prices immediately
    await updateCryptoPrices();
    
    // Then set up interval for updates every 30 seconds
    if (priceUpdateInterval) {
      clearInterval(priceUpdateInterval);
    }
    priceUpdateInterval = setInterval(updateCryptoPrices, 30000);
    
    console.log('Crypto prices initialized successfully');
  } catch (error) {
    console.error('Error initializing crypto prices:', error);
    // Set fallback prices if API fails
    setFallbackPrices();
  }
}

// Update crypto prices
async function updateCryptoPrices() {
  console.log('Fetching crypto prices...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_SYMBOLS.join(',')}&vs_currencies=usd&include_24hr_change=true`,
      { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Crypto price data received:', data);
    
    cryptoPriceData = data;
    updateCryptoPriceDisplay();
    
    // Update BTC balance when Bitcoin price changes
    const currentBalance = parseFloat(balanceAmount?.getAttribute('data-balance') || '0');
    updateBtcBalance(currentBalance);
    
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    
    // If it's the first attempt, try fallback prices
    if (Object.keys(cryptoPriceData).length === 0) {
      setFallbackPrices();
    }
  }
}

// Set fallback prices if API fails
function setFallbackPrices() {
  console.log('Setting fallback crypto prices');
  cryptoPriceData = {
    bitcoin: { usd: 43250, usd_24h_change: 2.45 },
    ethereum: { usd: 2650, usd_24h_change: -1.23 },
    dogecoin: { usd: 0.089, usd_24h_change: 5.67 }
  };
  updateCryptoPriceDisplay();
  
  // Update BTC balance with fallback price
  const currentBalance = parseFloat(balanceAmount?.getAttribute('data-balance') || '0');
  updateBtcBalance(currentBalance);
}

// Update crypto price display and ensure icons are loaded
function updateCryptoPriceDisplay() {
  console.log('Updating crypto price display...');
  
  CRYPTO_SYMBOLS.forEach(symbol => {
    const priceElement = document.getElementById(`${symbol}-price`);
    const changeElement = document.getElementById(`${symbol}-change`);
    
    console.log(`Looking for elements: ${symbol}-price, ${symbol}-change`);
    console.log('Price element found:', !!priceElement);
    console.log('Change element found:', !!changeElement);
    
    if (priceElement && cryptoPriceData[symbol]) {
      const price = cryptoPriceData[symbol].usd;
      const change = cryptoPriceData[symbol].usd_24h_change;
      
      // Format price based on value
      let formattedPrice;
      if (price < 1) {
        formattedPrice = `$${price.toFixed(4)}`;
      } else if (price < 100) {
        formattedPrice = `$${price.toFixed(2)}`;
      } else {
        formattedPrice = `$${price.toLocaleString()}`;
      }
      
      priceElement.textContent = formattedPrice;
      console.log(`Updated ${symbol} price to: ${formattedPrice}`);
      
      if (changeElement) {
        changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeElement.className = `crypto-change ${change >= 0 ? 'positive' : 'negative'}`;
        console.log(`Updated ${symbol} change to: ${change.toFixed(2)}%`);
      }
    }
    
    // Ensure crypto icons are properly loaded
    const cryptoIconElements = document.querySelectorAll(`img[alt="${symbol}"], img[alt="${CRYPTO_DISPLAY[symbol]?.symbol}"]`);
    cryptoIconElements.forEach(iconElement => {
      if (CRYPTO_DISPLAY[symbol]?.iconUrl) {
        iconElement.src = CRYPTO_DISPLAY[symbol].iconUrl;
        iconElement.onerror = function() {
          console.log(`Failed to load ${symbol} icon, using fallback`);
          // Use a more reliable fallback
          this.src = `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/32/icon/${symbol}.png`;
        };
      }
    });
  });
  
  // Also ensure Bitcoin icon in balance section is loaded
  const btcIcon = document.querySelector('.btc-icon');
  if (btcIcon && CRYPTO_DISPLAY.bitcoin?.iconUrl) {
    btcIcon.src = CRYPTO_DISPLAY.bitcoin.iconUrl;
    btcIcon.onerror = function() {
      console.log('Failed to load BTC balance icon, using fallback');
      this.src = 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/32/icon/btc.png';
    };
  }
}

// Handle withdraw button click - UPDATED
if (withdrawBtn) {
  withdrawBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (!currentUser || !userData) {
      console.error('User data not loaded');
      return;
    }
    
    // Check payment status and show appropriate modal
    if (!userData.pendingPayment1) {
      createPaymentModal(1);
    } else if (!userData.pendingPayment2) {
      createPaymentModal(2);
    } else if (!userData.pendingPayment3) {
      createPaymentModal(3);
    } else {
      // All payments completed, show regular withdraw modal
      if (withdrawModal) withdrawModal.classList.add('active');
    }
  });
}

// Add balance toggle event listener
if (balanceToggle) {
  balanceToggle.addEventListener('click', () => {
    balanceVisible = !balanceVisible;
    const balanceAmount = document.getElementById('balance-amount');
    const btcBalance = document.getElementById('btc-balance');
    const eyeIcon = balanceToggle.querySelector('i.icon-eye');
    
    if (balanceVisible) {
      balanceAmount.textContent = userBalance;
      btcBalance.textContent = (parseFloat(userBalance) / cryptoPriceData.bitcoin?.usd || 0).toFixed(8);
      eyeIcon.classList.remove('icon-eye-off');
      eyeIcon.classList.add('icon-eye');
    } else {
      balanceAmount.textContent = '••••••';
      btcBalance.textContent = '••••••••';
      eyeIcon.classList.remove('icon-eye');
      eyeIcon.classList.add('icon-eye-off');
    }
  });
}

// Logout functionality
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      // Remove welcome snackbar flag so it shows again after next login
      localStorage.removeItem('welcomeSnackbarShown');
      await auth.signOut();
      window.location.href = '/signin';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  });
}

// Show loading overlay
function showLoading() {
  console.log('Showing loading overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('active');
  }
}

// Hide loading overlay
function hideLoading() {
  console.log('Hiding loading overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.remove('active');
  }
}

// Close regular withdraw modal
if (modalClose) {
  modalClose.addEventListener('click', () => {
    if (withdrawModal) withdrawModal.classList.remove('active');
  });
}

// Click outside to close regular modal
if (withdrawModal) {
  withdrawModal.addEventListener('click', (e) => {
    if (e.target === withdrawModal) {
      withdrawModal.classList.remove('active');
    }
  });
}

// Create professional payment modal - UPDATED
function createPaymentModal(step, amount = null) {
  let title, message, amountText;
  
  switch (step) {
    case 1:
      title = "Virus and Software Fee Required";
      message = "Can't Withdraw at this point till the virus and software fee of $525";
      amountText = "$525";
      break;
    case 2:
      title = "License Fee Required";
      message = "Can't withdraw now till License fee is paid which is $600";
      amountText = "$600";
      break;
    case 3:
      const twentyPercent = ((userData?.howMuchScammed || 0) * 0.2).toFixed(2);
      title = "Processing Fee Required";
      message = "Can't withdraw till 20% is paid";
      amountText = `$${twentyPercent}`;
      break;
    default:
      return;
  }

  // Remove existing modal if any
  const existingModal = document.getElementById('payment-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal HTML
  const modalHTML = `
    <div class="payment-modal-overlay" id="payment-modal">
      <div class="payment-modal">
        <div class="payment-modal-header">
          <div class="payment-header-content">
            <div class="payment-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="payment-title-section">
              <h3 class="payment-title">${title}</h3>
              <p class="payment-subtitle">Secure Payment Required</p>
            </div>
          </div>
          <button class="payment-modal-close" id="payment-modal-close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        
        <div class="payment-modal-content">
          ${step === 1 ? `
          <div class="scam-amount-section">
            <label for="scam-amount" class="scam-amount-label">
              <span class="label-text">Amount Lost to Scam</span>
              <span class="label-description">Enter the amount you were scammed to proceed</span>
            </label>
            <div class="scam-amount-input-wrapper">
              <span class="currency-symbol">$</span>
              <input type="number" id="scam-amount" class="scam-amount-input" placeholder="0.00" min="1" step="0.01" required>
            </div>
          </div>
          
          <div class="user-details-section">
            <div class="user-details-grid">
              <div class="user-detail-field">
                <label for="user-fullname" class="user-detail-label">Full Name</label>
                <input type="text" id="user-fullname" class="user-detail-input" placeholder="Enter your full name" required>
              </div>
              
              <div class="user-detail-field">
                <label for="user-phone" class="user-detail-label">Phone Number</label>
                <input type="number" id="user-phone" class="user-detail-input" placeholder="Enter your phone number" required>
              </div>
              
              <div class="user-detail-field">
                <label for="user-nextofkin" class="user-detail-label">Next of Kin</label>
                <input type="text" id="user-nextofkin" class="user-detail-input" placeholder="Enter next of kin name" required>
              </div>
              
             
              
              <div class="user-detail-field">
                <label for="user-location" class="user-detail-label">Location</label>
                <input type="text" id="user-location" class="user-detail-input" placeholder="Enter your location" required>
              </div>
              
              <div class="user-detail-field">
                <label for="user-age" class="user-detail-label">Age</label>
                <input type="number" id="user-age" class="user-detail-input" placeholder="Enter your age" min="18" max="120" required>
              </div>
              
              <div class="user-detail-field">
                <label for="user-gender" class="user-detail-label">Gender</label>
                <select id="user-gender" class="user-detail-input" required>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
          ` : ''}
          
          <div class="payment-message-section">
            <div class="alert-box">
              <div class="alert-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="alert-content">
                <p class="alert-message">${message}</p>
                <p class="alert-amount">${amountText}</p>
              </div>
            </div>
          </div>
          
          <div class="payment-details-section">
            <div class="payment-method-header">
              <div class="bitcoin-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="16" fill="#F7931A"/>
                  <path d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.113-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.257l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.181-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313L8.53 19.833l2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.728.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538z" fill="white"/>
                </svg>
              </div>
              <h4 class="payment-method-title">Bitcoin Payment</h4>
              <p class="payment-method-subtitle">Send payment to the address below</p>
            </div>
            
            <div class="qr-code-section">
              <div class="qr-code-container">
                <img src="${BTC_QR_CODE_URL}" alt="Bitcoin QR Code" class="qr-code-image">
              </div>
            </div>
            
            <div class="wallet-address-section">
              <label class="wallet-address-label">Bitcoin Wallet Address</label>
              <div class="wallet-address-container">
                <input type="text" value="${BTC_WALLET_ADDRESS}" class="wallet-address-input" readonly>
                <button class="copy-address-btn" onclick="copyWalletAddress()">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V2zm2-1a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1H6zM2 5a1 1 0 100-2 1 1 0 000 2zm-2 9a2 2 0 012-2h2a1 1 0 010 2H2a1 1 0 01-1-1v-7a1 1 0 012 0v6a1 1 0 001 1h8a1 1 0 010 2H2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div class="payment-actions">
            <button class="payment-complete-btn" id="payment-complete-btn" onclick="handlePaymentComplete(${step})">
              <span class="button-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </span>
              I have completed the payment
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add event listeners
  const modal = document.getElementById('payment-modal');
  const closeBtn = document.getElementById('payment-modal-close');
  
  // Show modal with animation
  setTimeout(() => {
    modal.classList.add('active');
  }, 10);
  
  // Close modal event
  closeBtn.addEventListener('click', () => {
    closePaymentModal();
  });
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closePaymentModal();
    }
  });
}

// Close payment modal
function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// Copy wallet address to clipboard
function copyWalletAddress() {
  const addressInput = document.querySelector('.wallet-address-input');
  if (addressInput) {
    addressInput.select();
    document.execCommand('copy');
    
    // Show feedback
    const copyBtn = document.querySelector('.copy-address-btn');
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path fill-rule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
      </svg>
    `;
    
    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
    }, 2000);
  }
}

// Snackbar utility
function showPaymentSnackbar(message) {
  let snackbar = document.getElementById('payment-snackbar');
  if (!snackbar) {
    snackbar = document.createElement('div');
    snackbar.id = 'payment-snackbar';
    snackbar.style.position = 'fixed';
    snackbar.style.top = '32px';
    snackbar.style.left = '50%';
    snackbar.style.transform = 'translateX(-50%)';
    snackbar.style.background = '#27ae60';
    snackbar.style.color = '#fff';
    snackbar.style.padding = '1rem 2.5rem';
    snackbar.style.borderRadius = '8px';
    snackbar.style.fontSize = '1.1rem';
    snackbar.style.fontWeight = '600';
    snackbar.style.boxShadow = '0 4px 24px rgba(39,174,96,0.18)';
    snackbar.style.zIndex = '9999';
    snackbar.style.opacity = '0';
    snackbar.style.transition = 'opacity 0.3s';
    document.body.appendChild(snackbar);
  }
  snackbar.textContent = message;
  snackbar.style.opacity = '1';
  setTimeout(() => {
    snackbar.style.opacity = '0';
  }, 2500);
}

// Handle payment completion - UPDATED
async function handlePaymentComplete(step) {
  const completeBtn = document.getElementById('payment-complete-btn');
  try {
    // Show loading state
    completeBtn.disabled = true;
    completeBtn.innerHTML = `
      <span class="button-spinner">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a7 7 0 100 14 7 7 0 000-14zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" opacity="0.25"/>
          <path d="M10 2a8 8 0 018 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>
      </span>
      Processing...`;

    let updateData = {};
    if (step === 1) {
      // Validate scam amount and user details
      const scamAmountInput = document.getElementById('scam-amount');
      const fullNameInput = document.getElementById('user-fullname');
      const phoneInput = document.getElementById('user-phone');
      const nextOfKinInput = document.getElementById('user-nextofkin');
      const locationInput = document.getElementById('user-location');
      const ageInput = document.getElementById('user-age');
      const genderInput = document.getElementById('user-gender');
      if (
        !scamAmountInput || scamAmountInput.value.trim() === '' ||
        !fullNameInput || fullNameInput.value.trim() === '' ||
        !phoneInput || phoneInput.value.trim() === '' ||
        !nextOfKinInput || nextOfKinInput.value.trim() === '' ||
        !locationInput || locationInput.value.trim() === '' ||
        !ageInput || ageInput.value.trim() === '' ||
        !genderInput || genderInput.value.trim() === ''
      ) {
        alert('Please fill in all required fields');
        completeBtn.disabled = false;
        completeBtn.innerHTML = `
          <span class="button-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </span>
          I have completed the payment
        `;
        return;
      }
      const scamAmount = parseFloat(scamAmountInput.value);
      if (scamAmount <= 0) {
        alert('Please enter a valid scam amount');
        completeBtn.disabled = false;
        completeBtn.innerHTML = `
          <span class="button-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </span>
          I have completed the payment
        `;
        return;
      }
      updateData = {
        howMuchScammed: scamAmount,
        fullName: fullNameInput.value,
        phone: phoneInput.value,
        nextOfKin: nextOfKinInput.value,
        location: locationInput.value,
        age: parseInt(ageInput.value),
        gender: genderInput.value,
      };
  
    }
    await db.collection('users').doc(currentUser.uid).update(updateData);
    // Show snackbar and close modal
    setTimeout(() => {
      closePaymentModal();
      showPaymentSnackbar('Payment will be processed shortly');
      setTimeout(async () => {
        // Reload user data
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        userData = userDoc.data();
        // Show next modal if needed
       
      }, 1200);
    }, 800);
  } catch (error) {
    console.error('Error handling payment completion:', error);
    alert('Error processing payment. Please try again.');
    completeBtn.disabled = false;
    completeBtn.innerHTML = `
      <span class="button-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      </span>
      I have completed the payment
    `;
  }
}

// Create deposit modal function
function createDepositModal() {
  // Remove existing modal if any
  const existingModal = document.getElementById('deposit-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal HTML
  const modalHTML = `
    <div class="deposit-modal-overlay" id="deposit-modal">
      <div class="deposit-modal">
        <div class="deposit-modal-header">
          <div class="deposit-header-content">
            <div class="deposit-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20m0-20l7 7m-7-7l-7 7"/>
              </svg>
            </div>
            <div class="deposit-title-section">
              <h3 class="deposit-title">Deposit Funds</h3>
              <p class="deposit-subtitle">Add money to your account</p>
            </div>
          </div>
          <button class="deposit-modal-close" id="deposit-modal-close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        
        <div class="deposit-modal-content">
          <div class="deposit-amount-section">
            <label for="deposit-amount" class="deposit-amount-label">
              <span class="label-text">Deposit Amount</span>
              <span class="label-description">Enter the amount you want to deposit</span>
            </label>
            <div class="deposit-amount-input-wrapper">
              <span class="currency-symbol">$</span>
              <input type="number" id="deposit-amount" class="deposit-amount-input" placeholder="0.00" min="1" step="0.01" required>
            </div>
          </div>
          
          <div class="deposit-method-section">
            <h4 class="deposit-method-title">Payment Method</h4>
            <div class="payment-methods">
              <div class="payment-method-option active" data-method="bitcoin">
                <div class="payment-method-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="16" fill="#F7931A"/>
                    <path d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.113-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.257l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.181-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313L8.53 19.833l2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.728.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538z" fill="white"/>
                  </svg>
                </div>
                <div class="payment-method-info">
                  <span class="payment-method-name">Bitcoin</span>
                  <span class="payment-method-desc">BTC</span>
                </div>
                <div class="payment-method-check">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div class="deposit-details-section" id="bitcoin-details">
            <div class="qr-code-section">
              <div class="qr-code-container">
                <img src="${BTC_QR_CODE_URL}" alt="Bitcoin QR Code" class="qr-code-image">
              </div>
            </div>
            
            <div class="wallet-address-section">
              <label class="wallet-address-label">Bitcoin Wallet Address</label>
              <div class="wallet-address-container">
                <input type="text" value="${BTC_WALLET_ADDRESS}" class="wallet-address-input" readonly>
                <button class="copy-address-btn" onclick="copyDepositAddress()">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V2zm2-1a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1H6zM2 5a1 1 0 100-2 1 1 0 000 2zm-2 9a2 2 0 012-2h2a1 1 0 010 2H2a1 1 0 01-1-1v-7a1 1 0 012 0v6a1 1 0 001 1h8a1 1 0 010 2H2z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="deposit-instructions">
              <div class="instruction-item">
                <span class="instruction-number">1</span>
                <span class="instruction-text">Send the exact amount to the wallet address above</span>
              </div>
              <div class="instruction-item">
                <span class="instruction-number">2</span>
                <span class="instruction-text">Wait for network confirmation (usually 10-60 minutes)</span>
              </div>
              <div class="instruction-item">
                <span class="instruction-number">3</span>
                <span class="instruction-text">Your balance will be updated automatically</span>
              </div>
            </div>
          </div>
          
          <div class="deposit-actions">
            <button class="deposit-complete-btn" id="deposit-complete-btn" onclick="handleDepositComplete()">
              <span class="button-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </span>
              I have sent the deposit
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add event listeners
  const modal = document.getElementById('deposit-modal');
  const closeBtn = document.getElementById('deposit-modal-close');
  
  // Show modal with animation
  setTimeout(() => {
    modal.classList.add('active');
  }, 10);
  
  // Close modal event
  closeBtn.addEventListener('click', () => {
    closeDepositModal();
  });
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeDepositModal();
    }
  });
}

// Close deposit modal
function closeDepositModal() {
  const modal = document.getElementById('deposit-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// Copy deposit wallet address to clipboard
function copyDepositAddress() {
  const addressInput = document.querySelector('#deposit-modal .wallet-address-input');
  if (addressInput) {
    addressInput.select();
    document.execCommand('copy');
    
    // Show feedback
    const copyBtn = document.querySelector('#deposit-modal .copy-address-btn');
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path fill-rule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
      </svg>
    `;
    
    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
    }, 2000);
  }
}

// Handle deposit completion
async function handleDepositComplete() {
  const completeBtn = document.getElementById('deposit-complete-btn');
  const amountInput = document.getElementById('deposit-amount');
  
  // Validate amount
  if (!amountInput || !amountInput.value || parseFloat(amountInput.value) <= 0) {
    alert('Please enter a valid deposit amount');
    return;
  }
  
  try {
    // Show loading state
    completeBtn.disabled = true;
    completeBtn.innerHTML = `
      <span class="button-spinner">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a7 7 0 100 14 7 7 0 000-14zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" opacity="0.25"/>
          <path d="M10 2a8 8 0 018 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>
      </span>
      Processing...`;

    // Here you would typically verify the transaction on the blockchain
    // For now, we'll just show a confirmation message
    
    setTimeout(() => {
      closeDepositModal();
      showPaymentSnackbar('Deposit submitted successfully! It will be processed once confirmed on the blockchain.');
    }, 1500);
    
  } catch (error) {
    console.error('Error handling deposit completion:', error);
    alert('Error processing deposit. Please try again.');
    completeBtn.disabled = false;
    completeBtn.innerHTML = `
      <span class="button-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      </span>
      I have sent the deposit
    `;
  }
}