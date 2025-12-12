import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      username: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "user" | "admin";
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "user" | "admin";
    username: string;
  }
}

