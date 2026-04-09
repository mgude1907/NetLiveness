import { useState, useEffect, useCallback } from 'react';
import { getLogs } from '../api';
import { Search, ScrollText, RefreshCw } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const load = useCallback(async () => {
    try { setLogs(await getLogs()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const actions = [...new Set(logs.map(l => l.action).filter(Boolean))].sort();

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.details?.toLowerCase().includes(q) || l.action?.toLowerCase().includes(q)
      || l.operator?.toLowerCase().includes(q);
    const matchAction = !actionFilter || l.action === actionFilter;
    return matchSearch && matchAction;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const actionBadgeColor = (action) => {
    if (action?.includes('DOWN') || action?.includes('Sil') || action?.includes('Delete')) return 'badge-danger';
    if (action?.includes('UP') || action?.includes('Ekle') || action?.includes('Create')) return 'badge-success';
    if (action?.includes('Güncelle') || action?.includes('Update')) return 'badge-warn';
    return 'badge-default';
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /> Yükleniyor…</div>;

  return (
    <div>
      <div className="page-header">
        <div><h2>Sistem Logları</h2><p>{logs.length} log kaydı</p></div>
        <button className="btn btn-ghost" onClick={() => { setLoading(true); load(); }}>
          <RefreshCw size={16} /> Yenile
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box"><Search /><input placeholder="Log ara…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="filter-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="">Tüm Aksiyonlar</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Tarih</th><th>Aksiyon</th><th>Detay</th><th>Operatör</th></tr>
          </thead>
          <tbody>
            {filtered.slice(0, 500).map(l => (
              <tr key={l.id}>
                <td style={{ fontFamily:'monospace', fontSize:12 }}>
                  {l.date ? new Date(l.date).toLocaleString('tr-TR') : '—'}
                </td>
                <td><span className={`badge ${actionBadgeColor(l.action)}`}>{l.action}</span></td>
                <td style={{ whiteSpace:'normal', maxWidth:500 }}>{l.details}</td>
                <td>{l.operator || 'System'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign:'center', padding:'32px', color:'var(--text-muted)' }}>Log bulunamadı</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
