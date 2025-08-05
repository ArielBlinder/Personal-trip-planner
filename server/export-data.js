#!/usr/bin/env node

/**
 * Data Export Script for Personal Trip Planner
 * 
 * This script exports your current MongoDB data to JSON files
 * so you can easily migrate to a new installation.
 * 
 * Usage: node export-data.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Route = require('./models/Route');
require('dotenv').config();

const exportData = async () => {
  try {
    console.log('🔄 Starting data export...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trip-planner', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Create backup directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `backup_${timestamp}`;
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Export Users
    console.log('📥 Exporting users...');
    const users = await User.find({}).lean();
    const usersFilePath = path.join(backupDir, 'users_export.json');
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    console.log(` Exported ${users.length} users to ${usersFilePath}`);

    // Export Routes
    console.log('📥 Exporting routes...');
    const routes = await Route.find({}).lean();
    const routesFilePath = path.join(backupDir, 'routes_export.json');
    fs.writeFileSync(routesFilePath, JSON.stringify(routes, null, 2));
    console.log(` Exported ${routes.length} routes to ${routesFilePath}`);

    // Create README for the backup
    const readmeContent = `# Data Backup - ${new Date().toISOString()}

This backup contains your Personal Trip Planner data.

## Files:
- \`users_export.json\` - User accounts and authentication data
- \`routes_export.json\` - Saved trip routes and plans

## To restore this data on a new installation:

1. Copy these files to your new server directory
2. Rename \`users_export.json\` to \`users.json\`
3. Run: \`npm run migrate\`

Or use mongorestore if you prefer:
\`\`\`bash
mongorestore --db trip-planner --collection users users_export.json
mongorestore --db trip-planner --collection routes routes_export.json
\`\`\`

Generated: ${new Date().toISOString()}
Total Users: ${users.length}
Total Routes: ${routes.length}
`;

    fs.writeFileSync(path.join(backupDir, 'README.md'), readmeContent);

    console.log('\n🎉 Data export completed successfully!');
    console.log(`📁 Backup saved to: ${backupDir}/`);
    console.log('\n📋 Next steps:');
    console.log(`1. Copy the "${backupDir}" folder to your new computer`);
    console.log('2. Follow the README.md on the new computer');
    console.log('3. Use the exported JSON files for data migration');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
};

// Run the export
exportData();