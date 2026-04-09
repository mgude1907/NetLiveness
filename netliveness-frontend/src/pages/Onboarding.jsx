import { useState, useEffect } from 'react';
import { getOnboardings, createOnboarding, updateOnboarding, deleteOnboarding, getSettings } from '../api';
import toast from 'react-hot-toast';
import { UserPlus, Save, X, Trash2, Mail, Briefcase, Pencil, Phone, Calendar, Building2, User } from 'lucide-react';

export default function Onboarding() {
  const [data, setData] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    manager: '',
    startDate: '',
    homeAddress: '',
    mobilePhone: '',
    email: '',
    status: 'Bekliyor'
  });

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchData = async () => {
    try {
      const onboardings = await getOnboardings();
      setData(onboardings || []);
    } catch (e) {
      toast.error('Veriler alınamadı.');
    }
  };

  const fetchSettings = async () => {
    try {
      const settings = await getSettings();
      if (settings?.firmsList) {
        setCompanies(settings.firmsList.split(',').map(f => f.trim()).filter(f => f));
      }
    } catch (e) {
      console.error('Settings fetch error', e);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      firstName: '',
      lastName: '',
      company: companies[0] || '',
      manager: '',
      startDate: new Date().toISOString().split('T')[0],
      homeAddress: '',
      mobilePhone: '',
      email: '',
      status: 'Bekliyor'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      ...item,
      startDate: item.startDate ? item.startDate.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateOnboarding(editingItem.id, formData);
        toast.success('Güncellendi');
      } else {
        await createOnboarding(formData);
        toast.success('İş başı kaydedildi ve ilgili birimlere e-posta gönderimi tetiklendi.', { duration: 4000 });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      toast.error('İşlem başarısız oldu.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu iş başı kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await deleteOnboarding(id);
      toast.success('Kayıt silindi.');
      fetchData();
    } catch (e) {
      toast.error('Silinemedi.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ─── Page Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            <div className="icon-box-sm icon-green"><Briefcase size={15} /></div>
            İş Başı (Onboarding) Yönetimi
          </h1>
          <p className="page-subtitle">Yeni personel girişlerini kaydedin ve ilgili departmanlara otomatik bilgilendirme sağlayın</p>
        </div>
        
        <button className="btn btn-primary" onClick={openAddModal}>
          <UserPlus size={16} /> Yeni İş Başı Kaydı
        </button>
      </div>

      {/* ─── Data Card ─── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)' }}>
          <div className="icon-box-sm icon-slate" style={{ width: 24, height: 24 }}><UserPlus size={14} /></div>
          <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-1)' }}>AKTİF SÜREÇLER</div>
          <span className="badge badge-neutral" style={{ marginLeft: 'auto', fontSize: '10px' }}>{data.length} Kayıt</span>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 120 }}>Durum</th>
                <th>Ad Soyad</th>
                <th>Şirket / Yönetici</th>
                <th>İş Başı Tarihi</th>
                <th>İletişim Bilgileri</th>
                <th style={{ width: 100, textAlign: 'center' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => {
                const statusClass = item.status === 'Bekliyor' ? 'badge-amber' : 
                                   item.status === 'Hazırlanıyor' ? 'badge-blue' :
                                   item.status === 'İptal' ? 'badge-red' : 'badge-green';
                
                return (
                  <tr key={item.id}>
                    <td>
                      <span className={`badge ${statusClass}`} style={{ fontSize: '10px' }}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar-initials" style={{ background: 'linear-gradient(135deg, var(--green-light), var(--green-border))', color: 'var(--green)' }}>
                          {(item.firstName?.[0] || '?').toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: '13px' }}>
                          {item.firstName} {item.lastName}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>{item.company}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{item.manager}</div>
                    </td>
                    <td style={{ fontSize: '12px', fontWeight: 600 }}>
                      {new Date(item.startDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>{item.email}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{item.mobilePhone}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button className="btn-icon" onClick={() => openEditModal(item)} title="Düzenle"><Pencil size={13} /></button>
                        <button className="btn-icon" style={{ borderColor: 'var(--red-border)', color: 'var(--red)' }} onClick={() => handleDelete(item.id)} title="Sil"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ opacity: 0.2, marginBottom: '12px' }}><UserPlus size={48} /></div>
                    <p style={{ fontWeight: 600, color: 'var(--text-3)' }}>Şu an yayında olan bir iş başı süreci bulunmuyor.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <div className="icon-box-sm icon-green"><UserPlus size={16} /></div>
                {editingItem ? 'İş Başı Sürecini Düzenle' : 'Yeni İş Başı Kaydı'}
              </h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ad</label>
                  <input required className="form-input" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Ör: Can" />
                </div>
                <div className="form-group">
                  <label className="form-label">Soyad</label>
                  <input required className="form-input" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Ör: Özdemir" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Şirket / Tesis</label>
                  {companies.length > 0 ? (
                    <select className="form-select" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}>
                      {companies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input className="form-input" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Firma Adı" />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Sorumlu Yönetici</label>
                  <input required className="form-input" value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} placeholder="Ad Soyad" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">İş Başı Tarihi</label>
                  <input type="date" required className="form-input" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Süreç Durumu</label>
                  <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Bekliyor">Bekliyor</option>
                    <option value="Hazırlanıyor">Hazırlanıyor</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                    <option value="İptal">İptal</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Cep Telefonu</label>
                  <input className="form-input" value={formData.mobilePhone} onChange={e => setFormData({...formData, mobilePhone: e.target.value})} placeholder="05xx..." />
                </div>
                <div className="form-group">
                  <label className="form-label">E-Posta Adresi</label>
                  <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="eposta@sirket.com" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">İkamet Adresi (Ulaşım Planlaması İçin)</label>
                <textarea className="form-input" rows={2} value={formData.homeAddress} onChange={e => setFormData({...formData, homeAddress: e.target.value})} placeholder="Mahalle, Cadde, No..." />
              </div>

              {!editingItem && (
                <div style={{ padding: '16px', background: 'var(--blue-light)', borderRadius: '12px', border: '1px solid var(--blue-border)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Mail size={18} color="var(--blue)" style={{ marginTop: '2px' }} />
                  <div style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: 600, lineHeight: '1.4' }}>
                    Kaydet butonuna tıklandığında BT ve İdari İşler departmanlarına otomatik bilgilendirme e-postası gönderilecektir.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>İptal</button>
                <button type="submit" className="btn btn-primary" style={{ gap: '8px' }}>
                  <Save size={16} /> {editingItem ? 'Değişiklikleri Kaydet' : 'Kaydet ve Bildir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
