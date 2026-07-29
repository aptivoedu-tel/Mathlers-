import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db/mongodb";
import UserModel, { UserRole } from "@/models/User";
import SchoolModel from "@/models/School";
import bcrypt from "bcryptjs";

export type MathlersSession = {
  user: { id: string; email: string; name: string; role: UserRole; playerId: string };
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email/Username and password are required");
        }
        await connectDB();
        const input = credentials.email.trim().toLowerCase();

        // 1. Try finding in UserModel
        const user = await UserModel.findOne({
          $or: [{ email: input }, { playerId: input }]
        }).select("+password");

        if (user) {
          // Check if associated school is status-restricted
          if (user.school) {
            const school = await SchoolModel.findById(user.school);
            if (school) {
              if (school.status === "Pending") {
                throw new Error("Your school registration request is currently pending approval.");
              }
              if (school.status === "Rejected") {
                throw new Error("Your school registration request was not approved.");
              }
              if (school.status === "Blocked") {
                throw new Error("This school account has been blocked.");
              }
            }
          }

          if (!user.isActive) throw new Error("Account is inactive");
          if (user.isSuspended) throw new Error("Account is suspended");

          const isValid = await bcrypt.compare(credentials.password, user.password || "");
          if (!isValid) throw new Error("Incorrect password");

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName,
            role: user.role,
            playerId: user.playerId,
          };
        }

        // 2. Try finding direct School account
        const school = await SchoolModel.findOne({
          $or: [{ email: input }, { username: input }]
        }).select("+password");

        if (school) {
          if (school.status === "Pending") {
            throw new Error("Your school registration request is currently pending approval.");
          }
          if (school.status === "Rejected") {
            throw new Error("Your school registration request was not approved.");
          }
          if (school.status === "Blocked") {
            throw new Error("This school account has been blocked.");
          }
          if (school.status !== "Approved") {
            throw new Error("Your school account is not authorized to sign in.");
          }

          const isValid = await bcrypt.compare(credentials.password, school.password || "");
          if (!isValid) throw new Error("Incorrect password");

          return {
            id: school._id.toString(),
            email: school.email || `${school.username}@school.mathlers.com`,
            name: school.name,
            role: UserRole.ADMIN,
            playerId: school.username || school.name,
          };
        }

        throw new Error("No account found with that email or username.");
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.playerId = (user as any).playerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).playerId = token.playerId;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function auth(): Promise<MathlersSession | null> {
  const session = await getServerSession(authOptions);
  return session as MathlersSession | null;
}

export const isAdmin = (role?: string) => role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
export const isSuperAdmin = (role?: string) => role === UserRole.SUPER_ADMIN;
export const isTeacher = (role?: string) => role === UserRole.TEACHER;
export const canManageContent = (role?: string) => isTeacher(role) || isAdmin(role);
export const canManageSchoolOperations = (role?: string) => isAdmin(role);
