// CLIENT-SIDE ONLY - Remove all Firebase Admin code!

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
const userAvatar = document.getElementById('user-avatar');
const balanceAmount = document.getElementById('balance-amount');
const balanceToggle = document.getElementById('balance-toggle');
const withdrawBtn = document.getElementById('withdraw-btn');
const withdrawModal = document.getElementById('withdraw-modal');
const modalClose = document.getElementById('modal-close');
const withdrawForm = document.getElementById('withdraw-form');
const logoutBtn = document.getElementById('logout-btn');

let balanceVisible = true;
let currentUser = null;
let userBalance = '0.00';
let cryptoPriceData = {};
let priceUpdateInterval;

// Crypto configuration
const CRYPTO_SYMBOLS = ['bitcoin', 'ethereum', 'dogecoin'];
const CRYPTO_DISPLAY = {
  bitcoin: { symbol: 'BTC', icon: '₿' },
  ethereum: { symbol: 'ETH', icon: 'Ξ' },
  dogecoin: { symbol: 'DOGE', icon: 'Ð' }
};

// Check authentication state
auth.onAuthStateChanged(async (user) => {
  console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
  
  if (user) {
    currentUser = user;
    console.log(`User authenticated: ${user.uid}, Email verified: ${user.emailVerified}`);
    await loadUserData(user);
    initializeCryptoPrices();
    hideLoading();
  } else {
    console.log('No authenticated user, redirecting to signin');
    window.location.href = '/signin';
  }
});

// Load user data from Firestore
async function loadUserData(user) {
  try {
    console.log('Loading user data for:', user.uid);
    
    // Update user info in header
    userName.textContent = `Welcome back, ${user.displayName || 'User'}`;
    userEmail.textContent = user.email;
    
    if (user.photoURL) {
      userAvatar.src = user.photoURL;
    }
    
    // Load user data from Firestore
    console.log('Fetching user document from Firestore...');
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      console.log('User document found:', userDoc.data());
      const userData = userDoc.data();
      userBalance = userData.balance || '$0.00';
      
      // Remove currency symbol for display
      const balanceValue = userBalance.replace('$', '');
      balanceAmount.textContent = balanceValue;
      balanceAmount.setAttribute('data-balance', balanceValue);
    } else {
      console.log('User document not found, creating default...');
      
      // Create user document if it doesn't exist
      const newUserData = {
        fullName: user.displayName || '',
        email: user.email,
        balance: '$0.00',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('users').doc(user.uid).set(newUserData);
      console.log('Created new user document');
      
      userBalance = '$0.00';
      balanceAmount.textContent = '0.00';
      balanceAmount.setAttribute('data-balance', '0.00');
    }
    
  } catch (error) {
    console.error('Error loading user data:', error);
    
    // Set default values if error
    userBalance = '$0.00';
    balanceAmount.textContent = '0.00';
    balanceAmount.setAttribute('data-balance', '0.00');
    
    // Show balance visibility by default
    balanceVisible = true;
    balanceAmount.textContent = '0.00';
  }
}

// Initialize crypto price tracking
async function initializeCryptoPrices() {
  console.log('Initializing crypto price tracking...');
  await fetchCryptoPrices();
  updateCryptoPriceDisplay();
  
  // Update prices every 30 seconds
  priceUpdateInterval = setInterval(async () => {
    await fetchCryptoPrices();
    updateCryptoPriceDisplay();
  }, 30000);
}

// Fetch crypto prices from CoinGecko API (free)
async function fetchCryptoPrices() {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_SYMBOLS.join(',')}&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch crypto prices');
    }
    
    const data = await response.json();
    
    // Store previous prices for trend calculation
    const previousPrices = { ...cryptoPriceData };
    
    // Update crypto price data
    for (const [coin, priceData] of Object.entries(data)) {
      const prevPrice = cryptoPriceData[coin]?.price || priceData.usd;
      
      cryptoPriceData[coin] = {
        price: priceData.usd,
        change24h: priceData.usd_24h_change,
        trend: priceData.usd > prevPrice ? 'up' : priceData.usd < prevPrice ? 'down' : 'neutral',
        lastUpdated: Date.now()
      };
    }
    
    console.log('Crypto prices updated:', cryptoPriceData);
    
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    
    // Fallback data if API fails
    if (Object.keys(cryptoPriceData).length === 0) {
      cryptoPriceData = {
        bitcoin: { price: 45000, change24h: 2.5, trend: 'up', lastUpdated: Date.now() },
        ethereum: { price: 3200, change24h: -1.2, trend: 'down', lastUpdated: Date.now() },
        dogecoin: { price: 0.08, change24h: 5.8, trend: 'up', lastUpdated: Date.now() }
      };
    }
  }
}

