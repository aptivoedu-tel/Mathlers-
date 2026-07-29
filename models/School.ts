import mongoose, { Schema, Model } from 'mongoose';
import { BaseDocument } from './Base';

export type SchoolStatus = 'Pending' | 'Approved' | 'Rejected' | 'Blocked';

export interface ISchool extends BaseDocument {
  name: string;
  domain?: string;
  username?: string;
  password?: string;
  contactPerson?: string;
  address: string;
  city: string;
  coordinator?: mongoose.Types.ObjectId;
  coordinatorName?: string;
  contactNumber: string;
  email?: string;
  status: SchoolStatus;
  totalStudents: number;
  activeStudents: number;
  averageAccuracy: number;
  competitionsParticipated: number;
  competitionsWon: number;
  schoolRank?: number;
  assignedCompetitions: mongoose.Types.ObjectId[];
  assignedPracticeSets: mongoose.Types.ObjectId[];
  isActive: boolean;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: {
      type: String,
      required: [true, 'School name is required'],
      trim: true,
    },
    domain: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    username: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    password: {
      type: String,
      select: false,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    coordinator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    coordinatorName: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Blocked'],
      default: 'Pending',
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    activeStudents: {
      type: Number,
      default: 0,
    },
    averageAccuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    competitionsParticipated: {
      type: Number,
      default: 0,
    },
    competitionsWon: {
      type: Number,
      default: 0,
    },
    schoolRank: {
      type: Number,
    },
    assignedCompetitions: [{
      type: Schema.Types.ObjectId,
      ref: 'Competition',
    }],
    assignedPracticeSets: [{
      type: Schema.Types.ObjectId,
      ref: 'PracticeSet',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

SchoolSchema.index({ name: 1 });
SchoolSchema.index({ domain: 1 });
SchoolSchema.index({ email: 1 });
SchoolSchema.index({ username: 1 });
SchoolSchema.index({ status: 1 });
SchoolSchema.index({ city: 1 });
SchoolSchema.index({ coordinator: 1 });
SchoolSchema.index({ totalStudents: -1 });
SchoolSchema.index({ schoolRank: 1 });

let SchoolModel: Model<ISchool>;
try {
  SchoolModel = mongoose.model<ISchool>('School');
} catch {
  SchoolModel = mongoose.model<ISchool>('School', SchoolSchema);
}

export default SchoolModel;
