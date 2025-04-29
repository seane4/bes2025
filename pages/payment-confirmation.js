export default function PaymentConfirmation() {
  // Get the payment intent status from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const paymentIntentStatus = urlParams.get('payment_intent_status');
  const paymentIntentId = urlParams.get('payment_intent');

  return (
    <div className="payment-confirmation">
      {paymentIntentStatus === 'succeeded' ? (
        <div className="success">
          <h1>Payment Successful!</h1>
          <p>Thank you for your purchase. Your order has been confirmed.</p>
          <p>Order Reference: {paymentIntentId}</p>
          <a href="/" className="button">Return to Home</a>
        </div>
      ) : (
        <div className="error">
          <h1>Payment Failed</h1>
          <p>Sorry, there was a problem processing your payment.</p>
          <p>Please try again or contact support if the problem persists.</p>
          <a href="/checkout" className="button">Return to Checkout</a>
        </div>
      )}
    </div>
  );
} 