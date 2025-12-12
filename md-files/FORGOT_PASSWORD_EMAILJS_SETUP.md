# 🔐 FORGOT PASSWORD EMAILJS SETUP

## ✅ **What You Need:**

### **Same EmailJS Service:**
- ✅ **Service ID**: Use your existing one
- ✅ **Public Key**: Use your existing one
- ❌ **Template ID**: Create a NEW one for password reset

---

## 🚀 **STEP 1: Create Password Reset Template**

### **In EmailJS Dashboard:**
1. **Go to Email Templates**
2. **Click "Create New Template"**
3. **Name it**: "Password Reset Email"
4. **Use this HTML template**:

```html
<div style="font-family: system-ui, sans-serif, Arial; font-size: 16px; background-color: #f8fafc">
  <div style="max-width: 600px; margin: auto; padding: 20px">
    <!-- Header with Logo -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #055b8e">
      <div style="font-size: 28px; font-weight: bold; color: #055b8e; margin-bottom: 8px">
        🚚 Nivamore Courier Services
      </div>
      <div style="color: #666; font-size: 16px">Your Trusted Logistics Partner</div>
    </div>

    <!-- Password Reset Message -->
    <div style="text-align: center; margin-bottom: 30px">
      <h1 style="color: #055b8e; font-size: 24px; margin-bottom: 16px">
        Password Reset Request 🔐
      </h1>
      <p style="font-size: 18px; color: #333; margin-bottom: 20px">
        Hello {{first_name}},
      </p>
      <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 20px">
        We received a request to reset your password for your Nivamore Courier Services account. 
        If you made this request, click the button below to reset your password.
      </p>
    </div>

    <!-- Reset Button -->
    <div style="text-align: center; margin-bottom: 30px">
      <a
        style="
          display: inline-block;
          text-decoration: none;
          outline: none;
          color: #fff;
          background-color: #dc2626;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
        "
        href="{{reset_url}}"
        target="_blank"
      >
        Reset My Password
      </a>
    </div>

    <!-- Security Notice -->
    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin-bottom: 30px">
      <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 16px">⚠️ Security Notice</h3>
      <p style="margin: 8px 0; color: #333; font-size: 14px">
        • This link will expire in 1 hour for security reasons
      </p>
      <p style="margin: 8px 0; color: #333; font-size: 14px">
        • If you didn't request this password reset, please ignore this email
      </p>
      <p style="margin: 8px 0; color: #333; font-size: 14px">
        • Your password will remain unchanged until you create a new one
      </p>
    </div>

    <!-- Alternative Instructions -->
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px">
      <h3 style="color: #055b8e; margin-top: 0; margin-bottom: 16px">Can't click the button?</h3>
      <p style="margin: 8px 0; color: #333; font-size: 14px">
        Copy and paste this link into your browser:
      </p>
      <p style="margin: 8px 0; color: #055b8e; font-size: 14px; word-break: break-all">
        {{reset_url}}
      </p>
    </div>

    <!-- Contact Information -->
    <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 30px">
      <h3 style="color: #055b8e; margin-top: 0; margin-bottom: 16px">Need Help?</h3>
      <p style="margin: 8px 0; color: #333; font-size: 14px">
        If you're having trouble resetting your password, contact our support team:
      </p>
      <p style="margin: 8px 0; color: #333; font-size: 14px">
        <strong>📧 Email:</strong> 
        <a href="mailto:nivamorecourierservices@hotmail.com" style="text-decoration: none; outline: none; color: #055b8e">
          nivamorecourierservices@hotmail.com
        </a>
      </p>
      <p style="margin: 8px 0; color: #333; font-size: 14px">
        <strong>📞 Phone:</strong> +971 52 549 3462
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
        This email was sent to {{user_email}}. If you didn't request a password reset, please ignore this email.
      </p>
    </div>
  </div>
</div>
```

### **Template Variables:**
- `{{first_name}}` - User's first name
- `{{user_email}}` - User's email address
- `{{reset_url}}` - Password reset link with token

---

## 🔧 **STEP 2: Update Environment Variables**

Add the new template ID to your `.env.local`:

```env
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_existing_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_existing_template_id
NEXT_PUBLIC_EMAILJS_PASSWORD_RESET_TEMPLATE_ID=your_new_password_reset_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_existing_public_key
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3001
```

---

## 🚀 **STEP 3: Implementation**

I'll help you implement:
1. **Password reset API** with token generation
2. **Updated forgot password component** with EmailJS
3. **Password reset page** for users to set new password
4. **Token validation** and password update

---

## 🎯 **RESULT:**

**You'll have a complete password reset system that:**
- ✅ **Sends beautiful reset emails** via EmailJS
- ✅ **Uses secure tokens** with expiration
- ✅ **Validates tokens** before allowing password reset
- ✅ **Updates passwords** securely in database
- ✅ **Provides user feedback** throughout the process

**Ready to implement?** 🚀