// Update crypto price display in recent activity section
function updateCryptoPriceDisplay() {
  const activityList = document.querySelector('.activity-list');
  if (!activityList) return;
  
  // Clear existing items
  activityList.innerHTML = '';
  
  // Generate crypto price items
  CRYPTO_SYMBOLS.forEach(coinId => {
    const coinData = cryptoPriceData[coinId];
    const coinDisplay = CRYPTO_DISPLAY[coinId];
    
    if (!coinData || !coinDisplay) return;
    
    const isPositive = coinData.change24h >= 0;
    const trendIcon = getTrendIcon(coinData.trend);
    const priceFormatted = formatPrice(coinData.price, coinId);
    const changeFormatted = Math.abs(coinData.change24h).toFixed(2);
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    activityItem.innerHTML = `
      <div class="activity-icon ${isPositive ? 'success' : 'pending'}">
        <i class="icon">${coinDisplay.icon}</i>
      </div>
      <div class="activity-content">
        <div class="activity-title">${coinDisplay.symbol}/USD ${trendIcon}</div>
        <div class="activity-description">24h Change: ${isPositive ? '+' : '-'}${changeFormatted}%</div>
        <div class="activity-time">Live Price • Updated ${getTimeAgo(coinData.lastUpdated)}</div>
      </div>
      <div class="activity-amount" style="color: ${isPositive ? '#10b981' : '#ef4444'}">
        $${priceFormatted}
      </div>
    `;
    
    activityList.appendChild(activityItem);
    
    // Add subtle animation for price updates
    activityItem.style.opacity = '0';
    activityItem.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      activityItem.style.transition = 'all 0.3s ease';
      activityItem.style.opacity = '1';
      activityItem.style.transform = 'translateY(0)';
    }, 100);
  });
}

// Get trend icon based on price movement
function getTrendIcon(trend) {
  switch (trend) {
    case 'up':
      return '<span style="color: #10b981; font-size: 12px;">📈</span>';
    case 'down':
      return '<span style="color: #ef4444; font-size: 12px;">📉</span>';
    default:
      return '<span style="color: #6b7280; font-size: 12px;">➡️</span>';
  }
}

// Format price based on coin type
function formatPrice(price, coinId) {
  if (coinId === 'dogecoin') {
    return price.toFixed(4);
  } else if (price > 1000) {
    return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  } else {
    return price.toFixed(2);
  }
}

// Get time ago string
function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 120) return '1 min ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  return 'recently';
}

// Toggle balance visibility
balanceToggle.addEventListener('click', function() {
  balanceVisible = !balanceVisible;
  const balanceValue = balanceAmount.getAttribute('data-balance');
  
  if (balanceVisible) {
    balanceAmount.textContent = balanceValue;
    balanceToggle.querySelector('.icon').textContent = '👁️';
  } else {
    balanceAmount.textContent = '••••••';
    balanceToggle.querySelector('.icon').textContent = '👁️‍🗨️';
  }
});

// Show withdraw modal
withdrawBtn.addEventListener('click', function() {
  withdrawModal.classList.add('active');
});

// Close modal
modalClose.addEventListener('click', function() {
  withdrawModal.classList.remove('active');
});

// Close modal when clicking outside
withdrawModal.addEventListener('click', function(e) {
  if (e.target === withdrawModal) {
    withdrawModal.classList.remove('active');
  }
});

// Handle withdraw form submission
withdrawForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const amount = document.getElementById('withdraw-amount').value;
  const method = document.getElementById('withdraw-method').value;
  
  if (amount && method) {
    alert(`Withdrawal request submitted: $${amount} via ${method}`);
    withdrawModal.classList.remove('active');
    withdrawForm.reset();
  }
});

// Logout functionality
logoutBtn.addEventListener('click', async function() {
  try {
    // Clear crypto price interval
    if (priceUpdateInterval) {
      clearInterval(priceUpdateInterval);
    }
    
    await auth.signOut();
    // Clear cookie
    document.cookie = 'firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/signin';
  } catch (error) {
    console.error('Logout error:', error);
  }
});

// Hide loading overlay
function hideLoading() {
  console.log('Hiding loading overlay');
  setTimeout(() => {
    loadingOverlay.classList.add('hidden');
  }, 1000);
}

// Quick action clicks
document.querySelectorAll('.action-card').forEach(card => {
  card.addEventListener('click', function() {
    const title = this.querySelector('h3').textContent;
    alert(`${title} feature coming soon!`);
  });
});

// Force hide loading after 5 seconds as fallback
setTimeout(() => {
  if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
    console.log('Force hiding loading overlay after timeout');
    loadingOverlay.classList.add('hidden');
  }
}, 5000);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval);
  }
});