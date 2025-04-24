// // Test script to verify Stripe integration
// document.addEventListener('DOMContentLoaded', function() {
//   if (window.location.pathname.includes('checkout.html')) {
//     // Create a status container
//     const statusContainer = document.createElement('div');
//     statusContainer.style.position = 'fixed';
//     statusContainer.style.bottom = '10px';
//     statusContainer.style.right = '10px';
//     statusContainer.style.padding = '10px';
//     statusContainer.style.backgroundColor = '#f8f9fa';
//     statusContainer.style.border = '1px solid #ddd';
//     statusContainer.style.borderRadius = '4px';
//     statusContainer.style.zIndex = '9999';
//     statusContainer.style.fontSize = '12px';
//     document.body.appendChild(statusContainer);
    
//     // Check Stripe
//     let stripeStatus = 'Checking Stripe...';
//     try {
//       if (window.Stripe) {
//         stripeStatus = `✅ Stripe loaded (Key: ${window.STRIPE_PUBLISHABLE_KEY ? 'Found' : 'Missing'})`;
//       } else {
//         stripeStatus = '❌ Stripe not loaded';
//       }
//     } catch (error) {
//       stripeStatus = `❌ Stripe error: ${error.message}`;
//     }
    
//     // Check Supabase
//     let supabaseStatus = 'Checking Supabase...';
//     try {
//       if (window.supabaseClient || window.SUPABASE_URL) {
//         supabaseStatus = `✅ Supabase configured (URL: ${window.SUPABASE_URL ? 'Found' : 'Missing'})`;
//       } else {
//         supabaseStatus = '❌ Supabase not configured';
//       }
//     } catch (error) {
//       supabaseStatus = `❌ Supabase error: ${error.message}`;
//     }
    
//     // Display status
//     statusContainer.innerHTML = `
//       <strong>Integration Status:</strong><br>
//       ${stripeStatus}<br>
//       ${supabaseStatus}<br>
//       <button id="test-transaction" style="margin-top: 5px; padding: 3px 8px; font-size: 11px; background-color: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">Test Transaction</button>
//     `;
    
//     // Add test transaction button handler
//     document.getElementById('test-transaction').addEventListener('click', function() {
//       alert('To test a transaction, add items to your cart and complete the checkout process. Use Stripe test card: 4242 4242 4242 4242, any future date, any CVC, and any ZIP code.');
//     });
//   }
// }); 