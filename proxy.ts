import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const isLoginPage = req.nextUrl.pathname === "/admin/login";
      if (isLoginPage) return true;
      return !!token;
    },
  },
});

export const config = { 
  matcher: ["/admin", "/admin/:path*"] 
};
