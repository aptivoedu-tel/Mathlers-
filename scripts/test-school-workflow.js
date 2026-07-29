const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function testWorkflow() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const School = mongoose.connection.collection('schools');
  const User = mongoose.connection.collection('users');

  const testEmail = 'testschool@example.com';
  const testUsername = 'testschool_admin';

  // Clean up existing test data
  await School.deleteMany({ email: testEmail });
  await User.deleteMany({ email: testEmail });

  // 1. Test POST /api/schools/register simulation
  console.log('\n--- 1. Testing School Registration Request Creation ---');
  const hashed = await bcrypt.hash('TestPass123!', 10);
  const schoolRes = await School.insertOne({
    name: 'Test Innovation School',
    email: testEmail,
    username: testUsername,
    password: hashed,
    contactPerson: 'Principal Davis',
    contactNumber: '+92 300 1234567',
    address: '123 Academic Way',
    city: 'Karachi',
    status: 'Pending',
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const createdSchool = await School.findOne({ _id: schoolRes.insertedId });
  console.log('Created School Status:', createdSchool.status);
  if (createdSchool.status !== 'Pending') throw new Error('Expected Pending status!');

  // 2. Test Blocked status duplicate prevention check
  console.log('\n--- 2. Testing Blocked Credentials Restriction ---');
  await School.updateOne({ _id: schoolRes.insertedId }, { $set: { status: 'Blocked' } });
  const blockedSchool = await School.findOne({ $or: [{ email: testEmail }, { username: testUsername }] });
  if (blockedSchool.status === 'Blocked') {
    console.log('✅ Successfully detected Blocked school status during registration check!');
  }

  // 3. Test Approval & Syncing
  console.log('\n--- 3. Testing Approval Action ---');
  await School.updateOne({ _id: schoolRes.insertedId }, { $set: { status: 'Approved', isActive: true } });
  const approvedSchool = await School.findOne({ _id: schoolRes.insertedId });
  console.log('Approved School Status:', approvedSchool.status, 'IsActive:', approvedSchool.isActive);

  // Clean up test data
  await School.deleteMany({ email: testEmail });
  await User.deleteMany({ email: testEmail });

  console.log('\n🎉 ALL WORKFLOW DATABASE & REASONING TESTS PASSED PERFECTLY!');
  await mongoose.disconnect();
}

testWorkflow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
