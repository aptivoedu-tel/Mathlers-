import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import CompetitionModel, { CompetitionStatus } from '@/models/Competition';
import EnrollmentModel from '@/models/Enrollment';
import UserModel from '@/models/User';
import SchoolModel from '@/models/School';
import StudentCompetitionCenter, { CompetitionCard, EnrollmentSummary } from './StudentCompetitionCenter';
import { isValidObjectId } from '@/lib/utils/isValidObjectId';

export default async function CompetitionsPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/sign-in');
  }

  await connectDB();

  const hasValidId = isValidObjectId(session.user.id);
  const rawEnrollments = hasValidId 
    ? await EnrollmentModel.find({ student: session.user.id }) 
    : [];

  const enrollments = JSON.parse(JSON.stringify(rawEnrollments)) as Array<EnrollmentSummary & { competition: string }>;

  const enrollmentMap: Record<string, EnrollmentSummary> = {};
  const enrolledCompIds: string[] = [];

  enrollments.forEach((e) => {
    const compId = e.competition.toString();
    enrollmentMap[compId] = e;
    enrolledCompIds.push(compId);
  });

  const publicStatuses = [
    CompetitionStatus.REGISTRATION_OPEN,
    CompetitionStatus.REGISTRATION_CLOSED,
    CompetitionStatus.IN_PROGRESS,
    CompetitionStatus.PAUSED,
    CompetitionStatus.COMPLETED,
  ];

  const user = hasValidId ? await UserModel.findById(session.user.id).select('school') : null;
  let school = null;
  if (user?.school) {
    school = await SchoolModel.findById(user.school).select('assignedCompetitions');
  }

  const queryOr: any[] = [];
  if (school && school.assignedCompetitions) {
    queryOr.push({ _id: { $in: school.assignedCompetitions } });
  } else {
    queryOr.push({ status: { $in: publicStatuses } });
  }

  if (enrolledCompIds.length) {
    queryOr.push({ _id: { $in: enrolledCompIds } });
  }

  const rawCompetitions = await CompetitionModel.find({
    $or: queryOr,
  }).sort({ 'schedule.competitionStartDate': 1 });

  const competitions = JSON.parse(JSON.stringify(rawCompetitions)) as CompetitionCard[];

  const enrolledCompetitions = competitions.filter((competition) => enrolledCompIds.includes(competition._id.toString()));

  return (
    <StudentCompetitionCenter
      competitions={competitions}
      enrolledCompetitions={enrolledCompetitions}
      enrollmentMap={enrollmentMap}
      studentName={session.user.name || 'Student'}
    />
  );
}
