import mongoose, { Schema, Model } from 'mongoose';
import { BaseDocument } from './Base';

export enum PracticeSetType {
  CHAPTER_PRACTICE = 'chapter_practice',
  REVISION_PRACTICE = 'revision_practice',
  SPEED_PRACTICE = 'speed_practice',
  MIXED_PRACTICE = 'mixed_practice',
}

export interface IPracticeSet extends BaseDocument {
  name: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed' | 'all';
  type: PracticeSetType;
  subject?: mongoose.Types.ObjectId;
  grade?: mongoose.Types.ObjectId;
  chapter?: mongoose.Types.ObjectId;
  topic?: mongoose.Types.ObjectId;
  questions: mongoose.Types.ObjectId[];
  sections: {
    name: string;
    instructions?: string;
    questions: mongoose.Types.ObjectId[];
  }[];
  timeLimit: number;
  attemptsAllowed: number;
  availability: {
    startDate: Date;
    endDate: Date;
  };
  isPublished: boolean;
  coverImage?: string;
  createdBy: mongoose.Types.ObjectId;
  analytics: {
    totalAttempts: number;
    completionRate: number;
    averageScore: number;
    averageTime: number;
  };
}

const PracticeSetSchema = new Schema<IPracticeSet>(
  {
    name: {
      type: String,
      required: [true, 'Practice set name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed', 'all'],
      default: 'mixed',
    },
    type: {
      type: String,
      required: [true, 'Practice set type is required'],
      enum: Object.values(PracticeSetType),
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    grade: {
      type: Schema.Types.ObjectId,
      ref: 'Grade',
    },
    chapter: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    },
    topic: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
    },
    questions: [{
      type: Schema.Types.ObjectId,
      ref: 'Question',
    }],
    sections: [{
      name: { type: String, required: true, trim: true },
      instructions: { type: String, trim: true, maxlength: 1000 },
      questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    }],
    timeLimit: {
      type: Number,
      required: [true, 'Time limit is required'],
      default: 1800,
    },
    attemptsAllowed: {
      type: Number,
      required: [true, 'Attempts allowed is required'],
      default: 3,
    },
    availability: {
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
    analytics: {
      totalAttempts: {
        type: Number,
        default: 0,
      },
      completionRate: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      averageTime: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

PracticeSetSchema.index({ subject: 1, grade: 1 });
PracticeSetSchema.index({ type: 1 });
PracticeSetSchema.index({ isPublished: 1 });
PracticeSetSchema.index({ 'availability.startDate': 1, 'availability.endDate': 1 });

// In development, delete the cached model so schema changes are picked up on hot reload


let PracticeSetModel: Model<IPracticeSet>;
try {
  PracticeSetModel = mongoose.model<IPracticeSet>('PracticeSet');
} catch {
  PracticeSetModel = mongoose.model<IPracticeSet>('PracticeSet', PracticeSetSchema);
}

export default PracticeSetModel;
