// Initialize Stripe with publishable key from environment config
const stripe = Stripe(window.ENV.STRIPE.PUBLISHABLE_KEY);

// Immediately calculate and display the grand total as soon as this script loads
(function() {
  // Get cart from localStorage
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Calculate total
  let total = 0;
  cart.forEach(item => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity, 10) || 1;
    total += price * quantity;
  });
  
  // Format total
  const formattedTotal = total.toFixed(2);
  
  // Update display when DOM is available
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      const grandTotalDisplay = document.getElementById('grand-total-display');
      if (grandTotalDisplay) {
        grandTotalDisplay.textContent = '$' + formattedTotal;
        console.log('Grand total set to $' + formattedTotal + ' on DOMContentLoaded');
      }
    });
  } else {
    // DOM is already ready
    const grandTotalDisplay = document.getElementById('grand-total-display');
    if (grandTotalDisplay) {
      grandTotalDisplay.textContent = '$' + formattedTotal;
      console.log('Grand total set to $' + formattedTotal + ' immediately');
    }
  }
})();

// Create an instance of Elements
const elements = stripe.elements();

// Custom styling for the Stripe Elements
const style = {
  base: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    '::placeholder': {
      color: '#666'
    },
    padding: '8px 12px'
  },
  invalid: {
    color: '#e53935',
    iconColor: '#e53935'
  }
};

// Create and mount the card elements
const cardNumber = elements.create('cardNumber', { 
  style,
  placeholder: 'Card number',
  showIcon: true
});
const cardExpiry = elements.create('cardExpiry', { 
  style,
  placeholder: 'MM / YY'
});
const cardCvc = elements.create('cardCvc', { 
  style,
  placeholder: 'CVC'
});

