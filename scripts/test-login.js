const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGO;
if (!uri) {
  throw new Error("MONGO must be set before running this script.");
}

async function testLogin() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db("guangzhou");
    const usersCollection = db.collection("users");

    // Test credentials
    const testUsername = process.env.TEST_LOGIN_USERNAME;
    const testPassword = process.env.TEST_LOGIN_PASSWORD;

    if (!testUsername || !testPassword) {
      throw new Error(
        "TEST_LOGIN_USERNAME and TEST_LOGIN_PASSWORD must be set before running this script."
      );
    }

    console.log(`Testing login for username: ${testUsername}\n`);

    // Find user
    const user = await usersCollection.findOne({
      $or: [
        { username: testUsername },
        { email: testUsername }
      ]
    });

    if (!user) {
      console.log("❌ User not found!");
      return;
    }

    console.log("✅ User found:");
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`);

    // Check status
    if (user.status !== "active") {
      console.log(`\n❌ User status is "${user.status}" - should be "active"`);
      return;
    }
    console.log("\n✅ User status is active");

    // Test password (you need to provide the actual password)
    if (testPassword !== "your-actual-password-here") {
      const isPasswordValid = await bcrypt.compare(testPassword, user.password);
      
      if (isPasswordValid) {
        console.log("✅ Password verification successful!");
        console.log("\n🎉 Login test PASSED - Authentication should work!");
      } else {
        console.log("❌ Password verification failed!");
        console.log("   Make sure you're using the correct password");
      }
    } else {
      console.log("\n⚠️  To test password verification:");
      console.log("   1. Open scripts/test-login.js");
      console.log("   2. Replace 'your-actual-password-here' with your actual password");
      console.log("   3. Run this script again");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

testLogin();
