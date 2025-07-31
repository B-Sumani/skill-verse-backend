const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config');

// Default admin credentials
const DEFAULT_ADMIN = {
  username: 'admin',
  email: 'admin@skillverse.com',
  password: 'admin123',
  role: 'admin',
  profile: {
    firstName: 'Admin',
    lastName: 'User',
    bio: 'System Administrator',
    skills: ['System Administration', 'User Management'],
    interests: ['Platform Development', 'User Experience']
  }
};

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: DEFAULT_ADMIN.email },
        { username: DEFAULT_ADMIN.username }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Username: ${existingAdmin.username}`);
      console.log(`Role: ${existingAdmin.role}`);
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);

    // Create admin user
    const adminUser = new User({
      ...DEFAULT_ADMIN,
      password: hashedPassword
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', DEFAULT_ADMIN.email);
    console.log('👤 Username:', DEFAULT_ADMIN.username);
    console.log('🔑 Password:', DEFAULT_ADMIN.password);
    console.log('👑 Role:', DEFAULT_ADMIN.role);
    console.log('\n⚠️ Please change the default password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createAdminUser(); 