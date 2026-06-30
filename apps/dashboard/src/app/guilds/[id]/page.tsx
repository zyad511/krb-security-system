'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import io from 'socket.io-client';

export default function DashboardConfig() {
  const { id: guildId } = useParams();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // جلب الإعدادات الحالية من الـ API الرئيسي
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/guilds/${guildId}/config`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.data) setConfig(resData.data);
        setLoading(false);
      });

    // الاتصال بالـ WebSockets للمزامنة الحية
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
    socket.emit('joinGuildRoom', guildId);

    socket.on('configUpdated', (updatedConfig) => {
      setConfig(updatedConfig);
    });

    return () => {
      socket.disconnect();
    };
  }, [guildId]);

  const toggleFeature = async (path: string, currentVal: boolean) => {
    const updated = { ...config };
    // تعديل القيمة الديناميكية للميزة
    const keys = path.split('.');
    let current = updated;
    for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
    current[keys[keys.length - 1]] = !currentVal;

    setConfig(updated);

    // إرسال الإعدادات فوراً للـ API ليتم تفعيلها في البوت بدون ريستارت
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/guilds/${guildId}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white font-mono">LOADING SECURE INFRASTRUCTURE...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <header className="border-b border-zinc-800 pb-6 mb-8">
        <h1 className="text-2xl font-bold tracking-tighter">KRB SECURITY CONTROL SYSTEM</h1>
        <p className="text-xs text-zinc-500 mt-1">GUILD INTERFACE ID: {guildId}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Anti-Nuke Control Card */}
        <div className="border border-zinc-800 p-6 bg-zinc-950/50 hover:border-white transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">ANTI-NUKE: CHANNEL PROTECTION</h3>
            <button
              onClick={() => toggleFeature('antiNuke.channelDelete.enabled', config?.antiNuke?.channelDelete?.enabled)}
              className={`px-4 py-1 text-xs border uppercase tracking-wider transition-colors font-bold ${
                config?.antiNuke?.channelDelete?.enabled 
                  ? 'bg-white text-black border-white' 
                  : 'bg-black text-zinc-600 border-zinc-800'
              }`}
            >
              {config?.antiNuke?.channelDelete?.enabled ? 'Active' : 'Disabled'}
            </button>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Monitors mass channel deletions. Triggers immediate automated restriction on unauthorized staff accounts via sliding-window verification.
          </p>
          <div className="text-xs text-zinc-500 border-t border-zinc-900 pt-3">
            PUNISHMENT AUTOMATION: <span className="text-white underline">{config?.antiNuke?.channelDelete?.punishment?.type.join(' + ')}</span>
          </div>
        </div>

        {/* Bot Protection Card */}
        <div className="border border-zinc-800 p-6 bg-zinc-950/50 hover:border-white transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">GATEKEEPER: BOT QUARANTINE</h3>
            <button
              onClick={() => toggleFeature('botProtection.enabled', config?.botProtection?.enabled)}
              className={`px-4 py-1 text-xs border uppercase tracking-wider transition-colors font-bold ${
                config?.botProtection?.enabled 
                  ? 'bg-white text-black border-white' 
                  : 'bg-black text-zinc-600 border-zinc-800'
              }`}
            >
              {config?.botProtection?.enabled ? 'Active' : 'Disabled'}
            </button>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Isolates newly added automated bot integration accounts. Requires dynamic manual administrative review/authorization buttons before grant execution.
          </p>
        </div>
      </div>
    </div>
  );
}
