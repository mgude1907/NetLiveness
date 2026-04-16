import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line
} from 'recharts';
import { getTerminals, getSslItems, getUsomRssFeed, getHelpRequests, getAwarenessTips } from '../api';
import {
  Monitor, Server, Shield, LifeBuoy, Globe, ShieldCheck,
  Settings2, ChevronDown, Check, Clock, ArrowUpRight,
  ArrowDownRight, Package, Wifi, WifiOff, ExternalLink,
  Activity, TrendingUp, AlertTriangle, Users, CircleCheck,
  CircleX, Zap, Eye, ChevronRight, LayoutGrid, Layers,
  Plus, Cpu, HardDrive, CpuIcon, Signal, Lock, Bell, X, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const parseUsomDate = (s) => {
  if (!s) return '—';
  try {
    const d = new Date(s.includes(' ') ? s.replace(' ', 'T') : s);
    return isNaN(d.getTime()) ? s.split(' ')[0] : d.toLocaleDateString('tr-TR');
  } catch { return '—'; }
};

const isOnline = (status) =>
  status === 'Online' || status === 'UP' || status === 'Çevrimiçi';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const TinyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(15,23,42,0.1)',
      borderRadius: 12, padding: '10px 14px',
      fontSize: 11, boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
      backdropFilter: 'blur(10px)', color: '#0f172a'
    }}>
      {label && <div style={{ color: '#64748b', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', fontSize: 9 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [terminals, setTerminals] = useState([]);
  const [sslItems, setSslItems] = useState([]);
  const [usomFeeds, setUsomFeeds] = useState([]);
  const [awarenessTips, setAwarenessTips] = useState([]);
  const [currentTipIdx, setCurrentTipIdx] = useState(0);
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usomExpanded, setUsomExpanded] = useState(true);
  const [showWidgetStore, setShowWidgetStore] = useState(false);
  
  useEffect(() => {
    if (awarenessTips.length === 0) return;
    const it = setInterval(() => {
      setCurrentTipIdx(prev => (prev + 1) % awarenessTips.length);
    }, 8000);
    return () => clearInterval(it);
  }, [awarenessTips]);
  
  // Widget Visibility State
  const [activeWidgets, setActiveWidgets] = useState({
    heatmap: true,
    security: true,
    ssl: true,
    resources: true,
    activity: true,
    distribution: true,
    servers: true,
    usom: true,
    helpdesk: true,
    awareness: true
  });

  const load = useCallback(async () => {
    try {
      const [t, s, usom, hlp, tps] = await Promise.all([
        getTerminals().catch(() => []),
        getSslItems().catch(() => []),
        getUsomRssFeed().catch(() => []),
        getHelpRequests().catch(() => []),
        getAwarenessTips().catch(() => []),
      ]);
      setTerminals(Array.isArray(t) ? t : []);
      setSslItems(Array.isArray(s) ? s : []);
      setUsomFeeds(Array.isArray(usom) ? usom : []);
      setHelpRequests(Array.isArray(hlp) ? hlp : []);
      setAwarenessTips(tps || []);
    } catch { toast.error('Dashboard yüklenemedi.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, [load]);

  if (loading && !terminals.length) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span style={{ fontWeight: 600 }}>Dijital Sistemler Hazırlanıyor…</span>
    </div>
  );

  const servers = terminals.filter(t => t.deviceType === 'Sunucu' || t.deviceType === 'Server');
  const pcs = terminals.filter(t => t.deviceType === 'PC');
  const onlineServ = servers.filter(s => isOnline(s.status)).length;
  const onlinePcs = pcs.filter(p => isOnline(p.status)).length;
  const offlinePcs = pcs.length - onlinePcs;
  const critSsl = sslItems.filter(s => s.status === 'Kritik').length;
  const openTickets = helpRequests.filter(r => r.status === 'Açık').length;

  const now = new Date();
  const generateTrend = (base) => Array.from({ length: 10 }, (_, i) => ({ value: base + Math.floor(Math.random() * 5 - 2) }));

  const companyMap = {};
  terminals.forEach(t => { if (t.company) companyMap[t.company] = (companyMap[t.company] || 0) + 1; });
  const companyData = Object.entries(companyMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const activityData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    aktif: onlinePcs + Math.floor(Math.random() * 10 - 5),
    latency: Math.floor(Math.random() * 20 + 10)
  }));

  const heatmapData = [
    { name: 'Merkez', lat: 12, status: 'ok' },
    { name: 'RMK', lat: 45, status: 'warn' },
    { name: 'RHA', lat: 22, status: 'ok' },
    { name: 'RDN', lat: 110, status: 'crit' },
    { name: 'RET B.', lat: 18, status: 'ok' },
    { name: 'RET U.', lat: 25, status: 'ok' },
    { name: 'ROB', lat: 0, status: 'off' },
    { name: 'SYS', lat: 8, status: 'ok' }
  ];

  const securityLogs = [
    { time: '13:42', event: 'Hatalı Giriş Denemesi', user: 'admin_test', ip: '192.168.1.45', level: 'warn' },
    { time: '13:38', event: 'Yeni Terminal Keşfedildi', user: 'SYSTEM', ip: '10.0.5.21', level: 'info' },
    { time: '13:15', event: 'SSL Kritik Uyarı: outlook.xyz', user: 'SYSTEM', ip: '—', level: 'crit' },
    { time: '12:50', event: 'VPN Bağlantısı Kuruldu', user: 'm.gude', ip: '176.42.x.x', level: 'info' }
  ];

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100%', paddingBottom: 60 }}>
      
      {/* ─── Animated Background & Global Styles ─── */}
      <style>{`
        .bg-circle { position: fixed; border-radius: 50%; filter: blur(120px); z-index: -1; opacity: 0.18; animation: float 25s infinite alternate ease-in-out; }
        @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(150px, 80px) scale(1.3); } }
        @keyframes fadeInStagger { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .glass-card { 
          background: rgba(255, 255, 255, 0.85); 
          backdrop-filter: blur(20px); 
          border: 1px solid rgba(255, 255, 255, 0.5); 
          box-shadow: 0 15px 45px rgba(0,0,0,0.05); 
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          position: relative;
          overflow: hidden;
        }
        .glass-card:hover { transform: translateY(-4px); box-shadow: 0 25px 60px rgba(0,0,0,0.1); }
        
        .stagger-1 { animation: fadeInStagger 0.6s ease-out 0.1s backwards; }
        .stagger-2 { animation: fadeInStagger 0.6s ease-out 0.2s backwards; }
        .stagger-3 { animation: fadeInStagger 0.6s ease-out 0.3s backwards; }
        .stagger-4 { animation: fadeInStagger 0.6s ease-out 0.4s backwards; }

        .table-row-hover:hover { background: rgba(0,0,0,0.02) !important; cursor: pointer; }
        .btn-icon:hover { background: #f1f5f9; transform: scale(1.1); }
        .widget-store-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .neon-dot { box-shadow: 0 0 12px currentColor; }
      `}</style>

      {/* Vibrant Mesh Background */}
      <div className="bg-circle" style={{ width: 600, height: 600, background: '#f59e0b', top: '-200px', right: '-150px' }} />
      <div className="bg-circle" style={{ width: 500, height: 500, background: '#3b82f6', bottom: '5%', left: '-80px', animationDelay: '-5s' }} />
      <div className="bg-circle" style={{ width: 450, height: 450, background: '#10b981', top: '20%', left: '10%', animationDelay: '-12s', opacity: 0.12 }} />
      <div className="bg-circle" style={{ width: 400, height: 400, background: '#8b5cf6', bottom: '20%', right: '5%', animationDelay: '-8s', opacity: 0.12 }} />

      {/* ─── Widget Store Modal ─── */}
      {showWidgetStore && (
        <div className="widget-store-overlay" onClick={() => setShowWidgetStore(false)}>
          <div className="glass-card" style={{ width: 600, padding: 32, borderRadius: 32, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button 
              style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setShowWidgetStore(false)}
            >
              <X size={24} color="#94a3b8" />
            </button>
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>Widget Merkezi</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Dashboard görünümünüzü özelleştirmek için modülleri seçin.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <WidgetToggleItem 
                    icon={Signal} 
                    title="Ağ Isı Haritası" 
                    desc="Şubeler arası gecikme analizi" 
                    active={activeWidgets.heatmap} 
                    onToggle={() => setActiveWidgets(p => ({...p, heatmap: !p.heatmap}))}
                />
                <WidgetToggleItem 
                    icon={Bell} 
                    title="Güvenlik Akışı" 
                    desc="Son 10 sistem alarmı" 
                    active={activeWidgets.security} 
                    onToggle={() => setActiveWidgets(p => ({...p, security: !p.security}))}
                />
                <WidgetToggleItem 
                    icon={Lock} 
                    title="Sertifika Takibi" 
                    desc="SSL bitiş tarihleri" 
                    active={activeWidgets.ssl} 
                    onToggle={() => setActiveWidgets(p => ({...p, ssl: !p.ssl}))}
                />
                <WidgetToggleItem 
                    icon={Cpu} 
                    title="Kaynak Kullanımı" 
                    active={activeWidgets.resources} 
                    onToggle={() => setActiveWidgets(p => ({...p, resources: !p.resources}))}
                />
                <WidgetToggleItem 
                    icon={Shield} 
                    title="Siber Farkındalık" 
                    desc="Günlük güvenlik ipuçları" 
                    active={activeWidgets.awareness} 
                    onToggle={() => setActiveWidgets(p => ({...p, awareness: !p.awareness}))}
                />
            </div>
            <button 
                style={{ width: '100%', marginTop: 32, padding: '14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 16, fontWeight: 900, cursor: 'pointer' }}
                onClick={() => setShowWidgetStore(false)}
            >
                DEĞİŞİKLİKLERİ KAYDET
            </button>
          </div>
        </div>
      )}

      {/* ─── Header bar ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
             <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(15,23,42,0.2)' }}>
                <LayoutGrid size={20} color="#fff" />
             </div>
             <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', letterSpacing: 3 }}>MISSION CONTROL</span>
          </div>
          <div style={{ fontSize: 14, color: '#64748b', fontWeight: 700 }}>
            {now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
            {' • '}{now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button 
              className="btn-icon"
              style={{ width: 44, height: 44, borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              onClick={() => setShowWidgetStore(true)}
            >
              <Plus size={24} color="#0f172a" strokeWidth={3} />
            </button>
            <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800 }}>SİSTEM DURUMU</div>
               <div style={{ fontSize: 14, fontWeight: 900, color: '#059669' }}>NOMİNAL (24ms)</div>
            </div>
        </div>
      </div>

      {/* ─── Row 1: Graphic Stats ─── */}
      <div className="stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
        <GraphicStat title="AKTİF TERMİNALLER" value={onlinePcs} trend={generateTrend(onlinePcs)} color="#10b981" icon={Monitor} subtitle="Çevrimiçi Operasyonlar" />
        <GraphicStat title="PASİF TERMİNALLER" value={offlinePcs} trend={generateTrend(offlinePcs)} color="#ef4444" icon={WifiOff} subtitle="Kesinti Tahvilleri" />
        <GraphicStat title="SSL GÜVENLİK" value={sslItems.length} trend={generateTrend(sslItems.length)} color="#3b82f6" icon={ShieldCheck} subtitle={critSsl > 0 ? `${critSsl} Kritik Durum` : 'Güvenli Bölge'} />
        <GraphicStat title="YARDIM MASASI" value={openTickets} trend={generateTrend(openTickets)} color="#f59e0b" icon={LifeBuoy} subtitle={openTickets > 0 ? 'Bekleyen İstekler' : 'Masa Temiz'} />
      </div>

      {/* ─── Advanced Grid (New Widgets) ─── */}
      <div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
         {activeWidgets.awareness && (
            <div className="glass-card" style={{ padding: 24, borderRadius: 28, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: '100%', background: '#f59e0b' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Shield size={20} color="#f59e0b" />
                        <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1 }}>SİBER FARKINDALIK</span>
                    </div>
                </div>
                <div key={currentTipIdx} className="animate-fade-in" style={{ height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 950, color: '#0f172a', marginBottom: 4 }}>{awarenessTips[currentTipIdx]?.title}</h4>
                    <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4', fontWeight: 700 }}>{awarenessTips[currentTipIdx]?.text}</p>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                   {awarenessTips.map((_, i) => (
                      <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i === currentTipIdx ? '#f59e0b' : 'rgba(0,0,0,0.05)', transition: 'all 0.5s' }} />
                   ))}
                </div>
            </div>
         )}
         
         {activeWidgets.heatmap && (
            <div className="glass-card" style={{ padding: 24, borderRadius: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>AĞ ISİ HARİTASI (Geçikme)</div>
                    <Signal size={16} color="#3b82f6" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {heatmapData.map(d => (
                        <div key={d.name} style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 12, background: 'rgba(0,0,0,0.02)' }}>
                            <div style={{ height: 6, width: '60%', margin: '0 auto 8px', borderRadius: 3, background: d.status === 'ok' ? '#10b981' : d.status === 'warn' ? '#f59e0b' : d.status === 'crit' ? '#ef4444' : '#cbd5e1' }} />
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#0f172a' }}>{d.name}</div>
                            <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b' }}>{d.lat > 0 ? `${d.lat}ms` : '—'}</div>
                        </div>
                    ))}
                </div>
            </div>
         )}

         {activeWidgets.security && (
            <div className="glass-card" style={{ padding: 20, borderRadius: 28, gridColumn: activeWidgets.heatmap ? 'span 2' : 'span 3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>GÜVENLİK ANALİZ AKIŞI</div>
                    <Bell size={16} color="#ef4444" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {securityLogs.map((l, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 120px 120px', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.02)', borderRadius: 12, fontSize: 12 }}>
                            <span style={{ color: '#94a3b8', fontWeight: 800 }}>{l.time}</span>
                            <span style={{ fontWeight: 800, color: l.level === 'crit' ? '#ef4444' : l.level === 'warn' ? '#f59e0b' : '#1e293b' }}>{l.event}</span>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>{l.user}</span>
                            <span style={{ color: '#94a3b8', textAlign: 'right', fontWeight: 700 }}>{l.ip}</span>
                        </div>
                    ))}
                </div>
            </div>
         )}
      </div>

      {/* ─── Row 2: Charts Matrix ─── */}
      <div className="stagger-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {activeWidgets.distribution && (
            <div className="glass-card" style={{ padding: 24, borderRadius: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>ŞUBE CİHAZ YOĞUNLUĞU</div>
                    <Layers size={18} color="#f59e0b" />
                </div>
                <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={companyData} layout="vertical" margin={{ left: 20, right: 30 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={11} fontWeight={800} width={120} />
                            <Tooltip content={<TinyTooltip />} />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                                {companyData.map((e, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {activeWidgets.resources && (
            <div className="glass-card" style={{ padding: 24, borderRadius: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>SİSTEM KAYNAK KULLANIMI</div>
                    <Cpu size={18} color="#3b82f6" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, height: 260 }}>
                    <ResourceDonut label="CPU" value={24} color="#3b82f6" />
                    <ResourceDonut label="RAM" value={62} color="#8b5cf6" />
                </div>
            </div>
        )}
      </div>

      {activeWidgets.servers && (
          <div className="glass-card stagger-4" style={{ borderRadius: 28, padding: 0, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Server size={20} color="#f59e0b" />
                    <span style={{ fontSize: 15, fontWeight: 900 }}>KRİTİK SUNUCU İZLEME</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>TOPLAM {servers.length} SUNUCU AKTİF</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: 'rgba(0,0,0,0.05)' }}>
                {servers.map(s => (
                    <div key={s.id} style={{ background: '#fff', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 800 }}>{s.name}</span>
                            <div 
                              className="neon-dot"
                              style={{ 
                                width: 10, height: 10, borderRadius: '50%', 
                                background: isOnline(s.status) ? '#10b981' : '#ef4444', 
                                color: isOnline(s.status) ? '#10b981' : '#ef4444'
                              }} 
                            />
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{s.ipAddress}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} style={{ flex: 1, height: 12, borderRadius: 2, background: i === 11 && !isOnline(s.status) ? '#ef4444' : '#10b981', opacity: 0.15 + (i * 0.07) }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          </div>
      )}

      {activeWidgets.usom && (
          <div className="glass-card" style={{ borderRadius: 28, overflow: 'hidden', marginBottom: 24 }}>
            <div 
                onClick={() => setUsomExpanded(!usomExpanded)}
                style={{ padding: '20px 24px', cursor: 'pointer', background: 'rgba(239,68,68,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Shield size={22} color="#ef4444" />
                    <div>
                       <span style={{ fontSize: 15, fontWeight: 900 }}>USOM TEHDİT İSTİHBARAT AKIŞI</span>
                       <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 800, marginLeft: 15 }}>30 YENİ BİLDİRİM</span>
                    </div>
                </div>
                <ChevronDown size={20} color="#94a3b8" style={{ transform: usomExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            </div>
            {usomExpanded && (
                <div style={{ maxHeight: 400, overflowY: 'auto', padding: '10px 0' }}>
                     <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 120 }}>GÜVENLİK TİPİ</th>
                                <th>TEHDİT BAŞLIĞI / KAYNAK</th>
                                <th style={{ width: 120 }}>YAYIN TARİHİ</th>
                                <th style={{ width: 100, textAlign: 'center' }}>EYLEM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usomFeeds.map((f, i) => (
                                <tr key={i} className="table-row-hover">
                                    <td>
                                        <span className={`badge ${f.type?.includes('Zararlı') ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: 10, fontWeight: 900 }}>
                                            {f.type?.toUpperCase() || 'TEHDİT'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 13, fontWeight: 700 }}>
                                        <div style={{ wordBreak: 'break-word' }}>{f.title}</div>
                                    </td>
                                    <td style={{ fontSize: 11, color: '#64748b' }}>{parseUsomDate(f.pubDate)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button 
                                            onClick={() => f.link && window.open(f.link, '_blank')}
                                            style={{ 
                                                padding: '6px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', 
                                                borderRadius: 10, fontSize: 10, fontWeight: 900, cursor: 'pointer',
                                                color: 'var(--text-1)', boxShadow: 'var(--shadow-xs)', display: 'inline-flex', alignItems: 'center', gap: 4
                                            }}
                                        >
                                            <ExternalLink size={12} color="#3b82f6" /> İNCELE
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                     {usomFeeds.length === 0 && (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
                            <Zap size={24} style={{ marginBottom: 10, opacity: 0.5 }} />
                            <div>Henüz bir istihbarat akışı bulunamadı.</div>
                        </div>
                     )}
                </div>
            )}
          </div>
      )}

      {activeWidgets.helpdesk && (
          <div className="glass-card" style={{ borderRadius: 28, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <LifeBuoy size={20} color="#3b82f6" />
                    <span style={{ fontSize: 15, fontWeight: 900 }}>OPERASYONEL DESTEK TALEPLERİ</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '5px 12px', borderRadius: 10 }}>{openTickets} BEKLEYEN TERCÜME</span>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>TALEP KONUSU</th>
                        <th>PERSONEL</th>
                        <th>DEPARTMAN</th>
                        <th>DURUM</th>
                        <th>ÖNCELİK</th>
                        <th>SÜRE</th>
                    </tr>
                </thead>
                <tbody>
                    {helpRequests.map((r, i) => {
                        const isUrgent = r.priority === 'Yüksek';
                        return (
                            <tr key={i} className="table-row-hover">
                                <td>
                                    <div style={{ fontWeight: 800, fontSize: 13 }}>{r.subject}</div>
                                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>ID: #{1000 + i}</div>
                                </td>
                                <td style={{ fontSize: 13, fontWeight: 600 }}>{r.creatorName}</td>
                                <td style={{ fontSize: 12, color: '#64748b' }}>{r.department}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: r.status === 'Açık' ? '#f59e0b' : '#10b981' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.status === 'Açık' ? '#f59e0b' : '#10b981' }} />
                                        {r.status?.toUpperCase()}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${isUrgent ? 'badge-red' : 'badge-neutral'}`} style={{ fontSize: 10, fontWeight: 900 }}>
                                        {r.priority?.toUpperCase() || 'NORMAL'}
                                    </span>
                                </td>
                                <td style={{ fontSize: 11, color: '#94a3b8' }}>14 dk önce</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
      )}

    </div>
  );
}

function GraphicStat({ title, value, trend, color, icon: Icon, subtitle }) {
  return (
    <div className="glass-card" style={{ padding: 24, borderRadius: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, height: 4, width: '100%', background: color, boxShadow: `0 4px 15px ${color}44` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}33` }}>
           <Icon size={22} color={color} />
        </div>
        <div style={{ height: 36, width: 80 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                    <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={3} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', letterSpacing: 1.5 }}>{title}</div>
        <div style={{ fontSize: 32, fontWeight: 950, color: '#0f172a', margin: '4px 0', letterSpacing: -1 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{subtitle}</div>
      </div>
    </div>
  );
}

function ResourceDonut({ label, value, color }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 120, height: 120, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={[{v: value}, {v: 100-value}]} innerRadius={42} outerRadius={55} startAngle={90} endAngle={450} paddingAngle={0} dataKey="v" stroke="none">
                            <Cell fill={color} style={{ filter: `drop-shadow(0 0 8px ${color}66)` }} />
                            <Cell fill="rgba(0,0,0,0.06)" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 26, fontWeight: 950, color: '#0f172a' }}>%{value}</span>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: 1 }}>{label}</span>
                </div>
            </div>
        </div>
    );
}

function WidgetToggleItem({ icon: Icon, title, desc, active, onToggle }) {
    return (
        <div 
            style={{ 
                padding: '16px 20px', borderRadius: 20, 
                background: active ? '#f0fdf4' : 'rgba(0,0,0,0.02)', 
                border: active ? '1.5px solid #b91c1c00' : '1px solid transparent', // Placeholder to match active state border
                borderColor: active ? '#10b981' : '#e2e8f0',
                display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onClick={onToggle}
        >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? '#10b981' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#fff' : '#94a3b8' }}>
                <Icon size={20} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{title}</div>
                {desc && <div style={{ fontSize: 11, color: '#64748b' }}>{desc}</div>}
            </div>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid', borderColor: active ? '#10b981' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {active && <Check size={12} color="#10b981" strokeWidth={4} />}
            </div>
        </div>
    )
}
