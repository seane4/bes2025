import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

// Initialize Stripe (use your actual publishable key)
const stripePromise = loadStripe('your_publishable_key');

export default function CheckoutPage() {
  // Get cart items from your state management solution
  // This could be localStorage, a global state manager, etc.
  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  
  const handlePaymentSuccess = (paymentIntent) => {
    // Clear cart
    localStorage.removeItem('cartItems');
    // Redirect to success page
    window.location.href = `/payment-confirmation?payment_intent=${paymentIntent.id}&payment_intent_status=${paymentIntent.status}`;
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      
      {/* Order Summary */}
      <div className="order-summary">
        <h3>Order Summary</h3>
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <span>{item.name}</span>
              <span>{item.quantity}x</span>
              <span>${(item.price_cents / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="cart-total">
          <strong>Total: </strong>
          <span>
            ${(cartItems.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0) / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Stripe Elements */}
      <Elements stripe={stripePromise}>
        <CheckoutForm 
          items={cartItems}
          onSuccess={handlePaymentSuccess}
        />
      </Elements>
    </div>
  );
} 