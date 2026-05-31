import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // This is where you would check the database for the user
        // For now, we allow access with a default admin account
        const isUserValid = credentials?.username === "admin" || 
                            credentials?.username === "admin@qcargo.com" ||
                            credentials?.username === "admin@durdurcargo.com" || 
                            credentials?.username === "admin@qcargo.com";
        const isPasswordValid = credentials?.password === "durdur2024" || 
                                credentials?.password === "qcargo2024";

        if (isUserValid && isPasswordValid) {
          return { id: "1", name: "Admin Agent", email: "admin@qcargo.com" };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
