// Authentication Debug Helper
// Run this in browser console to check current auth state

console.log('=== AUTH DEBUG ===');

// Check localStorage for auth info
const token = localStorage.getItem('token');
const userData = localStorage.getItem('userData');
const expiration = localStorage.getItem('expiration');

console.log('Token exists:', !!token);
console.log('UserData exists:', !!userData);
console.log('Token expiration exists:', !!expiration);

if (userData) {
  try {
    const user = JSON.parse(userData);
    console.log('User ID:', user.id);
    console.log('User email:', user.email);
    console.log('User role:', user.role?.name);
    console.log('Full user data:', user);
  } catch (e) {
    console.error('Error parsing userData:', e);
  }
} else {
  console.log('No userData found in localStorage');
}

// Check if userData is correct
console.log('=== API TEST ===');
// Test call to the current user endpoint
if (token) {
  fetch('http://localhost:5000/api/users/current', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log('Current user from API:', data);
    if (userData) {
      const storedUser = JSON.parse(userData);
      console.log('MISMATCH CHECK:', data.id !== storedUser.id ? 
        `⚠️ MISMATCH! API: ${data.id}, Stored: ${storedUser.id}` : 
        'IDs match ✓');
    }
  })
  .catch(err => console.error('API error:', err));
}

// Check HTTP requests being made
console.log('=====================================================');
console.log('MONITORING HTTP REQUESTS FOR 10 SECONDS...');

const originalFetch = window.fetch;
window.fetch = function(resource, init) {
  // Only log API calls to our backend
  if (resource && typeof resource === 'string' && resource.includes('localhost:5000')) {
    console.log('📡 Fetch request:', {
      url: resource,
      method: init?.method || 'GET',
      headers: init?.headers,
      time: new Date().toLocaleTimeString()
    });
  }
  return originalFetch.apply(this, arguments);
};

// Reset after 10 seconds
setTimeout(() => {
  window.fetch = originalFetch;
  console.log('HTTP monitoring stopped');
  console.log('=====================================================');
}, 10000);

console.log('=====================================================');
console.log('Copy your COMPLETE userData here for inspection:');
console.log(userData);
console.log('====================================================='); 