"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import EmailIntegration from "../../components/EmailIntegration";
import GmailDebug from "../../components/GmailDebug";

const mockActiveApplications = [
  {
    id: 1,
    company: "Acme Corp",
    position: "Frontend Developer",
    date: "2024-05-01",
    stage: "Mülakat Daveti",
    tasks: ["Teknik test gönderilecek"],
  },
  {
    id: 2,
    company: "Globex",
    position: "Data Analyst",
    date: "2024-04-20",
    stage: "Başvuruldu",
    tasks: ["CV güncellemesi"],
  },
];

const mockFinishedApplications = [
  {
    id: 3,
    company: "Initech",
    position: "Backend Engineer",
    date: "2024-03-15",
    result: "Red",
    reason: "Teknik test başarısız",
  },
  {
    id: 4,
    company: "Umbrella",
    position: "QA Tester",
    date: "2024-02-10",
    result: "Teklif",
    reason: "Başarılı süreç",
  },
];

export default function Dashboard() {
  const { data: session } = useSession();
  const [emailConnected, setEmailConnected] = useState(false);
  const [applications, setApplications] = useState([]);
  
  useEffect(() => {
    if (session?.user?.email) {
      // Kullanıcının başvurularını yükle
      loadApplications();
    }
  }, [session]);

  const loadApplications = async () => {
    try {
      const response = await fetch(`/api/applications/${session?.user?.email}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Başvurular yüklenemedi:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f7f8fa] via-[#e6eaff] to-white flex flex-col items-center py-8 px-2">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        {/* Hoş geldin ve özet */}
        <section className="bg-white/90 rounded-2xl shadow-md p-6 flex flex-col gap-2 border border-[#e6eaff]">
          <h2 className="text-2xl font-bold text-[#465DDD] font-changa">Hoş geldin, Test User 👋</h2>
          <p className="text-[#465DDD] text-base">Başvurularını kolayca takip et, AI ile analiz et!</p>
        </section>

        {/* E-posta Entegrasyonu */}
        <EmailIntegration />
        
        {/* Gmail Debug Panel */}
        <GmailDebug />

        {/* Aktif Başvurular Paneli */}
        <section className="bg-white/90 rounded-2xl shadow-md p-6 border border-[#e6eaff]">
          <h3 className="text-xl font-bold text-[#465DDD] mb-4">Aktif Başvurular</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockActiveApplications.map((app) => (
              <div key={app.id} className="bg-[#f7f8fa] rounded-xl p-4 shadow flex flex-col gap-2 border border-[#e6eaff]">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#465DDD]">{app.company}</span>
                  <span className="text-xs text-gray-400">{app.date}</span>
                </div>
                <div className="text-[#465DDD] font-bold">{app.position}</div>
                <div className="text-sm text-[#6e7ff3]">Aşama: {app.stage}</div>
                <ul className="text-xs text-gray-500 list-disc ml-5">
                  {app.tasks.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs bg-[#e6eaff] text-[#465DDD] rounded px-2 py-1 hover:bg-[#465DDD] hover:text-white transition">Düzenle</button>
                  <button className="text-xs bg-[#ffe0e0] text-[#d32f2f] rounded px-2 py-1 hover:bg-[#d32f2f] hover:text-white transition">Sil</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sonuçlanmış Başvurular Paneli */}
        <section className="bg-white/90 rounded-2xl shadow-md p-6 border border-[#e6eaff]">
          <h3 className="text-xl font-bold text-[#465DDD] mb-4">Sonuçlanmış Başvurular</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockFinishedApplications.map((app) => (
              <div key={app.id} className="bg-[#f7f8fa] rounded-xl p-4 shadow flex flex-col gap-2 border border-[#e6eaff]">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#465DDD]">{app.company}</span>
                  <span className="text-xs text-gray-400">{app.date}</span>
                </div>
                <div className="text-[#465DDD] font-bold">{app.position}</div>
                <div className="text-sm text-[#6e7ff3]">Sonuç: {app.result}</div>
                <div className="text-xs text-gray-500">Neden: {app.reason}</div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Analiz ve Tavsiye Kutusu */}
        <section className="bg-[#e6eaff] rounded-2xl shadow-inner p-6 border border-[#cfd8fc] flex flex-col gap-2">
          <h3 className="text-lg font-bold text-[#465DDD]">AI Destekli Analiz & Tavsiye</h3>
          <ul className="list-disc ml-6 text-[#465DDD] text-sm">
            <li>Yazılım rollerinde %20 yanıt oranı, bu alana yönelmen faydalı olabilir.</li>
            <li>Sıklıkla test aşamasında eleniyorsun; teknik test pratiği öneriyoruz.</li>
          </ul>
        </section>

        {/* Takvim ve Görevler Kutusu */}
        <section className="bg-white/90 rounded-2xl shadow-md p-6 border border-[#e6eaff] flex flex-col gap-2">
          <h3 className="text-lg font-bold text-[#465DDD]">Yaklaşan Görevler & Takvim</h3>
          <ul className="list-disc ml-6 text-[#465DDD] text-sm">
            <li>02.05.2024: Teknik test gönderilecek (Acme Corp)</li>
            <li>05.05.2024: CV güncellemesi (Globex)</li>
          </ul>
        </section>

      </div>
    </main>
  );
} 