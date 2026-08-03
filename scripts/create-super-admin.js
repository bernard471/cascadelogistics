const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const uri = process.env.MONGO;
const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const username = process.env.SUPER_ADMIN_USERNAME?.trim();
const password = process.env.SUPER_ADMIN_INITIAL_PASSWORD;

if (!uri) throw new Error("MONGO must be set before running this script.");
if (!email || !email.includes("@")) throw new Error("SUPER_ADMIN_EMAIL must be a valid email address.");
if (!username || username.length < 3) throw new Error("SUPER_ADMIN_USERNAME must be at least 3 characters.");
if (!password || password.length < 16) {
  throw new Error("SUPER_ADMIN_INITIAL_PASSWORD must be at least 16 characters.");
}

async function createSuperAdmin() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const users = client.db("guangzhou").collection("users");
    const usernameNormalized = username.toLowerCase();
    const existing = await users.findOne({
      $or: [{ emailNormalized: email }, { usernameNormalized }],
    });

    if (existing) {
      if (existing.role === "super_admin") {
        console.log("The super admin account already exists.");
        return;
      }
      throw new Error("That email address or username already belongs to another account.");
    }

    const now = new Date();
    const result = await users.insertOne({
      firstName: process.env.SUPER_ADMIN_FIRST_NAME?.trim() || "System",
      lastName: process.env.SUPER_ADMIN_LAST_NAME?.trim() || "Owner",
      email,
      emailNormalized: email,
      username,
      usernameNormalized,
      password: await bcrypt.hash(password, 12),
      role: "super_admin",
      status: "active",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log("Super admin account created successfully.");
    console.log("Account ID:", result.insertedId.toString());
    console.log("Sign in through the normal member login page.");
  } finally {
    await client.close();
  }
}

createSuperAdmin().catch((error) => {
  console.error("Unable to create super admin:", error.message);
  process.exitCode = 1;
});
