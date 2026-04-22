import { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings, restartSystem, getSystemHealth, startWorker, testPersonnelConnection, testGlpiConnection, syncGlpiInventory } from '../api';
import { 
  Save, Settings as SettingsIcon, X as XIcon, Plus, Terminal, RefreshCw, 
  TriangleAlert, Zap, Activity, Database, PlayCircle, Mail, Globe, 
  ShieldCheck, Server, Monitor, Image as ImageIcon, Briefcase, Trash2, CheckCircle2, Box
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [form, setForm]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [newFirm, setNewFirm] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  
  // System Health
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [workerStarting, setWorkerStarting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testingGlpi, setTestingGlpi] = useState(false);
  const [syncingGlpi, setSyncingGlpi] = useState(false);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await getSystemHealth();
      setHealth(res);
    } catch {
      setHealth({ api: "Hata", worker: "Hata", database: "Hata" });
    }
    setHealthLoading(false);
  }, []);

  const handleStartWorker = async () => {
    setWorkerStarting(true);
    try {
      await startWorker();
      toast.success("Worker başlatma komutu iletildi.");
      setTimeout(fetchHealth, 2000);
    } catch (e) {
      toast.error("Worker başlatılamadı!");
    } finally {
      setWorkerStarting(false);
    }
  };

  const handleRestart = async () => {
    if (!window.confirm("DIKKAT! Sistem yeniden başlatılacak. Servisleriniz geçici olarak kesintiye uğrayabilir. Onaylıyor musunuz?")) return;
    setRestarting(true);
    try {
      const res = await restartSystem();
      toast.success(res.message || "Yeniden başlatılıyor...");
      setTimeout(() => window.location.reload(), 5000);
    } catch (e) {
      toast.error("Yeniden başlatma isteği başarısız oldu!");
      setRestarting(false);
    }
  };

  const handleTestConnection = async () => {
    if (form.personnelIntegrationType === 'SQL' || form.personnelSqlAuthType === 'SQL') {
       if (!form.personnelSqlHost) { toast.error("Sunucu Adı boş bırakılamaz."); return; }
       if (form.personnelSqlAuthType !== 'Windows' && !form.personnelSqlUser) {
          toast.error("SQL Kimlik Doğrulaması için Kullanıcı Adı (Login) gereklidir.");
          return;
       }
    }

    setTestingConnection(true);
    const tid = toast.loading('SQL Server bağlantısı test ediliyor...');
    try {
      const res = await testPersonnelConnection(form);
      toast.success(res.message || "Bağlantı başarılı!", { id: tid });
    } catch (e) {
      toast.error(e.response?.data?.message || "Bağlantı başarısız!", { id: tid });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestGlpiConnection = async () => {
    if (!form.glpiUrl) { toast.error("GLPI URL boş bırakılamaz."); return; }
    setTestingGlpi(true);
    const tid = toast.loading('GLPI bağlantısı test ediliyor...');
    try {
      const res = await testGlpiConnection(form);
      toast.success(res.message, { id: tid });
    } catch (e) {
      const detailedError = e.response?.data?.message || e.message || "Bilinmeyen bağlantı hatası!";
      toast.error(detailedError, { id: tid });
      console.error("GLPI Connection Error:", e);
    } finally {
      setTestingGlpi(false);
    }
  };

  const handleSyncGlpiInventory = async () => {
    setSyncingGlpi(true);
    const tid = toast.loading('GLPI envanteri senkronize ediliyor...');
    try {
      const res = await syncGlpiInventory();
      toast.success(res.message, { id: tid });
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Senkronizasyon başarısız!", { id: tid });
    } finally {
      setSyncingGlpi(false);
    }
  };

  const load = useCallback(async () => {
    try { 
      const raw = await getSettings();
      const withDefaults = {
        ...raw,
        personnelSqlAuthType: raw.personnelSqlAuthType || 'SQL',
        personnelIntegrationType: raw.personnelIntegrationType || 'None'
      };
      setForm(withDefaults); 
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { 
    load(); 
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, [load, fetchHealth]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success('Ayarlar başarıyla kaydedildi!');
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
    } catch (e) { 
      toast.error('Kaydetme hatası!'); 
    }
    finally { setSaving(false); }
  };

  if (loading || !form) return (
    <div className="loading-overlay">
      <div className="spinner" />
      <span>Yapılandırma yükleniyor...</span>
    </div>
  );

  const update = (key, val) => setForm({ ...form, [key]: val });

  const tabs = [
    { id: 'general', label: 'Genel', icon: <Globe size={16} /> },
    { id: 'monitoring', label: 'İzleme', icon: <Monitor size={16} /> },
    { id: 'integration', label: 'Entegrasyonlar', icon: <Activity size={16} /> },
    { id: 'alerts', label: 'Bildirimler', icon: <Mail size={16} /> },
    { id: 'system', label: 'Sistem', icon: <ShieldCheck size={16} /> },
  ];

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: 28, background: 'var(--bg-surface)', padding: '20px 24px', 
        borderRadius: 'var(--r-xl)', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingsIcon className="icon-amber" style={{ padding: 6, borderRadius: 8 }} size={32} />
            Uygulama Yapılandırması
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Sistem genelindeki tüm parametreleri ve servis bağlantılarını yönetin.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ height: 42, padding: '0 24px' }}>
          <Save size={18} /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>

      {/* Main Tabs Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Navigation Sidebar */}
        <div style={{ 
          background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)', 
          border: '1px solid var(--border)', padding: 12, position: 'sticky', top: 92
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', marginBottom: 4 }}
            >
              <div className="nav-icon-wrap" style={{ 
                background: activeTab === tab.id ? 'var(--amber)' : 'var(--bg-inset)',
                color: activeTab === tab.id ? '#fff' : 'var(--text-2)'
              }}>
                {tab.icon}
              </div>
              <span style={{ flex: 1 }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {activeTab === 'general' && (
            <div className="animate-in-up">
              <section className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <div className="icon-box-sm icon-amber"><ImageIcon size={16} /></div>
                    🎨 Markalama & Görünüm
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">Uygulama Başlığı</label>
                    <input 
                      className="form-input" 
                      value={form.appTitle || ''} 
                      onChange={e => update('appTitle', e.target.value)} 
                      placeholder="REPKON NetLiveness" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Uygulama Logosu</label>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: 20, 
                      padding: 16, background: 'var(--bg-inset)', borderRadius: 12, border: '1px dashed var(--border-strong)'
                    }}>
                      <div style={{ 
                        width: 80, height: 80, background: '#fff', 
                        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)'
                      }}>
                        {form.appLogo ? (
                          <img src={form.appLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                        ) : (
                          <ImageIcon size={32} color="var(--text-3)" />
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                            <Plus size={14} /> Logo Yükle
                            <input 
                              type="file" accept="image/*" hidden 
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => update('appLogo', reader.result);
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                          {form.appLogo && (
                            <button className="btn btn-danger" onClick={() => update('appLogo', '')}>
                              <Trash2 size={14} /> Kaldır
                            </button>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Önerilen: 512x512px Şeffaf PNG</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <div className="icon-box-sm icon-blue"><Briefcase size={16} /></div>
                    🏢 Firma & Şube Yönetimi
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-2)' }}>İzleme ekranlarında ve personel listelerinde kullanılacak aktif firma isimleri:</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 0' }}>
                    {(form.firmsList || '').split(',').map(f => f.trim()).filter(Boolean).map(firm => (
                      <div key={firm} className="badge badge-amber" style={{ padding: '6px 14px', gap: 8 }}>
                        <span>{firm}</span>
                        <XIcon size={12} className="cursor-pointer" onClick={() => {
                          const list = (form.firmsList || '').split(',').map(f => f.trim()).filter(Boolean);
                          update('firmsList', list.filter(x => x !== firm).join(','));
                        }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10, maxWidth: 400 }}>
                    <input 
                      className="form-input" placeholder="Yeni Firma Adı..." 
                      value={newFirm} onChange={e => setNewFirm(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (!newFirm.trim()) return;
                          const list = (form.firmsList || '').split(',').map(f => f.trim()).filter(Boolean);
                          if (!list.includes(newFirm.trim())) {
                            update('firmsList', [...list, newFirm.trim()].join(','));
                            setNewFirm('');
                          }
                        }
                      }}
                    />
                    <button className="btn btn-secondary" onClick={() => {
                      if (!newFirm.trim()) return;
                      const list = (form.firmsList || '').split(',').map(f => f.trim()).filter(Boolean);
                      if (!list.includes(newFirm.trim())) {
                        update('firmsList', [...list, newFirm.trim()].join(','));
                        setNewFirm('');
                      }
                    }}>Ekle</button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="animate-in-up">
              <section className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <div className="icon-box-sm icon-green"><Activity size={16} /></div>
                    📡 Şebeke İzleme Parametreleri
                  </h3>
                </div>
                <div className="form-group">
                  <label className="form-label">Ping Yoklama Aralığı (Milisaniye)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="number" className="form-input" style={{ maxWidth: 160 }}
                      value={form.pingIntervalMs} onChange={e => update('pingIntervalMs', parseInt(e.target.value) || 5000)} />
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Varsayılan: 5000ms (5 Saniye)</span>
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <div className="icon-box-sm icon-violet"><Server size={16} /></div>
                    🖥️ Uzak Erişim & WMI Yetkilendirmesi
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Ucak bilgisayarlardan uygulama ve performans verisi çekebilmek için gerekli kimlik bilgileri:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="form-group">
                      <label className="form-label">WMI Kullanıcı Adı</label>
                      <input className="form-input" value={form.wmiUser || ''} onChange={e => update('wmiUser', e.target.value)} placeholder="administrator" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">WMI Şifre</label>
                      <input type="password" title="Şifre" className="form-input" value={form.wmiPass || ''} onChange={e => update('wmiPass', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">WMI Domain (Opsiyonel)</label>
                    <input className="form-input" value={form.wmiDomain || ''} onChange={e => update('wmiDomain', e.target.value)} placeholder="REPKON" />
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'integration' && (
            <div className="animate-in-up">
              <section className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <h3 className="card-title">
                    <div className="icon-box-sm icon-blue"><Database size={16} /></div>
                    🔗 Personel Sistem Entegrasyonu (Meyer / IFS)
                  </h3>
                  <div className={`badge ${form.personnelIntegrationType === 'None' ? 'badge-neutral' : 'badge-green'}`}>
                    {form.personnelIntegrationType === 'None' ? 'Devre Dışı' : 'Aktif'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="form-group">
                    <label className="form-label">Bağlantı Yöntemi</label>
                    <select 
                      className="form-select" style={{ maxWidth: 300 }}
                      value={form.personnelIntegrationType} 
                      onChange={e => update('personnelIntegrationType', e.target.value)}
                    >
                      <option value="None">Manuel Yönetim (Entegrasyon Yok)</option>
                      <option value="SQL">SQL Server Doğrudan Bağlantı</option>
                    </select>
                  </div>

                  {form.personnelIntegrationType === 'SQL' && (
                    <div className="animate-in" style={{ 
                      padding: 24, background: 'var(--bg-inset)', borderRadius: 16, border: '1px solid var(--border-strong)'
                    }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Database size={16} color="var(--blue)" /> SQL Bağlantı Parametreleri
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                        <div className="form-group">
                          <label className="form-label">Sunucu (Host / IP)</label>
                          <input className="form-input" value={form.personnelSqlHost || ''} onChange={e => update('personnelSqlHost', e.target.value)} placeholder="192.168.1.10" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Veritabanı Adı</label>
                          <input className="form-input" value={form.personnelSqlDatabase || ''} onChange={e => update('personnelSqlDatabase', e.target.value)} placeholder="Meyer" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Kimlik Doğrulama</label>
                          <select className="form-select" value={form.personnelSqlAuthType || 'SQL'} onChange={e => update('personnelSqlAuthType', e.target.value)}>
                            <option value="SQL">SQL Server Authentication</option>
                            <option value="Windows">Windows Authentication</option>
                          </select>
                        </div>
                        {form.personnelSqlAuthType === 'SQL' ? (
                          <>
                            <div className="form-group">
                              <label className="form-label">Kullanıcı Adı</label>
                              <input className="form-input" value={form.personnelSqlUser || ''} onChange={e => update('personnelSqlUser', e.target.value)} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Şifre</label>
                              <input type="password" title="SQL Şifre" className="form-input" value={form.personnelSqlPass || ''} onChange={e => update('personnelSqlPass', e.target.value)} />
                            </div>
                          </>
                        ) : <div style={{ gridColumn: 'span 2', fontSize: 12, color: 'var(--text-3)', padding: 12, background: 'rgba(255,255,255,0.5)', borderRadius: 8 }}>Windows Authentication, API servisinin çalıştığı kullanıcı hesabını kullanacaktır.</div>}
                      </div>

                      <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                        <div className="form-group">
                          <label className="form-label">Senkronizasyon Sorgusu (SQL)</label>
                          <textarea 
                            className="form-textarea" rows={3} style={{ fontFamily: 'monospace' }}
                            value={form.personnelIntegrationSqlQuery || ''} 
                            onChange={e => update('personnelIntegrationSqlQuery', e.target.value)}
                            placeholder="SELECT SicilNo, Ad, Soyad, Bolum, Gorev FROM Employees"
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            {form.personnelIntegrationLastSync ? `Son Başarılı Senkr: ${new Date(form.personnelIntegrationLastSync).toLocaleString()}` : 'Henüz senkronize edilmedi.'}
                          </span>
                          <button 
                            className="btn btn-secondary" onClick={handleTestConnection} disabled={testingConnection}
                            style={{ background: 'var(--blue-soft)', color: 'var(--blue-text)', borderColor: 'var(--blue-border)' }}
                          >
                            {testingConnection ? <RefreshCw className="spin" size={14} /> : <Zap size={14} />} Bağlantıyı Test Et
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <div className="icon-box-sm icon-amber"><Zap size={16} /></div>
                    🎫 GLPI Teknik Destek Entegrasyonu
                  </h3>
                  <div className={`badge ${form.glpiUrl ? 'badge-green' : 'badge-neutral'}`}>
                    {form.glpiUrl ? 'Bağlantı Hazır' : 'Yapılandırılmadı'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '8px 0' }}>
                  <div style={{ padding: 16, background: 'rgba(245,158,11,0.05)', borderRadius: 16, border: '1px solid rgba(245,158,11,0.1)', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div className="icon-box-sm" style={{ background: '#f59e0b', color: '#fff' }}><Globe size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>GLPI API Erişimi</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Taleplerin GLPI bilet sistemine otomatik aktarılması için REST API bağlantısını yapılandırın.</div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">GLPI API URL (apirest.php konumu)</label>
                    <input className="form-input" value={form.glpiUrl || ''} onChange={e => update('glpiUrl', e.target.value)} placeholder="http://192.168.7.235" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="form-group">
                      <label className="form-label">Uygulama Belirteci (App Token)</label>
                      <input className="form-input" value={form.glpiAppToken || ''} onChange={e => update('glpiAppToken', e.target.value)} placeholder="GLPI tarafında oluşturulan App Token" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Kullanıcı Belirteci (User Token)</label>
                      <input className="form-input" value={form.glpiUserToken || ''} onChange={e => update('glpiUserToken', e.target.value)} placeholder="API yetkili kullanıcısı API Token" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                       <div className="icon-box-sm icon-blue"><Plus size={14} /></div>
                       <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ marginBottom: 0 }}>Zimmet Şablon Yolu (Kurumsal)</label>
                       </div>
                    </div>
                    <input className="form-input" style={{ maxWidth: 300 }} value={form.zimmetTemplatePath || ''} onChange={e => update('zimmetTemplatePath', e.target.value)} />
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button 
                      className="btn btn-secondary" onClick={handleSyncGlpiInventory} disabled={syncingGlpi || !form.glpiUrl}
                      style={{ background: 'var(--blue-soft)', color: 'var(--blue-text)', borderColor: 'var(--blue-border)' }}
                    >
                      {syncingGlpi ? <RefreshCw className="spin" size={14} /> : <Box size={14} />} Envanteri Şimdi Eşitle
                    </button>
                    <button 
                      className="btn btn-secondary" onClick={handleTestGlpiConnection} disabled={testingGlpi || !form.glpiUrl}
                      style={{ background: 'var(--amber-soft)', color: 'var(--amber-text)', borderColor: 'var(--amber-border)' }}
                    >
                      {testingGlpi ? <RefreshCw className="spin" size={14} /> : <Zap size={14} />} GLPI Bağlantısını Doğrula
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="animate-in-up">
              <section className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <div className="icon-box-sm icon-amber"><Mail size={16} /></div>
                    📧 E-Posta (SMTP) & Alarm Yapılandırması
                  </h3>
                  <div className={`badge ${form.smtpEnabled ? 'badge-green' : 'badge-neutral'}`}>
                    {form.smtpEnabled ? 'Servis Aktif' : 'Servis Kapalı'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" id="smtpEnabled" checked={form.smtpEnabled} onChange={e => update('smtpEnabled', e.target.checked)} style={{ width: 16, height: 16 }} />
                    <label htmlFor="smtpEnabled" style={{ fontWeight: 600, cursor: 'pointer' }}>E-Posta gönderimini aktif et</label>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 20 }}>
                    <div className="form-group">
                      <label className="form-label">SMTP Sunucu</label>
                      <input className="form-input" value={form.smtpServer} onChange={e => update('smtpServer', e.target.value)} placeholder="smtp.office365.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Port</label>
                      <input type="number" className="form-input" value={form.smtpPort} onChange={e => update('smtpPort', parseInt(e.target.value) || 587)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="form-group">
                      <label className="form-label">Kullanıcı Adı</label>
                      <input className="form-input" value={form.smtpUser} onChange={e => update('smtpUser', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Şifre</label>
                      <input type="password" title="SMTP Şifre" className="form-input" value={form.smtpPass} onChange={e => update('smtpPass', e.target.value)} />
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: 'var(--bg-inset)', borderRadius: 12 }}>
                    <h5 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' }}>🔔 Hedef E-Posta Adresleri</h5>
                    <div className="form-group">
                      <label className="form-label">BT Departmanı</label>
                      <input className="form-input" value={form.itEmailTo || ''} onChange={e => update('itEmailTo', e.target.value)} placeholder="it-list@company.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">İdari İşler</label>
                      <input className="form-input" value={form.adminEmailTo || ''} onChange={e => update('adminEmailTo', e.target.value)} />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="animate-in-up">
              <section className="card" style={{ marginBottom: 24 }}>
                <div className="card-header" style={{ marginBottom: 24 }}>
                  <h3 className="card-title">
                    <div className="icon-box-sm icon-red"><ShieldCheck size={16} /></div>
                    🛠️ Sistem Modülleri Durumu & Servis Kontrolü
                  </h3>
                  <button className="btn btn-secondary" onClick={fetchHealth} disabled={healthLoading}>
                    <RefreshCw className={healthLoading ? 'spin' : ''} size={14} /> Yenile
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {[
                    { id: 'api', label: 'API Servisi (5006)', status: health?.api, icon: <Zap size={20} />, action: handleRestart, actionLabel: restarting ? '...' : 'Yeniden Başlat' },
                    { id: 'worker', label: 'İzleme Worker', status: health?.worker, icon: <Activity size={20} />, action: handleStartWorker, actionLabel: 'Başlat', hideAction: health?.worker === 'Çalışıyor' },
                    { id: 'db', label: 'SQLite Veritabanı', status: health?.database, icon: <Database size={20} />, noAction: true },
                  ].map(s => (
                    <div key={s.id} style={{ 
                      padding: 20, borderRadius: 16, background: 'var(--bg-inset)', border: '1px solid var(--border)',
                      display: 'flex', flexDirection: 'column', gap: 16
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ 
                          width: 40, height: 40, borderRadius: 12,
                          background: s.status === 'Çalışıyor' || s.status === 'Bağlı' ? 'var(--green-soft)' : 'var(--red-soft)',
                          color: s.status === 'Çalışıyor' || s.status === 'Bağlı' ? 'var(--green)' : 'var(--red)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {s.icon}
                        </div>
                        <div className={`badge ${s.status === 'Çalışıyor' || s.status === 'Bağlı' ? 'badge-green' : 'badge-red'}`}>
                          {s.status || 'Hata'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{s.label}</div>
                        {!s.noAction && !s.hideAction && (
                          <button 
                            className="btn btn-ghost" onClick={s.action}
                            style={{ width: '100%', marginTop: 12, height: 32, fontSize: 11 }}
                          >
                             {s.actionLabel}
                          </button>
                        )}
                        {s.hideAction && (
                          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <CheckCircle2 size={12} /> Servis Aktif
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div style={{ 
                padding: 20, borderRadius: 16, background: 'var(--red-soft)', 
                border: '1px solid var(--red-border)', color: 'var(--red-text)'
              }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <TriangleAlert size={18} /> Tehlikeli Bölge
                </h4>
                <p style={{ fontSize: 12, marginBottom: 16 }}>Sistemi yeniden başlatmak tüm aktif aramaları ve izleme süreçlerini geçici olarak durduracaktır. Lütfen bu işlemi yalnızca zorunlu hallerde gerçekleştirin.</p>
                <button className="btn btn-danger" onClick={handleRestart} disabled={restarting}>
                  <RefreshCw size={14} className={restarting ? 'spin' : ''} /> Sistemi Tamamen Kapat ve Yeniden Başlat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-in { animation: fadeIn 0.3s ease-out; }
        .animate-in-up { animation: fadeInUp 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
