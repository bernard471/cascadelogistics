# 📧 EMAILJS WELCOME EMAIL TEMPLATE

## 🎯 **Professional Welcome Email for Nivamore Courier Services**

Based on your sample HTML, here's a customized template for your courier service:

---

## 🎨 **HTML TEMPLATE:**

```html
<div style="font-family: system-ui, sans-serif, Arial; font-size: 16px; background-color: #f8fafc">
  <div style="max-width: 600px; margin: auto; padding: 20px">
    <!-- Header with Logo -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #055b8e">
      <a style="text-decoration: none; outline: none" href="{{login_url}}" target="_blank">
        <div style="font-size: 28px; font-weight: bold; color: #055b8e; margin-bottom: 8px">
          🚚 Nivamore Courier Services
        </div>
        <div style="color: #666; font-size: 16px">Your Trusted Logistics Partner</div>
      </a>
    </div>

    <!-- Welcome Message -->
    <div style="text-align: center; margin-bottom: 30px">
      <h1 style="color: #055b8e; font-size: 24px; margin-bottom: 16px">
        Welcome aboard, {{first_name}}! 🎉
      </h1>
      <p style="font-size: 18px; color: #333; margin-bottom: 20px">
        Thank you for choosing Nivamore Courier Services! We're excited to have you as part of our growing community of satisfied customers.
      </p>
    </div>

    <!-- Account Details -->
    <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #055b8e; margin-bottom: 30px">
      <h3 style="color: #055b8e; margin-top: 0; margin-bottom: 16px">Your Account Details:</h3>
      <p style="margin: 8px 0; color: #333">
        <strong>Username:</strong> {{username}}
      </p>
      <p style="margin: 8px 0; color: #333">
        <strong>Email:</strong> {{user_email}}
      </p>
      <p style="margin: 8px 0; color: #333">
        <strong>Account Status:</strong> Active ✅
      </p>
    </div>

    <!-- Features Section -->
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px">
      <h3 style="color: #055b8e; margin-top: 0; margin-bottom: 16px">What you can do now:</h3>
      <div style="margin: 12px 0; display: flex; align-items: center">
        <span style="color: #055b8e; margin-right: 10px; font-weight: bold">📦</span>
        <span>Submit and track your shipments in real-time</span>
      </div>
      <div style="margin: 12px 0; display: flex; align-items: center">
        <span style="color: #055b8e; margin-right: 10px; font-weight: bold">🗺️</span>
        <span>View detailed shipment routes and progress</span>
      </div>
      <div style="margin: 12px 0; display: flex; align-items: center">
        <span style="color: #055b8e; margin-right: 10px; font-weight: bold">📱</span>
        <span>Receive instant notifications and updates</span>
      </div>
      <div style="margin: 12px 0; display: flex; align-items: center">
        <span style="color: #055b8e; margin-right: 10px; font-weight: bold">💬</span>
        <span>Get 24/7 customer support assistance</span>
      </div>
      <div style="margin: 12px 0; display: flex; align-items: center">
        <span style="color: #055b8e; margin-right: 10px; font-weight: bold">📊</span>
        <span>Access your shipment history and analytics</span>
      </div>
    </div>

    <!-- Call to Action Button -->
    <div style="text-align: center; margin-bottom: 30px">
      <a
        style="
          display: inline-block;
          text-decoration: none;
          outline: none;
          color: #fff;
          background-color: #055b8e;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
        "
        href="{{login_url}}"
        target="_blank"
      >
        Login to Your Dashboard
      </a>
    </div>

    <!-- Contact Information -->
    <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 30px">
      <h3 style="color: #055b8e; margin-top: 0; margin-bottom: 16px">Need Help?</h3>
      <p style="margin: 8px 0; color: #333">
        Our support team is here to assist you:
      </p>
      <p style="margin: 8px 0; color: #333">
        <strong>📧 Email:</strong> 
        <a href="mailto:nivamorecourierservices@hotmail.com" style="text-decoration: none; outline: none; color: #055b8e">
          nivamorecourierservices@hotmail.com
        </a>
      </p>
      <p style="margin: 8px 0; color: #333">
        <strong>📞 Phone:</strong> +971 52 549 3462
      </p>
      <p style="margin: 8px 0; color: #333">
        <strong>🕒 Hours:</strong> Monday - Friday: 9:00 AM - 6:00 PM (GST)
      </p>
    </div>

    <!-- Closing Message -->
    <div style="text-align: center; margin-bottom: 30px">
      <p style="color: #333; font-size: 16px; line-height: 1.6">
        We're committed to providing you with the best courier and logistics services. 
        If you have any questions or need assistance, don't hesitate to reach out to us.
      </p>
      <p style="color: #333; font-size: 16px; line-height: 1.6">
        Thank you for trusting us with your shipping needs!
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px">
      <p style="margin: 8px 0">
        <strong>Best regards,<br />The Nivamore Courier Services Team</strong>
      </p>
      <p style="margin: 8px 0">
        © 2024 Nivamore Courier Services. All rights reserved.
      </p>
      <p style="margin: 8px 0">
        This email was sent to {{user_email}}. If you didn't create an account, please ignore this email.
      </p>
    </div>
  </div>
</div>
```

