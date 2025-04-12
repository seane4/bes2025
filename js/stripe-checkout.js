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
  const formattedTotal = (total / 100).toFixed(2);
  
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
    const subtotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity, 10) || 1;
      return sum + (price * quantity);
    }, 0);
    
    // Format subtotal
    const formattedSubtotal = (subtotal / 100).toFixed(2);
    if (subtotalElement) {
      subtotalElement.textContent = `$${formattedSubtotal}`;
    }
    
    // Calculate final total with discount
    let finalTotal = subtotal;
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
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
          
          const discountAmount = document.createElement('div');
          discountAmount.className = 'text-block-6 discount-amount';
          
          discountLine.appendChild(discountLabel);
          discountLine.appendChild(discountAmount);
          orderSummaryList.appendChild(discountLine);
        }
        
        if (discountLine) {
          const discountAmountElement = discountLine.querySelector('.discount-amount');
          if (discountAmountElement) {
            discountAmountElement.textContent = `-$${(discountAmount / 100).toFixed(2)}`;
          }
        }
      }
    }
    
    // Update total and grand total displays
    const formattedTotal = (finalTotal / 100).toFixed(2);
    if (totalElement) {
      totalElement.textContent = `$${formattedTotal}`;
    }
    if (grandTotalDisplay) {
      console.log('Setting grand total to:', formattedTotal);
      grandTotalDisplay.textContent = `$${formattedTotal}`;
      
      // Fire an event that the grand total was updated
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
      const cartItems = getCartItems();

      if (cartTotal === 0 || cartItems.length === 0) {
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
              name: document.querySelector('[name="primary_name"]').value,
              address: {
                line1: document.querySelector('[name="address_line1"]').value,
                line2: document.querySelector('[name="address_line2"]').value,
                city: document.querySelector('[name="city"]').value,
                state: document.querySelector('[name="state"]').value,
                postal_code: document.querySelector('[name="zip"]').value,
                country: document.querySelector('[name="country"]').value
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
            name: document.querySelector('[name="primary_name"]').value,
            email: document.querySelector('[name="email"]').value,
            phone: document.querySelector('[name="primary_phone"]').value,
            shirt_size: document.querySelector('[name="primary_shirt_size"]').value,
            spouse_name: document.querySelector('[name="spouse_name"]').value,
            spouse_shirt_size: document.querySelector('[name="spouse_shirt_size"]').value,
            additional_guest_name: document.querySelector('[name="additional_guest_name"]').value,
            additional_guest_shirt_size: document.querySelector('[name="additional_guest_shirt_size"]').value,
            special_requirements: document.getElementById('special_requirements').value
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

function getCartItems() {
  const cart = localStorage.getItem('cart');
  console.log('Raw cart data:', cart); // Debug log
  const items = cart ? JSON.parse(cart) : [];
  console.log('Parsed cart items:', items); // Debug log
  return items;
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

// Make removeCartItem function globally available
window.removeCartItem = function(itemId) {
  console.log('Removing item:', itemId); // Debug log
  let cart = getCartItems();
  cart = cart.filter(item => item.id.toString() !== itemId.toString());
  console.log('Updated cart:', cart); // Debug log
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update cart total - handle both price formats
  // Method 1: Standard calculation (assuming price is in cents)
  let subtotal = cart.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity, 10) || 1;
    return sum + (price * quantity);
  }, 0);
  
  // Method 2: Alternative calculation (if prices are already in dollars)
  let altSubtotal = cart.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity, 10) || 1;
    return sum + (price * quantity);
  }, 0);
  
  // Choose the appropriate total based on results
  let finalSubtotal = subtotal / 100;
  
  // If standard calculation gives zero but alt doesn't, use alt
  if (cart.length > 0 && subtotal === 0 && altSubtotal > 0) {
    console.log('Using alternative calculation method for removeCartItem (prices appear to be in dollars already)');
    finalSubtotal = altSubtotal;
  }
  
  localStorage.setItem('cartTotal', finalSubtotal.toFixed(2));
  
  // Update displays
  displayOrderItems();
  window.dispatchEvent(new CustomEvent('cartUpdated'));
};

