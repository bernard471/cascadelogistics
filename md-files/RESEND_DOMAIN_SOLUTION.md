# 🔧 RESEND DOMAIN VERIFICATION GUIDE

## ❌ **Current Issue:**
**Error:** "You can only send testing emails to your own email address"

**Cause:** Resend's free tier restricts sending to verified domains only.

---

## ✅ **SOLUTION OPTIONS:**

### **Option 1: Domain Verification (Recommended)**
Verify your domain to send emails to anyone.

### **Option 2: Use SendGrid (Alternative)**
SendGrid allows sending to any email without domain verification.

### **Option 3: Use Mailgun (Alternative)**
Mailgun also allows sending without domain verification.

---

## 🚀 **OPTION 1: DOMAIN VERIFICATION (Resend)**

### **Step 1: Add Domain to Resend**
1. **Go to Resend Dashboard**: https://resend.com/domains
2. **Click "Add Domain"**
3. **Enter your domain**: `nivamore.com` (or whatever domain you own)
4. **Click "Add"**

### **Step 2: Verify Domain**
1. **Copy the DNS records** Resend provides
2. **Add them to your domain's DNS settings**:
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Find DNS management
   - Add the TXT and CNAME records
3. **Wait for verification** (usually 5-10 minutes)

### **Step 3: Update Email Configuration**
```typescript
// After domain verification, update the from address:
from: 'Nivamore Courier Services <hello@nivamore.com>'
```

---

## 🔧 **OPTION 2: SENDGRID (No Domain Required)**

### **Step 1: Sign Up for SendGrid**
1. **Go to**: https://sendgrid.com
2. **Sign up** with your email
3. **Verify your email**
4. **Get API key** from Settings → API Keys

### **Step 2: Install SendGrid**
```bash
npm install @sendgrid/mail
```

### **Step 3: Update Email Service**
Replace `src/lib/email.ts` with:

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendWelcomeEmail = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}) => {
  try {
    const msg = {
      to: userData.email,
      from: 'nivamorecourierservices@hotmail.com', // Your verified sender
      subject: `Welcome to Nivamore Courier Services, ${userData.firstName}!`,
      html: createWelcomeEmailTemplate(userData).html,
      text: createWelcomeEmailTemplate(userData).text
    };

    const result = await sgMail.send(msg);
    console.log('Welcome email sent successfully:', result[0].statusCode);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
```

### **Step 4: Environment Variables**
```env
SENDGRID_API_KEY=your_sendgrid_api_key
NEXTAUTH_URL=http://localhost:3000
```

---

## 🎯 **OPTION 3: MAILGUN (No Domain Required)**

### **Step 1: Sign Up for Mailgun**
1. **Go to**: https://mailgun.com
2. **Sign up** for free account
3. **Get API key** from dashboard

### **Step 2: Install Mailgun**
```bash
npm install mailgun-js
```

### **Step 3: Update Email Service**
```typescript
import mailgun from 'mailgun-js';

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY!,
  domain: process.env.MAILGUN_DOMAIN!
});

export const sendWelcomeEmail = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}) => {
  try {
    const data = {
      from: 'Nivamore Courier Services <nivamorecourierservices@hotmail.com>',
      to: userData.email,
      subject: `Welcome to Nivamore Courier Services, ${userData.firstName}!`,
      html: createWelcomeEmailTemplate(userData).html,
      text: createWelcomeEmailTemplate(userData).text
    };

    const result = await mg.messages().send(data);
    console.log('Welcome email sent successfully:', result.id);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
```

---

## 🎯 **MY RECOMMENDATION: SENDGRID**

**Why SendGrid is perfect for you:**
- ✅ **No domain verification needed**
- ✅ **Free tier**: 100 emails/day
- ✅ **Easy setup**
- ✅ **Reliable delivery**
- ✅ **Works with your Hotmail address**

---

## 🚀 **QUICK SENDGRID SETUP:**

### **1. Sign Up (2 minutes)**
- Go to https://sendgrid.com
- Sign up with your email
- Verify your email

### **2. Get API Key (1 minute)**
- Go to Settings → API Keys
- Create new key
- Copy the API key

### **3. Install Package (1 minute)**
```bash
npm install @sendgrid/mail
```

### **4. Update Code (1 minute)**
Replace the email service with SendGrid code above

### **5. Test (1 minute)**
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "any-email@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe"
  }'
```

---

## 💰 **COST COMPARISON:**

| Service | Free Tier | Domain Required |
|---------|-----------|-----------------|
| **Resend** | 3,000/month | ✅ Yes |
| **SendGrid** | 100/day | ❌ No |
| **Mailgun** | 5,000/month (3 months) | ❌ No |

---

## 🎉 **RESULT:**

**With SendGrid, you'll have:**
- ✅ **Working welcome emails** in 5 minutes
- ✅ **No domain verification** needed
- ✅ **Send to any email address**
- ✅ **Professional delivery**
- ✅ **Free tier** for testing

**Ready to switch to SendGrid? It's the easiest solution!**
