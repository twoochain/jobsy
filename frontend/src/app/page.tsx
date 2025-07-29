"use client";
import Image from "next/image";
import StartButton from "../components/StartButton";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#465DDD] via-[#6e7ff3] to-white">
      <div className="w-full max-w-xl p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-8 bg-white/90 backdrop-blur-md border border-[#e6eaff]">
        <h1 className="text-5xl md:text-6xl font-bold text-[#465DDD] drop-shadow-lg font-changa text-center tracking-tight">
          Jobsy
        </h1>
        <p className="text-xl md:text-2xl text-[#465DDD] font-semibold text-center">
          AI Destekli İş & Staj Takip Asistanı
        </p>
        <div className="my-4">
          <Image src="/favicon.ico" alt="Jobsy Logo" width={72} height={72} className="rounded-full border-4 border-[#465DDD] shadow-md" />
        </div>
        <p className="text-lg md:text-xl text-[#465DDD] text-center font-changa">
          Başvurularını kolayca takip et, <span className="font-extrabold">AI</span> ile analiz et!
        </p>
        <div className="mt-6 flex flex-col gap-2 w-full">
          <StartButton error={error} />
        </div>
      </div>
    </main>
  );
}
