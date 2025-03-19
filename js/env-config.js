// Environment configuration for Banff Energy Summit
(function() {
  // This script injects environment variables from Vercel into the window object
  window.SUPABASE_URL = '{{NEXT_PUBLIC_SUPABASE_URL}}';
  window.SUPABASE_ANON_KEY = '{{NEXT_PUBLIC_SUPABASE_ANON_KEY}}';
  window.STRIPE_PUBLISHABLE_KEY = '{{NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}}';
  window.SITE_URL = '{{NEXT_PUBLIC_SITE_URL}}';

  console.log('Environment configuration loaded');
})(); 