const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local to avoid needing the dotenv package
try {
  const envPath = path.join(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
} catch (e) {
  console.error('Could not load .env.local file. Proceeding with existing environment variables.');
}

async function createDeveloperAccount() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const email = 'developer@mathlers.com';
    const password = 'mathler6622';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a unique playerId
    const playerId = `MTH-${new Date().getFullYear().toString().slice(-2)}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const db = mongoose.connection.db;
    
    // Using raw mongodb driver to avoid compiling the schema in a standalone script
    const result = await db.collection('users').updateOne(
      { email },
      {
        $set: {
          fullName: 'Mathlers Developer',
          email: email,
          password: hashedPassword,
          role: 'super_admin',
          playerId: playerId,
          isEmailVerified: true,
          profileComplete: true,
          isActive: true,
          isSuspended: false,
          level: 1,
          points: 0,
          accuracy: 0,
          currentStreak: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          competitionsJoined: 0,
          competitionsWon: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log(`Developer account successfully created: ${email}`);
    } else {
      console.log(`Developer account successfully updated: ${email}`);
    }

  } catch (error) {
    console.error('Error creating developer account:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createDeveloperAccount();
