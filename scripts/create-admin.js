const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGO;
const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

if (!uri) {
  throw new Error("MONGO must be set before running this script.");
}

if (!initialPassword || initialPassword.length < 12) {
  throw new Error("ADMIN_INITIAL_PASSWORD must be set to at least 12 characters.");
}

async function createAdminUser() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("guangzhou");
    const usersCollection = db.collection("users");

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: "admin@cascadelogistics.com" });

    if (existingAdmin) {
      console.log("Admin user already exists!");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(initialPassword, 12);

    // Create admin user
    const adminUser = {
      firstName: "Admin",
      lastName: "User",
      email: "admin@cascadelogistics.com",
      username: "admin",
      password: hashedPassword,
      role: "admin",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true
    };

    const result = await usersCollection.insertOne(adminUser);
    console.log("Admin user created successfully!");
    console.log("Email: admin@cascadelogistics.com");
    console.log("Username: admin");
    console.log("Password: supplied securely through ADMIN_INITIAL_PASSWORD");
    console.log("ID:", result.insertedId);

  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await client.close();
  }
}

createAdminUser();
