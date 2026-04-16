import { useState, useEffect, useCallback } from 'react';
import { getTerminals, createTerminal, updateTerminal, deleteTerminal, forceWmiRefresh, getSettings, getInventory, getStock } from '../api';
import { Plus, Search, Pencil, Trash2, Monitor, X, ChevronDown, ChevronRight, Building2, Layers, RefreshCw, Zap, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const HealthBar = ({ label, val }) => {
  const getColor = (v) => {
    if (v > 85) return 'var(--red)';
    if (v > 65) return 'var(--amber)';
    return 'var(--green)';
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', width: '28px' }}>{label}</span>
      <div style={{ flex: 1, height: '4px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${val}%`, background: getColor(val), borderRadius: '99px', transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-2)', width: '28px', textAlign: 'right' }}>%{val}</span>
    </div>
  );
};

const DEVICE_TYPES = [
  'Sunucu', 'Sanal Makine', 'ESXI', 'Firewall', 'Switch', 'Router', 'Access Point',
  'Kamera', 'NVR', 'Yazıcı', 'Zebra Barkod Yazıcı', 'Kart Okuyucu', 'Yüz Okuma', 
  'QNAP', 'NAS', 'Santral', 'IDRAC', 'Güvenlik PC', 'Kesintisiz Güç Kaynağı (UPS)', 
  'Akıllı Kabinet', 'Diğer'
];

const emptyForm = {
  name: '', host: '', mac: '', switchPort: '', company: 'Merkez',
  country: 'Türkiye', location: '', description: '', deviceType: 'PC', maintenance: false, skipWmi: false,
  status: 'UNK', rttMs: 0, lastCheck: new Date().toISOString(),
  cpuUsage: 0, ramUsage: 0, diskSizeGb: 0, diskFreeGb: 0,
  username: '', password: '', 
  enableFileMonitoring: false, monitoredPaths: 'C:\\Users', monitoredExtensions: 'sldprt;dwg;dxf;step;iam;ipt', fileThresholdMb: 25,
  enableUserActivity: false, userActivityGroup: 'Genel'
};

export default function Terminals() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [modal, setModal]       = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [editId, setEditId]     = useState(null);
  const [firmsList, setFirmsList] = useState([]);

  // --- INVENTORY LOOKUP --- //
  const [inventory, setInventory]     = useState([]);
  const [showStockSelect, setShowStockSelect] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [expanded, setExpanded]   = useState(() => {
    try {
      const saved = localStorage.getItem('terminals_expanded');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('terminals_expanded', JSON.stringify(expanded));
  }, [expanded]);

  // Otomatik Kullanıcı İzleme Seçimi
  useEffect(() => {
    if (modal && !editId) {
      const pcTypes = ['PC', 'Sunucu', 'Sanal Makine', 'Mühendislik PC', 'Kullanıcı PC'];
      if (pcTypes.includes(form.deviceType) || form.deviceType.toLowerCase().includes('pc')) {
        if (form.enableUserActivity === false) {
          setForm(prev => ({ ...prev, enableUserActivity: true }));
        }
      }
    }
  }, [form.deviceType, modal, editId]);

  const load = useCallback(async () => {
    try { 
      const [termData, settingsData] = await Promise.all([getTerminals(), getSettings()]);
      setItems(termData);
      
      const firms = (settingsData?.firmsList || '').split(',').map(f => f.trim()).filter(Boolean);
      setFirmsList(firms.length > 0 ? firms : ['Merkez']);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      const [inv, stock] = await Promise.all([getInventory(), getStock()]);
      const combined = [...(inv || []), ...(stock || [])];
      setInventory(combined.filter(i => i.category === 'Bilgisayar'));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 8000); return () => clearInterval(iv); }, [load]);

  const filtered = items.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.host.toLowerCase().includes(q)
      || t.location?.toLowerCase().includes(q) || t.company?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchCompany = !companyFilter || t.company === companyFilter;
    const isNotPc = t.deviceType !== 'PC';
    return matchSearch && matchStatus && matchCompany && isNotPc;
  });

  const openNew = () => { 
    setForm(emptyForm); 
    setEditId(null); 
    setModal(true); 
    loadInventory();
  };

  const handleStockSelect = (item) => {
    setForm(prev => ({
      ...prev,
      name: item.pcIsmi || '',
      host: item.ipAddress || item.pcIsmi || '',
      company: item.firma || 'Merkez',
      description: `${item.brand || ''} ${item.model || ''} (${item.serialNo || ''})`.trim()
    }));
    setShowStockSelect(false);
    toast.success('Bilgiler stoktan çekildi.');
  };
  const openEdit = (t) => {
    setForm({ ...t });
    setEditId(t.id); setModal(true);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await updateTerminal(editId, { ...form, id: editId });
        toast.success('Cihaz başarıyla güncellendi.');
      } else {
        await createTerminal(form);
        toast.success('Yeni cihaz eklendi.');
      }
      setModal(false); load();
    } catch (e) {
      console.error(e);
      toast.error('Kayıt işlemi başarısız oldu.');
    }
  };

  const handleDelete = (id) => {
    setEditId(id);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteTerminal(editId);
      toast.success('Cihaz silindi.');
      setDeleteModal(false);
      setEditId(null);
      load();
    } catch (e) {
      console.error(e);
      toast.error('Silme işlemi başarısız oldu.');
    }
  };

  const toggleGroup = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRefreshWMI = async (id, e) => {
    if (e) e.stopPropagation();
    const tId = toast.loading('WMI Taraması yapılıyor, lütfen bekleyin...');
    try {
      await forceWmiRefresh(id);
      toast.success('Tarama başarılı.', { id: tId });
      load();
    } catch (e) {
      toast.error('Tarama başarısız oldu.', { id: tId });
    }
  };

  const statusBadge = (s) => {
    const map = { UP: 'badge-up', DOWN: 'badge-down', UNK: 'badge-unk' };
    const labels = { UP: 'Aktif', DOWN: 'Çevrimdışı', UNK: 'Bilinmiyor' };
    return <span className={`badge ${map[s] || 'badge-default'}`}><span className="badge-dot" />{labels[s] || s}</span>;
  };

  // Grouping logic
  const groupedData = filtered.reduce((acc, t) => {
    const company = t.company || 'Tanımsız Firma';
    const type = t.deviceType || 'Diğer';
    if (!acc[company]) acc[company] = {};
    if (!acc[company][type]) acc[company][type] = [];
    acc[company][type].push(t);
    return acc;
  }, {});

  const sortedCompanies = Object.keys(groupedData).sort();

  if (loading) return <div className="loading-spinner"><div className="spinner" /> Yükleniyor…</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ─── Page Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            <div className="icon-box-sm icon-green"><Monitor size={15} /></div>
            Ağ Aygıtları
          </h1>
          <p className="page-subtitle">{filtered.length} cihaz aktif olarak izleniyor</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Yeni Cihaz Ekle
        </button>
      </div>

      {/* ─── Toolbar ─── */}
      <div className="card" style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <Search size={15} color="var(--text-3)" />
              <input 
                placeholder="Cihaz adı, IP, konum veya firma ara..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <select className="form-select" style={{ width: '180px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tüm Durumlar</option>
              <option value="UP">Aktif (Online)</option>
              <option value="DOWN">Çevrimdışı (Offline)</option>
              <option value="UNK">Bilinmiyor</option>
            </select>
            <select className="form-select" style={{ width: '180px' }} value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
              <option value="">Tüm Firmalar</option>
              {firmsList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost" onClick={load} title="Verileri Yenile">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {sortedCompanies.map(company => {
          const isCompExpanded = expanded[company] !== false; 
          const compData = groupedData[company];
          const sortedTypes = Object.keys(compData).sort();
          const totalInComp = Object.values(compData).flat().length;

          return (
            <div key={company} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Company Header */}
              <div 
                onClick={() => toggleGroup(company)}
                style={{ 
                  padding: '16px 24px', background: '#f8fafc', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '14px', borderBottom: isCompExpanded ? '1px solid var(--border)' : 'none'
                }}
              >
                <div style={{ transform: isCompExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
                  <ChevronDown size={18} color="var(--text-3)" />
                </div>
                <div className="icon-box-sm icon-blue"><Building2 size={16} /></div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-1)' }}>{company}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>{totalInComp} İzlenen Cihaz</div>
                </div>
              </div>

              {isCompExpanded && (
                <div style={{ padding: '0 0 16px 0' }}>
                  {sortedTypes.map(type => {
                    const typeKey = `${company}-${type}`;
                    const isTypeExpanded = expanded[typeKey] !== false;
                    const itemsInType = compData[type];

                    return (
                      <div key={type} style={{ margin: '16px 24px 0' }}>
                        <div 
                          onClick={() => toggleGroup(typeKey)}
                          style={{ 
                            padding: '10px 16px', background: 'var(--bg-page)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '10px', 
                            marginBottom: isTypeExpanded ? '12px' : '0', border: '1px solid var(--border)'
                          }}
                        >
                          <div style={{ transform: isTypeExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
                            <ChevronDown size={14} color="var(--text-3)" />
                          </div>
                          <div className="icon-box-sm icon-slate" style={{ width: 24, height: 24, borderRadius: 6 }}>
                             <Layers size={13} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-2)' }}>{type}</span>
                          <span className="badge badge-neutral" style={{ fontSize: '10px', marginLeft: 'auto' }}>{itemsInType.length} Cihaz</span>
                        </div>

                        {isTypeExpanded && (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th style={{ width: 100 }}>Durum</th>
                                  <th>Aygıt Adı / Host</th>
                                  <th style={{ width: 80 }}>RTT</th>
                                  <th>Konum</th>
                                  <th style={{ width: 180 }}>Kapasite / Sağlık</th>
                                  <th style={{ width: 100, textAlign: 'center' }}>İşlemler</th>
                                </tr>
                              </thead>
                              <tbody>
                                {itemsInType.map(t => {
                                   const isUp = t.status === 'UP';
                                   const isServ = ['Sunucu', 'ESXI', 'Sanal Makine'].includes(t.deviceType);
                                   
                                   return (
                                    <tr key={t.id}>
                                      <td>
                                        <span className={`badge ${isUp ? 'badge-green' : (t.status === 'DOWN' ? 'badge-red' : 'badge-neutral')}`}>
                                          <span className={`status-dot ${isUp ? 'success' : (t.status === 'DOWN' ? 'danger' : 'muted')}${isUp ? ' pulse' : ''}`} style={{ width: 6, height: 6 }} />
                                          {isUp ? 'AKTİF' : (t.status === 'DOWN' ? 'KAPALI' : 'BİLİNMİYOR')}
                                        </span>
                                      </td>
                                      <td>
                                        <div style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: '13px' }}>{t.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'monospace' }}>{t.host}</div>
                                      </td>
                                      <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                                          {isUp ? <><Zap size={11} color="var(--amber)" /> {t.rttMs}ms</> : <span style={{ color: 'var(--text-3)' }}>—</span>}
                                        </div>
                                      </td>
                                      <td style={{ fontSize: '12px', fontWeight: 500 }}>{t.location || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                                      <td>
                                        {isServ && isUp ? (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
                                            <HealthBar label="Disk" val={t.diskSizeGb > 0 ? Math.round((1 - t.diskFreeGb / t.diskSizeGb) * 100) : 0} />
                                            <HealthBar label="CPU"  val={t.cpuUsage} />
                                            <HealthBar label="RAM"  val={t.ramUsage} />
                                          </div>
                                        ) : (
                                          <div style={{ fontSize: '11px', color: 'var(--text-3)', fontStyle: 'italic' }}>Kullanılabilir değil</div>
                                        )}
                                      </td>
                                      <td>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                          <button className="btn-icon" onClick={() => openEdit(t)} title="Düzenle"><Pencil size={14} /></button>
                                          <button className="btn-icon" style={{ borderColor: 'var(--red-border)', color: 'var(--red)' }} onClick={() => handleDelete(t.id)} title="Sil"><Trash2 size={14} /></button>
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
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card" style={{ textAlign:'center', padding:'60px', borderStyle: 'dashed' }}>
            <Monitor size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-2)' }}>Arama kriterlerine uygun aygıt bulunamadı.</p>
            <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => { setSearch(''); setStatusFilter(''); setCompanyFilter(''); }}>Filtreleri Temizle</button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Trash2 size={18} color="var(--red)" /> Aygıtı Sil</h2>
              <button className="icon-btn" onClick={() => setDeleteModal(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: '8px 0 24px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>Bu aygıtı izleme listesinden kaldırmak istediğinize emin misiniz?</p>
              <p style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 600, marginTop: '8px' }}>Bu işlem geri alınamaz ve tüm geçmiş veriler temizlenir.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>İptal</button>
              <button className="btn btn-danger" style={{ background: 'var(--red)', color: '#fff' }} onClick={confirmDelete}>Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <div className="icon-box-sm icon-amber"><Pencil size={16} /></div>
                {editId ? 'Aygıt Bilgilerini Düzenle' : 'Yeni Ağ Aygıtı Kaydı'}
              </h2>
              <button className="icon-btn" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {!editId && (
                <div style={{ padding: '12px', background: 'var(--bg-inset)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showStockSelect ? '12px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={14} color="var(--blue)" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-1)' }}>Mevcut Envanterden Veri Çek</span>
                    </div>
                    <button className="btn btn-ghost" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={() => setShowStockSelect(!showStockSelect)}>
                      {showStockSelect ? 'Kapat' : 'Stoktan Seç'}
                    </button>
                  </div>
                  
                  {showStockSelect && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="search-bar" style={{ height: '36px' }}>
                        <Search size={14} />
                        <input 
                          placeholder="Bilgisayar adı veya seri no ile ara..." 
                          value={stockSearch} 
                          onChange={e => setStockSearch(e.target.value)} 
                          autoFocus
                        />
                      </div>
                      <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {inventory.filter(i => {
                          const s = stockSearch.toLowerCase();
                          return !s || i.pcIsmi?.toLowerCase().includes(s) || i.serialNo?.toLowerCase().includes(s) || (i.assignedTo && i.assignedTo.toLowerCase().includes(s));
                        }).map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => handleStockSelect(item)}
                            style={{ 
                              padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff'
                            }}
                            className="stock-item-hover"
                          >
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)' }}>{item.pcIsmi}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{item.brand} {item.model} — {item.assignedTo || 'Depo'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                               <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--blue)' }}>{item.ipAddress || 'IP Yok'}</div>
                               <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{item.firma}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Aygıt Adı (Etiket)</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ör: TR-SRV-01" />
                </div>
                <div className="form-group">
                  <label className="form-label">Host / IP Adresi</label>
                  <input className="form-input" value={form.host} onChange={e => setForm({...form, host: e.target.value})} placeholder="10.0.0.5 veya hostname" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">MAC Adresi</label>
                  <input className="form-input" value={form.mac} onChange={e => setForm({...form, mac: e.target.value})} placeholder="AA:BB:CC:DD:EE:FF" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bağlı Olduğu Port</label>
                  <input className="form-input" value={form.switchPort} onChange={e => setForm({...form, switchPort: e.target.value})} placeholder="Gi1/0/24" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tesis / Firma</label>
                  <select className="form-select" value={form.company} onChange={e => setForm({...form, company: e.target.value})}>
                    {firmsList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Aygıt Türü</label>
                  <select className="form-select" value={form.deviceType} onChange={e => setForm({...form, deviceType: e.target.value})}>
                    {DEVICE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="divider" style={{ margin: '8px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Fiziksel Lokasyon</label>
                  <input className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="B-Blok Kat-1 Oda-201" />
                </div>
                <div className="form-group">
                  <label className="form-label">Açıklama / Notlar</label>
                  <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
              </div>

              {/* Advanced Polling Settings */}
              <div style={{ padding: '16px', background: 'var(--bg-inset)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                 <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Tarama Seçenekleri</p>
                 <div style={{ display: 'flex', gap: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.skipWmi} onChange={e => setForm({...form, skipWmi: e.target.checked})} style={{ width: 16, height: 16 }} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>Sadece Ping İzle (WMI Kapalı)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.maintenance} onChange={e => setForm({...form, maintenance: e.target.checked})} style={{ width: 16, height: 16 }} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>Bakım Moduna Al (İzlemeyi Durdur)</span>
                    </label>
                 </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editId ? 'Değişiklikleri Kaydet' : 'Aygıtı Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
