// Stripe Payments Integration for Banff Energy Summit 2025
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Stripe elements once the DOM is loaded
  if (window.location.pathname.includes('checkout.html')) {
    // Wait for env-config.js to load
    const checkStripeKey = setInterval(() => {
      if (window.STRIPE_PUBLISHABLE_KEY) {
        clearInterval(checkStripeKey);
        initializeStripeElements();
        initializeSupabase();
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkStripeKey);
      if (!window.STRIPE_PUBLISHABLE_KEY) {
        console.error('Failed to load Stripe publishable key');
      }
    }, 5000);
  }
});

// Initialize Stripe with your publishable key
let stripe;
let elements;
let cardElement;
let cardNumberElement;
let cardExpiryElement;
let cardCvcElement;

// Initialize Supabase client
let supabase;

function initializeSupabase() {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error('Supabase configuration missing');
    return;
  }
  
  try {
    // Create Supabase client
    supabase = supabaseClient.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    console.log('Supabase client initialized');
  } catch (error) {
    console.error('Error initializing Supabase:', error);
  }
}

function initializeStripeElements() {
  console.log('Initializing Stripe elements...');
  
  if (!window.STRIPE_PUBLISHABLE_KEY) {
    console.error('Stripe publishable key not found');
    return;
  }
  
  try {
    // Initialize Stripe with the publishable key
    stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY);
    
    // Create Stripe elements
    elements = stripe.elements({
      fonts: [
        {
          cssSrc: 'https://fonts.googleapis.com/css?family=Sen:400,700,800',
        },
      ],
      locale: 'auto'
    });
    
    // Customize the style of the Stripe elements
    const style = {
      base: {
        color: '#333',
        fontFamily: '"Sen", sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '14px',
        '::placeholder': {
          color: '#aab7c4'
        },
        ':-webkit-autofill': {
          color: '#333'
        }
      },
      invalid: {
        color: '#e53935',
        iconColor: '#e53935',
        '::placeholder': {
          color: '#e53935'
        }
      }
    };
    
    // Create individual Stripe elements for card number, expiration, and CVC
    cardNumberElement = elements.create('cardNumber', {
      style: style,
      placeholder: 'Card number'
    });
    
    cardExpiryElement = elements.create('cardExpiry', {
      style: style,
      placeholder: 'MM / YY'
    });
    
    cardCvcElement = elements.create('cardCvc', {
      style: style,
      placeholder: 'CVC'
    });
    
    // Store the Stripe elements in a global variable for access from other scripts
    window.stripeElements = {
      number: cardNumberElement,
      expiry: cardExpiryElement,
      cvc: cardCvcElement
    };
    
    // Wait for the DOM to be fully ready
    setTimeout(() => {
      mountStripeElements();
    }, 500);
  } catch (error) {
    console.error('Error initializing Stripe:', error);
  }
}

function mountStripeElements() {
  const cardNumberContainer = document.getElementById('card-number-element');
  const cardExpiryContainer = document.getElementById('card-expiry-element');
  const cardCvcContainer = document.getElementById('card-cvc-element');
  
  // Helper function to mount a single element
  const mountElement = (element, container, name) => {
    if (!container) {
      console.error(`${name} container not found`);
      return;
    }
    
    try {
      // Clean up any existing element
      if (element._mounted) {
        element.unmount();
      }
      
      // Mount the element
      element.mount(container);
      element._mounted = true;
      console.log(`${name} element mounted`);
      
      // Add event listeners
      element.on('focus', () => {
        container.classList.add('focused');
      });
      
      element.on('blur', () => {
        container.classList.remove('focused');
      });
      
      element.on('change', (event) => {
        if (event.error) {
          container.classList.add('invalid');
        } else {
          container.classList.remove('invalid');
        }
      });
    } catch (error) {
      console.error(`Error mounting ${name} element:`, error);
    }
  };
  
  // Mount each element
  mountElement(cardNumberElement, cardNumberContainer, 'Card number');
  mountElement(cardExpiryElement, cardExpiryContainer, 'Card expiry');
  mountElement(cardCvcElement, cardCvcContainer, 'Card CVC');
  
  // Set up form submission after elements are mounted
  setupCheckoutFormSubmission();
}