// Mount the card elements to their respective containers
document.addEventListener('DOMContentLoaded', function() {
  // Mount elements
  cardNumber.mount('#card-number-element');
  cardExpiry.mount('#card-expiry-element');
  cardCvc.mount('#card-cvc-element');

  // Handle real-time validation errors
  const displayError = document.getElementById('card-errors');
  const form = document.getElementById('payment-form');
  const submitButton = form.querySelector('button[type="submit"]');
  
  function showError(message) {
    displayError.textContent = message;
    displayError.style.display = 'block';
    submitButton.disabled = false;
    submitButton.textContent = 'Pay Now';
  }

  function clearError() {
    displayError.textContent = '';
    displayError.style.display = 'none';
  }
  
  [cardNumber, cardExpiry, cardCvc].forEach(element => {
    element.on('change', function(event) {
      if (event.error) {
        showError(event.error.message);
      } else {
        clearError();
      }
    });
  });

  // Copy shipping address to billing address when checkbox is checked
  const billingCheckbox = document.getElementById('billing-same-as-shipping');
  if (billingCheckbox) {
    billingCheckbox.addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('billing-name').value = document.querySelector('[name="primary_name"]').value;
        document.getElementById('billing-email').value = document.querySelector('[name="email"]').value;
        document.getElementById('billing-address').value = document.querySelector('[name="address_line1"]').value;
        document.getElementById('billing-city').value = document.querySelector('[name="city"]').value;
        document.getElementById('billing-state').value = document.querySelector('[name="state"]').value;
        document.getElementById('billing-zip').value = document.querySelector('[name="zip"]').value;
        document.getElementById('billing-country').value = document.querySelector('[name="country"]').value;
      }
    });
  }

  // Discount code handling
  let appliedDiscount = null;

  function handleDiscountCode() {
    const discountInput = document.getElementById('wf-ecom-discounts');
    const discountCode = discountInput.value.trim().toUpperCase();
    const discountError = document.querySelector('.w-commerce-commercecarterrorstate');
    
    // Reset any previous error states
    discountError.style.display = 'none';
    
    // Check for valid discount code
    if (discountCode === 'TRACTS') {
      appliedDiscount = {
        code: 'TRACTS',
        type: 'percentage',
        amount: 100 // 100% off
      };
      
      // Update the order summary
      updateOrderSummary();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'discount-success-message';
      successMessage.textContent = 'Discount code applied successfully!';
      discountInput.parentNode.appendChild(successMessage);
      
      // Disable the input and button
      discountInput.disabled = true;
      document.getElementById('apply-discount-btn').disabled = true;
    } else {
      // Show error message
      discountError.style.display = 'block';
      discountError.querySelector('.w-cart-error-msg').textContent = 'Invalid discount code.';
    }
  }

  function updateOrderSummary() {
    const subtotalElement = document.getElementById('subtotal-amount');
    const totalElement = document.getElementById('total-amount');
    const grandTotalDisplay = document.getElementById('grand-total-display');
    const orderSummaryList = document.getElementById('order-summary-list');
    const cartItems = getCartItems();
    
    console.log('updateOrderSummary called', cartItems);
    
    // Calculate subtotal from cart items
    let subtotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity, 10) || 1;
      return sum + (price * quantity);
    }, 0);
    
    // Format subtotal - ASSUME subtotal is already in dollars
    const formattedSubtotal = subtotal.toFixed(2);
    if (subtotalElement) {
      subtotalElement.textContent = `$${formattedSubtotal}`;
    }
    
    // Calculate final total with discount
    let finalTotal = subtotal;
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        // Calculate discount amount in dollars
        const discountAmount = subtotal * (appliedDiscount.amount / 100); 
        finalTotal = Math.max(0, subtotal - discountAmount);
        
        // Add or update discount line
        let discountLine = document.getElementById('discount-line');
        if (!discountLine && orderSummaryList) {
          discountLine = document.createElement('div');
          discountLine.id = 'discount-line';
          discountLine.className = 'w-commerce-commercecheckoutsummarylineitem';
          
          const discountLabel = document.createElement('div');
          discountLabel.className = 'text-block-3';
          discountLabel.textContent = `Discount (${appliedDiscount.code})`;
          
          const discountAmountEl = document.createElement('div'); // Renamed variable to avoid conflict
          discountAmountEl.className = 'text-block-6 discount-amount';
          
          discountLine.appendChild(discountLabel);
          discountLine.appendChild(discountAmountEl); // Use renamed variable
          orderSummaryList.appendChild(discountLine);
        }
        
        if (discountLine) {
          const discountAmountElement = discountLine.querySelector('.discount-amount');
          if (discountAmountElement) {
            // Display discount amount in dollars
            discountAmountElement.textContent = `-$${discountAmount.toFixed(2)}`; 
          }
        }
      }
      // Add logic here for fixed amount discounts if needed
      // else if (appliedDiscount.type === 'fixed') { ... }
    }
    
    // Update total and grand total displays - ASSUME finalTotal is in dollars
    const formattedTotal = finalTotal.toFixed(2); 
    if (totalElement) {
      totalElement.textContent = `$${formattedTotal}`;
    }
    if (grandTotalDisplay) {
      console.log('%cupdateOrderSummary: Setting grand total to: $' + formattedTotal + ' (assuming dollars)', 'color: green; font-weight: bold;');
      grandTotalDisplay.textContent = `$${formattedTotal}`;
      
      // Fire an event that the grand total was updated - send dollar values
      window.dispatchEvent(new CustomEvent('grandTotalUpdated', { 
        detail: { total: finalTotal, formattedTotal: formattedTotal } 
      }));
    }
    
    // Show empty cart message if no items
    if (!cartItems || cartItems.length === 0) {
      if (orderSummaryList) {
        orderSummaryList.innerHTML = '';
        if (subtotalElement) subtotalElement.textContent = '$0.00';
        if (totalElement) totalElement.textContent = '$0.00';
        if (grandTotalDisplay) grandTotalDisplay.textContent = '$0.00';
      }
    }
  }

  // Add event listener for the discount button
  const applyDiscountBtn = document.getElementById('apply-discount-btn');
  if (applyDiscountBtn) {
    applyDiscountBtn.addEventListener('click', handleDiscountCode);
  }
  
  // Add event listener for Enter key in discount input
  const discountInput = document.getElementById('wf-ecom-discounts');
  if (discountInput) {
    discountInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleDiscountCode();
      }
    });
  }

  // Handle form submission
  form.addEventListener('submit', async function(event) {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = 'Processing Payment...';
    clearError();

    // Validate form fields
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('invalid');
      } else {
        field.classList.remove('invalid');
      }
    });

    if (!isValid) {
      showError('Please fill in all required fields.');
      return;
    }

    try {
      // Get cart data
      const cartTotal = getCartTotal();
      console.log('cartTotal:', cartTotal);
      const cartItems = getCartItems();
      console.log('cartItems:', cartItems);
      //Remove this for now to work on Stripe integration 
      if ( cartItems.length === 0) {
        showError('Your cart is empty. Please add items before proceeding.');
        return;
      }

      // Apply discount if present
      let finalAmount = cartTotal;
      if (appliedDiscount && appliedDiscount.code === 'TRACTS') {
        finalAmount = 0; // 100% discount
      }

      // Create payment intent with final amount
      const response = await fetch(window.ENV.STRIPE.ENDPOINTS.CREATE_PAYMENT_INTENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: finalAmount,
          currency: window.ENV.APP.CURRENCY,
          items: cartItems,
          discount: appliedDiscount,
          customer_info: {
            name: document.getElementById('billing-name').value,
            email: document.getElementById('billing-email').value,
            shipping: {
              name: document.getElementById('billing-name').value,
              address: {
                line1: document.getElementById('billing-address').value,
                city: document.getElementById('billing-city').value,
                state: document.getElementById('billing-state').value,
                postal_code: document.getElementById('billing-zip').value,
                country: document.getElementById('billing-country').value
              }
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: document.getElementById('billing-name').value,
            email: document.getElementById('billing-email').value,
            address: {
              line1: document.getElementById('billing-address').value,
              city: document.getElementById('billing-city').value,
              state: document.getElementById('billing-state').value,
              postal_code: document.getElementById('billing-zip').value,
              country: document.getElementById('billing-country').value
            }
          }
        }
      });

      if (error) {
        throw error;
      }

      if (paymentIntent.status === 'succeeded') {
        // Save order details
        const orderDetails = {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          customer_info: {
            name: document.getElementById('billing-name').value,
            email: document.getElementById('billing-email').value,
            shipping: {
              name: document.getElementById('billing-name').value,
              address: {
                line1: document.getElementById('billing-address').value,
                city: document.getElementById('billing-city').value,
                state: document.getElementById('billing-state').value,
                postal_code: document.getElementById('billing-zip').value,
                country: document.getElementById('billing-country').value
              }
            }
          },
          items: cartItems
        };

        // Send order details to server
        const orderResponse = await fetch('/api/save-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderDetails)
        });

        if (!orderResponse.ok) {
          console.error('Failed to save order details');
        }

        // Clear cart and redirect
        clearCart();
        window.location.href = '/order-confirmation.html?payment_status=success';
      }
    } catch (error) {
      console.error('Payment error:', error);
      showError(error.message || 'An error occurred while processing your payment. Please try again.');
    }
  });

  // Display order items
  displayOrderItems();
  
  // Update display when cart is updated
  window.addEventListener('cartUpdated', displayOrderItems);
});