// Function to display order items
function displayOrderItems() {
  const orderItemsList = document.querySelector('.w-commerce-commercecheckoutorderitemslist');
  const cartItems = getCartItems();
  
  // Update the order summary first to ensure totals are correct
  if (typeof window.updateOrderSummary === 'function') {
    window.updateOrderSummary();
  }
  
  // Update Items in Order section
  if (orderItemsList && cartItems.length > 0) {
    orderItemsList.innerHTML = cartItems.map(item => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity, 10) || 1;
      
      // Check if price is in cents or dollars
      let formattedPrice; 
      // Try calculating both ways
      const inCents = (price * quantity / 100).toFixed(2);
      const inDollars = (price * quantity).toFixed(2);
      
      // If inCents is 0.00 but inDollars is not, then price is likely in dollars already
      formattedPrice = (inCents === "0.00" && inDollars !== "0.00") ? inDollars : inCents;
      
      return `
        <div class="w-commerce-commercecheckoutorderitem">
          ${item.image ? `<img src="${item.image}" alt="${item.name || item.title || 'Product'}" class="w-commerce-commercecheckoutorderitemimage"/>` : ''}
          <div class="w-commerce-commercecheckoutorderiteminfo">
            <div class="w-commerce-commercecheckoutorderitemtitle">${item.name || item.title || 'Product'}</div>
            <div class="w-commerce-commercecheckoutorderitemprice">$${formattedPrice}</div>
            <div class="w-commerce-commercecheckoutorderitemquantity">Quantity: ${quantity}</div>
            <button class="remove-item-btn" onclick="removeCartItem('${item.id}')">Remove</button>
          </div>
        </div>
      `;
    }).join('');
  } else if (orderItemsList) {
    orderItemsList.innerHTML = `
      <div class="empty-cart-message">
        <p>Your cart is empty</p>
        <a href="/" class="btn">Continue Shopping</a>
      </div>
    `;
  }
}

// Update CSS for remove button
const removeButtonStyle = document.createElement('style');
removeButtonStyle.textContent = `
  .remove-item-btn {
    background: none;
    border: none;
    color: #e53935;
    font-size: 12px;
    font-family: Roboto, sans-serif;
    padding: 4px 8px;
    margin-left: 8px;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.2s ease;
  }
  
  .remove-item-btn:hover {
    color: #c62828;
  }
  
  .empty-cart-message {
    text-align: center;
    padding: 30px;
    font-family: Roboto, sans-serif;
  }

  .w-commerce-commercecheckoutorderiteminfo {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
`;
document.head.appendChild(removeButtonStyle);

// Make updateOrderSummary function globally available
window.updateOrderSummary = function() {
  const subtotalElement = document.getElementById('subtotal-amount');
  const totalElement = document.getElementById('total-amount');
  const grandTotalDisplay = document.getElementById('grand-total-display');
  
  // Get cart items directly from localStorage
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  console.log('Cart items in updateOrderSummary:', cartItems);
  
  // Try both price formats
  // Method 1: Standard calculation (assuming price is in cents)
  let subtotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity, 10) || 1;
    return sum + (price * quantity);
  }, 0);
  
  // Method 2: Alternative calculation (if prices are already in dollars)
  let altSubtotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity, 10) || 1;
    return sum + (price * quantity);
  }, 0);
  
  // Choose the appropriate total based on results
  let formattedSubtotal = (subtotal / 100).toFixed(2);
  console.log('Standard calculation (cents): $' + formattedSubtotal);
  console.log('Alternative calculation (dollars): $' + altSubtotal.toFixed(2));
  
  // If standard calculation gives zero but alt doesn't, use alt
  if (cartItems.length > 0 && subtotal === 0 && altSubtotal > 0) {
    console.log('Using alternative calculation method (prices appear to be in dollars already)');
    formattedSubtotal = altSubtotal.toFixed(2);
  }
  
  // Update displays
  if (subtotalElement) {
    subtotalElement.textContent = `$${formattedSubtotal}`;
  }
  
  // For now, total equals subtotal (no discount)
  if (totalElement) {
    totalElement.textContent = `$${formattedSubtotal}`;
  }
  
  // Update grand total display - THIS IS THE CRITICAL PART
  if (grandTotalDisplay) {
    grandTotalDisplay.textContent = `$${formattedSubtotal}`;
    grandTotalDisplay.style.color = '#4CAF50';
    grandTotalDisplay.style.fontWeight = 'bold';
    console.log('Grand total display updated to:', formattedSubtotal);
  } else {
    console.warn('Grand total display element not found in DOM');
  }
  
  // Fire event for other components that might need this information
  window.dispatchEvent(new CustomEvent('grandTotalUpdated', { 
    detail: { total: subtotal, formattedTotal: formattedSubtotal } 
  }));
}; 