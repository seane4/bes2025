// Vercel API endpoint for sending confirmation emails
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get order details from Supabase
    const { data: orderDetails, error: orderError } = await supabase.rpc(
      'admin.get_order_details',
      { order_id_param: orderId }
    );

    if (orderError) {
      throw new Error(`Error fetching order details: ${orderError.message}`);
    }

    if (!orderDetails) {
      return res.status(404).json({ error: `Order not found: ${orderId}` });
    }

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Generate email content
    const htmlContent = generateConfirmationEmailHtml(
      orderDetails.order.order_id,
      orderDetails.customer.name,
      orderDetails.items,
      orderDetails.order.total
    );

    // Send the email
    await transporter.sendMail({
      from: `Banff Energy Summit <${process.env.EMAIL_FROM || 'no-reply@banffenergysummit.com'}>`,
      to: orderDetails.customer.email,
      subject: 'Your Banff Energy Summit 2025 Registration Confirmation',
      html: htmlContent,
    });

    // Log the email event in Supabase
    await supabase.from('email_logs').insert({
      order_id: orderId,
      recipient: orderDetails.customer.email,
      subject: 'Your Banff Energy Summit 2025 Registration Confirmation',
      status: 'sent',
    });

    return res.status(200).json({
      success: true,
      message: 'Confirmation email sent successfully',
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Generate HTML content for confirmation email
function generateConfirmationEmailHtml(orderId, customerName, items, totalAmount) {
  // Format items HTML
  let itemsHtml = '';
  let subtotal = 0;

  items.forEach((item) => {
    const itemPrice = parseFloat(item.total);
    subtotal += itemPrice;

    itemsHtml += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.item_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${itemPrice.toFixed(2)}</td>
      </tr>
    `;
  });

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
              <td style="padding: 10px; text-align: right;">$${totalAmount.toFixed(2)}</td>
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
        
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://banffenergysummit.com'}/my-registration" class="btn">View Your Registration</a>
      </div>
      <div class="footer">
        <p>&copy; 2025 Banff Energy Summit. All rights reserved.</p>
        <p>This email was sent to you because you registered for the Banff Energy Summit 2025.</p>
      </div>
    </body>
    </html>
  `;
} 