// Helper functions
function getCartTotal() {
  const cartTotal = localStorage.getItem('cartTotal');
  return cartTotal ? Math.round(parseFloat(cartTotal) * 100) : 0;
}

// Helper function to get cart items safely
function getCartItems() {
  try {
      const cartString = localStorage.getItem('cart');
      if (!cartString) {
          return []; // No cart data
      }
      const cart = JSON.parse(cartString);
      if (!Array.isArray(cart)) { // Ensure cart is always an array
          console.warn('Cart data in localStorage was not an array. Resetting.');
          localStorage.setItem('cart', JSON.stringify([])); // Clear invalid data
          return [];
      }
      // Optional: Further validation of items within the array
      return cart.filter(item =>
          item && typeof item === 'object' &&
          item.id && typeof item.id === 'string' && // Expect string ID
          item.name && typeof item.name === 'string' &&
          typeof item.price === 'number' && Number.isInteger(item.price) && item.price >= 0 && // Expect integer price in cents >= 0
          typeof item.quantity === 'number' && Number.isInteger(item.quantity) && item.quantity > 0 // Expect integer quantity > 0
      );
  } catch (error) {
      console.error("Error parsing cart data from localStorage:", error);
      localStorage.setItem('cart', JSON.stringify([])); // Clear potentially corrupted data
      return [];
  }
}

