import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextRequest, NextResponse } from "next/server";

const OutlookProvider = {
  id: "outlook",
  name: "Outlook",
  type: 'oauth' as const,
  authorization: {
    url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    params: { scope: "openid email profile" },
  },
  token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  userinfo: {
    url: "https://graph.microsoft.com/oidc/userinfo",
  },
  clientId: process.env.MICROSOFT_CLIENT_ID!,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  profile(profile: any) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
};

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    OutlookProvider,
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        // TODO: Gerçek kullanıcı veritabanı ile değiştirilecek
        if (
          credentials?.email === "test@example.com" &&
          credentials?.password === "password123"
        ) {
          return { id: "1", name: "Test User", email: "test@example.com" };
        }
        return null;
      },
    }),
  ],
  // İsteğe bağlı: callback, session, vs. eklenebilir
});

export { handler as GET, handler as POST }; 