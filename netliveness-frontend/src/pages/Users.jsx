import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, createUser, updateUser, deleteUser } from '../api';
import { Plus, Search, Pencil, Trash2, User, Shield, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AVAILABLE_MODULES = [
  { id: 'Terminals', name: 'Ağ İzleme' },
  { id: 'UserMonitoring', name: 'Kullanıcı İzleme' },
  { id: 'Reports', name: 'Raporlar' },
  { id: 'Ssl', name: 'SSL Takip' },
  { id: 'Matrix', name: 'Yetki Matrisi' },
  { id: 'Directory', name: 'Şirket Rehberi' },
  { id: 'Onboarding', name: 'İş Başları' },
  { id: 'Personnel', name: 'Personel' },
  { id: 'Stock', name: 'Stok & Envanter' },
  { id: 'Cards', name: 'Kart Çevirici' },
  { id: 'Compliance', name: 'Uyum / Sertifika' },
  { id: 'Logs', name: 'Sistem Logları' },
  { id: 'Settings', name: 'Ayarlar' },
  { id: 'Users', name: 'Kullanıcı Yönetimi' },
  { id: 'Updates', name: 'Güncelleme Merkezi' }
];

const emptyForm = {
  username: '',
  passwordHash: '',
  fullName: '',
  email: '',
  permissions: 'Terminals,Reports',
  isAdmin: false,
  isActive: true
};

export default function Users() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId]     = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getUsers();
      setItems(data);
    } catch (e) {
      console.error(e);
      toast.error('Kullanıcı listesi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(u => 
    !search || 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (u) => {
    setForm({
      username: u.username,
      passwordHash: '', // Keep blank unless changing
      fullName: u.fullName,
      email: u.email || '',
      permissions: u.permissions || '',
      isAdmin: u.isAdmin,
      isActive: u.isActive !== false
    });
    setEditId(u.id);
    setModal(true);
  };

  const handleTogglePermission = (moduleId) => {
    if (form.isAdmin) return; // Admins have all
    let perms = form.permissions ? form.permissions.split(',').filter(Boolean) : [];
    if (perms.includes(moduleId)) {
      perms = perms.filter(p => p !== moduleId);
    } else {
      perms.push(moduleId);
    }
    setForm(prev => ({ ...prev, permissions: perms.join(',') }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.username || !form.fullName) {
      toast.error('Kullanıcı Adı ve Ad Soyad zorunludur.');
      return;
    }
    if (!editId && !form.passwordHash) {
      toast.error('Yeni kullanıcı için şifre zorunludur.');
      return;
    }

    try {
      if (editId) {
        await updateUser(editId, { ...form, id: editId });
        toast.success('Kullanıcı güncellendi.');
      } else {
        await createUser(form);
        toast.success('Kullanıcı oluşturuldu.');
      }
      setModal(false);
      load();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data || 'İşlem başarısız.');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(editId);
      toast.success('Kullanıcı silindi.');
      setDeleteModal(false);
      load();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data || 'Silme işlemi başarısız.');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /> Yükleniyor…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Kullanıcı Yönetimi</h2>
          <p>Sisteme giriş izni olan yetkili hesaplar</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Yeni Kullanıcı
        </button>
      </div>

      {/* Tabs */}
      <div className="segmented-control" style={{ marginBottom: '24px', maxWidth: '400px' }}>
        <button 
          className="segmented-item active" 
          onClick={() => navigate('/users')}
        >
          Kullanıcı Listesi
        </button>
        <button 
          className="segmented-item" 
          onClick={() => navigate('/matrix')}
        >
          Erişim Yetkisi
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box" style={{ width: '300px' }}>
          <Search size={18} />
          <input 
            placeholder="Kullanıcı ara..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>E-posta / Kullanıcı Adı</th>
              <th>Ad Soyad</th>
              <th>Durum</th>
              <th>Rol</th>
              <th>Yetkili Modüller</th>
              <th style={{ width: 100 }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ opacity: u.isActive === false ? 0.6 : 1 }}>
                <td><span className="text-muted">#{u.id}</span></td>
                <td style={{ fontWeight: 600 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{u.username}</span>
                    {u.email && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</span>}
                  </div>
                </td>
                <td>{u.fullName}</td>
                <td>
                  <span className="badge" style={{ background: u.isActive === false ? 'var(--bg-input)' : 'var(--accent-green-dim)', color: u.isActive === false ? 'var(--text-muted)' : 'var(--accent-green)' }}>
                    {u.isActive === false ? 'Pasif' : 'Aktif'}
                  </span>
                </td>
                <td>
                  {u.isAdmin ? (
                    <span className="badge" style={{ background: 'var(--accent-purple)', color: '#fff' }}>Sistem Yöneticisi</span>
                  ) : (
                    <span className="badge" style={{ background: 'var(--accent-green-dim)', color: 'var(--accent-green)' }}>Standart</span>
                  )}
                </td>
                <td>
                  {u.isAdmin ? (
                    <span className="text-muted">Tüm yetkiler</span>
                  ) : (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(u.permissions || '').split(',').filter(Boolean).map(p => {
                        const m = AVAILABLE_MODULES.find(x => x.id === p);
                        return <span key={p} style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--bg-input)', borderRadius: '4px', color: 'var(--text-secondary)' }}>{m ? m.name : p}</span>
                      })}
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="icon-btn" onClick={() => openEdit(u)} title="Düzenle">
                      <Pencil size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => { setEditId(u.id); setDeleteModal(true); }} title="Sil">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Kayıt bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '600px', maxWidth: '95vw' }}>
            <div className="modal-header">
              <h3>{editId ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</h3>
              <button className="icon-btn" onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Kullanıcı Adı</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ width: '100%' }}
                      value={form.username} 
                      onChange={e => setForm({...form, username: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>E-posta Adresi</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      style={{ width: '100%' }}
                      value={form.email} 
                      onChange={e => setForm({...form, email: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Ad Soyad</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ width: '100%' }}
                      value={form.fullName} 
                      onChange={e => setForm({...form, fullName: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Durum</label>
                    <select 
                      className="form-input" 
                      style={{ width: '100%' }}
                      value={form.isActive} 
                      onChange={e => setForm({...form, isActive: e.target.value === 'true'})} 
                    >
                      <option value="true">Aktif (Giriş Yapabilir)</option>
                      <option value="false">Pasif (Engellendi)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Şifre {editId && '(Değiştirmek istemiyorsanız boş bırakın)'}</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    style={{ width: '100%' }}
                    value={form.passwordHash} 
                    onChange={e => setForm({...form, passwordHash: e.target.value})} 
                  />
                </div>

                <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: '8px', marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                    <input 
                      type="checkbox" 
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-purple)' }}
                      checked={form.isAdmin}
                      onChange={e => setForm({...form, isAdmin: e.target.checked})}
                    />
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>Sistem Yöneticisi</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tüm modüllere ve ayarlara kısıtlamasız erişim (Diğer yetkilere bakılmaz).</span>
                    </div>
                  </label>
                </div>

                {!form.isAdmin && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Kısıtlı Yetkiler (Sadece seçili modüller görülür)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {AVAILABLE_MODULES.map(mod => {
                        const hasPerm = (form.permissions || '').split(',').includes(mod.id);
                        return (
                          <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', border: '1px solid', borderColor: hasPerm ? 'var(--accent-green)' : 'var(--border-color)', borderRadius: '6px', background: hasPerm ? 'var(--accent-green-dim)' : 'transparent', transition: 'all 0.2s' }}>
                            <input 
                              type="checkbox" 
                              checked={hasPerm}
                              onChange={() => handleTogglePermission(mod.id)}
                              style={{ display: 'none' }}
                            />
                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid', borderColor: hasPerm ? 'var(--accent-green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: hasPerm ? 'var(--accent-green)' : 'transparent' }}>
                              {hasPerm && <Check size={12} color="#fff" />}
                            </div>
                            <span style={{ fontSize: '13px', color: hasPerm ? '#fff' : '#d1d5db', fontWeight: hasPerm ? 600 : 400 }}>{mod.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--accent-red)' }}>Silmeyi Onayla</h3>
              <button className="icon-btn" onClick={() => setDeleteModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body text-center">
              <p>Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Vazgeç</button>
              <button className="btn" style={{ background: 'var(--accent-red)', color: 'white' }} onClick={confirmDelete}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
