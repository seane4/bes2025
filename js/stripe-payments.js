// Stripe Payments Integration for Banff Energy Summit 2025

/**
 * Shows or hides a loading indicator overlay.
 * @param {boolean} isLoading - True to show the loading indicator, false to hide it.
 */
function showLoading(isLoading) {
  const overlay = document.getElementById('loading-overlay'); // Make sure this element exists in your HTML

  if (!overlay) {
    console.warn('Loading overlay element (#loading-overlay) not found.');
    return; // Exit if the overlay element doesn't exist
  }

  if (isLoading) {
    console.log('Showing loading indicator...');
    overlay.style.display = 'flex'; // Or 'block', depending on your CSS
  } else {
    console.log('Hiding loading indicator...');
    overlay.style.display = 'none';
  }
}

// --- ADD THIS LOG ---
console.log('showLoading function defined:', typeof showLoading);
// --- END ADD LOG ---

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Stripe elements once the DOM is loaded
  if (window.location.pathname.includes('checkout.html')) {
    // Wait for env-config.js to load and set window.ENV
    const checkEnvConfig = setInterval(() => {
      // Check for the nested ENV object and the specific key
      if (window.ENV && window.ENV.STRIPE && window.ENV.STRIPE.PUBLISHABLE_KEY && window.ENV.SUPABASE && window.ENV.SUPABASE.URL) {
        clearInterval(checkEnvConfig);
        initializeStripeElements();
        initializeSupabase(); // Initialize Supabase after config is ready

        // --- EDIT: Call setupCheckoutFormSubmission AFTER initialization ---
        setupCheckoutFormSubmission();
        // --- END EDIT ---

      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkEnvConfig);
      // Update the check here as well
      if (!window.ENV || !window.ENV.STRIPE || !window.ENV.STRIPE.PUBLISHABLE_KEY || !window.ENV.SUPABASE || !window.ENV.SUPABASE.URL) {
        console.error('Failed to load Stripe publishable key or Supabase URL from ENV config');
        // Optionally display user-facing error
        showError('Payment system configuration error. Please try again later or contact support.');
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

// --- Make sure Supabase client is declared in a scope accessible by saveOrderToSupabase ---
let supabaseClient = null;

function initializeSupabase() {
  console.log('Initializing Supabase client...');
  if (!window.ENV || !window.ENV.SUPABASE || !window.ENV.SUPABASE.URL || !window.ENV.SUPABASE.ANON_KEY) {
    console.error('Supabase URL or Anon Key not found in ENV config.');
    showError('System configuration error. Please contact support.'); // Use your error display function
    return;
  }
  try {
    // Use createClient from the Supabase library (ensure it's loaded via CDN or npm)
    supabaseClient = supabase.createClient(window.ENV.SUPABASE.URL, window.ENV.SUPABASE.ANON_KEY);
    console.log('Supabase client initialized successfully.');
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    showError('Failed to connect to database services. Please try again later.');
  }
}

function initializeStripeElements() {
  console.log('Initializing Stripe elements...');
  
  // Use the ENV object for Stripe config
  if (!window.ENV || !window.ENV.STRIPE || !window.ENV.STRIPE.PUBLISHABLE_KEY) {
    console.error('Stripe publishable key not found in ENV config');
    // Optionally display user-facing error
    showError('Payment system configuration error. Please try again later or contact support.');
    return;
  }
  
  try {
    // Initialize Stripe with the publishable key from window.ENV
    stripe = Stripe(window.ENV.STRIPE.PUBLISHABLE_KEY);
    
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

/**
 * Validates the customer details form fields.
 * @returns {boolean} True if the form is valid, false otherwise.
 */
function validateForm() {
  console.log('Validating form...');
  let isValid = true;
  let firstErrorMessage = null;

  // --- Helper to check a field and show error ---
  function checkField(id, fieldName) {
    const field = document.getElementById(id);
    if (!field) {
      console.error(`Validation Error: Element with ID "${id}" not found.`);
      // Decide if this is critical enough to stop validation
      // isValid = false;
      // if (!firstErrorMessage) firstErrorMessage = `Configuration error: Missing form field "${fieldName}".`;
      return; // Skip check if element doesn't exist
    }

    const value = field.value.trim();
    if (!value) {
      isValid = false;
      const errorMsg = `${fieldName} is required.`;
      // Optionally display error near the field (implementation depends on your HTML structure)
      // showFieldError(field, errorMsg);
      if (!firstErrorMessage) firstErrorMessage = errorMsg; // Store the first error found
      console.warn(`Validation failed: ${fieldName} is empty (ID: ${id})`);
    } else {
      // Optionally clear error near the field
      // clearFieldError(field);
    }
  }

  // --- Add checks for all your required fields ---
  // ** IMPORTANT: Update these IDs to match your checkout.html form inputs **
  checkField('billing-name', 'Billing Name'); // Example ID
  checkField('billing-email', 'Email');       // Example ID
  checkField('billing-address', 'Address');   // Example ID
  checkField('billing-city', 'City');         // Example ID
  checkField('billing-state', 'State');       // Example ID
  checkField('billing-zip', 'ZIP Code');      // Example ID
  checkField('billing-country', 'Country');   // Example ID
  checkField('phone', 'Phone');             // Example ID (if you have phone)
  // Add checks for other fields like shirt size, spouse info if they are required

  // --- Check Stripe Elements (Card details are validated by Stripe itself, but check mount points) ---
  // Basic check: Ensure Stripe elements are mounted (more complex validation happens via Stripe)
  if (!window.stripeElements || !window.stripeElements.number || !window.stripeElements.expiry || !window.stripeElements.cvc) {
      isValid = false;
      const errorMsg = 'Payment card details are incomplete or not loaded correctly.';
      if (!firstErrorMessage) firstErrorMessage = errorMsg;
      console.error('Validation failed: Stripe elements not properly initialized/mounted.');
  }


  if (!isValid && firstErrorMessage) {
    console.error('Form validation failed:', firstErrorMessage);
    // Use your existing error display function
    handlePaymentError(firstErrorMessage); // Display the first error found to the user
  } else if (isValid) {
     console.log('Form validation passed.');
     // Optionally clear any general form error message displayed by handlePaymentError
     clearGeneralError(); // You might need to create this function
  }

  return isValid;
}

// Optional helper function to clear general errors (if handlePaymentError shows them in one place)
function clearGeneralError() {
    const errorDiv = document.getElementById('payment-error'); // Use the ID of your general error display area
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
}

// --- Function to save order details to Supabase ---
async function saveOrderToSupabase(paymentIntent, customerData, cartItems) {
    console.log('Attempting to save order to Supabase...');
    if (!supabaseClient) {
        console.error('Supabase client not initialized. Cannot save order.');
        // Optionally inform the user, though payment succeeded. This is more for backend logging.
        // You might want to queue this for retry or log it server-side via another mechanism.
        return { error: new Error('Supabase client not available.') };
    }
    if (!paymentIntent || !customerData || !cartItems) {
         console.error('Missing data required to save order to Supabase.');
         return { error: new Error('Missing data for Supabase save.') };
    }

    try {
        // ** Adjust column names to match your 'orders' table schema **
        const orderData = {
            customer_name: customerData.name,
            customer_email: customerData.email,
            amount: paymentIntent.amount, // Amount is already in cents from PaymentIntent
            currency: paymentIntent.currency,
            stripe_payment_intent_id: paymentIntent.id, // Store the PI ID
            status: paymentIntent.status, // Should be 'succeeded' here
            items: cartItems, // Store the cart items as JSONB
            // Add address details if your table has columns for them
            billing_address_line1: customerData.address?.line1,
            billing_address_city: customerData.address?.city,
            billing_address_state: customerData.address?.state,
            billing_address_postal_code: customerData.address?.postal_code,
            billing_address_country: customerData.address?.country,
            // If using Supabase Auth, you might want to link the user ID
            // user_id: (await supabaseClient.auth.getUser()).data.user?.id || null,
        };

        console.log('Order data prepared for Supabase:', orderData);

        const { data, error } = await supabaseClient
            .from('orders') // Your table name
            .insert([orderData])
            .select(); // Optionally select the inserted row back

        if (error) {
            console.error('Error saving order to Supabase:', error);
            // Decide how critical this is. Payment succeeded, but DB save failed.
            // Log this error for investigation. Maybe show a modified success message?
            // Example: "Payment successful, but there was an issue saving your order details. Please contact support with ID: ..."
            return { error }; // Return the error object
        }

        console.log('Order successfully saved to Supabase:', data);
        return { data }; // Return the inserted data

    } catch (error) {
        console.error('Unexpected error during Supabase save:', error);
        return { error };
    }
}

function setupCheckoutFormSubmission() {
  console.log('Setting up checkout form submission...'); // Added log

  // --- EDIT: Add individual checks for elements ---
  const checkoutForm = document.getElementById('checkout-form'); // Use your actual form ID
  const customerForm = document.getElementById('customer-details-form'); // Use your actual customer details form ID
  const paymentForm = document.getElementById('payment-form'); // Use your actual payment form ID (might be the same as checkout-form)
  const checkoutButton = document.querySelector('.w-commerce-commercecheckoutplaceorderbutton'); // Use your actual button selector

  let formToSubmit = checkoutForm || paymentForm; // Determine which form contains the button/triggers submission

  // Log found elements for debugging
  console.log('Checkout Form:', checkoutForm);
  console.log('Customer Form:', customerForm);
  console.log('Payment Form:', paymentForm);
  console.log('Checkout Button:', checkoutButton);
  console.log('Form to Submit:', formToSubmit);


  // Check if essential elements exist
  if (!formToSubmit) {
      console.error('setupCheckoutFormSubmission Error: Could not find the main form element (tried #checkout-form or #payment-form).');
      showError('Checkout form element not found. Please contact support.'); // User-facing error
      return; // Stop if the main form is missing
  }
  if (!checkoutButton) {
      console.error('setupCheckoutFormSubmission Error: Could not find the checkout button element (tried .w-commerce-commercecheckoutplaceorderbutton).');
      showError('Checkout button not found. Please contact support.'); // User-facing error
      return; // Stop if the button is missing
  }
  // You might not need separate customer/payment forms if it's all one form. Adjust checks as needed.
  // if (!customerForm) {
  //     console.warn('setupCheckoutFormSubmission Warning: Customer form element (#customer-details-form) not found.');
  // }

  // --- END EDIT ---


  // Add event listener to the form that contains the submit button
  formToSubmit.addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent default form submission
    console.log('Checkout form submitted.'); // Log submission attempt

    // --- ADD THIS LOG ---
    console.log('Checking showLoading right before call:', typeof showLoading);
    // --- END ADD LOG ---

    // Disable button to prevent multiple clicks
    checkoutButton.disabled = true;
    checkoutButton.value = 'Processing...'; // Update button text

    // Show loading indicator (optional)
    showLoading(true);

    // 1. Validate form fields
    if (!validateForm()) {
      checkoutButton.disabled = false;
      checkoutButton.value = 'Place Order'; // Reset button text
      showLoading(false);
      return; // Stop if validation fails
    }
    console.log('Form validation passed.');

    // 2. Collect customer data (ensure IDs match your HTML)
    const customerData = {
      name: document.getElementById('customer-name')?.value || '', // Example ID
      email: document.getElementById('customer-email')?.value || '', // Example ID
      phone: document.getElementById('customer-phone')?.value || '', // Example ID
      // Add all other relevant fields: address, city, state, zip, country, shirtSize, etc.
      address: document.getElementById('customer-address')?.value || '',
      city: document.getElementById('customer-city')?.value || '',
      state: document.getElementById('customer-state')?.value || '',
      zip: document.getElementById('customer-zip')?.value || '',
      country: document.getElementById('customer-country')?.value || '',
      shirtSize: document.getElementById('shirt-size')?.value || '', // Example ID
      // Add spouse/guest fields if applicable
      spouseName: document.getElementById('spouse-name')?.value || '',
      spouseShirtSize: document.getElementById('spouse-shirt-size')?.value || '',
      // Add height/weight if applicable
      height: document.getElementById('customer-height')?.value || '',
      weight: document.getElementById('customer-weight')?.value || '',
      spouseHeight: document.getElementById('spouse-height')?.value || '',
      spouseWeight: document.getElementById('spouse-weight')?.value || '',
    };
    console.log('Collected customer data:', customerData);


    // 3. Get cart items from localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
      handlePaymentError('Your cart is empty.');
      checkoutButton.disabled = false;
      checkoutButton.value = 'Place Order';
      showLoading(false);
      return;
    }
    console.log('Cart items:', cart);

    // 4. Create Payment Intent on the backend
    try {
      console.log('Creating Payment Intent...');

      // --- EDIT: Use environment config for the API endpoint ---
      if (!window.ENV || !window.ENV.STRIPE || !window.ENV.STRIPE.ENDPOINTS || !window.ENV.STRIPE.ENDPOINTS.CREATE_PAYMENT_INTENT) {
          throw new Error('Create Payment Intent endpoint configuration is missing.');
      }
      const createPaymentIntentUrl = window.ENV.STRIPE.ENDPOINTS.CREATE_PAYMENT_INTENT;
      console.log(`Fetching from endpoint: ${createPaymentIntentUrl}`); // Log the URL being used
      // --- END EDIT ---

      const response = await fetch(createPaymentIntentUrl, { // Use the variable here
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart: cart, customerData: customerData }), // Send cartItems (ensure variable name consistency) and customer data
      });

      // --- EDIT: Improved error handling for non-JSON responses ---
      if (!response.ok) {
          const errorText = await response.text(); // Get raw text response
          console.error('Server response (non-JSON):', errorText);
          // Try to parse as JSON, but fallback to text if it fails
          let errorJson = {};
          try { errorJson = JSON.parse(errorText); } catch (e) { /* ignore parsing error */ }
          throw new Error(errorJson.error || `Server error ${response.status}: ${errorText.substring(0, 200)}`); // Show beginning of text error if no JSON error message
      }
      // --- END EDIT ---

      const paymentIntentData = await response.json(); // Now we expect JSON if response.ok

      // Original check remains useful if server sends { "error": "..." } with status 200
      if (paymentIntentData.error) {
        throw new Error(paymentIntentData.error);
      }
      // --- End Original Check ---

      const clientSecret = paymentIntentData.clientSecret;
      console.log('Payment Intent created successfully. Client Secret obtained.');

      // 5. Confirm Card Payment with Stripe.js
      console.log('Confirming card payment...');
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: window.stripeElements.number, // Use the mounted card number element
            billing_details: {
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone,
              address: {
                line1: customerData.address,
                city: customerData.city,
                state: customerData.state,
                postal_code: customerData.zip,
                country: customerData.country, // Use ISO 2-letter country code if possible
              },
            },
          },
        }
      );

      if (stripeError) {
        // Show error to your customer (e.g., insufficient funds, card declined)
        console.error('Stripe card confirmation error:', stripeError);
        handlePaymentError(stripeError.message);
        checkoutButton.disabled = false;
        checkoutButton.value = 'Place Order';
        showLoading(false);
      } else {
        // Payment succeeded
        console.log('PaymentIntent details:', paymentIntent);
        if (paymentIntent.status === 'succeeded') {
          console.log('Payment succeeded!');

          // --- EDIT: Save to Supabase AFTER successful payment ---
          const { error: supabaseSaveError } = await saveOrderToSupabase(paymentIntent, customerData, cart);
          if (supabaseSaveError) {
            // Logged within the function. Decide if user needs specific feedback.
            console.warn("Payment was successful, but saving order details failed.");
            // You could potentially show a slightly different success message here
            // or add a note to contact support if issues arise.
          }
          // --- END EDIT ---

          // Proceed with showing success message and clearing cart regardless of DB save status (payment is done)
          showPaymentSuccessMessage(customerData, cart, paymentIntent.amount, paymentIntent.id);
          // No need to re-enable button or hide loading on success path

        } else {
           console.warn('Payment status:', paymentIntent.status);
           handlePaymentError(`Payment status: ${paymentIntent.status}. Please contact support.`);
           checkoutButton.disabled = false;
           checkoutButton.value = 'Place Order';
           showLoading(false);
        }
      }
    } catch (error) {
      console.error('Error during payment process:', error);
      handlePaymentError(error.message || 'An unexpected error occurred. Please try again.');
      checkoutButton.disabled = false;
      checkoutButton.value = 'Place Order';
      showLoading(false);
    }
  });

  console.log('Checkout form submission handler attached.'); // Added log
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