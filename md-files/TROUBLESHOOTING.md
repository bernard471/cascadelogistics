# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Terminal Errors About Missing MongoDB Dependencies

**Errors like:**
```
Module not found: Can't resolve 'kerberos'
Module not found: Can't resolve 'snappy'
Module not found: Can't resolve 'socks'
Module not found: Can't resolve 'aws4'
```

**✅ FIXED:** These optional dependencies have been installed. Restart your dev server:
```bash
npm run dev
```

---

### Issue 2: "Cannot connect to MongoDB"

**Solution:**
1. Check your internet connection
2. Verify MongoDB Atlas allows your IP address
3. Run the connection test:
```bash
node scripts/test-connection.js
```

---

### Issue 3: Login Not Working / Authentication Errors

**Step 1: Verify Environment Variables**
```bash
# Check .env.local exists and has all variables
Get-Content .env.local
```

Should show:
```
MONGO=mongodb+srv://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-secret>
```

**Step 2: Restart Development Server**
```bash
# Stop the server (Ctrl+C)
# Then start again
npm run dev
```

**Step 3: Clear Browser Cache**
- Open DevTools (F12)
- Go to Application tab
- Clear all cookies for localhost:3000
- Try logging in again

**Step 4: Check User in Database**
```bash
node scripts/debug-auth.js
```

---

### Issue 4: "Invalid username or password"

**Possible causes:**
1. Wrong password entered
2. User doesn't exist in database
3. User status is not "active"
4. Password hash mismatch

**Debug steps:**
```bash
node scripts/debug-auth.js
```

This will show:
- All users in database
- Their usernames and emails
- Their status
- Password hash types

---

### Issue 5: Redirects Not Working

**Check middleware:**
1. File exists: `src/middleware.ts`
2. Restart dev server after creating middleware
3. Clear browser cache

**Test:**
1. Try accessing http://localhost:3000/user-dashboard directly
2. Should redirect to login if not authenticated

---

### Issue 6: Session Not Persisting

**Solutions:**
1. Clear browser cookies
2. Check NEXTAUTH_SECRET is set in .env.local
3. Verify NEXTAUTH_URL matches your domain
4. Restart development server

---

### Issue 7: Role-Based Access Not Working

**Admin can't access admin dashboard:**
1. Check user role in database is "admin" (not "Admin")
2. Clear session and login again
3. Check browser console for errors

**User can access admin dashboard:**
1. Check middleware.ts is configured correctly
2. Restart server
3. Clear browser session

---

### Issue 8: Registration Errors

**"User already exists":**
- User with that email or username already exists
- Try different email/username

**Password validation errors:**
- Password must be at least 6 characters
- Passwords must match
- Must agree to terms

---

## Debugging Commands

### 1. Test MongoDB Connection
```bash
node scripts/test-connection.js
```

### 2. Debug Authentication
```bash
node scripts/debug-auth.js
```

### 3. Create Admin User
```bash
node scripts/create-admin.js
```

### 4. Check Environment Variables
```bash
Get-Content .env.local
```

### 5. View Server Logs
Check your terminal where `npm run dev` is running

---

## Verification Checklist

Before reporting an issue, verify:

- [ ] `.env.local` file exists with all 3 variables
- [ ] NEXTAUTH_SECRET is generated (not placeholder text)
- [ ] MongoDB connection works (`node scripts/test-connection.js`)
- [ ] User exists in database (`node scripts/debug-auth.js`)
- [ ] User status is "active"
- [ ] Development server is running (`npm run dev`)
- [ ] Browser cache is cleared
- [ ] Using correct username/password

---

## Getting Detailed Error Information

### Browser Console:
1. Open DevTools (F12)
2. Go to Console tab
3. Try logging in
4. Copy any red error messages

### Server Terminal:
1. Look at terminal where `npm run dev` is running
2. Any errors will appear in red
3. Copy the complete error stack trace

### Network Tab:
1. Open DevTools (F12)
2. Go to Network tab
3. Try logging in
4. Check the response from `/api/auth/callback/credentials`
5. Look for error messages in the response

---

## Still Having Issues?

### Provide these details:

1. **Exact error message** from terminal
2. **Browser console errors** (if any)
3. **Output of:** `node scripts/debug-auth.js`
4. **What happens when you login:**
   - Does the button show "SIGNING IN..."?
   - Does it stay on login page?
   - Does it show error message?
   - Does it redirect somewhere?

---

## Quick Fixes

### Reset Everything:
```bash
# 1. Stop development server (Ctrl+C)

# 2. Clear Next.js cache
Remove-Item -Recurse -Force .next

# 3. Restart server
npm run dev
```

### Create Fresh Admin:
1. Delete admin from MongoDB Atlas
2. Run: `node scripts/create-admin.js`
3. Login with: admin / admin123

### Test with New User:
1. Go to http://localhost:3000/member-register
2. Create completely new account
3. Try logging in with new credentials

---

## Environment Variables Template

Your `.env.local` should look exactly like this:

```env
MONGO=mongodb+srv://nextauth:vDdOjXSh8Er5yz6L@cluster0.soo8n.mongodb.net/logistics?retryWrites=true&w=majority&appName=Cluster0
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=0/wjbpiZ94wctUZ4rqHHi4AO/QgxvG1JeQhRnQLemAc=
```

Make sure:
- No spaces around the `=` sign
- No quotes around values
- Each variable on its own line
- File is named exactly `.env.local`

---

## Contact & Support

If none of these solutions work, please provide:
1. Complete error message from terminal
2. Browser console errors
3. Output from `node scripts/debug-auth.js`
4. What you see when trying to login

This will help diagnose the exact issue! 🔍

