const fs = require('fs');

// Read the env-config.js file
let content = fs.readFileSync('js/env-config.js', 'utf8');

// Replace environment variables
content = content.replace(/\{\{NEXT_PUBLIC_SUPABASE_URL\}\}/g, process.env.NEXT_PUBLIC_SUPABASE_URL || '');
content = content.replace(/\{\{NEXT_PUBLIC_SUPABASE_ANON_KEY\}\}/g, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
content = content.replace(/\{\{NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\}\}/g, process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
content = content.replace(/\{\{NEXT_PUBLIC_SITE_URL\}\}/g, process.env.NEXT_PUBLIC_SITE_URL || '');

// Write the updated content back to the file
fs.writeFileSync('js/env-config.js', content);

console.log('Build script completed successfully'); 