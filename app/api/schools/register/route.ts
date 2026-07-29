import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/mongodb';
import SchoolModel from '@/models/School';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      countryCode = '+92',
      contactNumber,
      username,
      password,
      confirmPassword,
      contactPerson,
      address,
      city,
    } = body;

    // Validate required fields
    if (!name || !email || !contactNumber || !username || !password || !address || !city) {
      return NextResponse.json(
        { error: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();
    const fullContactNumber = contactNumber.startsWith('+') ? contactNumber : `${countryCode} ${contactNumber.trim()}`;

    await connectDB();

    // Check for existing school requests or records with matching email or username
    const existingSchools = await SchoolModel.find({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    // Check if any matched record is Blocked
    const isBlocked = existingSchools.some((s) => s.status === 'Blocked');
    if (isBlocked) {
      return NextResponse.json(
        { error: 'This email or username has been blocked from registering.' },
        { status: 403 }
      );
    }

    // Check if any matched record is Pending or Approved
    const isAlreadyRegistered = existingSchools.some(
      (s) => s.status === 'Pending' || s.status === 'Approved'
    );
    if (isAlreadyRegistered) {
      return NextResponse.json(
        { error: 'A school request with this email or username is already registered or pending approval.' },
        { status: 400 }
      );
    }

    // If existing records were Rejected, remove them so a fresh Pending request can be created
    if (existingSchools.length > 0) {
      await SchoolModel.deleteMany({
        _id: { $in: existingSchools.map((s) => s._id) },
        status: 'Rejected',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const school = await SchoolModel.create({
      name: name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      password: hashedPassword,
      contactPerson: contactPerson ? contactPerson.trim() : undefined,
      contactNumber: fullContactNumber,
      address: address.trim(),
      city: city.trim(),
      status: 'Pending',
      isActive: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your registration request has been submitted successfully. You will be notified via email once your request has been reviewed.',
        schoolId: school._id.toString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error registering school:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit registration request. Please try again.' },
      { status: 500 }
    );
  }
}
