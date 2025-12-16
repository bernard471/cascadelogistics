const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = "mongodb+srv://logistics_db_user:7pNGrpcWbDOlVcOT@cluster0.cwnkqv9.mongodb.net/guangzhou?retryWrites=true&w=majority&appName=Cluster0";

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
    const hashedPassword = await bcrypt.hash("cascade123", 10);

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
    console.log("Password: cascade123");
    console.log("ID:", result.insertedId);

  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await client.close();
  }
}

createAdminUser();

