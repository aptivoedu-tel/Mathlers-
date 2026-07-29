import { auth, isAdmin } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import UserModel from '@/models/User';
import CompetitionModel from '@/models/Competition';
import QuestionModel from '@/models/Question';
import ResultModel from '@/models/Result';
import AdminDashboardView from '@/components/admin/AdminDashboardView';

export default async function AdminDashboard() {
  const session = await auth();

  if (!session || !isAdmin(session.user.role)) {
    redirect('/sign-in');
  }

  await connectDB();

  const [students, competitions, questions, results] = await Promise.all([
    UserModel.countDocuments({ isActive: true }),
    CompetitionModel.estimatedDocumentCount(),
    QuestionModel.estimatedDocumentCount(),
    ResultModel.estimatedDocumentCount()
  ]);

  return (
    <AdminDashboardView
      studentsCount={students}
      competitionsCount={competitions}
      questionsCount={questions}
      resultsCount={results}
    />
  );
}