function setupCheckoutFormSubmission() {
  const checkoutButton = document.querySelector('.w-commerce-commercecheckoutplaceorderbutton');
  const customerForm = document.getElementById('wf-form-Customer-Information'); // Ensure this ID matches your form
  const paymentForm = document.getElementById('payment-form'); // Ensure this ID matches your payment form container
  const paymentError = document.getElementById('payment-error');

  if (!checkoutButton || !customerForm || !paymentForm) {
    console.error('Checkout button, customer form, or payment form element not found.');
    // Optionally display an error to the user
    return;
  }

  checkoutButton.addEventListener('click', async function(event) { // Make the handler async
    event.preventDefault(); // Prevent default form submission
    checkoutButton.value = 'Processing...'; // Update button text
    checkoutButton.disabled = true; // Disable button
    if (paymentError) paymentError.textContent = ''; // Clear previous errors

    // --- Form Validation (Keep your existing validation) ---
    let isValid = true;
    // Add checks for required fields if necessary
    // Example:
    // const emailInput = customerForm.querySelector('[name="email"]');
    // if (!emailInput.value || !emailInput.checkValidity()) {
    //   isValid = false;
    //   // Add visual feedback for invalid field
    // }
    // ... add more validation as needed ...

    if (!isValid) {
      console.error('Form validation failed.');
      if (paymentError) paymentError.textContent = 'Please fill out all required fields correctly.';
      checkoutButton.value = 'Place Order'; // Reset button text
      checkoutButton.disabled = false; // Re-enable button
      return; // Stop submission
    }
    // --- End Form Validation ---


    // Extract customer information
    const customerData = {
      email: customerForm.querySelector('[name="email"]').value,
      primaryName: customerForm.querySelector('[name="primary_name"]').value,
      phone: customerForm.querySelector('[name="primary_phone"]').value,
      address: {
        line1: customerForm.querySelector('[name="address_line1"]').value,
        line2: customerForm.querySelector('[name="address_line2"]').value || '',
        city: customerForm.querySelector('[name="city"]').value,
        state: customerForm.querySelector('[name="state"]').value,
        postal_code: customerForm.querySelector('[name="zip"]').value, // Ensure name="zip" matches your HTML
        country: customerForm.querySelector('[name="country"]').value
      },
      shirtSize: customerForm.querySelector('[name="primary_shirt_size"]').value,
      // --- EDIT START: Add Height and Weight ---
      primaryHeight: customerForm.querySelector('[name="primary_height"]').value || '',
      primaryWeight: customerForm.querySelector('[name="primary_weight"]').value || null, // Send null if empty, backend expects integer
      // --- EDIT END ---
      spouseName: customerForm.querySelector('[name="spouse_name"]').value || '',
      spouseShirtSize: customerForm.querySelector('[name="spouse_shirt_size"]').value || '',
      // --- EDIT START: Add Spouse Height and Weight ---
      spouseHeight: customerForm.querySelector('[name="spouse_height"]').value || '',
      spouseWeight: customerForm.querySelector('[name="spouse_weight"]').value || null, // Send null if empty, backend expects integer
      // --- EDIT END ---
      additionalGuestName: customerForm.querySelector('[name="additional_guest_name"]').value || '',
      additionalGuestShirtSize: customerForm.querySelector('[name="additional_guest_shirt_size"]').value || '',
      specialRequirements: customerForm.querySelector('[name="special_requirements"]').value || ''
    };

    // --- Get Cart Items (Keep your existing cart logic) ---
    let cartItems = [];
    try {
      cartItems = window.getCartItems ? window.getCartItems() : []; // Use your function to get cart items
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new Error("Cart is empty or invalid.");
      }
      // Basic validation of cart items structure
      cartItems.forEach(item => {
        if (!item.id || !item.name || item.price === undefined || !item.quantity) {
          console.warn("Invalid item structure in cart:", item);
          // Decide if this is a critical error or if you can proceed
        }
      });
    } catch (error) {
      console.error("Error getting or validating cart items:", error);
      if (paymentError) paymentError.textContent = 'Error processing cart. Please refresh and try again.';
      checkoutButton.value = 'Place Order';
      checkoutButton.disabled = false;
      return;
    }
    // --- End Get Cart Items ---

    // --- Create Payment Intent ---
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems, // Send structured cart items
          customerData: customerData // Send collected customer data
        }),
      });

      const { clientSecret, error: backendError } = await response.json();

      if (backendError || !clientSecret) {
        throw new Error(backendError || 'Failed to create Payment Intent.');
      }

      // --- Confirm Card Payment ---
      if (!stripe || !cardElement) {
         throw new Error('Stripe.js or Card Element not initialized.');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerData.primaryName,
              email: customerData.email,
              phone: customerData.phone,
              address: customerData.address, // Pass the address object
            },
          },
          // Optional: Add receipt_email if not relying solely on Stripe customer object
          // receipt_email: customerData.email
        }
      );

      if (stripeError) {
        console.error('Stripe Error:', stripeError);
        // More specific error handling based on stripeError.type
        if (stripeError.type === 'card_error' || stripeError.type === 'validation_error') {
          if (paymentError) paymentError.textContent = stripeError.message || 'Payment failed. Please check your card details.';
        } else {
          if (paymentError) paymentError.textContent = 'An unexpected error occurred during payment.';
        }
        checkoutButton.value = 'Place Order';
        checkoutButton.disabled = false;
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded!');
        // Redirect to a success page
        window.location.href = '/order-confirmation'; // Adjust your success page URL
        // Optionally clear the cart here if needed
        // window.clearCartFunction();
      } else if (paymentIntent) {
         // Handle other statuses like 'requires_action' if necessary
         console.log('Payment Intent status:', paymentIntent.status);
         if (paymentError) paymentError.textContent = `Payment status: ${paymentIntent.status}. Please follow any additional instructions.`;
         checkoutButton.value = 'Place Order'; // Or update based on status
         checkoutButton.disabled = false; // Or manage based on status
      } else {
         // Handle unexpected scenarios where paymentIntent might be missing
         throw new Error('Payment confirmation did not return expected status.');
      }
      // --- End Confirm Card Payment ---

    } catch (error) {
      console.error('Error during checkout process:', error);
      if (paymentError) paymentError.textContent = error.message || 'An error occurred. Please try again.';
      checkoutButton.value = 'Place Order';
      checkoutButton.disabled = false;
    }
    // --- End Create Payment Intent ---
  });
}

