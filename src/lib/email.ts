import nodemailer from 'nodemailer';

// Create Gmail transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Welcome email template
export const createWelcomeEmailTemplate = (userData: {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}) => {
  return {
    from: `"Guangzhou Swift Logistics" <info@guangzhouswiftlogistics.com>`,
    to: userData.email,
    subject: `Welcome to Guangzhou Swift Logistics, ${userData.firstName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Guangzhou Swift Logistics</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #055b8e;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #055b8e;
            margin-bottom: 10px;
          }
          .tagline {
            color: #666;
            font-size: 16px;
          }
          .welcome-message {
            font-size: 24px;
            color: #055b8e;
            margin-bottom: 20px;
            text-align: center;
          }
          .content {
            margin-bottom: 30px;
          }
          .highlight {
            background-color: #f0f8ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #055b8e;
            margin: 20px 0;
          }
          .cta-button {
            display: inline-block;
            background-color: #055b8e;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            transition: background-color 0.3s;
          }
          .cta-button:hover {
            background-color: #044a73;
          }
          .features {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .feature-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
          }
          .feature-icon {
            color: #055b8e;
            margin-right: 10px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .contact-info {
            background-color: #f0f8ff;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🚚 Guangzhou Swift Logistics</div>
            <div class="tagline">Your Trusted Logistics Partner</div>
          </div>

          <div class="welcome-message">
            Welcome aboard, ${userData.firstName}! 🎉
          </div>

          <div class="content">
            <p>Dear ${userData.firstName} ${userData.lastName},</p>
            
            <p>Thank you for choosing Nivamore Courier Services! We're thrilled to have you as part of our growing community of satisfied customers.</p>

            <div class="highlight">
              <h3 style="color: #055b8e; margin-top: 0;">Your Account Details:</h3>
              <p><strong>Username:</strong> ${userData.username}</p>
              <p><strong>Email:</strong> ${userData.email}</p>
              <p><strong>Account Status:</strong> Active ✅</p>
            </div>

            <p>You can now access all our premium services and features:</p>

            <div class="features">
              <h3 style="color: #055b8e; margin-top: 0;">What you can do now:</h3>
              <div class="feature-item">
                <span class="feature-icon">📦</span>
                <span>Submit and track your shipments in real-time</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🗺️</span>
                <span>View detailed shipment routes and progress</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📱</span>
                <span>Receive instant notifications and updates</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">💬</span>
                <span>Get 24/7 customer support assistance</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <span>Access your shipment history and analytics</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/member-login" class="cta-button">
                Login to Your Dashboard
              </a>
            </div>

            <div class="contact-info">
              <h3 style="color: #055b8e; margin-top: 0;">Need Help?</h3>
              <p>Our support team is here to assist you:</p>
              <p><strong>📧 Email:</strong> guangzhouswiftlogistic@gmail.com</p>
              <p><strong>📞 Phone:</strong> +86 132 605 43058 / +233 248 84 0661</p>
              <p><strong>🕒 Hours:</strong> Monday - Friday: 9:00 AM - 6:00 PM (GST)</p>
            </div>

            <p>We're committed to providing you with the best courier and logistics services. If you have any questions or need assistance, don't hesitate to reach out to us.</p>

            <p>Thank you for trusting us with your shipping needs!</p>

            <p>Best regards,<br>
            <strong>The Guangzhou Swift Logistics Team</strong></p>
          </div>

          <div class="footer">
            <p>© 2024 Guangzhou Swift Logistics. All rights reserved.</p>
            <p>This email was sent to ${userData.email}. If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Guangzhou Swift Logistics, ${userData.firstName}!

      Dear ${userData.firstName} ${userData.lastName},

      Thank you for choosing Guangzhou Swift Logistics! We're thrilled to have you as part of our growing community of satisfied customers.

      Your Account Details:
      - Username: ${userData.username}
      - Email: ${userData.email}
      - Account Status: Active ✅

      What you can do now:
      📦 Submit and track your shipments in real-time
      🗺️ View detailed shipment routes and progress
      📱 Receive instant notifications and updates
      💬 Get 24/7 customer support assistance
      📊 Access your shipment history and analytics

      Login to your dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/member-login

      Need Help?
      📧 Email: info@guangzhouswiftlogistics.com
      📞 Phone: +86 132 605 43058 / +233 248 84 0661
      🕒 Hours: Monday - Friday: 9:00 AM - 6:00 PM (GST)

      We're committed to providing you with the best courier and logistics services. If you have any questions or need assistance, don't hesitate to reach out to us.

      Thank you for trusting us with your shipping needs!

      Best regards,
      The Guangzhou Swift Logistics Team

      © 2024 Guangzhou Swift Logistics. All rights reserved.
      This email was sent to ${userData.email}. If you didn't create an account, please ignore this email.
    `
  };
};

// Send welcome email using Gmail SMTP
export const sendWelcomeEmail = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}) => {
  try {
    const transporter = createTransporter();
    const mailOptions = createWelcomeEmailTemplate(userData);
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test email configuration with Gmail SMTP
export const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Gmail SMTP connection verified successfully');
    return { success: true };
  } catch (error) {
    console.error('Gmail SMTP connection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
