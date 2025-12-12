const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = "mongodb+srv://guangzhou:guangzhou123@cluster0.jrvr3.mongodb.net/guangzhou?retryWrites=true&w=majority&appName=Cluster0";

async function createAdminUser() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("guangzhou");
    const usersCollection = db.collection("users");

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: "admin@guangzhouswiftservices.com" });

    if (existingAdmin) {
      console.log("Admin user already exists!");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("guangzhou123", 10);

    // Create admin user
    const adminUser = {
      firstName: "Admin",
      lastName: "User",
      email: "admin@guangzhouswiftservices.com",
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
    console.log("Email: admin@guangzhouswiftservices.com");
    console.log("Username: admin");
    console.log("Password: guangzhou123");
    console.log("ID:", result.insertedId);

  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await client.close();
  }
}

createAdminUser();

