const fs = require('fs');

// Read the env-config.js file
let content = fs.readFileSync('js/env-config.js', 'utf8');

// Replace environment variables
content = content.replace(/\{\{SUPABASE_URL\}\}/g, process.env.SUPABASE_URL || '');
content = content.replace(/\{\{SUPABASE_ANON_KEY\}\}/g, process.env.SUPABASE_ANON_KEY || '');
content = content.replace(/\{\{STRIPE_PUBLISHABLE_KEY\}\}/g, process.env.STRIPE_PUBLISHABLE_KEY || '');
content = content.replace(/\{\{SITE_URL\}\}/g, process.env.SITE_URL || '');

// Write the updated content back to the file
fs.writeFileSync('js/env-config.js', content);

console.log('Build script completed successfully'); 