function validateCustomerForm() {
  const customerForm = document.querySelector('.w-commerce-commercecheckoutcustomerinfowrapper');
  
  if (!customerForm) {
    console.error('Customer form not found');
    handlePaymentError('Form error: Could not find the customer information form.');
    return false;
  }
  
  // Check required fields
  const email = customerForm.querySelector('[name="email"]')?.value;
  const primaryName = customerForm.querySelector('[name="primary_name"]')?.value;
  const phone = customerForm.querySelector('[name="primary_phone"]')?.value;
  const shirtSize = customerForm.querySelector('[name="primary_shirt_size"]')?.value;
  const address = customerForm.querySelector('[name="address_line1"]')?.value;
  const city = customerForm.querySelector('[name="city"]')?.value;
  const state = customerForm.querySelector('[name="state"]')?.value;
  const zip = customerForm.querySelector('[name="zip"]')?.value;
  const country = customerForm.querySelector('[name="country"]')?.value;
  
  // Create an array to collect all error messages
  let errors = [];
  
  // Validate email
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Please enter a valid email address.');
  }
  
  // Validate name
  if (!primaryName || primaryName.trim().length < 3) {
    errors.push('Please enter your full name (first and last name).');
  }
  
  // Validate phone
  if (!phone || phone.replace(/[^0-9]/g, '').length < 10) {
    errors.push('Please enter a valid phone number with at least 10 digits.');
  }
  
  // Validate shirt size
  if (!shirtSize) {
    errors.push('Please select a shirt size.');
  }
  
  // Validate address
  if (!address || address.trim().length < 5) {
    errors.push('Please enter a valid street address.');
  }
  
  // Validate city
  if (!city || city.trim().length < 2) {
    errors.push('Please enter a valid city.');
  }
  
  // Validate state
  if (!state || state.trim().length < 2) {
    errors.push('Please enter a valid state/province.');
  }
  
  // Validate ZIP
  if (!zip || zip.trim().length < 5) {
    errors.push('Please enter a valid ZIP/postal code.');
  }
  
  // Validate country
  if (!country) {
    errors.push('Please select a country.');
  }
  
  // If there are errors, display them
  if (errors.length > 0) {
    handlePaymentError(errors.join('<br>'));
    return false;
  }
  
  return true;
}

