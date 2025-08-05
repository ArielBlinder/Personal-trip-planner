#!/usr/bin/env node

/**
 * Setup Verification Script for Personal Trip Planner
 * This script checks if all prerequisites are installed and configured correctly.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Personal Trip Planner - Setup Verification\n');

const checks = {
    passed: 0,
    failed: 0,
    warnings: 0
};

function checkResult(name, success, message = '') {
    if (success) {
        console.log(`✅ ${name}`);
        checks.passed++;
    } else {
        console.log(`❌ ${name}${message ? ': ' + message : ''}`);
        checks.failed++;
    }
}

function warningResult(name, message = '') {
    console.log(`⚠️  ${name}${message ? ': ' + message : ''}`);
    checks.warnings++;
}

// Check Node.js
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const versionNumber = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (versionNumber >= 16) {
        checkResult(`Node.js ${nodeVersion}`, true);
    } else {
        checkResult(`Node.js ${nodeVersion}`, false, 'Version 16+ required');
    }
} catch (error) {
    checkResult('Node.js', false, 'Not installed');
}

// Check npm
try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    checkResult(`npm ${npmVersion}`, true);
} catch (error) {
    checkResult('npm', false, 'Not installed');
}

// Check MongoDB
try {
    execSync('mongosh --eval "db.runCommand({ping: 1})" --quiet', { encoding: 'utf8' });
    checkResult('MongoDB Connection', true);
} catch (error) {
    checkResult('MongoDB Connection', false, 'MongoDB not running or not installed');
}

// Check if server dependencies are installed
const serverNodeModules = path.join(__dirname, 'server', 'node_modules');
if (fs.existsSync(serverNodeModules)) {
    checkResult('Server Dependencies', true);
} else {
    checkResult('Server Dependencies', false, 'Run "cd server && npm install"');
}

// Check if client dependencies are installed
const clientNodeModules = path.join(__dirname, 'client', 'node_modules');
if (fs.existsSync(clientNodeModules)) {
    checkResult('Client Dependencies', true);
} else {
    checkResult('Client Dependencies', false, 'Run "cd client && npm install"');
}

// Check .env file
const envFile = path.join(__dirname, 'server', '.env');
if (fs.existsSync(envFile)) {
    checkResult('.env file exists', true);
    
    // Check .env contents
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    if (envContent.includes('MONGODB_URI=')) {
        checkResult('MongoDB URI configured', true);
    } else {
        warningResult('MongoDB URI', 'Not configured in .env');
    }
    
    if (envContent.includes('JWT_SECRET=') && !envContent.includes('your_super_secret')) {
        checkResult('JWT Secret configured', true);
    } else {
        warningResult('JWT Secret', 'Using default value or not configured');
    }
    
    if (envContent.includes('GEMINI_API_KEY=') && !envContent.includes('your_gemini_api_key_here')) {
        checkResult('Gemini API Key configured', true);
    } else {
        warningResult('Gemini API Key', 'Not configured - AI features will not work');
    }
} else {
    checkResult('.env file', false, 'Create .env file in server directory');
}

// Check Git
try {
    const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
    checkResult(`Git ${gitVersion.replace('git version ', '')}`, true);
} catch (error) {
    warningResult('Git', 'Not installed (optional for running the app)');
}

console.log('\n📊 Setup Summary:');
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);

if (checks.failed > 0) {
    console.log('\n❗ Please fix the failed checks before running the application.');
    console.log('📖 See INSTALLATION_GUIDE.md for detailed setup instructions.');
    process.exit(1);
} else if (checks.warnings > 0) {
    console.log('\n⚠️  Some optional features may not work due to warnings above.');
    console.log('🚀 You can still run the application!');
} else {
    console.log('\n🎉 All checks passed! You\'re ready to run the application.');
    console.log('\n🚀 To start the application:');
    console.log('   Terminal 1: cd server && npm run dev');
    console.log('   Terminal 2: cd client && npm start');
}