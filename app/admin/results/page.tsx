import { auth, isAdmin } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import ResultModel from '@/models/Result';
import { IUser } from '@/models/User';
import GlassCard from '@/components/ui/GlassCard';
import { Award } from 'lucide-react';

export default async function ResultsPage() {
  const session = await auth();
  
  if (!session || !isAdmin(session.user.role)) {
    redirect('/sign-in');
  }

  await connectDB();

  const results = await ResultModel.find()
    .populate<{ student: Pick<IUser, 'fullName' | 'playerId'> }>('student', 'fullName playerId')
    .sort({ completedAt: -1 })
    .limit(50)
    .lean();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Results</h1>
          <p className="text-gray-600">Latest recorded practice and competition results.</p>
        </div>
      </div>

      {/* Results Table */}
      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Student</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Score</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Accuracy</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Time</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result._id.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-lighter rounded-full flex items-center justify-center text-brand-primary font-bold">
                        {result.student?.fullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{result.student?.fullName || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{result.student?.playerId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                      result.type === 'practice' ? 'bg-blue-100 text-blue-700' :
                      result.type === 'test' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {result.type}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-brand-primary" />
                      <span className="font-semibold text-gray-900">{result.score}/{result.totalMarks || 100}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-semibold ${
                      result.accuracy >= 80 ? 'text-green-600' :
                      result.accuracy >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {result.accuracy}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{result.timeTaken || 'N/A'}</td>
                  <td className="py-4 px-4 text-gray-600">
                    {new Date(result.completedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {results.length === 0 && (
          <div className="text-center py-12">
            <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-2">No results found</p>
            <p className="text-sm text-gray-500">Results will appear here as students complete tests</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
