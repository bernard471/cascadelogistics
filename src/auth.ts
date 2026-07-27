import NextAuth from "next-auth";
import { CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import type { User } from "@/models/User";

class AccountSuspendedError extends CredentialsSignin {
  code = "account_suspended";
}

class EmailUnverifiedError extends CredentialsSignin {
  code = "email_unverified";
}

class IdentityPendingError extends CredentialsSignin {
  code = "identity_pending";
}

class IdentityRejectedError extends CredentialsSignin {
  code = "identity_rejected";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const client = await clientPromise;
          const db = client.db("guangzhou");
          const usersCollection = db.collection<User>("users");

          // Find user by username or email
          const user = await usersCollection.findOne({
            $or: [
              { usernameNormalized: (credentials.username as string).trim().toLowerCase() },
              { emailNormalized: (credentials.username as string).trim().toLowerCase() },
              { username: credentials.username as string },
              { email: credentials.username as string }
            ]
          });

          if (!user) {
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          if (user.status !== "active") {
            throw new AccountSuspendedError();
          }

          if (!user.emailVerified && user.role !== "staff") {
            throw new EmailUnverifiedError();
          }

          // Existing users without an identity status remain active during migration.
          if (user.role === "user" && user.identityVerificationStatus) {
            if (
              user.identityVerificationStatus === "rejected" ||
              user.identityVerificationStatus === "resubmission-required"
            ) {
              throw new IdentityRejectedError();
            }
            if (user.identityVerificationStatus !== "verified") {
              throw new IdentityPendingError();
            }
          }

          // Return user object (without password)
          return {
            id: user._id?.toString() || "",
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            username: user.username,
            image: user.image
          };
        } catch (error) {
          if (error instanceof CredentialsSignin) {
            throw error;
          }
          console.error("Authentication error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/member-login",
    error: "/member-login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || "";
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow any URL that starts with baseUrl
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default to base URL
      return baseUrl;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
});
