# 🔧 EMAIL TROUBLESHOOTING GUIDE

## ❌ **Current Issue: Microsoft Basic Authentication Disabled**

**Error:** `535 5.7.139 Authentication unsuccessful, basic authentication is disabled`

**Cause:** Microsoft has disabled basic authentication for Hotmail/Outlook accounts for security reasons.

---

## ✅ **SOLUTION OPTIONS:**

### **Option 1: Use Gmail SMTP (Recommended)**

Update your `.env.local` file to use Gmail instead:

```env
# Gmail Configuration (Recommended)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
NEXTAUTH_URL=http://localhost:3000
```

**Gmail Setup Steps:**
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password as `EMAIL_PASSWORD`

### **Option 2: Use Microsoft OAuth2 (Advanced)**

If you want to keep using Hotmail, you need to set up OAuth2:

```env
# Microsoft OAuth2 Configuration
EMAIL_USER=nivamorecourierservices@hotmail.com
EMAIL_CLIENT_ID=your-client-id
EMAIL_CLIENT_SECRET=your-client-secret
EMAIL_REFRESH_TOKEN=your-refresh-token
NEXTAUTH_URL=http://localhost:3000
```

**OAuth2 Setup Steps:**
1. **Register App** at https://portal.azure.com
2. **Create App Registration** with Mail.Send permissions
3. **Generate Client ID and Secret**
4. **Get Refresh Token** using OAuth2 flow

### **Option 3: Use Alternative Email Service**

Consider using:
- **SendGrid** (Professional email service)
- **Mailgun** (Developer-friendly)
- **Amazon SES** (AWS email service)
- **Resend** (Modern email API)

---

## 🚀 **QUICK FIX - Gmail Setup:**

### **1. Update Email Configuration**

Replace the current email configuration in `src/lib/email.ts`:

```typescript
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};
```

### **2. Update Environment Variables**

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

### **3. Gmail App Password Setup**

1. **Go to Google Account**: https://myaccount.google.com/
2. **Security** → **2-Step Verification** (enable if not already)
3. **App passwords** → **Generate app password**
4. **Select app**: Mail
5. **Select device**: Other (Custom name: "Nivamore Courier")
6. **Copy the 16-character password**
7. **Use this password** as `EMAIL_PASSWORD` in `.env.local`

---

## 🔧 **Alternative: Use Resend (Modern Email Service)**

### **1. Install Resend**

```bash
npm install resend
```

### **2. Update Email Service**

Replace `src/lib/email.ts` with:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Nivamore Courier Services <onboarding@resend.dev>',
      to: [userData.email],
      subject: `Welcome to Nivamore Courier Services, ${userData.firstName}!`,
      html: `<!-- Your HTML template here -->`
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    console.log('Welcome email sent successfully:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
```

### **3. Environment Variables**

```env
RESEND_API_KEY=your-resend-api-key
```

---

## 🎯 **RECOMMENDED ACTION:**

**Use Gmail SMTP** - it's the easiest and most reliable solution:

1. **Create a Gmail account** for your business
2. **Enable 2-factor authentication**
3. **Generate app password**
4. **Update environment variables**
5. **Test the email functionality**

---

## 🧪 **Testing:**

After setting up Gmail, test with:

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe"
  }'
```

---

## 📞 **Need Help?**

If you're still having issues:
1. **Check the console logs** for detailed error messages
2. **Verify your app password** is correct
3. **Ensure 2-factor authentication** is enabled
4. **Try a different email service** if Gmail doesn't work

**The email system will work once you set up proper authentication!**