function clearCart() {
  localStorage.removeItem('cart');
  localStorage.removeItem('cartTotal');
  
  // Trigger cart update event
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

// Handle payment status check
function checkForPaymentStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment_status');
  
  if (paymentStatus === 'success') {
    const contentSection = document.querySelector('.content-section');
    if (contentSection) {
      const successMessage = document.createElement('div');
      successMessage.className = 'payment-success-message';
      successMessage.innerHTML = `
        <div class="payment-success-content">
          <h2>Payment Successful!</h2>
          <p>Thank you for your purchase. Your order has been confirmed.</p>
          <p>You will receive a confirmation email shortly.</p>
          <div class="payment-success-buttons">
            <a href="/" class="btn">Return to Home</a>
          </div>
        </div>
      `;
      contentSection.appendChild(successMessage);
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  checkForPaymentStatus();
  
  // Initialize grand total display
  if (typeof window.updateOrderSummary === 'function') {
    window.updateOrderSummary();
  }
  
  // Make sure we update the grand total display whenever the cart is updated
  window.addEventListener('cartUpdated', function() {
    if (typeof window.updateOrderSummary === 'function') {
      window.updateOrderSummary();
    }
  });
});

// Function to display items (Adapt selectors to your checkout page HTML)
function displayOrderItems() {
  const cart = getCartItems();
  // IMPORTANT: Update this selector to match your actual container for order items
  const orderItemsContainer = document.getElementById('order-items-container') || document.querySelector('.order-summary-list'); // Example selectors

  // IMPORTANT: Update this selector for the subtotal display
  const subtotalElement = document.getElementById('subtotal-display') || document.querySelector('.subtotal-value'); // Example selectors

  if (!orderItemsContainer) {
      console.error("Order items container element not found. Cannot display items.");
      // Attempt to update total anyway if element exists
      if (subtotalElement) {
          subtotalElement.textContent = '$0.00';
      }
      return;
  }

  orderItemsContainer.innerHTML = ''; // Clear previous items
  let currentSubtotalCents = 0;

  if (cart.length === 0) {
    orderItemsContainer.innerHTML = '<li>Your cart is empty.</li>'; // Use list item for consistency
  } else {
    cart.forEach(item => {
      // Item structure is already validated by getCartItems
      const quantity = item.quantity;
      const priceInCents = item.price;
      const itemTotalCents = priceInCents * quantity;
      currentSubtotalCents += itemTotalCents;

      // Create list item element (Adapt HTML structure and classes as needed)
      const listItem = document.createElement('li');
      listItem.classList.add('order-item'); // Add a class for styling
      // Ensure item.id is a string for the attribute and function call
      const itemIdStr = String(item.id);
      listItem.innerHTML = `
        <div class="item-details">
          <span class="item-name">${item.name}</span>
          <span class="item-quantity"> &times; ${quantity}</span>
          <span class="item-price-each"> ($${(priceInCents / 100).toFixed(2)} each)</span>
        </div>
        <div class="item-total-price">$${(itemTotalCents / 100).toFixed(2)}</div>
        <button class="remove-item-btn" title="Remove item" onclick="removeCartItem('${itemIdStr}')" data-item-id="${itemIdStr}">×</button>
      `;
      orderItemsContainer.appendChild(listItem);
    });
  }

  // Update subtotal display
  const subtotalDollars = (currentSubtotalCents / 100).toFixed(2);
  if (subtotalElement) {
    subtotalElement.textContent = `$${subtotalDollars}`;
  } else {
      console.warn("Subtotal display element not found.");
  }

  // Also update the grand total if it's displayed separately and calculated here
  // IMPORTANT: Update selector if needed
  const grandTotalElement = document.getElementById('grand-total') || document.querySelector('.grand-total-value'); // Example selectors
   if (grandTotalElement) {
     grandTotalElement.textContent = `$${subtotalDollars}`; // Assuming subtotal is grand total for now
   }

   console.log(`Order items displayed. Subtotal: $${subtotalDollars}`);
}

// Make removeCartItem function globally available and use the correct ID
window.removeCartItem = function(itemIdToRemove) {
  // Ensure itemIdToRemove is treated as a string for comparison
  const idStr = String(itemIdToRemove);
  console.log('Attempting to remove item with ID:', idStr);
  let cart = getCartItems(); // Get validated cart items

  // Filter out the item(s) with the matching ID
  const initialLength = cart.length;
  // Create a new array excluding the item(s) to remove
  const updatedCart = cart.filter(item => String(item.id) !== idStr);
  const itemsRemovedCount = initialLength - updatedCart.length;

  if (itemsRemovedCount > 0) {
      console.log(`Removed ${itemsRemovedCount} item instance(s) with ID: ${idStr}`);
      // Save the updated cart back to localStorage
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      console.log('Updated cart saved:', updatedCart);

      // Update displays
      displayOrderItems(); // Refresh the displayed list and totals
      window.dispatchEvent(new CustomEvent('cartUpdated')); // Notify other listeners (like header count in index.js)
  } else {
      console.warn(`No item found with ID: ${idStr} to remove.`);
  }
};

// Function to prepare data and redirect to Stripe
async function redirectToCheckout() {
  console.log("Initiating redirectToCheckout...");
  const cart = getCartItems(); // Get validated cart items

  if (cart.length === 0) {
    alert("Your cart is empty. Please add items before checking out.");
    console.log("Checkout aborted: Cart is empty.");
    return;
  }

  console.log(`Preparing ${cart.length} cart items for Stripe.`);

  // Prepare line_items for Stripe Checkout
  const lineItems = cart.map(item => {
    // Item structure is already validated by getCartItems
    return {
      price_data: {
        currency: 'cad', // IMPORTANT: Verify currency code
        product_data: {
          name: item.name,
          // Add description or images if needed and available
          // description: item.description || `Product ID: ${item.id}`, // Example description
          // images: item.image ? [item.image] : [], // Ensure image URLs are accessible by Stripe
        },
        unit_amount: item.price, // Price MUST be in cents (already validated as integer)
      },
      quantity: item.quantity, // Already validated as integer > 0
    };
  });

   console.log("Line items prepared for Stripe:", lineItems);


  // --- Add loading state to button ---
  const checkoutButton = document.getElementById('checkout-button'); // Ensure your button has this ID
  let originalButtonText = '';
  if (checkoutButton) {
      originalButtonText = checkoutButton.textContent;
      checkoutButton.textContent = 'Processing...';
      checkoutButton.disabled = true;
  }
  // --- End loading state ---


  try {
    // Fetch the Checkout Session ID from your backend API route
    // IMPORTANT: Ensure this matches your actual API endpoint
    const apiRoute = '/api/create-checkout-session';
    console.log(`Fetching checkout session from: ${apiRoute}`);

    const response = await fetch(apiRoute, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ line_items: lineItems }), // Send line_items to backend
    });

    console.log(`Response status from ${apiRoute}: ${response.status}`);

    if (!response.ok) {
      let errorData;
      try {
          errorData = await response.json();
          console.error("Error data from backend:", errorData);
      } catch (e) {
          errorData = { error: await response.text() }; // Fallback if response is not JSON
          console.error("Non-JSON error response from backend:", errorData.error);
      }
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const { sessionId } = await response.json();
    console.log("Received Stripe Session ID:", sessionId);

    if (!sessionId) {
        throw new Error("Missing Session ID from server response.");
    }

    // Redirect to Stripe Checkout
    // IMPORTANT: Replace with your ACTUAL Stripe Publishable Key
    const stripePublishableKey = 'pk_test_YOUR_PUBLISHABLE_KEY'; // REPLACE THIS
    if (stripePublishableKey.includes('YOUR_PUBLISHABLE_KEY')) {
        console.error("Stripe Publishable Key is not set!");
        alert("Checkout configuration error. Please contact support.");
        throw new Error("Stripe Publishable Key missing.");
    }
    const stripe = Stripe(stripePublishableKey);

    console.log("Redirecting to Stripe Checkout...");
    const { error } = await stripe.redirectToCheckout({ sessionId });

    // This point is only reached if redirectToCheckout fails immediately
    if (error) {
      console.error("Stripe redirection error:", error);
      throw new Error(`Could not redirect to Stripe: ${error.message}`); // Throw to be caught below
    }
  } catch (error) {
    console.error("Checkout process error:", error);
    alert(`Checkout failed: ${error.message}. Please try again or contact support.`);
    // --- Restore button state on error ---
    if (checkoutButton) {
        checkoutButton.textContent = originalButtonText || 'Checkout';
        checkoutButton.disabled = false;
    }
    // --- End restore button state ---
  }
}

