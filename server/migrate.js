const fs = require('fs');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const migrateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trip-planner', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB for migration...');

    // Check if users.json exists
    if (!fs.existsSync('users.json')) {
      console.log('users.json file not found. No migration needed.');
      return;
    }

    // Read existing users from JSON file
    const userData = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(userData);

    console.log(`Found ${users.length} users in users.json`);

    // Filter out users with empty username or email
    const validUsers = users.filter(user => 
      user.username && user.username.trim() !== '' && 
      user.email && user.email.trim() !== ''
    );

    console.log(`${validUsers.length} valid users found (excluding empty entries)`);

    // Check if any users already exist in MongoDB
    const existingUsersCount = await User.countDocuments();
    if (existingUsersCount > 0) {
      console.log(`Warning: ${existingUsersCount} users already exist in MongoDB`);
      console.log('Migration will skip duplicate emails...');
    }

    // Migrate users to MongoDB
    let migratedCount = 0;
    let skippedCount = 0;

    for (const userData of validUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`Skipping existing user: ${userData.email}`);
          skippedCount++;
          continue;
        }

        // Create new user
        const user = new User({
          username: userData.username,
          email: userData.email,
          password: userData.password // Already hashed
        });

        await user.save();
        console.log(`Migrated user: ${userData.username} (${userData.email})`);
        migratedCount++;
      } catch (error) {
        console.error(`Error migrating user ${userData.email}:`, error.message);
      }
    }

    console.log(`\nMigration completed:`);
    console.log(`- Migrated: ${migratedCount} users`);
    console.log(`- Skipped: ${skippedCount} users`);
    console.log(`- Total valid users in JSON: ${validUsers.length}`);

    // Backup the original file
    const backupName = `users_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.copyFileSync('users.json', backupName);
    console.log(`\nOriginal users.json backed up as: ${backupName}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUsers();
}

module.exports = migrateUsers;