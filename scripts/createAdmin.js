const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '..', 'enterprise-time-trackin-firebase-adminsdk-fbsvc-cab31ad1df.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'enterprise-time-trackin'
});

const db = admin.firestore();
const auth = admin.auth();

async function createAdminUser() {
  try {
    console.log('🚀 Starting admin user creation...\n');

    const adminEmail = 'admin@company.com';
    const adminPassword = 'Admin@123123';
    const adminUsername = 'admin';

    // Step 1: Check if user already exists in Authentication
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminEmail);
      console.log('⚠️  User already exists in Firebase Authentication');
      console.log('   UID:', userRecord.uid);
      console.log('   Email:', userRecord.email);
      console.log('\n🔄 Updating password...');
      
      // Update password
      await auth.updateUser(userRecord.uid, {
        password: adminPassword
      });
      console.log('✅ Password updated successfully');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('📝 Creating new user in Firebase Authentication...');
        userRecord = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          emailVerified: true,
          disabled: false
        });
        console.log('✅ User created in Authentication');
        console.log('   UID:', userRecord.uid);
        console.log('   Email:', userRecord.email);
      } else {
        throw error;
      }
    }

    // Step 2: Create/Update user document in Firestore
    const userDoc = {
      id: userRecord.uid,
      username: adminUsername,
      fullName: 'Administrator',
      email: adminEmail,
      role: 'admin',
      department: 'Management',
      position: 'System Administrator',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      notificationsEnabled: true
    };

    console.log('\n📝 Creating/Updating user document in Firestore...');
    await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
    console.log('✅ User document created/updated in Firestore');

    // Step 3: Display summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ADMIN USER CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Email:    admin@company.com');
    console.log('   Password: Admin@123123');
    console.log('\n🔑 User Details:');
    console.log('   UID:        ', userRecord.uid);
    console.log('   Role:       ', userDoc.role);
    console.log('   Department: ', userDoc.department);
    console.log('   Position:   ', userDoc.position);
    console.log('   Active:     ', userDoc.isActive);
    console.log('\n💡 You can now login at: http://localhost:3000');
    console.log('   Use either username "admin" or email "admin@company.com"');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    console.error('\nError details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  }
}

// Run the script
createAdminUser();

