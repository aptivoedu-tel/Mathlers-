import connectDB from '@/lib/db/mongodb';
import SchoolModel from '@/models/School';
import UserModel from '@/models/User';
import { auth, isSuperAdmin } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import AdminSchoolsClient, { SerializedSchool } from './AdminSchoolsClient';

export default async function SchoolsPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  await connectDB();
  const operator = await UserModel.findById(session.user.id).select('school');
  const query = isSuperAdmin(session.user.role) ? {} : { _id: operator?.school };

  const rawSchools = await SchoolModel.find(query)
    .sort({ createdAt: -1 })
    .lean();

  const serializedSchools: SerializedSchool[] = rawSchools.map((school: any) => ({
    _id: school._id.toString(),
    name: school.name,
    domain: school.domain,
    username: school.username,
    contactPerson: school.contactPerson || school.coordinatorName,
    contactNumber: school.contactNumber || 'N/A',
    email: school.email,
    address: school.address || 'N/A',
    city: school.city,
    status: school.status || (school.isActive ? 'Approved' : 'Pending'),
    totalStudents: school.totalStudents || 0,
    activeStudents: school.activeStudents || 0,
    createdAt: school.createdAt ? new Date(school.createdAt).toISOString() : new Date().toISOString(),
  }));

  const totalStudents = serializedSchools.reduce((total, school) => total + school.totalStudents, 0);

  return (
    <AdminSchoolsClient
      initialSchools={serializedSchools}
      totalStudents={totalStudents}
    />
  );
}
