import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function CheckoutForm({ items, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [customerData, setCustomerData] = useState({
    email: '',
    primaryName: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
    shirtSize: '',
    primaryHeight: '',
    primaryWeight: '',
    spouseName: '',
    spouseShirtSize: '',
    spouseHeight: '',
    spouseWeight: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // 1. Create PaymentIntent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerData
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create payment intent');
      }

      const { clientSecret, amount } = await response.json();

      // 2. Confirm Payment
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-confirmation`,
          payment_method_data: {
            billing_details: {
              name: customerData.primaryName,
              email: customerData.email,
              phone: customerData.phone,
              address: customerData.address,
            },
          },
        },
        redirect: 'if_required',
      });

      if (submitError) {
        throw new Error(submitError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess?.(paymentIntent);
      }

    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomerDataChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCustomerData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCustomerData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Customer Information */}
      <div className="customer-info">
        <h3>Customer Information</h3>
        
        {/* Primary Contact */}
        <div className="form-group">
          <input
            type="email"
            name="email"
            value={customerData.email}
            onChange={handleCustomerDataChange}
            placeholder="Email"
            required
          />
          <input
            type="text"
            name="primaryName"
            value={customerData.primaryName}
            onChange={handleCustomerDataChange}
            placeholder="Full Name"
            required
          />
          <input
            type="tel"
            name="phone"
            value={customerData.phone}
            onChange={handleCustomerDataChange}
            placeholder="Phone"
            required
          />
        </div>

        {/* Address */}
        <div className="form-group">
          <input
            type="text"
            name="address.line1"
            value={customerData.address.line1}
            onChange={handleCustomerDataChange}
            placeholder="Street Address"
            required
          />
          <input
            type="text"
            name="address.city"
            value={customerData.address.city}
            onChange={handleCustomerDataChange}
            placeholder="City"
            required
          />
          <input
            type="text"
            name="address.state"
            value={customerData.address.state}
            onChange={handleCustomerDataChange}
            placeholder="State"
            required
          />
          <input
            type="text"
            name="address.postal_code"
            value={customerData.address.postal_code}
            onChange={handleCustomerDataChange}
            placeholder="ZIP/Postal Code"
            required
          />
        </div>

        {/* Additional Details */}
        <div className="form-group">
          <select
            name="shirtSize"
            value={customerData.shirtSize}
            onChange={handleCustomerDataChange}
            required
          >
            <option value="">Select Shirt Size</option>
            <option value="S">Small</option>
            <option value="M">Medium</option>
            <option value="L">Large</option>
            <option value="XL">X-Large</option>
            <option value="2XL">2X-Large</option>
          </select>
          <input
            type="text"
            name="primaryHeight"
            value={customerData.primaryHeight}
            onChange={handleCustomerDataChange}
            placeholder="Height"
          />
          <input
            type="number"
            name="primaryWeight"
            value={customerData.primaryWeight}
            onChange={handleCustomerDataChange}
            placeholder="Weight"
          />
        </div>

        {/* Spouse Information (if needed) */}
        <div className="form-group">
          <input
            type="text"
            name="spouseName"
            value={customerData.spouseName}
            onChange={handleCustomerDataChange}
            placeholder="Spouse Name (if applicable)"
          />
          <select
            name="spouseShirtSize"
            value={customerData.spouseShirtSize}
            onChange={handleCustomerDataChange}
          >
            <option value="">Spouse Shirt Size</option>
            <option value="S">Small</option>
            <option value="M">Medium</option>
            <option value="L">Large</option>
            <option value="XL">X-Large</option>
            <option value="2XL">2X-Large</option>
          </select>
          <input
            type="text"
            name="spouseHeight"
            value={customerData.spouseHeight}
            onChange={handleCustomerDataChange}
            placeholder="Spouse Height"
          />
          <input
            type="number"
            name="spouseWeight"
            value={customerData.spouseWeight}
            onChange={handleCustomerDataChange}
            placeholder="Spouse Weight"
          />
        </div>
      </div>

      {/* Payment Element */}
      <div className="payment-element">
        <PaymentElement />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={isProcessing || !stripe || !elements}
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
} 