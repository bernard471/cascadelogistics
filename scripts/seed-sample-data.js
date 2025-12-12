const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGO;

async function seedSampleData() {
  if (!uri) {
    console.error('❌ MONGO environment variable not found');
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('logistics');

    // Get the user ID (assumes you have a user already)
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: 'basare471@gmail.com' });

    if (!user) {
      console.error('❌ User not found. Please create a user first.');
      return;
    }

    const userId = user._id.toString();
    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${userId})`);

    // Seed sample shipments
    const shipmentsCollection = db.collection('shipments');
    
    const sampleShipments = [
      {
        trackingId: `NSC${Date.now()}001`,
        userId: userId,
        senderName: `${user.firstName} ${user.lastName}`,
        senderEmail: user.email,
        senderPhone: user.phone || '+971 52 549 3462',
        senderAddress: '123 Business Bay',
        senderCity: 'Dubai',
        senderCountry: 'UAE',
        receiverName: 'John Recipient',
        receiverEmail: 'john@example.com',
        receiverPhone: '+234 80 123 4567',
        receiverAddress: '456 Victoria Island',
        receiverCity: 'Lagos',
        receiverCountry: 'Nigeria',
        packageType: 'parcel',
        weight: 2.5,
        dimensions: '30 x 20 x 15',
        quantity: 1,
        description: 'Electronics and accessories',
        declaredValue: 150,
        serviceType: 'express',
        status: 'in-transit',
        currentLocation: 'Doha, Qatar',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        timeline: [
          {
            status: 'Order Placed',
            location: 'Dubai, UAE',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            time: '10:30 AM',
            completed: true
          },
          {
            status: 'Package Picked Up',
            location: 'Dubai Warehouse',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            time: '2:45 PM',
            completed: true
          },
          {
            status: 'In Transit - Air',
            location: 'Doha, Qatar',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            time: '8:20 AM',
            completed: true
          }
        ],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        trackingId: `NSC${Date.now()}002`,
        userId: userId,
        senderName: `${user.firstName} ${user.lastName}`,
        senderEmail: user.email,
        senderPhone: user.phone || '+971 52 549 3462',
        senderAddress: '123 Business Bay',
        senderCity: 'Dubai',
        senderCountry: 'UAE',
        receiverName: 'Jane Recipient',
        receiverEmail: 'jane@example.com',
        receiverPhone: '+44 20 7946 0958',
        receiverAddress: '789 Oxford Street',
        receiverCity: 'London',
        receiverCountry: 'UK',
        packageType: 'document',
        weight: 0.5,
        quantity: 1,
        description: 'Legal documents',
        declaredValue: 50,
        serviceType: 'standard',
        status: 'delivered',
        estimatedDelivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        actualDelivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        timeline: [
          {
            status: 'Order Placed',
            location: 'Dubai, UAE',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            time: '9:00 AM',
            completed: true
          },
          {
            status: 'Delivered',
            location: 'London, UK',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            time: '3:30 PM',
            completed: true
          }
        ],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];

    const shipmentResult = await shipmentsCollection.insertMany(sampleShipments);
    console.log(`✅ Inserted ${shipmentResult.insertedCount} sample shipments`);

    // Seed sample notifications
    const notificationsCollection = db.collection('notifications');
    
    const sampleNotifications = [
      {
        userId: userId,
        type: 'delivery',
        title: 'Shipment Delivered',
        message: `Your package ${sampleShipments[1].trackingId} has been successfully delivered to London, UK.`,
        isRead: false,
        relatedShipmentId: sampleShipments[1].trackingId,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        userId: userId,
        type: 'update',
        title: 'Shipment Update',
        message: `Package ${sampleShipments[0].trackingId} is now in transit and expected to arrive soon.`,
        isRead: false,
        relatedShipmentId: sampleShipments[0].trackingId,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        userId: userId,
        type: 'alert',
        title: 'Welcome to Nivamore!',
        message: 'Thank you for registering. Start by creating your first shipment.',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];

    const notificationResult = await notificationsCollection.insertMany(sampleNotifications);
    console.log(`✅ Inserted ${notificationResult.insertedCount} sample notifications`);

    console.log('\n🎉 Sample data seeded successfully!');
    console.log('\n📦 Sample Tracking IDs:');
    sampleShipments.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.trackingId} - ${s.status}`);
    });

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

seedSampleData();

