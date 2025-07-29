"use client";
import { useSession } from "next-auth/react";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";

export default function AuthShowcase() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Yükleniyor...</div>;

  if (!session) return <LoginButton />;

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4">Hoşgeldin, {session.user?.name}!</p>
      <LogoutButton />
    </div>
  );
} 