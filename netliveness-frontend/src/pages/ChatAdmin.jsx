import { useState, useEffect, useCallback } from 'react';
import { getChatUsers, getPersonnel, registerUser, updateUser, deleteUser, getChannels, createChannel, updateChatUser, deleteChatUser, getChannelMembers, addChannelMember, removeChannelMember } from '../api';
import { Search, Pencil, Trash2, Check, X, MessageSquare, Copy, Hash, Key, PauseCircle, PlayCircle, Users, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatAdmin() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' veya 'channels'

  // Kullanıcı State'leri
  const [items, setItems] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [form, setForm] = useState({ fullName: '', username: '', password: '', isActive: true });
  const [editId, setEditId] = useState(null);

  // Kanal State'leri
  const [channels, setChannels] = useState([]);
  const [channelModal, setChannelModal] = useState(false);
  const [channelForm, setChannelForm] = useState({ name: '', description: '' });

  // Davet State'i
  const [inviteData, setInviteData] = useState(null);

  // Uye Yonetimi
  const [memberModal, setMemberModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelMembers, setChannelMembers] = useState([]);

  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      if (activeTab === 'users') {
        const usersData = await getChatUsers();
        setItems(usersData.filter(u => u.isAdmin || (u.permissions && u.permissions.includes('Chat'))));
        const personnelData = await getPersonnel();
        setPersonnelList(personnelData);
      } else {
        const chanData = await getChannels();
        setChannels(chanData);
      }
    } catch (e) {
      console.error("LOAD DATA ERROR:", e);
      toast.error('Veriler yüklenemedi. Lütfen yönetici haklarınızı ve internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadData(); }, [loadData]);

  // -- KULLANICI FONKSİYONLARI --
  const filteredUsers = items.filter(u => 
    !search || 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const openNewUser = () => { 
    setForm({ fullName: '', username: '', password: '1', isActive: true }); 
    setEditId(null); 
    setModal(true); 
  };
  
  const openEditUser = (u) => {
    setForm({
      fullName: u.fullName,
      username: u.username,
      password: '',
      isActive: u.isActive !== false
    });
    setEditId(u.id);
    setModal(true);
  };

  const handlePersonnelSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const person = personnelList.find(p => p.id.toString() === selectedId);
    if (person) {
      const namePart = (person.ad || '').trim().toLowerCase().replace(/\s+/g, '');
      const surnamePart = (person.soyad || '').trim().toLowerCase().replace(/\s+/g, '');
      
      const charMap = { 'ç':'c', 'ğ':'g', 'ı':'i', 'ö':'o', 'ş':'s', 'ü':'u' };
      const normalize = str => str.replace(/[çğışöü]/g, match => charMap[match] || match);
      const usernameGenerated = normalize(`${namePart}.${surnamePart}`);
      
      setForm({
        ...form,
        fullName: person.adSoyad || `${person.ad} ${person.soyad}`,
        username: usernameGenerated
      });
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!form.username || !form.fullName) return toast.error('Kullanıcı Adı ve Ad Soyad zorunludur.');
    if (!editId && !form.password) return toast.error('Yeni kayıt için bir şifre zorunludur.');

    try {
      if (editId) {
        const payload = { id: editId, fullName: form.fullName, username: form.username, isActive: form.isActive, permissions: 'Chat' };
        if (form.password) payload.password = form.password;
        await updateChatUser(editId, payload);
        toast.success('Kullanıcı güncellendi.');
        setModal(false);
      } else {
        const regPass = form.password || '1';
        await registerUser({ fullName: form.fullName, email: form.username, password: regPass });
        toast.success('Kullanıcı sohbete dahil edildi.');
        setModal(false);
        // Davet Modalını Aç
        setInviteData({
            fullName: form.fullName,
            username: form.username,
            password: regPass,
            link: window.location.origin + '/login'
        });
      }
      loadData();
    } catch (e) {
      toast.error(e.response?.data || 'İşlem başarısız.');
    }
  };

  const confirmDeleteUser = async () => {
    try {
      await deleteChatUser(editId);
      toast.success('Kullanıcı sohbet sisteminden tamamen silindi.');
      setDeleteModal(false);
      loadData();
    } catch (e) { toast.error('Silme işlemi başarısız.'); }
  };

  const handleResetPassword = async (u) => {
      const newPass = prompt(`${u.fullName} için yeni şifre belirleyin:`);
      if (!newPass) return;
      try {
          await updateChatUser(u.id, { password: newPass });
          toast.success("Şifre sıfırlandı.");
      } catch(e) { toast.error("Şifre sıfırlanamadı."); }
  };

  const handleToggleFreeze = async (u) => {
      try {
          await updateChatUser(u.id, { isActive: !u.isActive });
          toast.success(u.isActive ? "Hesap donduruldu." : "Hesap aktif edildi.");
          loadData();
      } catch(e) { toast.error("İşlem başarısız."); }
  };

  // -- KANAL FONKSİYONLARI --
  const handleSaveChannel = async (e) => {
      e.preventDefault();
      try {
          await createChannel({ name: channelForm.name, description: channelForm.description, ownerId: 1 }); // Admin-owner as 1
          toast.success('Kanal oluşturuldu.');
          setChannelModal(false);
          loadData();
      } catch (e) {
          toast.error('Kanal oluşturulamadı.');
      }
  };

  const openMemberModal = async (ch) => {
      setSelectedChannel(ch);
      setLoading(true);
      try {
          const members = await getChannelMembers(ch.id);
          setChannelMembers(members.map(m => m.id));
          setMemberModal(true);
      } catch(e) { toast.error("Üye listesi alınamadı."); }
      finally { setLoading(false); }
  };

  const toggleMembership = async (userId) => {
      const isMember = channelMembers.includes(userId);
      try {
          if (isMember) {
              await removeChannelMember(selectedChannel.id, userId);
              setChannelMembers(prev => prev.filter(id => id !== userId));
              toast.success("Üye çıkarıldı.");
          } else {
              await addChannelMember({ channelId: selectedChannel.id, userId });
              setChannelMembers(prev => [...prev, userId]);
              toast.success("Üye eklendi.");
          }
      } catch(e) { toast.error("İşlem başarısız."); }
  };

  const copyInviteToClipboard = () => {
      const text = `Sn. ${inviteData.fullName},\n\nŞirket içi haberleşme platformuna hesabınız tanımlanmıştır.\nAşağıdaki bağlantıdan sisteme girebilirsiniz.\n\nErişim Linki: ${inviteData.link}\nKullanıcı Adı: ${inviteData.username}\nParola: ${inviteData.password}\n\nİyi çalışmalar.`;
      navigator.clipboard.writeText(text);
      toast.success('Davet metni panoya kopyalandı.');
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /> Yükleniyor…</div>;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Sohbet Yönetimi</h2>
          <p>Personellerin şirket içi sohbete erişim izinlerini ve kanalları yönetin</p>
        </div>
        <div>
            {activeTab === 'users' ? (
                <button className="btn btn-primary" onClick={openNewUser}>
                  <MessageSquare size={16} /> Sohbete Personel Ekle
                </button>
            ) : (
                <button className="btn btn-primary" onClick={() => { setChannelForm({name:'', description:''}); setChannelModal(true); }}>
                  <Hash size={16} /> Yeni Kanal (Grup) Aç
                </button>
            )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
          <button 
             style={{ background: 'none', border: 'none', padding: '10px 16px', color: activeTab === 'users' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'users' ? '2px solid var(--accent-amber)' : '2px solid transparent', cursor: 'pointer', fontWeight: 700 }}
             onClick={() => setActiveTab('users')}
          >
              Kişiler / Personeller
          </button>
          <button 
             style={{ background: 'none', border: 'none', padding: '10px 16px', color: activeTab === 'channels' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'channels' ? '2px solid var(--accent-amber)' : '2px solid transparent', cursor: 'pointer', fontWeight: 700 }}
             onClick={() => setActiveTab('channels')}
          >
              Mesajlaşma Grupları
          </button>
      </div>

      {/* KULLANICILAR TABI */}
      {activeTab === 'users' && (
          <>
            <div className="toolbar">
              <div className="search-box" style={{ width: '300px' }}>
                <Search size={18} />
                <input placeholder="Kullanıcı ara..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Kullanıcı Adı</th>
                    <th>Ad Soyad</th>
                    <th>Sohbet İzmi</th>
                    <th>Rol / Durum</th>
                    <th style={{ width: 100 }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} style={{ opacity: u.isActive === false ? 0.6 : 1 }}>
                      <td><span className="text-muted">#{u.id}</span></td>
                      <td style={{ fontWeight: 600 }}>{u.email}</td>
                      <td>{u.fullName}</td>
                      <td><span className="badge" style={{ background: 'var(--accent-blue)', color: '#fff' }}>Sohbet (Mesajlaşma)</span></td>
                      <td>
                        <span className="badge" style={{ background: u.isActive === false ? 'var(--bg-input)' : 'var(--accent-green-dim)', color: u.isActive === false ? 'var(--text-muted)' : 'var(--accent-green)' }}>
                          {u.isActive === false ? 'Pasif' : 'Aktif'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="icon-btn" onClick={() => handleResetPassword(u)} title="Şifre Sıfırla"><Key size={16} /></button>
                          <button className="icon-btn" style={{ color: u.isActive === false ? 'var(--accent-green)' : 'var(--accent-amber)' }} onClick={() => handleToggleFreeze(u)} title={u.isActive === false ? 'Dondurmayı Kaldır' : 'Hesabı Dondur'}>
                              {u.isActive === false ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                          </button>
                          <button className="icon-btn" onClick={() => openEditUser(u)} title="Düzenle"><Pencil size={16} /></button>
                          {!u.isAdmin && (
                            <button className="icon-btn danger" onClick={() => { setEditId(u.id); setDeleteModal(true); }} title="Hesabı TAMAMEN SİL"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Kayıt bulunamadı.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
      )}

      {/* KANALLAR TABI */}
      {activeTab === 'channels' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {channels.map(ch => (
                  <div key={ch.id} style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent-green)' }}><Hash size={18} /></span>
                          <h3 style={{ margin: 0 }}>{ch.name}</h3>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, minHeight: '3em' }}>{ch.description || 'Genel Sohbet Kanalı'}</p>
                      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openMemberModal(ch)}>
                              <Users size={14} /> Üyeleri Yönet
                          </button>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(ch.createdAt).toLocaleDateString()}</div>
                      </div>
                  </div>
              ))}
              {channels.length === 0 && <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Henüz açılmış bir kanal yok.</div>}
          </div>
      )}

      {/* UZMAN KULLANICI EKLEME MODALI */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '500px', maxWidth: '95vw' }}>
            <div className="modal-header">
              <h3>{editId ? 'Sohbet İznini Düzenle' : 'Yeni Sohbet Kullanıcısı'}</h3>
              <button className="icon-btn" onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                {!editId && (
                  <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--accent-green, #22c55e)' }}>✔ Otomatik Personel Eşleştirme</label>
                    <select className="form-input" style={{ width: '100%' }} onChange={handlePersonnelSelect} defaultValue="">
                      <option value="" disabled>--- Şirket Rehberinden Bir Personel Seçin ---</option>
                      {personnelList.map(p => (
                        <option key={p.id} value={p.id}>{p.ad} {p.soyad} ({p.bolum})</option>
                      ))}
                    </select>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                      Seçim yaptığınızda Ad, Soyad ve Kullanıcı Adı bilgileri standartlara uygun doldurulur.
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Oluşturulacak Kullanıcı Adı</label>
                    <input type="text" className="form-input" style={{ width: '100%' }} value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Ad Soyad</label>
                    <input type="text" className="form-input" style={{ width: '100%' }} value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Başlangıç Şifresi {editId && '(Değiştirmeyecekseniz boş bırakın)'}</label>
                    <input type="password" className="form-input" style={{ width: '100%' }} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  </div>
                  
                  {editId && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Durum (Engelleme)</label>
                      <select className="form-input" style={{ width: '100%' }} value={form.isActive} onChange={e => setForm({...form, isActive: e.target.value === 'true'})}>
                        <option value="true">Aktif (Sohbete Giriş Yapabilir)</option>
                        <option value="false">Pasif (Engellendi)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Değişiklikleri Kaydet' : 'Kullanıcıyı Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KANAL OLUŞTURMA MODALI */}
      {channelModal && (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '400px', maxWidth: '95vw' }}>
              <div className="modal-header">
                <h3>Yeni Sohbet Kanalı</h3>
                <button className="icon-btn" onClick={() => setChannelModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveChannel}>
                <div className="modal-body">
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Kanal Adı</label>
                        <input type="text" className="form-input" style={{ width: '100%' }} placeholder="Örn: Bölüm-IT, Muhasebe" value={channelForm.name} onChange={e => setChannelForm({...channelForm, name: e.target.value})} required />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Açıklama (İsteğe Bağlı)</label>
                        <input type="text" className="form-input" style={{ width: '100%' }} placeholder="Kanal amacı nedir?" value={channelForm.description} onChange={e => setChannelForm({...channelForm, description: e.target.value})} />
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setChannelModal(false)}>İptal</button>
                    <button type="submit" className="btn btn-primary">Kanalı Aç</button>
                </div>
              </form>
            </div>
        </div>
      )}

      {/* DAVET LİNKİ BAŞARI MODALI */}
      {inviteData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '500px', maxWidth: '95vw' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--accent-green)' }}>🎉 Personel Eklendi!</h3>
              <button className="icon-btn" onClick={() => setInviteData(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Kullanıcı sohbet sistemine başarıyla eklendi. Personele giriş bilgilerini iletmek için aşağıdaki hızlı davet metnini kopyalayıp WhatsApp, e-posta veya SMS ile gönderebilirsiniz.</p>
              
              <div style={{ background: '#1a1a1a', padding: '16px', borderRadius: '8px', border: '1px solid #333', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap', color: '#e5e5e5' }}>
{`Sn. ${inviteData.fullName},

Şirket içi haberleşme platformuna hesabınız tanımlanmıştır.
Aşağıdaki bağlantıdan sisteme giriş yapabilirsiniz.

Erişim Linki: ${inviteData.link}
Kullanıcı Adı: ${inviteData.username}
Parola: ${inviteData.password}

İyi çalışmalar.`}
              </div>
            </div>
            <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setInviteData(null)}>Kapat</button>
                <button className="btn btn-primary" onClick={copyInviteToClipboard}><Copy size={16} /> Metni Kopyala</button>
            </div>
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
              <p>Bu personelin sohbet yetkisini iptal etmek üzeresiniz. Emin misiniz?</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Vazgeç</button>
              <button className="btn" style={{ background: 'var(--accent-red)', color: 'white' }} onClick={confirmDelete}>Yetkiyi Kaldır</button>
            </div>
          </div>
        </div>
      )}

      {/* UYE YONETIMI MODALI */}
      {memberModal && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ width: '500px' }}>
                  <div className="modal-header">
                      <h3><Hash size={18} /> {selectedChannel?.name}: Üye Yönetimi</h3>
                      <button className="icon-btn" onClick={() => setMemberModal(false)}><X size={20} /></button>
                  </div>
                  <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Bu gruba kimlerin katılabileceğini belirleyin. Eklenen kullanıcılar sohbete hemen erişebilir.</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {items.map(u => {
                              const isMember = channelMembers.includes(u.id);
                              return (
                                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                                      <div>
                                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.fullName}</div>
                                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{u.email}</div>
                                      </div>
                                      <button 
                                          className={`btn ${isMember ? 'btn-secondary' : 'btn-primary'}`} 
                                          style={{ padding: '6px 16px', minWidth: '100px' }}
                                          onClick={() => toggleMembership(u.id)}
                                      >
                                          {isMember ? <><X size={14} /> Çıkar</> : <><UserPlus size={14} /> Ekle</>}
                                      </button>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
                  <div className="modal-footer">
                      <button className="btn btn-primary" onClick={() => setMemberModal(false)}>Tamamla</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
