const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO || 'mongodb://localhost:27017/logistics';

async function seedNotifications() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('logistics');
    const usersCollection = db.collection('users');
    const notificationsCollection = db.collection('notifications');
    
    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`Found ${users.length} users`);
    
    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }
    
    // Clear existing notifications
    await notificationsCollection.deleteMany({});
    console.log('Cleared existing notifications');
    
    // Create sample notifications for each user
    const sampleNotifications = [
      {
        title: "Welcome to Nivamore!",
        message: "Thank you for joining our logistics platform. You can now track your shipments and manage your deliveries.",
        type: "delivery",
        isRead: false
      },
      {
        title: "Shipment Update",
        message: "Your shipment NSC123456789 has been updated and is now in transit.",
        type: "update",
        isRead: false
      },
      {
        title: "Payment Received",
        message: "Your payment for shipment NSC123456789 has been processed successfully.",
        type: "payment",
        isRead: true
      },
      {
        title: "Delivery Completed",
        message: "Your shipment NSC123456789 has been delivered successfully. Thank you for choosing Nivamore!",
        type: "delivery",
        isRead: false
      },
      {
        title: "New Service Available",
        message: "We've added new express delivery options. Check out our updated service offerings.",
        type: "alert",
        isRead: false
      }
    ];
    
    const notifications = [];
    
    for (const user of users) {
      // Create 2-4 random notifications for each user
      const numNotifications = Math.floor(Math.random() * 3) + 2;
      const selectedNotifications = sampleNotifications
        .sort(() => 0.5 - Math.random())
        .slice(0, numNotifications);
      
      for (const notification of selectedNotifications) {
        notifications.push({
          userId: user._id.toString(),
          ...notification,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time within last 7 days
        });
      }
    }
    
    // Insert notifications
    const result = await notificationsCollection.insertMany(notifications);
    console.log(`Created ${result.insertedCount} notifications`);
    
    // Show summary
    const unreadCount = await notificationsCollection.countDocuments({ isRead: false });
    const readCount = await notificationsCollection.countDocuments({ isRead: true });
    
    console.log('\n📊 Notification Summary:');
    console.log(`Total notifications: ${notifications.length}`);
    console.log(`Unread notifications: ${unreadCount}`);
    console.log(`Read notifications: ${readCount}`);
    
    console.log('\n✅ Sample notifications seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding notifications:', error);
  } finally {
    await client.close();
  }
}

// Run the script
seedNotifications();
