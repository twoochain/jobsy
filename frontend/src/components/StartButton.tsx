"use client";
import { useState, useEffect } from "react";
import LoginRegisterModal from "./LoginRegisterModal";

export default function StartButton({ error }: { error?: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (error) setOpen(true);
  }, [error]);

  return (
    <>
      <button
        className="bg-white text-[#465DDD] font-bold py-3 rounded-xl shadow-lg hover:bg-[#e6eaff] hover:scale-105 transition-all duration-200 text-lg w-full font-changa border-2 border-[#465DDD]"
        onClick={() => setOpen(true)}
      >
        Hemen Başla
      </button>
      <LoginRegisterModal open={open} onClose={() => setOpen(false)} error={error} />
    </>
  );
} 