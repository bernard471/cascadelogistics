const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGO;

async function seedAdminData() {
  if (!uri) {
    console.error('❌ MONGO environment variable not found');
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('guangzhou');

    // Seed Staff Members
    const staffCollection = db.collection('staff');
    
    const sampleStaff = [
      {
        firstName: 'Sarah',
        lastName: 'Manager',
        email: 'sarah.m@nivamore.com',
        phone: '+971 55 234 5678',
        role: 'manager',
        department: 'Operations',
        joinDate: new Date('2022-03-20'),
        status: 'active',
        employeeId: 'EMP001',
        createdAt: new Date('2022-03-20'),
        updatedAt: new Date()
      },
      {
        firstName: 'James',
        lastName: 'Operator',
        email: 'james.o@nivamore.com',
        phone: '+971 54 345 6789',
        role: 'operator',
        department: 'Operations',
        joinDate: new Date('2022-06-10'),
        status: 'active',
        employeeId: 'EMP002',
        createdAt: new Date('2022-06-10'),
        updatedAt: new Date()
      },
      {
        firstName: 'Lisa',
        lastName: 'Support',
        email: 'lisa.s@nivamore.com',
        phone: '+971 56 456 7890',
        role: 'support',
        department: 'Customer Service',
        joinDate: new Date('2022-08-15'),
        status: 'active',
        employeeId: 'EMP003',
        createdAt: new Date('2022-08-15'),
        updatedAt: new Date()
      },
      {
        firstName: 'Mike',
        lastName: 'Driver',
        email: 'mike.d@nivamore.com',
        phone: '+971 58 567 8901',
        role: 'driver',
        department: 'Logistics',
        joinDate: new Date('2023-01-20'),
        status: 'active',
        employeeId: 'EMP004',
        createdAt: new Date('2023-01-20'),
        updatedAt: new Date()
      },
      {
        firstName: 'Emma',
        lastName: 'Warehouse',
        email: 'emma.w@nivamore.com',
        phone: '+971 52 678 9012',
        role: 'warehouse-staff',
        department: 'Warehouse',
        joinDate: new Date('2023-03-12'),
        status: 'on-leave',
        employeeId: 'EMP005',
        createdAt: new Date('2023-03-12'),
        updatedAt: new Date()
      }
    ];

    const staffResult = await staffCollection.insertMany(sampleStaff);
    console.log(`✅ Inserted ${staffResult.insertedCount} staff members`);

    console.log('\n🎉 Admin sample data seeded successfully!');
    console.log('\n👥 Staff Members:');
    sampleStaff.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.firstName} ${s.lastName} - ${s.role} (${s.department})`);
    });
    
    console.log('\n📊 Admin Dashboard is ready to test!');
    console.log('   Login with your separately configured admin credentials');
    console.log('   URL: http://localhost:3000/admin-dashboard');

  } catch (error) {
    console.error('❌ Error seeding admin data:', error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

seedAdminData();
