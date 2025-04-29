const express = require('express');
const path = require('path');
const app = express();

// Import handlers
const stripeWebhookHandler = require('./api/webhook/stripe');

// Webhook endpoint must be raw for signature verification
app.post('/api/webhook/stripe', 
  express.raw({type: 'application/json'}),
  stripeWebhookHandler
);

// Regular JSON parsing for other routes
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 