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
  window.SUPABASE_URL = 'https://your-project.supabase.co';
  window.SUPABASE_ANON_KEY = 'your-anon-key';
  
  // Site URL
  window.SITE_URL = window.location.origin;

  console.log('Environment configuration loaded');
  console.log('Stripe key configured:', !!window.ENV.STRIPE.PUBLISHABLE_KEY);
})(); 