// Environment Configuration
const ENV = {
  // Stripe Configuration
  STRIPE: {
    // Replace this with your actual Stripe publishable key
    PUBLISHABLE_KEY: 'pk_test_51O4La8JN3tVTvIK71234567890abcdefghijklmnopqrstuvwxyz',
    
    // API endpoints
    ENDPOINTS: {
      CREATE_PAYMENT_INTENT: '/api/create-payment-intent',
      WEBHOOK: '/api/stripe-webhook'
    }
  },
  
  // Application Configuration
  APP: {
    CURRENCY: 'usd',
    CURRENCY_DISPLAY: 'USD'
  }
};

// Make ENV available globally
window.ENV = ENV;

// Environment configuration for Banff Energy Summit
(function() {
  // Supabase configuration - Replace with your actual values in production
  window.SUPABASE_URL = 'https://nxeyxsojtistrgadsyju.supabase.co';
  window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZXl4c29qdGlzdHJnYWRzeWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzU0NDEsImV4cCI6MjA2MDIxMTQ0MX0.7RU25WUHDeXEh3xpsBviGWACXcCaa7ddDsmD0irwo9w';
  
  // Site URL
  window.SITE_URL = window.location.origin;

  console.log('Environment configuration loaded');
  console.log('Stripe key configured:', !!window.ENV.STRIPE.PUBLISHABLE_KEY);
})(); 