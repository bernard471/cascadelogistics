# Authentication Setup Guide

## Prerequisites
- MongoDB Atlas account (already configured)
- Node.js installed

## Environment Variables Setup

Create a `.env.local` file in the root of your project with the following variables:

```env
# MongoDB connection string
MONGO=mongodb+srv://USERNAME:PASSWORD@HOST/DATABASE

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
```

### Generate NEXTAUTH_SECRET

You can generate a secure secret using one of these methods:

1. **Using OpenSSL (recommended):**
   ```bash
   openssl rand -base64 32
   ```

2. **Using Node.js:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **Online Generator:**
   Visit: https://generate-secret.vercel.app/32

## Database Setup

### 1. Create Admin User

Run this command to create an admin user in your database:

```bash
node scripts/create-admin.js
```

Set `ADMIN_INITIAL_PASSWORD` to a unique temporary value of at least 12 characters before running the script. The admin username is `admin` and the email is `admin@cascadelogistics.com`. Remove the environment variable and change the password after first login.

### 2. Test User Registration

You can register a regular user through the registration page at:
`http://localhost:3000/member-register`

## How Authentication Works

### User Registration Flow:
1. User fills out registration form at `/member-register`
2. Data is sent to `/api/auth/register`
3. Password is hashed using bcryptjs
4. User is created in MongoDB with role: "user"
5. User is redirected to login page

### Login Flow:
1. User enters username/email and password at `/member-login`
2. NextAuth validates credentials against MongoDB
3. Password is compared using bcrypt
4. Session is created with JWT
5. User is redirected to:
   - `/user-dashboard` for regular users
   - `/admin-dashboard` for admin users

### Protected Routes:
- All `/user-dashboard/*` routes require authentication
- All `/admin-dashboard/*` routes require admin role
- Non-authenticated users are redirected to login
- Non-admin users trying to access admin routes are redirected to user dashboard

## User Roles

### Regular User (role: "user")
- Can access User Dashboard
- Can submit shipments
- Can track shipments
- Can view their assets
- Can manage profile

### Admin (role: "admin")
- Can access Admin Dashboard
- Can manage all users
- Can manage all shipments
- Can view analytics and reports
- Can manage revenue
- Can manage staff
- Can configure system settings

## Testing the Authentication

### 1. Start the development server:
```bash
npm run dev
```

### 2. Create the admin user:
```bash
node scripts/create-admin.js
```

### 3. Test Admin Login:
- Go to: http://localhost:3000/member-login
- Username: `admin`
- Password: the value supplied through `ADMIN_INITIAL_PASSWORD`
- Should redirect to: http://localhost:3000/admin-dashboard

### 4. Test User Registration:
- Go to: http://localhost:3000/member-register
- Fill in the registration form
- Submit and login
- Should redirect to: http://localhost:3000/user-dashboard

## Troubleshooting

### Cannot connect to MongoDB:
- Check that your IP is whitelisted in MongoDB Atlas
- Verify connection string is correct
- Ensure network allows connections to MongoDB

### Login not working:
- Check that `.env.local` file exists and has correct values
- Verify NEXTAUTH_SECRET is set
- Check browser console for errors
- Verify user exists in database and status is "active"

### Session not persisting:
- Clear browser cookies
- Restart development server
- Check NEXTAUTH_URL matches your domain

## Security Best Practices

1. **Change Default Admin Password:**
   - Login as admin
   - Go to Settings → Security
   - Update password immediately

2. **Use Strong Passwords:**
   - Minimum 6 characters (enforced)
   - Recommend 12+ characters with mixed case, numbers, symbols

3. **Keep Secrets Safe:**
   - Never commit `.env.local` to git
   - Use different secrets for production
   - Rotate secrets periodically

4. **Enable Two-Factor Authentication:**
   - Available in Settings (to be implemented)

## Database Collections

### users Collection:
```typescript
{
  firstName: string,
  lastName: string,
  email: string,
  username: string,
  password: string (hashed),
  role: "user" | "admin",
  status: "active" | "suspended" | "pending",
  createdAt: Date,
  updatedAt: Date,
  emailVerified: boolean,
  phone?: string,
  address?: string,
  city?: string,
  country?: string,
  postalCode?: string,
  bio?: string,
  image?: string
}
```

## Next Steps

1. Set up `.env.local` file with all required variables
2. Generate NEXTAUTH_SECRET
3. Run the admin creation script
4. Test login and registration
5. Customize user roles and permissions as needed
6. Implement additional features (forgot password, email verification, etc.)

