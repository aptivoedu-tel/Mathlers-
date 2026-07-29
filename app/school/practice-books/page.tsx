import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import UserModel from '@/models/User';
import SchoolModel from '@/models/School';
import PracticeSetModel from '@/models/PracticeSet';
import PageHeader from '@/components/ui/PageHeader';
import SchoolPracticeBooksClient from './SchoolPracticeBooksClient';
import SubjectModel from '@/models/Subject';
import GradeModel from '@/models/Grade';

export default async function SchoolPracticeBooksPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  await connectDB();

  let school = null;
  const user = await UserModel.findById(session.user.id).select('school');
  if (user?.school) {
    school = await SchoolModel.findById(user.school);
  } else {
    school = await SchoolModel.findOne({
      $or: [{ email: session.user.email }, { username: session.user.playerId }],
    });
  }

  if (!school) {
    return <div>School not found</div>;
  }

  // Fetch all published practice sets
  const rawPracticeSets = await PracticeSetModel.find({
    isPublished: true
  })
    .populate({ path: 'subject', model: SubjectModel, select: 'name' })
    .populate({ path: 'grade', model: GradeModel, select: 'name' })
    .sort({ createdAt: -1 })
    .lean();

  const serializedPracticeSets = rawPracticeSets.map((ps: any) => ({
    _id: ps._id.toString(),
    name: ps.name,
    difficulty: ps.difficulty,
    type: ps.type,
    subjectName: ps.subject?.name || 'General',
    gradeName: ps.grade?.name || 'All Grades',
  }));

  const assignedPracticeIds = school.assignedPracticeSets?.map(id => id.toString()) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Practice Books Management"
        subtitle="Select which practice books are available to your students."
        breadcrumbs={[
          { label: 'School Portal', href: '/school/dashboard' },
          { label: 'Practice Books' },
        ]}
      />
      <SchoolPracticeBooksClient 
        practiceSets={serializedPracticeSets} 
        initialAssignedIds={assignedPracticeIds} 
      />
    </div>
  );
}
