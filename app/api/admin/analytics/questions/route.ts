import { NextRequest, NextResponse } from 'next/server';
import { auth, isSuperAdmin } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import QuestionModel from '@/models/Question';
import mongoose from 'mongoose';

const timeRanges = new Set(['all', 'today', 'week', 'month', 'year']);
const difficulties = new Set(['easy', 'medium', 'hard']);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isSuperAdmin(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get('subject') || '';
    const grade = searchParams.get('grade') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const timeRange = searchParams.get('timeRange') || 'all';

    if ((subject && !mongoose.isValidObjectId(subject)) || (grade && !mongoose.isValidObjectId(grade))) {
      return NextResponse.json({ error: 'Invalid subject or grade filter' }, { status: 400 });
    }
    if (difficulty && !difficulties.has(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty filter' }, { status: 400 });
    }
    if (!timeRanges.has(timeRange)) {
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 });
    }

    await connectDB();

    // Build match stage
    const matchStage: Record<string, unknown> = {};
    
    if (subject) matchStage.subject = new mongoose.Types.ObjectId(subject);
    if (grade) matchStage.grade = new mongoose.Types.ObjectId(grade);
    if (difficulty) matchStage.difficulty = difficulty;
    
    if (timeRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      matchStage['analytics.lastUsedDate'] = { $gte: startDate };
    }

    // Overall statistics
    const overallStats = await QuestionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          totalAttempts: { $sum: '$analytics.totalAttempts' },
          totalCorrect: { $sum: '$analytics.totalCorrect' },
          totalIncorrect: { $sum: '$analytics.totalIncorrect' },
          avgCorrectPercentage: { $avg: '$analytics.correctPercentage' },
          avgDifficultyIndex: { $avg: '$analytics.difficultyIndex' },
          totalUsageInPractice: { $sum: '$analytics.usageInPractice' },
          totalUsageInTests: { $sum: '$analytics.usageInTests' },
          totalUsageInCompetitions: { $sum: '$analytics.usageInCompetitions' }
        }
      }
    ]);

    // Statistics by difficulty
    const statsByDifficulty = await QuestionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          avgCorrectPercentage: { $avg: '$analytics.correctPercentage' },
          totalAttempts: { $sum: '$analytics.totalAttempts' },
          avgDifficultyIndex: { $avg: '$analytics.difficultyIndex' }
        }
      }
    ]);

    // Top 10 most attempted questions
    const topAttemptedQuestions = await QuestionModel.find(matchStage)
      .sort({ 'analytics.totalAttempts': -1 })
      .limit(10)
      .populate('subject', 'name')
      .populate('grade', 'name')
      .select('question difficulty analytics.totalAttempts analytics.correctPercentage')
      .lean();

    // Top 10 hardest questions (lowest correct percentage)
    const hardestQuestions = await QuestionModel.find({
      ...matchStage,
      'analytics.totalAttempts': { $gt: 0 }
    })
      .sort({ 'analytics.correctPercentage': 1 })
      .limit(10)
      .populate('subject', 'name')
      .populate('grade', 'name')
      .select('question difficulty analytics.totalAttempts analytics.correctPercentage')
      .lean();

    // Top 10 easiest questions (highest correct percentage)
    const easiestQuestions = await QuestionModel.find({
      ...matchStage,
      'analytics.totalAttempts': { $gt: 0 }
    })
      .sort({ 'analytics.correctPercentage': -1 })
      .limit(10)
      .populate('subject', 'name')
      .populate('grade', 'name')
      .select('question difficulty analytics.totalAttempts analytics.correctPercentage')
      .lean();

    // Questions by status
    const statsByStatus = await QuestionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overall: overallStats[0] || {
          totalQuestions: 0,
          totalAttempts: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          avgCorrectPercentage: 0,
          avgDifficultyIndex: 0,
          totalUsageInPractice: 0,
          totalUsageInTests: 0,
          totalUsageInCompetitions: 0
        },
        byDifficulty: statsByDifficulty,
        byStatus: statsByStatus,
        topAttempted: topAttemptedQuestions,
        hardest: hardestQuestions,
        easiest: easiestQuestions
      }
    });
  } catch (error) {
    console.error('Error fetching question analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question analytics' },
      { status: 500 }
    );
  }
}