// Add event listener to your checkout button
document.addEventListener('DOMContentLoaded', () => {
  // IMPORTANT: Update selector to match your checkout button
  const checkoutButton = document.getElementById('checkout-button') || document.querySelector('.checkout-button-class'); // Example selectors
  if (checkoutButton) {
    checkoutButton.addEventListener('click', redirectToCheckout);
    console.log("Checkout button event listener added.");
  } else {
      console.warn("Checkout button not found on this page.");
  }

  // Initial display of items on checkout page load
  displayOrderItems();

  // Listen for cart updates to refresh display while on the checkout page
  window.addEventListener('cartUpdated', displayOrderItems);
  console.log("Stripe checkout script initialized.");
});

// Make updateOrderSummary function globally available
window.updateOrderSummary = function() {
  const subtotalElement = document.getElementById('subtotal-amount');
  const totalElement = document.getElementById('total-amount');
  const grandTotalDisplay = document.getElementById('grand-total-display');
  
  // Get cart items directly from localStorage
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  console.log('Cart items in updateOrderSummary:', cartItems);
  
  // Find this loop within your updateOrderSummary or total calculation function
  const cartItemElements = document.querySelectorAll('.checkout-item'); // Adjust selector if needed
  let calculatedTotal = 0;

  console.log(`Found ${cartItemElements.length} item elements for total calculation.`); // Log how many items it found

  cartItemElements.forEach((itemElement, index) => {
      console.log(`Processing item element ${index + 1}:`, itemElement);

      // --- DEBUGGING PRICE EXTRACTION ---
      // Adjust the selector '.item-price' to match where the price is displayed for each item
      const priceElement = itemElement.querySelector('.item-price-each'); // Use the correct class for price per item

      if (priceElement) {
          console.log(`  Found price element for item ${index + 1}:`, priceElement);
          const priceText = priceElement.textContent;
          console.log(`  Raw price text content for item ${index + 1}: "${priceText}"`);

          // Attempt to parse the price (adjust regex if needed based on format, e.g., remove $, commas)
          // This example removes anything that isn't a digit or a decimal point.
          const cleanedPriceText = priceText.replace(/[^0-9.]/g, '');
          const price = parseFloat(cleanedPriceText);
          console.log(`  Parsed price for item ${index + 1}: ${price}`); // Check if this is a valid number

          if (!isNaN(price) && price > 0) {
              // Now, get the quantity for this item (you might need to read this from the DOM too)
              let quantity = 1; // Default to 1 if quantity isn't displayed/read
              const quantityElement = itemElement.querySelector('.item-quantity'); // <<< ADJUST SELECTOR IF NEEDED
              if (quantityElement) {
                   // Clean the text content to remove non-digits before parsing
                   const quantityText = quantityElement.textContent.replace(/[^0-9]/g, '');
                   const quantityValue = parseInt(quantityText, 10);
                   if (!isNaN(quantityValue) && quantityValue > 0) {
                       quantity = quantityValue;
                       console.log(`  Parsed quantity for item ${index + 1}: ${quantity}`); // Added log
                   } else {
                       console.warn(`  Failed to parse quantity for item ${index + 1}. Text: "${quantityElement.textContent}"`);
                   }
              } else {
                   console.log(`  Quantity element not found for item ${index + 1}, assuming quantity is 1.`);
              }
          } else {
              console.warn(`  Failed to parse price for item ${index + 1}. Text: "${priceText}"`);
          }
      } else {
                   console.log(`  Quantity element not found for item ${index + 1}, assuming quantity is 1.`) }
      }