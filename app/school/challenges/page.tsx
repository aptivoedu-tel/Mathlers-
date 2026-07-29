import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import UserModel from '@/models/User';
import SchoolModel from '@/models/School';
import CompetitionModel from '@/models/Competition';
import PageHeader from '@/components/ui/PageHeader';
import SchoolChallengesClient from './SchoolChallengesClient';

export default async function SchoolChallengesPage() {
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

  // Fetch all active/upcoming competitions that schools can assign
  const rawCompetitions = await CompetitionModel.find({
    status: { $in: ['registration_open', 'registration_closed', 'in_progress', 'upcoming'] }
  }).sort({ 'schedule.competitionStartDate': 1 }).lean();

  const serializedCompetitions = rawCompetitions.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
    category: c.category,
    difficultyLevel: c.difficultyLevel,
    status: c.status,
  }));

  const assignedCompIds = school.assignedCompetitions?.map(id => id.toString()) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Challenges Management"
        subtitle="Select which challenges (competitions) are available to your students."
        breadcrumbs={[
          { label: 'School Portal', href: '/school/dashboard' },
          { label: 'Challenges' },
        ]}
      />
      <SchoolChallengesClient 
        competitions={serializedCompetitions} 
        initialAssignedIds={assignedCompIds} 
      />
    </div>
  );
}
