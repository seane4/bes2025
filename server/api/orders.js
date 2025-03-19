/**
 * Banff Energy Summit 2025 - Orders API
 * 
 * This file contains the backend API endpoints for handling orders,
 * storing data in the database, and processing payments.
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for some hosting providers
  }
});

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Create Payment Intent endpoint
 * Creates a new payment intent with Stripe
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { cart, customerData } = req.body;
    
    // Calculate amount based on cart items
    let subtotal = 0;
    cart.forEach(item => {
      if (item.type === 'activity') {
        subtotal += parseFloat(item.price);
      } else {
        subtotal += parseFloat(item.total);
      }
    });
    
    const taxRate = 0.05; // 5% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    // Create a new payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // amount in cents, rounded to avoid floating point issues
      currency: 'usd',
      metadata: {
        customer_email: customerData.email,
        customer_name: customerData.primaryName
      }
    });
    
    // Return the client secret to the client
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Save Order endpoint
 * Stores the order details in the database
 */
router.post('/save-order', async (req, res) => {
  const client = await pool.connect();
  try {
    const { orderId, customerInfo, items, paymentDetails, status } = req.body;
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Insert customer information
    const customerQuery = `
      INSERT INTO customers (
        email, primary_name, phone, address_line1, address_line2, 
        city, state, postal_code, country, shirt_size,
        spouse_name, spouse_shirt_size, additional_guest_name, 
        additional_guest_shirt_size, special_requirements
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
    `;
    
    const customerValues = [
      customerInfo.email,
      customerInfo.primaryName,
      customerInfo.phone,
      customerInfo.address.line1,
      customerInfo.address.line2 || '',
      customerInfo.address.city,
      customerInfo.address.state,
      customerInfo.address.postal_code,
      customerInfo.address.country,
      customerInfo.shirtSize,
      customerInfo.spouseName || '',
      customerInfo.spouseShirtSize || '',
      customerInfo.additionalGuestName || '',
      customerInfo.additionalGuestShirtSize || '',
      customerInfo.specialRequirements || ''
    ];
    
    const customerResult = await client.query(customerQuery, customerValues);
    const customerId = customerResult.rows[0].id;
    
    // Insert order
    const orderQuery = `
      INSERT INTO orders (
        order_id, customer_id, subtotal, tax, total,
        payment_method, transaction_id, order_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const orderValues = [
      orderId,
      customerId,
      paymentDetails.subtotal,
      paymentDetails.tax,
      paymentDetails.total,
      paymentDetails.paymentMethod,
      paymentDetails.transactionId,
      new Date().toISOString(),
      status
    ];
    
    const orderResult = await client.query(orderQuery, orderValues);
    const orderDbId = orderResult.rows[0].id;
    
    // Insert order items
    for (const item of items) {
      const itemQuery = `
        INSERT INTO order_items (
          order_id, item_type, item_id, item_name, 
          quantity, price, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      const itemValues = [
        orderDbId,
        item.type,
        item.id,
        item.name,
        item.quantity || 1,
        item.price,
        item.total || item.price
      ];
      
      await client.query(itemQuery, itemValues);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Return success response
    res.json({
      success: true,
      orderId: orderId,
      message: 'Order successfully saved to database'
    });
  } catch (error) {
    // Rollback transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error saving order to database:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

/**
 * Get Order endpoint
 * Retrieves order details from the database
 */
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Query to get order with customer and items
    const orderQuery = `
      SELECT 
        o.id, o.order_id, o.subtotal, o.tax, o.total, 
        o.payment_method, o.transaction_id, o.order_date, o.status,
        c.email, c.primary_name, c.phone, c.address_line1, c.address_line2,
        c.city, c.state, c.postal_code, c.country, c.shirt_size,
        c.spouse_name, c.spouse_shirt_size, c.additional_guest_name,
        c.additional_guest_shirt_size, c.special_requirements
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.order_id = $1
    `;
    
    const orderResult = await pool.query(orderQuery, [orderId]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    // Get order items
    const itemsQuery = `
      SELECT 
        item_type, item_id, item_name, quantity, price, total
      FROM order_items
      WHERE order_id = $1
    `;
    
    const itemsResult = await pool.query(itemsQuery, [order.id]);
    const items = itemsResult.rows;
    
    // Format response
    const response = {
      orderId: order.order_id,
      customerInfo: {
        email: order.email,
        primaryName: order.primary_name,
        phone: order.phone,
        address: {
          line1: order.address_line1,
          line2: order.address_line2,
          city: order.city,
          state: order.state,
          postal_code: order.postal_code,
          country: order.country
        },
        shirtSize: order.shirt_size,
        spouseName: order.spouse_name,
        spouseShirtSize: order.spouse_shirt_size,
        additionalGuestName: order.additional_guest_name,
        additionalGuestShirtSize: order.additional_guest_shirt_size,
        specialRequirements: order.special_requirements
      },
      paymentDetails: {
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        paymentMethod: order.payment_method,
        transactionId: order.transaction_id
      },
      orderDate: order.order_date,
      status: order.status,
      items: items
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error retrieving order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send Order Confirmation Email endpoint
 * Sends a confirmation email to the customer
 */
router.post('/send-confirmation', async (req, res) => {
  try {
    const { to, subject, orderId, customerName, items, totalAmount } = req.body;
    
    // Create HTML email content
    const htmlContent = generateConfirmationEmailHtml(orderId, customerName, items, totalAmount);
    
    // Send email
    const info = await transporter.sendMail({
      from: `"Banff Energy Summit" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: subject,
      html: htmlContent
    });
    
    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Confirmation email sent successfully'
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate HTML content for confirmation email
 */
function generateConfirmationEmailHtml(orderId, customerName, items, totalAmount) {
  // Format items HTML
  let itemsHtml = '';
  items.forEach(item => {
    itemsHtml += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${(item.type === 'activity' ? parseFloat(item.price) : parseFloat(item.total)).toFixed(2)}</td>
      </tr>
    `;
  });
  
  // Calculate subtotal and tax
  const subtotal = items.reduce((total, item) => {
    if (item.type === 'activity') {
      return total + parseFloat(item.price);
    } else {
      return total + parseFloat(item.total);
    }
  }, 0);
  
  const taxRate = 0.05;
  const tax = subtotal * taxRate;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Banff Energy Summit 2025 Registration Confirmation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          background-color: #00ae6b;
          color: white;
          padding: 20px;
          text-align: center;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #f5f5f5;
          padding: 10px;
          text-align: left;
          border-bottom: 2px solid #e0e0e0;
        }
        .total-row {
          font-weight: bold;
          background-color: #f9f9f9;
        }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background-color: #00ae6b;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Registration Confirmation</h1>
      </div>
      <div class="content">
        <h2>Thank You for Your Registration!</h2>
        <p>Hello ${customerName},</p>
        <p>We're excited to confirm your registration for the Banff Energy Summit 2025. We look forward to seeing you at this exclusive event!</p>
        
        <h3>Order Details</h3>
        <p><strong>Order Reference:</strong> ${orderId}</p>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>Subtotal</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>Tax (5%)</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${tax.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td style="padding: 10px;"><strong>Total</strong></td>
              <td style="padding: 10px; text-align: right;">$${(subtotal + tax).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <h3>What's Next?</h3>
        <p>Here's what you can expect:</p>
        <ul>
          <li>You'll receive a detailed itinerary closer to the event date.</li>
          <li>Make sure to check our website for any updates or additional information.</li>
          <li>If you have any questions or special requests, please don't hesitate to contact us.</li>
        </ul>
        
        <p>For any inquiries, please contact our team at <a href="mailto:support@banffenergysummit.com">support@banffenergysummit.com</a>.</p>
        
        <a href="https://banffenergysummit.com/my-registration" class="btn">View Your Registration</a>
      </div>
      <div class="footer">
        <p>&copy; 2025 Banff Energy Summit. All rights reserved.</p>
        <p>This email was sent to you because you registered for the Banff Energy Summit 2025.</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = router; 