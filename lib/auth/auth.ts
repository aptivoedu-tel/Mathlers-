import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db/mongodb";
import UserModel, { UserRole } from "@/models/User";
import bcrypt from "bcryptjs";

export type MathlersSession = {
  user: { id: string; email: string; name: string; role: UserRole; playerId: string };
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }
        await connectDB();
        const user = await UserModel.findOne({
          email: credentials.email.toLowerCase()
        }).select("+password");

        if (!user) throw new Error("No account found with that email");
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
