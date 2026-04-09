import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { getTerminals, getSslItems, getUsomRssFeed, getHelpRequests } from '../api';
import {
  Monitor, Server, Shield, LifeBuoy, Globe, ShieldCheck,
  Settings2, ChevronDown, Check, Clock, ArrowUpRight,
  ArrowDownRight, Package, Wifi, WifiOff, ExternalLink,
  Activity, TrendingUp, AlertTriangle, Users, CircleCheck,
  CircleX, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─ helpers ─────────────────────────────────── */
const parseUsomDate = (s) => {
  if (!s) return '—';
  try {
    const d = new Date(s.includes(' ') ? s.replace(' ', 'T') : s);
    return isNaN(d.getTime()) ? s.split(' ')[0] : d.toLocaleDateString('tr-TR');
  } catch { return '—'; }
};

const isOnline = (status) =>
  status === 'Online' || status === 'UP' || status === 'Çevrimiçi';

const CHART_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

/* ─ Custom Tooltip ─────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: 12, padding: '10px 14px',
      fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      {label && <div style={{ color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

const WIDGETS = { metrics: true, servers: true, usom: true, ssl: true, helpdesk: true, inventory: true };

export default function Dashboard() {
  const [terminals, setTerminals]       = useState([]);
  const [sslItems, setSslItems]         = useState([]);
  const [usomFeeds, setUsomFeeds]       = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [widgets, setWidgets] = useState(() => {
    try { const s = localStorage.getItem('dash_widgets_v3'); return s ? { ...WIDGETS, ...JSON.parse(s) } : WIDGETS; }
    catch { return WIDGETS; }
  });
  const [showCfg, setShowCfg] = useState(false);
  const cfgRef = useRef(null);

  useEffect(() => { localStorage.setItem('dash_widgets_v3', JSON.stringify(widgets)); }, [widgets]);

  const load = useCallback(async () => {
    try {
      const [t, s, usom, hlp] = await Promise.all([
        getTerminals().catch(() => []),
        getSslItems().catch(() => []),
        getUsomRssFeed().catch(() => []),
        getHelpRequests().catch(() => []),
      ]);
      setTerminals(Array.isArray(t) ? t : []);
      setSslItems(Array.isArray(s) ? s : []);
      setUsomFeeds(Array.isArray(usom) ? usom : []);
      setHelpRequests(Array.isArray(hlp) ? hlp : []);
    } catch { toast.error('Dashboard yüklenemedi.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    const h = (e) => { if (cfgRef.current && !cfgRef.current.contains(e.target)) setShowCfg(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (loading && !terminals.length) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span style={{ fontWeight: 600 }}>Dashboard yükleniyor…</span>
    </div>
  );

  /* ─ derived stats ─ */
  const servers    = terminals.filter(t => t.deviceType === 'Sunucu' || t.deviceType === 'Server');
  const pcs        = terminals.filter(t => t.deviceType === 'PC');
  const onlineServ = servers.filter(s => isOnline(s.status)).length;
  const critSsl    = sslItems.filter(s => s.status === 'Kritik').length;
  const openTickets = helpRequests.filter(r => r.status === 'Açık').length;

  /* ─ ssl donut ─ */
  const sslDonut = [
    { name: 'Güvenli', value: Math.max(0, sslItems.length - critSsl), color: '#10b981' },
    { name: 'Kritik',  value: critSsl,                                 color: '#ef4444' },
  ];

  /* ─ company bar chart ─ */
  const companyMap = {};
  terminals.forEach(t => { if (t.company) companyMap[t.company] = (companyMap[t.company] || 0) + 1; });
  const companyData = Object.entries(companyMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  /* ─ mock activity sparkline data ─ */
  const now = new Date();
  const activitySparkline = Array.from({ length: 12 }, (_, i) => {
    const h = new Date(now); h.setHours(now.getHours() - (11 - i));
    return {
      time: `${h.getHours()}:00`,
      aktif: Math.floor(Math.random() * (pcs.length || 10) * 0.7 + 2),
    };
  });

  /* ─ KPI definitions ─ */
  const KPI = [
    {
      label: 'Uç Nokta',
      value: terminals.length,
      sub: `${pcs.length} bilgisayar, ${servers.length} sunucu`,
      icon: Monitor,
      kpiColor: '#f59e0b',
      iconClass: 'icon-amber',
      iconColor: '#b45309',
      pct: 100,
      trend: null,
    },
    {
      label: 'Aktif Sunucu',
      value: `${onlineServ}/${servers.length}`,
      sub: servers.length ? `%${Math.round((onlineServ / servers.length) * 100)} çevrimiçi` : 'Sunucu yok',
      icon: Server,
      kpiColor: '#10b981',
      iconClass: 'icon-green',
      iconColor: '#065f46',
      pct: servers.length ? Math.round((onlineServ / servers.length) * 100) : 0,
      trend: '+2%',
      trendUp: true,
    },
    {
      label: 'SSL Sertifika',
      value: sslItems.length,
      sub: critSsl > 0 ? `⚠️ ${critSsl} kritik sertifika` : '✅ Tümü geçerli',
      icon: Shield,
      kpiColor: critSsl > 0 ? '#ef4444' : '#10b981',
      iconClass: critSsl > 0 ? 'icon-red' : 'icon-green',
      iconColor: critSsl > 0 ? '#991b1b' : '#065f46',
      pct: sslItems.length ? Math.round(((sslItems.length - critSsl) / sslItems.length) * 100) : 100,
      trend: critSsl > 0 ? `${critSsl} uyarı` : 'Temiz',
      trendUp: critSsl === 0,
    },
    {
      label: 'Destek Talebi',
      value: openTickets,
      sub: openTickets > 0 ? 'Çözüm bekliyor' : 'Tümü çözüldü',
      icon: LifeBuoy,
      kpiColor: openTickets > 0 ? '#f59e0b' : '#10b981',
      iconClass: openTickets > 0 ? 'icon-amber' : 'icon-green',
      iconColor: openTickets > 0 ? '#b45309' : '#065f46',
      pct: 0,
      trend: openTickets > 0 ? 'Açık' : 'Kapalı',
      trendUp: openTickets === 0,
    },
  ];

  const WIDGET_LABELS = [
    { id: 'metrics',   label: 'Metrik Kartları' },
    { id: 'servers',   label: 'Sunucu Durumu' },
    { id: 'ssl',       label: 'SSL Analizi' },
    { id: 'inventory', label: 'Cihaz Dağılımı' },
    { id: 'usom',      label: 'USOM Tehdit Akışı' },
    { id: 'helpdesk',  label: 'Yardım Masası' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ─── Toolbar ─── */}
      <div style={{ display: 'flex', justify: 'flex-start', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">
            <div className="icon-box-sm icon-amber">
              <Activity size={15} color="#b45309" />
            </div>
            Dashboard
          </h1>
          <p className="page-subtitle">Son güncelleme: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div style={{ position: 'relative' }} ref={cfgRef}>
          <button className="btn btn-secondary" onClick={() => setShowCfg(s => !s)}>
            <Settings2 size={14} />
            Widget Seç
            <ChevronDown size={12} style={{ transform: showCfg ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>

          {showCfg && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16,
              padding: 8, minWidth: 220, boxShadow: '0 10px 24px rgba(0,0,0,0.12)', zIndex: 50,
            }}>
              <div style={{ padding: '4px 12px 8px', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                Görüntülenecek Widgetlar
              </div>
              {WIDGET_LABELS.map(w => (
                <div
                  key={w.id}
                  onClick={() => setWidgets(p => ({ ...p, [w.id]: !p[w.id] }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 13, fontWeight: 500,
                    color: widgets[w.id] ? '#0f172a' : '#94a3b8',
                    background: widgets[w.id] ? '#fffbeb' : 'transparent',
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{
                    width: 18, height: 18,
                    border: `2px solid ${widgets[w.id] ? '#f59e0b' : '#e2e8f0'}`,
                    borderRadius: 5, background: widgets[w.id] ? '#f59e0b' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.12s', flexShrink: 0,
                  }}>
                    {widgets[w.id] && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>
                  {w.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      {widgets.metrics && (
        <div className="kpi-grid">
          {KPI.map(k => (
            <div
              key={k.label}
              className="kpi-card"
              style={{ '--kpi-color': k.kpiColor }}
            >
              <div className="kpi-top">
                <div className={`icon-box ${k.iconClass}`}>
                  <k.icon size={22} color={k.iconColor} />
                </div>
                {k.trend !== null && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    fontSize: 11, fontWeight: 700,
                    color: k.trendUp ? '#065f46' : '#991b1b',
                    background: k.trendUp ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${k.trendUp ? '#a7f3d0' : '#fecaca'}`,
                    padding: '3px 8px', borderRadius: 99,
                  }}>
                    {k.trendUp
                      ? <ArrowUpRight size={11} />
                      : <ArrowDownRight size={11} />}
                    {k.trend}
                  </div>
                )}
              </div>
              <div>
                <div className="kpi-value">{k.value}</div>
                <div className="kpi-label">{k.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{k.sub}</div>
              </div>
              {k.pct > 0 && (
                <div className="kpi-bar">
                  <div className="kpi-bar-fill" style={{ width: `${k.pct}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Main data row: Activity + Server + SSL ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

        {/* Activity Area Chart */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '18px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">
                <TrendingUp size={16} color="#10b981" />
                Aktif Terminal Trendi
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Son 12 saat</div>
            </div>
            <span className="badge badge-green" style={{ fontSize: 10 }}>
              <span className="status-dot success pulse" style={{ width: 6, height: 6 }} />
              Canlı
            </span>
          </div>
          <div style={{ padding: '16px 8px 12px', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activitySparkline}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" fontSize={10} stroke="#cbd5e1" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="aktif" name="Aktif Terminal"
                  stroke="#10b981" strokeWidth={2}
                  fill="url(#areaGrad)" dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Server online indicator */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="icon-box icon-green">
                <Server size={20} color="#065f46" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sunucu</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: -0.5 }}>
                  {onlineServ} <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>/ {servers.length}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {servers.length > 0 && servers.slice(0, 3).map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}>
                    {isOnline(s.status)
                      ? <Wifi size={11} color="#10b981" />
                      : <WifiOff size={11} color="#ef4444" />}
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SSL quick */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className={`icon-box ${critSsl > 0 ? 'icon-red' : 'icon-green'}`}>
                {critSsl > 0
                  ? <AlertTriangle size={20} color="#991b1b" />
                  : <ShieldCheck size={20} color="#065f46" />
                }
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>SSL Sertifika</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: -0.5 }}>
                  {sslItems.length} <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>toplam</span>
                </div>
                <div style={{ fontSize: 11, color: critSsl > 0 ? '#991b1b' : '#065f46', fontWeight: 700, marginTop: 2 }}>
                  {critSsl > 0 ? `⚠️ ${critSsl} kritik` : '✅ Hepsi geçerli'}
                </div>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className={`icon-box ${openTickets > 0 ? 'icon-amber' : 'icon-green'}`}>
                <LifeBuoy size={20} color={openTickets > 0 ? '#b45309' : '#065f46'} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Yardım Masası</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: -0.5 }}>{openTickets}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>açık talep</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Server Table ─── */}
      {widgets.servers && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{
            padding: '16px 22px', borderBottom: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div className="card-title">
              <div className="icon-box-sm icon-green">
                <Server size={14} color="#065f46" />
              </div>
              Sunucu Durumu
            </div>
            <span className="badge badge-neutral">{servers.length} sunucu</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sunucu Adı</th>
                  <th>Durum</th>
                  <th>IP Adresi</th>
                  <th>Tür</th>
                  <th>Son Görülme</th>
                </tr>
              </thead>
              <tbody>
                {servers.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    <Server size={28} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                    Kayıtlı sunucu bulunamadı
                  </td></tr>
                ) : servers.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={`icon-box-sm ${isOnline(s.status) ? 'icon-green' : 'icon-red'}`} style={{ width: 30, height: 30, borderRadius: 6 }}>
                          {isOnline(s.status)
                            ? <Wifi size={13} color="#065f46" />
                            : <WifiOff size={13} color="#991b1b" />}
                        </div>
                        <strong>{s.name}</strong>
                      </div>
                    </td>
                    <td>
                      {isOnline(s.status)
                        ? <span className="badge badge-green"><span className="status-dot success pulse" style={{ width: 6, height: 6 }} /> Çevrimiçi</span>
                        : <span className="badge badge-red"><span className="status-dot danger" style={{ width: 6, height: 6 }} /> Çevrimdışı</span>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{s.ipAddress || '—'}</td>
                    <td>
                      <span className="badge badge-neutral">{s.deviceType || 'Sunucu'}</span>
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>
                      {s.lastSeen ? new Date(s.lastSeen).toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Charts Row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {widgets.ssl && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">
                <div className="icon-box-sm icon-violet"><Shield size={14} color="#5b21b6" /></div>
                SSL Sertifika Durumu
              </div>
              <span className="badge badge-neutral">{sslItems.length} sertifika</span>
            </div>
            <div style={{ padding: '16px 24px 20px', display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sslDonut} cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={4} dataKey="value">
                      {sslDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1 }}>
                {sslDonut.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                      <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{d.value}</span>
                  </div>
                ))}
                {/* SSL list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {sslItems.slice(0, 3).map(s => (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px', background: '#f8fafc', borderRadius: 8, fontSize: 12,
                    }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{s.domain}</span>
                      <span className={`badge ${s.status === 'Kritik' ? 'badge-red' : 'badge-green'}`} style={{ fontSize: 10 }}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {widgets.inventory && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e2e8f0' }}>
              <div className="card-title">
                <div className="icon-box-sm icon-amber"><Package size={14} color="#b45309" /></div>
                Şube / Cihaz Dağılımı
              </div>
            </div>
            <div style={{ padding: '12px 16px 20px', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyData} margin={{ top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} stroke="#cbd5e1" tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Cihaz" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ─── USOM Feed ─── */}
      {widgets.usom && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{
            padding: '16px 22px', borderBottom: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div className="card-title">
              <div className="icon-box-sm icon-red">
                <Globe size={14} color="#991b1b" />
              </div>
              USOM Siber Tehdit İstihbaratı
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-amber">
                <span className="status-dot warning pulse" style={{ width: 6, height: 6 }} />
                Canlı Akış
              </span>
              <a
                href="https://www.usom.gov.tr"
                target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}
              >
                usom.gov.tr <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {usomFeeds.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div className="icon-box icon-red" style={{ margin: '0 auto 12px' }}>
                <Globe size={22} color="#991b1b" />
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Tehdit akışı yüklenemedi</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>API: /api/usom/rss — bağlantı kontrol ediliyor…</div>
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 440 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Tür</th>
                    <th>Adres / Başlık</th>
                    <th style={{ width: 260 }}>Açıklama</th>
                    <th style={{ width: 100 }}>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {usomFeeds.slice(0, 25).map((feed, i) => {
                    const isHarmful = feed.type === 'Zararlı Bağlantı';
                    return (
                      <tr key={i}>
                        <td>
                          <span className={`badge ${isHarmful ? 'badge-red' : 'badge-amber'}`}>
                            {isHarmful
                              ? <><CircleX size={11} /> Zararlı</>
                              : <><Zap size={11} /> Bildirim</>}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                            color: '#0f172a', display: 'block',
                            maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {feed.title}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: '#475569' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                            {feed.description}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            <Clock size={11} />
                            {parseUsomDate(feed.pubDate)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Help Desk ─── */}
      {widgets.helpdesk && helpRequests.filter(r => r.status === 'Açık').length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{
            padding: '16px 22px', borderBottom: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div className="card-title">
              <div className="icon-box-sm icon-amber"><LifeBuoy size={14} color="#b45309" /></div>
              Bekleyen Destek Talepleri
            </div>
            <span className="badge badge-amber">{openTickets} açık</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Konu</th>
                <th>Talep Eden</th>
                <th>Departman</th>
                <th>Öncelik</th>
              </tr>
            </thead>
            <tbody>
              {helpRequests.filter(r => r.status === 'Açık').slice(0, 8).map((r, i) => (
                <tr key={i}>
                  <td><strong>{r.subject}</strong></td>
                  <td>{r.creatorName}</td>
                  <td style={{ color: '#94a3b8' }}>{r.department}</td>
                  <td>
                    <span className={`badge ${
                      r.priority === 'Yüksek' ? 'badge-red'
                      : r.priority === 'Orta' ? 'badge-amber'
                      : 'badge-neutral'
                    }`}>{r.priority || 'Normal'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
