"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

interface Props {
  open: boolean;
  onClose: () => void;
  error?: string | null;
}

export default function LoginRegisterModal({ open, onClose, error }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 transition-all">
      <div className="bg-[#f7f8fa] p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-sm mx-2 relative animate-fade-in flex flex-col gap-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl focus:outline-none">&times;</button>
        <div className="flex gap-1 mb-2 border-b border-[#e6eaff]">
          <button
            className={`flex-1 py-2 font-bold text-base sm:text-lg transition-colors duration-200 ${tab === "login" ? "text-[#465DDD] border-b-2 border-[#465DDD] bg-white" : "text-gray-400 hover:text-[#465DDD]"}`}
            onClick={() => setTab("login")}
          >
            Giriş Yap
          </button>
          <button
            className={`flex-1 py-2 font-bold text-base sm:text-lg transition-colors duration-200 ${tab === "register" ? "text-[#465DDD] border-b-2 border-[#465DDD] bg-white" : "text-gray-400 hover:text-[#465DDD]"}`}
            onClick={() => setTab("register")}
          >
            Kayıt Ol
          </button>
        </div>
        <div className="transition-all duration-300">
          {tab === "login" ? <LoginForm onSuccess={onClose} error={error} /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSuccess, error }: { onSuccess: () => void; error?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok && !res.error) {
      onSuccess();
      window.location.href = "/dashboard";
    } else {
      setFormError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    }
  }
  return (
    <div className="flex flex-col gap-5">
      <OAuthButtons onSuccess={onSuccess} />
      <div className="flex items-center gap-2 my-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-400 text-sm">veya</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          name="email"
          type="email"
          placeholder="E-posta"
          className="border border-[#e6eaff] rounded-lg px-4 py-2 text-base focus:outline-none focus:border-[#465DDD] transition-colors placeholder-gray-400"
          required
        />
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Şifre"
            className="border border-[#e6eaff] rounded-lg px-4 py-2 text-base focus:outline-none focus:border-[#465DDD] transition-colors placeholder-gray-400 w-full pr-10"
            required
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#465DDD] focus:outline-none"
            onClick={() => setShowPassword((v) => !v)}
            aria-label="Şifreyi Göster/Gizle"
          >
            {showPassword ? (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
            ) : (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.8 21.8 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.8 21.8 0 0 1-4.43 5.94M1 1l22 22"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
            )}
          </button>
        </div>
        <button
          type="submit"
          className="bg-[#465DDD] text-white font-bold py-2 rounded-lg mt-2 hover:bg-[#6e7ff3] active:bg-[#465DDD] transition-colors text-base shadow-sm focus:outline-none"
          disabled={loading}
        >
          {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>
        {(formError || error) && <div className="text-red-500 text-sm text-center mt-1">{formError || error}</div>}
      </form>
    </div>
  );
}

function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Ad Soyad"
        className="border border-[#e6eaff] rounded-lg px-4 py-2 text-base focus:outline-none focus:border-[#465DDD] transition-colors placeholder-gray-400"
        required
      />
      <input
        type="email"
        placeholder="E-posta"
        className="border border-[#e6eaff] rounded-lg px-4 py-2 text-base focus:outline-none focus:border-[#465DDD] transition-colors placeholder-gray-400"
        required
      />
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Şifre"
          className="border border-[#e6eaff] rounded-lg px-4 py-2 text-base focus:outline-none focus:border-[#465DDD] transition-colors placeholder-gray-400 w-full pr-10"
          required
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#465DDD] focus:outline-none"
          onClick={() => setShowPassword((v) => !v)}
          aria-label="Şifreyi Göster/Gizle"
        >
          {showPassword ? (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.8 21.8 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.8 21.8 0 0 1-4.43 5.94M1 1l22 22"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
          )}
        </button>
      </div>
      <button
        type="submit"
        className="bg-[#465DDD] text-white font-bold py-2 rounded-lg mt-2 hover:bg-[#6e7ff3] active:bg-[#465DDD] transition-colors text-base shadow-sm focus:outline-none"
      >
        Kayıt Ol
      </button>
      <div className="text-gray-400 text-xs text-center mt-1">Kayıt özelliği yakında aktif olacak.</div>
    </form>
  );
}

function OAuthButtons({ onSuccess }: { onSuccess: () => void }) {
  async function handleProvider(provider: string) {
    const res = await signIn(provider, { callbackUrl: "/dashboard" });
    if (res?.ok && !res.error) {
      onSuccess();
    }
  }
  return (
    <div className="flex flex-col gap-3 mb-2">
      <button
        type="button"
        className="flex items-center justify-center gap-3 border border-[#e6eaff] rounded-lg py-2 px-3 font-semibold bg-white hover:bg-[#f0f3ff] active:bg-[#e6eaff] transition-colors text-[#465DDD] shadow-sm focus:outline-none"
        onClick={() => handleProvider("google")}
      >
        <span className="flex items-center justify-center w-6 h-6">
          <svg width="20" height="20" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.9 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 6.3 28.1 4 22 4 11.5 4 3 12.5 3 23s8.5 19 19 19c9.5 0 18-7.5 18-19 0-1.3-.1-2.7-.3-4z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 17.1 19.2 14 24 14c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 6.3 28.1 4 22 4 11.5 4 3 12.5 3 23s8.5 19 19 19c9.5 0 18-7.5 18-19 0-1.3-.1-2.7-.3-4z"/><path fill="#FBBC05" d="M24 44c5.9 0 10.7-2.9 13.7-7.4l-7-5.1C29.9 33.1 27.1 34.5 24 34.5c-5.1 0-9.4-3.4-10.9-8.1l-7 5.1C8.5 39.5 15.7 44 24 44z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.1 3.1-4.1 5.5-7.7 5.5-5.1 0-9.4-3.4-10.9-8.1l-7 5.1C8.5 39.5 15.7 44 24 44c9.5 0 18-7.5 18-19 0-1.3-.1-2.7-.3-4z"/></g></svg>
        </span>
        Google ile Giriş Yap
      </button>
      <button
        type="button"
        className="flex items-center justify-center gap-3 border border-[#e6eaff] rounded-lg py-2 px-3 font-semibold bg-white hover:bg-[#f0f3ff] active:bg-[#e6eaff] transition-colors text-[#465DDD] shadow-sm focus:outline-none"
        onClick={() => handleProvider("outlook")}
      >
        <span className="flex items-center justify-center w-6 h-6">
          <svg width="20" height="20" viewBox="0 0 48 48"><g><rect width="48" height="48" rx="8" fill="#0078D4"/><path fill="#fff" d="M24 14c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></g></svg>
        </span>
        Outlook ile Giriş Yap
      </button>
    </div>
  );
} 