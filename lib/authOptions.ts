import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongoose';
import AdminUser from '@/lib/models/AdminUser';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        try {
          await connectDB();
          const user = await AdminUser.findOne({
            $or: [
              { username: credentials.username.toLowerCase() },
              { email:    credentials.username.toLowerCase() },
            ],
            active: true,
          });
          if (!user) return null;
          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;
          return {
            id:    String(user._id),
            name:  user.name,
            email: user.email,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            role:  user.role as any,
          };
        } catch (err) {
          console.error('Auth error:', err);
          return null;
        }
      },
    }),
  ],
  pages:   { signIn: '/admin/login' },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        token.id   = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id   = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
