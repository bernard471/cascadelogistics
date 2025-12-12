const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = "mongodb+srv://nextauth:vDdOjXSh8Er5yz6L@cluster0.soo8n.mongodb.net/logistics?retryWrites=true&w=majority&appName=Cluster0";

async function debugAuth() {
  const client = new MongoClient(uri);

  try {
    console.log("=".repeat(60));
    console.log("AUTHENTICATION DEBUGGING TOOL");
    console.log("=".repeat(60));

    await client.connect();
    console.log("\n✅ MongoDB Connection: SUCCESS");

    const db = client.db("logistics");
    const usersCollection = db.collection("users");

    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`\n📊 Total users in database: ${users.length}`);

    if (users.length === 0) {
      console.log("\n❌ No users found in database!");
      console.log("   Run 'node scripts/create-admin.js' to create an admin user");
      console.log("   Or register a user at http://localhost:3000/member-register");
      return;
    }

    console.log("\n" + "=".repeat(60));
    console.log("USER LIST:");
    console.log("=".repeat(60));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Password Hash: ${user.password.substring(0, 30)}...`);
      console.log(`   Created: ${user.createdAt}`);
      
      // Identify hash type
      if (user.password.startsWith('$2a$')) {
        console.log(`   Hash Type: bcrypt (2a) ✅`);
      } else if (user.password.startsWith('$2b$')) {
        console.log(`   Hash Type: bcrypt (2b) ✅`);
      } else {
        console.log(`   Hash Type: UNKNOWN ❌`);
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log("TESTING PASSWORD COMPATIBILITY:");
    console.log("=".repeat(60));

    // Test if bcryptjs can verify $2b$ hashes
    const testPassword = "test123";
    const hash2b = await bcrypt.hash(testPassword, 10);
    const canVerify = await bcrypt.compare(testPassword, hash2b);
    
    console.log(`\n✅ bcryptjs can create and verify hashes: ${canVerify ? "YES" : "NO"}`);

    // Test with user's actual hash type
    const bernardUser = users.find(u => u.username === "bernardo471");
    if (bernardUser) {
      console.log("\n" + "=".repeat(60));
      console.log("BERNARD'S ACCOUNT STATUS:");
      console.log("=".repeat(60));
      console.log(`✅ User exists: YES`);
      console.log(`✅ Status: ${bernardUser.status}`);
      console.log(`✅ Role: ${bernardUser.role}`);
      console.log(`✅ Hash type: ${bernardUser.password.substring(0, 4)}`);
      
      if (bernardUser.status !== "active") {
        console.log(`\n❌ WARNING: Status is "${bernardUser.status}" - should be "active"`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("CHECKLIST:");
    console.log("=".repeat(60));
    console.log("✅ MongoDB connection working");
    console.log("✅ Users collection exists");
    console.log(`✅ ${users.length} user(s) in database`);
    console.log("✅ bcryptjs library working");
    
    console.log("\n" + "=".repeat(60));
    console.log("ENVIRONMENT VARIABLES TO CHECK:");
    console.log("=".repeat(60));
    console.log("Make sure your .env.local has:");
    console.log("1. MONGO=<your-connection-string>");
    console.log("2. NEXTAUTH_URL=http://localhost:3000");
    console.log("3. NEXTAUTH_SECRET=<your-generated-secret>");
    
    console.log("\n" + "=".repeat(60));
    console.log("TO TEST LOGIN:");
    console.log("=".repeat(60));
    console.log("1. Restart your development server (npm run dev)");
    console.log("2. Go to http://localhost:3000/member-login");
    console.log(`3. Login with:`);
    console.log(`   Username: bernardo471`);
    console.log(`   Password: <your-password>`);
    console.log("\n4. Check browser console and terminal for errors");

  } catch (error) {
    console.error("\n❌ Error:", error);
  } finally {
    await client.close();
  }
}

debugAuth();

