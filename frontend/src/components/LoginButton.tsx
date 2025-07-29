"use client";
import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <button
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow"
      onClick={() => signIn("google")}
    >
      Google ile Giriş Yap
    </button>
  );
} 