function handlePaymentError(errorMessage) {
  console.error('Payment error:', errorMessage);
  
  // Display the error message to the user
  const errorElement = document.querySelector('.w-commerce-commercecheckouterrorstate');
  const errorMessageElement = document.querySelector('.w-checkout-error-msg');
  
  if (errorElement && errorMessageElement) {
    errorMessageElement.textContent = errorMessage;
    errorElement.style.display = 'flex';
    
    // Scroll to the error message
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    // Fallback to alert if the error element is not found
    alert('Error: ' + errorMessage);
  }
}

function showPaymentSuccessMessage(customerData, cart, total, orderId) {
  console.log('Payment successful:', orderId);
  console.log('Customer data:', customerData);
  console.log('Cart items:', cart);
  console.log('Total amount:', total);
  
  // Create success message UI
  const successDiv = document.createElement('div');
  successDiv.className = 'payment-success-message';
  successDiv.innerHTML = `
    <div class="payment-success-content">
      <h2>Thank You for Your Registration!</h2>
      <p>Your payment has been successfully processed.</p>
      <p>You will receive a confirmation email shortly with the details of your registration.</p>
      <p>Order Reference: ${orderId}</p>
      <div class="payment-success-buttons">
        <a href="index.html" class="btn">Return to Home</a>
      </div>
    </div>
  `;
  
  // Replace the checkout form with the success message
  const checkoutForm = document.querySelector('.w-commerce-commercecheckoutformcontainer');
  if (checkoutForm) {
    checkoutForm.innerHTML = '';
    checkoutForm.appendChild(successDiv);
    checkoutForm.style.padding = '40px';
    checkoutForm.style.textAlign = 'center';
  }
  
  // Clear the cart
  localStorage.removeItem('cart');
  
  // Update the cart display
  if (typeof updateCartDisplay === 'function') {
    updateCartDisplay();
  }
  
  // Add styles for the success message
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .payment-success-message {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      margin: 0 auto;
    }
    
    .payment-success-content {
      text-align: center;
    }
    
    .payment-success-content h2 {
      color: #00ae6b;
      margin-bottom: 20px;
      font-size: 24px;
    }
    
    .payment-success-content p {
      margin-bottom: 16px;
      color: #666;
      font-size: 16px;
      line-height: 1.5;
    }
    
    .payment-success-buttons {
      margin-top: 30px;
    }
    
    .payment-success-buttons .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #00ae6b;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      transition: background-color 0.3s ease;
    }
    
    .payment-success-buttons .btn:hover {
      background-color: #009a5f;
    }
  `;
  document.head.appendChild(styleSheet);
}

// In your cart display logic
const displayTotal = (cartTotalInCents / 100).toFixed(2);
document.getElementById('grand-total-display').textContent = `$${displayTotal}`; 