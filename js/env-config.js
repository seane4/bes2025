// Environment Configuration
const ENV = {
  // Stripe Configuration
  STRIPE: {
    // Publishable key from .env
    PUBLISHABLE_KEY: 'pk_test_51RDJNnCmQWfCgIYUttuWdIatviUpU6X0FCmX6nnIgHq0ExkwbrK1ZYb2QG2S9FlZVqYyUxuMaFy0yehnc62OsEnD00NBJr7cPP', // Copied from .env
    
    // API endpoints
    ENDPOINTS: {
      CREATE_PAYMENT_INTENT: '/api/create-payment-intent',
      WEBHOOK: '/api/stripe-webhook'  
    }
  },
  
  // Supabase Configuration
  SUPABASE: {
    // URL and Anon Key from .env
    URL: 'https://nxeyxsojtistrgadsyju.supabase.co', // Copied from .env
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZXl4c29qdGlzdHJnYWRzeWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzU0NDEsImV4cCI6MjA2MDIxMTQ0MX0.7RU25WUHDeXEh3xpsBviGWACXcCaa7ddDsmD0irwo9w' // Copied from .env
  },
  
  // Application Configuration
  APP: {
    CURRENCY: 'usd',
    CURRENCY_DISPLAY: 'USD',
    // Site URL - Set dynamically below
    SITE_URL: ''
  }
};

// Make ENV available globally
window.ENV = ENV;

// Environment configuration specific setup / dynamic values
(function() {
  // Set Site URL dynamically
  window.ENV.APP.SITE_URL = window.location.origin;

  // Debug Stripe key (Accessing via the ENV object)
  console.log('Stripe key length:', window.ENV.STRIPE.PUBLISHABLE_KEY.length);
  console.log('Stripe key starts with:', window.ENV.STRIPE.PUBLISHABLE_KEY.substring(0, 4));
  console.log('Stripe key ends with:', window.ENV.STRIPE.PUBLISHABLE_KEY.substring(window.ENV.STRIPE.PUBLISHABLE_KEY.length - 4));
  console.log('Stripe key configured:', !!window.ENV.STRIPE.PUBLISHABLE_KEY);

  // Debug Supabase keys (Accessing via the ENV object)
  console.log('Supabase URL configured:', !!window.ENV.SUPABASE.URL);
  console.log('Supabase Anon Key configured:', !!window.ENV.SUPABASE.ANON_KEY);
  console.log('Site URL configured:', window.ENV.APP.SITE_URL);
})();

// Example of how other scripts would access these:
// const stripeKey = window.ENV.STRIPE.PUBLISHABLE_KEY;
// const supabaseUrl = window.ENV.SUPABASE.URL;
// const supabaseAnonKey = window.ENV.SUPABASE.ANON_KEY;
// const { createClient } = supabase; // Assuming Supabase client library is loaded
// const supabase = createClient(supabaseUrl, supabaseAnonKey);