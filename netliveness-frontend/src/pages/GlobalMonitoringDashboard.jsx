import React, { useState, useEffect, useCallback } from 'react';
import { getGlobalMonitoringDashboard } from '../api';
import {
  Monitor, Users, Zap, TriangleAlert, RefreshCw, Clock,
  Wifi, WifiOff, Box, Activity, TrendingUp, PauseCircle,
  AlertOctagon, Minus, ChevronRight, Server
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import toast from 'react-hot-toast';

/* ── helpers ──────────────────────────────── */
const fmtTime = (sec) => {
  if (!sec || sec === 0) return '—';
  if (sec >= 3600) return `${Math.floor(sec / 3600)}sa ${Math.floor((sec % 3600) / 60)}dk`;
  if (sec >= 60) return `${Math.floor(sec / 60)}dk`;
  return `${sec}sn`;
};

const fmtLastSeen = (raw) => {
  if (!raw || raw === 'N/A') return '—';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '—';
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Az önce';
    if (diffMin < 60) return `${diffMin}dk önce`;
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
};

/* ─ Status config ─────────────────────────── */
const STATUS_CONFIG = {
  Online:  { label: 'AKTİF',          badgeClass: 'badge-green',  dot: 'success', icon: Wifi },
  Idle:    { label: 'BOŞ BEKLEMEDE',  badgeClass: 'badge-neutral', dot: 'muted',  icon: Minus },
  Offline: { label: 'ÇEVRİMDIŞI',    badgeClass: 'badge-neutral', dot: 'muted',  icon: WifiOff },
  Overtime:{ label: 'MESAİÜSTÜ',     badgeClass: 'badge-violet', dot: 'info',   icon: TrendingUp },
  Error:   { label: 'BAĞLANTI HATASI',badgeClass: 'badge-red',    dot: 'danger', icon: AlertOctagon },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: 10, padding: '8px 14px', fontSize: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      {label && <div style={{ color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

const DONUT_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

export default function GlobalMonitoringDashboard({ pcName = 'ALL' }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await getGlobalMonitoringDashboard(pcName);
      setData(res);
      setLastRefresh(new Date());
    } catch {
      toast.error('Global izleme verisi çekilemedi.');
    } finally {
      setLoading(false);
    }
  }, [pcName]);

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 30_000);
    return () => clearInterval(iv);
  }, [loadData]);

  if (loading && !data) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span style={{ fontWeight: 600 }}>Terminal durumları yükleniyor…</span>
    </div>
  );

  if (!data) return (
    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
      <Server size={36} style={{ opacity: 0.3 }} />
      <div style={{ marginTop: 12, fontWeight: 700 }}>Sunucu bağlantısı sağlanamadı</div>
    </div>
  );

  /* ── derived counts ── */
  const employees = data.employeesOnline || [];
  const totalOnline   = data.totalActiveEmployees  || 0;
  const totalIdle     = data.totalIdleEmployees     || 0;
  const totalOvertime = data.totalOvertimeEmployees || 0;
  const totalPassive  = data.totalPassiveEmployees  || 0;
  const totalError    = data.totalErrorTerminals    || 0;
  const totalAll      = employees.length;

  /* ── filter ── */
  const filtered = employees.filter(e => {
    const matchSearch = !search || 
      e.userName?.toLowerCase().includes(search.toLowerCase()) ||
      e.employee?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ── KPI cards data ── */
  const KPI_CARDS = [
    { label: 'Aktif Çalışan',  value: totalOnline,   icon: Wifi,         iconClass: 'icon-green',  kpiColor: '#10b981', sub: 'Son 5 dk aktivite' },
    { label: 'Boş Beklemede',  value: totalIdle,     icon: Minus,        iconClass: 'icon-slate',  kpiColor: '#94a3b8', sub: 'Çevrimiçi ama pasif' },
    { label: 'Mesai Üstü',     value: totalOvertime, icon: TrendingUp,   iconClass: 'icon-violet', kpiColor: '#8b5cf6', sub: 'Mesai saati dışı' },
    { label: 'Çevrimdışı',     value: totalPassive,  icon: WifiOff,      iconClass: 'icon-slate',  kpiColor: '#cbd5e1', sub: 'Bağlantı yok' },
    { label: 'Bağlantı Hatası',value: totalError,    icon: AlertOctagon, iconClass: 'icon-red',    kpiColor: '#ef4444', sub: 'WMI / RPC hatası' },
    { label: 'Sistem Verimi',  value: `%${data.averageProductivity || 0}`, icon: Zap, iconClass: 'icon-amber', kpiColor: '#f59e0b', sub: 'Aktif / Toplam süre' },
  ];

  /* ── activity trend for chart ── */
  const trendData = (data.activityTrend || []).map(t => ({
    hour: t.hour,
    sn: Math.round((t.activeSeconds || 0) / 60),
  }));

  /* ── app usage donut ── */
  const appUsage = (data.appUsageList || []).map((a, i) => ({
    name: a.appName,
    value: Math.round(a.activeSeconds / 60),
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  /* ── status distribution bar data ── */
  const distData = [
    { name: 'Aktif',      value: totalOnline,   fill: '#10b981' },
    { name: 'Boş',        value: totalIdle,     fill: '#94a3b8' },
    { name: 'M.Üstü',     value: totalOvertime, fill: '#8b5cf6' },
    { name: 'Çevrimdışı', value: totalPassive + totalError, fill: '#e2e8f0' },
  ].filter(d => d.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ─── Page Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">
            <div className="icon-box-sm icon-blue"><Activity size={15} color="#1e40af" /></div>
            Global İzleme Merkezi
          </h1>
          <p className="page-subtitle">
            {totalAll} terminal · Son güncelleme: {lastRefresh ? lastRefresh.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadData}>
          <RefreshCw size={13} /> Yenile
        </button>
      </div>

      {/* ─── KPI Row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
        {KPI_CARDS.map(k => (
          <div
            key={k.label}
            className="card"
            style={{
              '--kpi-color': k.kpiColor,
              padding: '18px 18px 14px',
              cursor: 'default',
              borderTop: `3px solid ${k.kpiColor}`,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div className={`icon-box-sm ${k.iconClass}`} style={{ width: 32, height: 32, borderRadius: 8 }}>
                <k.icon size={14} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: -1, lineHeight: 1 }}>
              {k.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 4 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Charts Row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px 240px', gap: 18 }}>

        {/* Activity Trend */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">
              <TrendingUp size={15} color="#10b981" />
              Saatlik Aktivite Trendi
            </div>
            <span className="badge badge-green" style={{ fontSize: 10 }}>
              <span className="status-dot success pulse" style={{ width: 6, height: 6 }} />
              Canlı
            </span>
          </div>
          <div style={{ height: 180, padding: '8px 8px 12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" fontSize={10} stroke="#cbd5e1" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sn" name="Aktif (dk)" stroke="#10b981" strokeWidth={2} fill="url(#trendGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* App Usage Donut */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px 0' }}>
            <div className="card-title" style={{ fontSize: 13 }}>
              <Box size={14} color="#f59e0b" />
              Uygulama Kullanımı
            </div>
          </div>
          {appUsage.length > 0 ? (
            <div style={{ padding: '8px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={appUsage} cx="50%" cy="50%" innerRadius={35} outerRadius={52} dataKey="value" paddingAngle={3}>
                      {appUsage.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {appUsage.slice(0, 4).map(a => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: a.color }} />
                    <span style={{ color: '#475569', fontWeight: 500 }}>{a.name}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{a.value}dk</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
              Bugün aktivite verisi yok
            </div>
          )}
        </div>

        {/* Software Stats */}
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="card-title" style={{ marginBottom: 16, fontSize: 13 }}>
            <Zap size={14} color="#f59e0b" />
            Yazılım Toplam Kullanımı
          </div>
          {[
            { label: 'SolidWorks', value: fmtTime(data.solidWorksUsageTime), color: '#ef4444', cls: 'icon-red' },
            { label: 'Autodesk',   value: fmtTime(data.autodeskUsageTime),   color: '#3b82f6', cls: 'icon-blue' },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: '1px solid #f1f5f9',
            }}>
              <div className={`icon-box-sm ${s.cls}`} style={{ width: 30, height: 30, borderRadius: 8 }}>
                <Box size={13} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{s.value}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
            Şirket geneli toplam kullanım süresi
          </div>
        </div>
      </div>

      {/* ─── Terminal Table ─── */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          background: '#fdfdfe',
          borderRadius: '16px 16px 0 0',
        }}>
          <div className="card-title">
            <div className="icon-box-sm icon-blue" style={{ width: 28, height: 28, borderRadius: 7 }}>
              <Monitor size={13} color="#1e40af" />
            </div>
            Anlık Terminal Durumları
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div className="search-bar" style={{ minWidth: 200 }}>
              <Users size={13} color="#94a3b8" />
              <input
                placeholder="Terminal / kullanıcı ara…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Status filter pills */}
            {['', 'Online', 'Idle', 'Overtime', 'Error', 'Offline'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 99,
                  border: `1.5px solid ${statusFilter === s ? '#f59e0b' : '#e2e8f0'}`,
                  background: statusFilter === s ? '#fffbeb' : '#fff',
                  color: statusFilter === s ? '#b45309' : '#64748b',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.12s', fontFamily: 'Inter, sans-serif',
                }}
              >
                {s === '' ? `Tümü (${totalAll})` :
                 s === 'Online'  ? `Aktif (${totalOnline})` :
                 s === 'Idle'    ? `Boş (${totalIdle})` :
                 s === 'Overtime'? `M.Üstü (${totalOvertime})` :
                 s === 'Error'   ? `Hata (${totalError})` :
                                   `Çevrimdışı (${totalPassive})`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Terminal / Kullanıcı</th>
                <th>Durum</th>
                <th>Son Aktivite</th>
                <th style={{ width: 120 }}>Son Güncelleme</th>
                <th>Hata</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                    <Monitor size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                    Terminal bulunamadı
                  </td>
                </tr>
              ) : filtered.map((emp, i) => {
                const cfg   = STATUS_CONFIG[emp.status] || STATUS_CONFIG['Offline'];
                const Icon  = cfg.icon;
                const isErr = emp.status === 'Error';

                return (
                  <tr key={i} style={{ background: isErr ? '#fef2f2' : undefined }}>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Avatar */}
                        <div style={{
                          width: 34, height: 34, borderRadius: 9,
                          background: emp.status === 'Online'
                            ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                            : emp.status === 'Error'
                            ? 'linear-gradient(135deg, #fee2e2, #fecaca)'
                            : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                          border: `1.5px solid ${emp.status === 'Online' ? '#a7f3d0' : emp.status === 'Error' ? '#fecaca' : '#e2e8f0'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon
                            size={14}
                            color={emp.status === 'Online' ? '#065f46' : emp.status === 'Error' ? '#991b1b' : '#94a3b8'}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                            {emp.userName || emp.employee}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                            {emp.employee}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${cfg.badgeClass}`} style={{ fontSize: 10 }}>
                        <span className={`status-dot ${cfg.dot}${emp.status === 'Online' ? ' pulse' : ''}`} style={{ width: 6, height: 6 }} />
                        {cfg.label}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: emp.currentTask ? '#0f172a' : '#94a3b8' }}>
                        {emp.currentTask || <span style={{ fontStyle: 'italic' }}>—</span>}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8' }}>
                        <Clock size={11} />
                        {fmtLastSeen(emp.lastSeen)}
                      </div>
                    </td>

                    <td>
                      {emp.lastError ? (
                        <div style={{
                          fontSize: 10, color: '#ef4444', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 3,
                          maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          <TriangleAlert size={10} />
                          {emp.lastError.split('\n')[0]}
                        </div>
                      ) : <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div style={{
          padding: '10px 22px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fdfdfe',
          borderRadius: '0 0 16px 16px',
        }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {filtered.length} / {totalAll} terminal gösteriliyor
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8' }}>
            {totalAll > 0 && (
              <>
                <span>🟢 {totalOnline} aktif</span>
                <span>⚪ {totalIdle} boşta</span>
                {totalError > 0 && <span>🔴 {totalError} hatalı</span>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
