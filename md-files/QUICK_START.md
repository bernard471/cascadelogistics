# Quick Start Guide - Cascade Logistics

## Step 1: Install Dependencies ✅ (Already Done)

The following packages have been installed:
- `next-auth@beta` - Authentication
- `mongodb` - Database driver
- `bcryptjs` - Password hashing
- `@types/bcryptjs` - TypeScript types

## Step 2: Create Environment File

Create a file named `.env.local` in the root directory with:

```env
MONGO=mongodb+srv://USERNAME:PASSWORD@HOST/DATABASE
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
```

### Generate NEXTAUTH_SECRET:

**Option 1 - Using Node.js (Easiest):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 2 - Using OpenSSL:**
```bash
openssl rand -base64 32
```

Copy the generated string and paste it as the value for `NEXTAUTH_SECRET` in your `.env.local` file.

## Step 3: Create Admin User

Run this command to create your first admin user:

```bash
node scripts/create-admin.js
```

Before running the command, set `ADMIN_INITIAL_PASSWORD` to a unique temporary value of at least 12 characters. The script creates the `admin` account at `admin@cascadelogistics.com`. Remove the environment variable and change the password after first login.

## Step 4: Start the Development Server

```bash
npm run dev
```

## Step 5: Test Authentication

### Test Admin Login:
1. Go to: http://localhost:3000/member-login
2. Enter username: `admin`
3. Enter the password supplied through `ADMIN_INITIAL_PASSWORD`
4. Click "SIGN IN"
5. You should be redirected to: http://localhost:3000/admin-dashboard

### Test User Registration:
1. Go to: http://localhost:3000/member-register
2. Fill in all required fields
3. Click "CREATE ACCOUNT"
4. You'll be redirected to login page
5. Login with your new credentials
6. You should be redirected to: http://localhost:3000/user-dashboard

## What's Been Configured

### ✅ Authentication System:
- NextAuth v5 with MongoDB adapter
- Credentials provider (username/password)
- JWT session strategy
- Password hashing with bcrypt
- Role-based authentication (user/admin)

### ✅ Database Connection:
- MongoDB connection configured
- Database name: `logistics`
- Collection: `users`
- Automatic connection pooling

### ✅ Protected Routes:
- `/user-dashboard/*` - Requires authentication
- `/admin-dashboard/*` - Requires admin role
- Middleware redirects unauthorized access

### ✅ Session Management:
- 30-day session expiration
- Automatic session refresh
- Secure JWT tokens

### ✅ User Features:
- Registration with validation
- Login with username or email
- Role-based dashboard access
- Logout functionality
- Session persistence

## File Structure

```
src/
├── auth.ts                          # NextAuth configuration
├── middleware.ts                    # Route protection
├── lib/
│   └── mongodb.ts                   # Database connection
├── models/
│   └── User.ts                      # User type definitions
├── app/
│   └── api/
│       └── auth/
│           ├── [...nextauth]/route.ts  # NextAuth API routes
│           └── register/route.ts       # Registration endpoint
├── components/
│   ├── SessionProvider.tsx          # Session wrapper
│   ├── MemberLoginSection.tsx       # Login form (connected)
│   └── MemberRegisterSection.tsx    # Registration form (connected)
└── scripts/
    └── create-admin.js              # Admin user creation script
```

## Troubleshooting

### "Cannot connect to MongoDB"
1. Check internet connection
2. Verify MongoDB connection string in `.env.local`
3. Ensure IP address is whitelisted in MongoDB Atlas

### "NEXTAUTH_SECRET is not set"
1. Make sure `.env.local` file exists
2. Verify NEXTAUTH_SECRET is generated and added
3. Restart development server after adding env variables

### "Invalid credentials" when logging in
1. Verify user exists in database
2. Check user status is "active"
3. Ensure password is correct
4. Try running create-admin script again

### Session not working
1. Clear browser cookies and cache
2. Restart development server
3. Check browser console for errors
4. Verify `.env.local` has all required variables

## Next Steps

After setting up:
1. ✅ Login as admin and change the temporary password
2. ✅ Test user registration and login
3. ✅ Explore both dashboards
4. Configure additional settings as needed
5. Start using the system!

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check terminal console for server errors
3. Verify all environment variables are set correctly
4. Ensure MongoDB connection is working
5. Restart the development server

---

**Everything is set up and ready to go! Just follow the steps above to start using your authentication system.** 🎉

