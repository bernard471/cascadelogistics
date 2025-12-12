const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://nextauth:vDdOjXSh8Er5yz6L@cluster0.soo8n.mongodb.net/logistics?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  const client = new MongoClient(uri);

  try {
    console.log("Attempting to connect to MongoDB...");
    await client.connect();
    console.log("✅ Successfully connected to MongoDB!");

    const db = client.db("logistics");
    console.log("✅ Connected to database: logistics");

    // List collections
    const collections = await db.listCollections().toArray();
    console.log("\nExisting collections:");
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    if (collections.length === 0) {
      console.log("  (No collections yet - they will be created when you add data)");
    }

    // Check for users collection
    const usersCollection = db.collection("users");
    const userCount = await usersCollection.countDocuments();
    console.log(`\n✅ Users collection: ${userCount} users found`);

    if (userCount > 0) {
      console.log("\nExisting users:");
      const users = await usersCollection.find({}, { 
        projection: { username: 1, email: 1, role: 1, status: 1 } 
      }).toArray();
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
      });
    }

    console.log("\n✅ Database connection test successful!");
    console.log("\nYou can now:");
    console.log("1. Run 'node scripts/create-admin.js' to create an admin user");
    console.log("2. Start your app with 'npm run dev'");
    console.log("3. Register users at http://localhost:3000/member-register");

  } catch (error) {
    console.error("❌ Error connecting to MongoDB:");
    console.error(error.message);
    console.log("\nPossible solutions:");
    console.log("1. Check your internet connection");
    console.log("2. Verify the connection string is correct");
    console.log("3. Ensure your IP is whitelisted in MongoDB Atlas");
  } finally {
    await client.close();
    console.log("\nConnection closed.");
  }
}

testConnection();