---

## 🔧 **EMAILJS SETUP:**

### **Step 1: Create EmailJS Account**
1. **Go to**: https://www.emailjs.com
2. **Sign up** with your email
3. **Verify your email**

### **Step 2: Add Email Service**
1. **Go to Email Services** in dashboard
2. **Add Gmail** (or your preferred email service)
3. **Connect your Gmail account**
4. **Copy the Service ID**

### **Step 3: Create Email Template**
1. **Go to Email Templates**
2. **Create new template**
3. **Name it**: "Welcome Email"
4. **Paste the HTML template above**
5. **Save the template**

### **Step 4: Get Public Key**
1. **Go to Account** → **General**
2. **Copy your Public Key**

---

## 📝 **TEMPLATE VARIABLES:**

The template uses these variables that you'll need to pass from your app:

- `{{first_name}}` - User's first name
- `{{last_name}}` - User's last name
- `{{username}}` - User's username
- `{{user_email}}` - User's email address
- `{{login_url}}` - Link to login page

---

## 🎨 **DESIGN FEATURES:**

### **Visual Elements:**
- ✅ **Professional header** with company branding
- ✅ **Personalized welcome** message
- ✅ **Account details** section with highlighting
- ✅ **Feature highlights** with icons
- ✅ **Call-to-action** button
- ✅ **Contact information** section
- ✅ **Clean footer** with company info

### **Brand Colors:**
- **Primary**: #055b8e (Nivamore blue)
- **Background**: #f8fafc (Light gray)
- **Accent**: #f0f8ff (Light blue)
- **Text**: #333 (Dark gray)

### **Responsive Design:**
- ✅ **Mobile-friendly** layout
- ✅ **Proper spacing** and padding
- ✅ **Readable fonts** and sizes
- ✅ **Professional appearance**

---

## 🚀 **IMPLEMENTATION:**

### **1. Update Registration API**
Replace the email sending code with EmailJS:

```typescript
// In your registration API
const emailData = {
  to_email: userData.email,
  first_name: userData.firstName,
  last_name: userData.lastName,
  username: userData.username,
  user_email: userData.email,
  login_url: `${process.env.NEXTAUTH_URL}/member-login`
};

// Send via EmailJS (client-side)
```

### **2. Client-Side Email Sending**
Since EmailJS is client-side, you'll need to send the email from the frontend after successful registration.

---

## 🎉 **RESULT:**

**You'll have a beautiful, professional welcome email that:**
- ✅ **Matches your brand** perfectly
- ✅ **Looks great** on all devices
- ✅ **Includes all user details**
- ✅ **Has clear call-to-action**
- ✅ **Provides contact information**
- ✅ **Works with EmailJS** without server issues

**This template will work perfectly with EmailJS!** 🚀
