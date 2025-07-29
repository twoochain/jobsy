"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
      onClick={() => signOut()}
    >
      Çıkış Yap
    </button>
  );
} 