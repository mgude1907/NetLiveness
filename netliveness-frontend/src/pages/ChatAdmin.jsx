import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getChatUsers, getPersonnel, registerUser, updateUser, 
  deleteUser, getChannels, createChannel, updateChatUser, 
  deleteChatUser, getChannelMembers, addChannelMember, removeChannelMember 
} from '../api';
import { 
  Search, Pencil, Trash2, Check, X, MessageSquare, Copy, Hash, 
  Key, PauseCircle, PlayCircle, Users, UserPlus, Shield, 
  Activity, Bell, UserCheck, UserMinus, MoreHorizontal, ChevronRight,
  TrendingUp, Layers, Zap, Plus, Settings2, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

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
  const [stats, setStats] = useState({ totalUsers: 0, activeChannels: 0, frozenUsers: 0, onlineNow: 0 });

  const loadData = useCallback(async () => {
    try {
      const [usersData, personnelData, chanData] = await Promise.all([
        getChatUsers(),
        getPersonnel(),
        getChannels()
      ]);

      const chatUsers = usersData.filter(u => u.isAdmin || (u.permissions && u.permissions.includes('Chat')));
      setItems(chatUsers);
      setPersonnelList(personnelData);
      setChannels(chanData);

      // Stats calculation
      setStats({
        totalUsers: chatUsers.length,
        activeChannels: chanData.length,
        frozenUsers: chatUsers.filter(u => u.isActive === false).length,
        onlineNow: Math.floor(chatUsers.length * 0.4) // Mock online stat
      });

    } catch (e) {
      console.error("LOAD DATA ERROR:", e);
      toast.error('Veriler yüklenemedi. Lütfen yetkilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // -- KULLANICI FONKSİYONLARI --
  const filteredUsers = items.filter(u => 
    !search || 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openNewUser = () => { 
    setForm({ fullName: '', username: '', password: '1', isActive: true }); 
    setEditId(null); 
    setModal(true); 
  };
  
  const openEditUser = (u) => {
    setForm({
      fullName: u.fullName,
      username: u.username || u.email,
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

  const confirmDeleteUserAction = async () => {
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
          await createChannel({ name: channelForm.name, description: channelForm.description, ownerId: 1 });
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

  if (loading && items.length === 0) return (
    <div className="loading-screen">
       <div className="spinner" />
       <span>Sohbet Verileri Yükleniyor...</span>
    </div>
  );

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 60 }}>
      
      {/* ─── Page Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div className="icon-box-sm" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
                <Shield size={18} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.5px' }}>Sohbet & İletişim Yönetimi</h2>
           </div>
           <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>Personel erişim yetkileri, grup kanalları ve sistem güvenliği denetim merkezi.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setActiveTab(activeTab === 'users' ? 'channels' : 'users')}>
                {activeTab === 'users' ? <><Layers size={16} /> Kanallara Geç</> : <><Users size={16} /> Kişilere Geç</>}
            </button>
            <button className="btn btn-primary" onClick={activeTab === 'users' ? openNewUser : () => { setChannelForm({name:'', description:''}); setChannelModal(true); }}>
                {activeTab === 'users' ? <><UserPlus size={16} /> Yeni Personel Ekle</> : <><Plus size={16} /> Yeni Kanal Aç</>}
            </button>
        </div>
      </div>

      {/* ─── Stats Dashboard ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          <ChatStat title="TOPLAM PERSONEL" value={stats.totalUsers} icon={Users} color="#f59e0b" trend={[40, 42, 45, 44, 48, 52]} />
          <ChatStat title="AKTİF KANALLAR" value={stats.activeChannels} icon={Hash} color="#3b82f6" trend={[10, 12, 11, 14, 15, 15]} />
          <ChatStat title="DONDURULANLAR" value={stats.frozenUsers} icon={PauseCircle} color="#ef4444" trend={[2, 4, 3, 5, 4, 3]} />
          <ChatStat title="ANLIK ÇEVRİMİÇİ" value={stats.onlineNow} icon={Activity} color="#10b981" trend={[15, 18, 22, 20, 25, 28]} />
      </div>

      {/* ─── Tab Toolbar ─── */}
      <div className="card" style={{ padding: '8px 16px', borderRadius: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
              <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Kişiler & Yetkiler" />
              <TabButton active={activeTab === 'channels'} onClick={() => setActiveTab('channels')} icon={Hash} label="Gruplar & Kanallar" />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="search-bar" style={{ width: 280, height: 40 }}>
                 <Search size={16} />
                 <input 
                    placeholder="İsim veya kullanıcı adı ara..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    style={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 500 }}
                 />
              </div>
              <button className="btn-icon" onClick={loadData}><Activity size={18} /></button>
          </div>
      </div>

      {/* ─── Main Content ─── */}
      {activeTab === 'users' ? (
          <div className="card" style={{ padding: 0, borderRadius: 28, overflow: 'hidden', border: '1px solid var(--border)' }}>
             <table className="data-table">
                <thead style={{ background: 'var(--bg-inset)' }}>
                    <tr>
                        <th style={{ paddingLeft: 24 }}>PERSONEL BİLGİSİ</th>
                        <th>KULLANICI ADI</th>
                        <th>YETKİ DURUMU</th>
                        <th>HESAP DURUMU</th>
                        <th style={{ width: 140, textAlign: 'right', paddingRight: 24 }}>İŞLEMLER</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map(u => (
                        <tr key={u.id} className="table-row-hover" style={{ opacity: u.isActive === false ? 0.6 : 1 }}>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ 
                                        width: 36, height: 36, borderRadius: 10, 
                                        background: u.isActive === false ? 'var(--bg-inset)' : 'var(--blue-soft)', 
                                        color: u.isActive === false ? 'var(--text-3)' : 'var(--blue-text)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 900
                                    }}>
                                        {u.fullName?.[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 800 }}>{u.fullName}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>ID: #{u.id} • {u.isAdmin ? 'Yönetici' : 'Personel'}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>@{u.email || u.username}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div className="icon-box-xs" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}><MessageSquare size={12} /></div>
                                    <span style={{ fontSize: 12, fontWeight: 700 }}>Sohbet İzni</span>
                                </div>
                            </td>
                            <td>
                                <span className={`badge ${u.isActive === false ? 'badge-neutral' : 'badge-green'}`} style={{ fontSize: 10, fontWeight: 900 }}>
                                    {u.isActive === false ? 'DONDURULDU' : 'AKTİF'}
                                </span>
                            </td>
                            <td style={{ paddingRight: 24 }}>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button className="btn-icon-sm" onClick={() => handleResetPassword(u)} title="Şifre Sıfırla"><Key size={14} /></button>
                                    <button className="btn-icon-sm" style={{ color: u.isActive === false ? 'var(--green)' : 'var(--amber)' }} onClick={() => handleToggleFreeze(u)} title="Dondur/Çöz">
                                        {u.isActive === false ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                                    </button>
                                    <button className="btn-icon-sm" onClick={() => openEditUser(u)}><Pencil size={14} /></button>
                                    {!u.isAdmin && (
                                        <button className="btn-icon-sm danger" onClick={() => { setEditId(u.id); setDeleteModal(true); }}><Trash2 size={14} /></button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}><Info size={24} style={{ marginBottom: 8, opacity: 0.5 }} /><br/>Kişi bulunamadı.</td></tr>
                    )}
                </tbody>
             </table>
          </div>
      ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {channels.map(ch => (
                  <div key={ch.id} className="card glass-card h-hover" style={{ padding: 24, borderRadius: 28, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'linear-gradient(225deg, var(--green-soft) 0%, transparent 70%)', opacity: 0.5 }} />
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-text)', border: '1px solid var(--border)' }}>
                              <Hash size={20} />
                          </div>
                          <div>
                              <div style={{ fontSize: 16, fontWeight: 950, color: 'var(--text-1)' }}>{ch.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>{ch.description || 'Genel Sohbet Kanalı'}</div>
                          </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                          <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-3)', letterSpacing: 1 }}>ANALİZ</div>
                          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                             <div className="icon-box-xs" style={{ background: 'var(--bg-inset)', color: 'var(--text-2)' }}><Users size={12} /></div>
                             <span style={{ fontSize: 12, fontWeight: 800 }}>8 Üye</span>
                          </div>
                          <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 12, borderRadius: 12 }} onClick={() => openMemberModal(ch)}>
                              Yönet <ChevronRight size={14} style={{ marginLeft: 4 }} />
                          </button>
                      </div>
                  </div>
              ))}
              
              <div 
                className="card h-hover" 
                style={{ border: '2px dashed var(--border)', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', minHeight: 180, borderRadius: 28 }}
                onClick={() => { setChannelForm({name:'', description:''}); setChannelModal(true); }}
              >
                  <div className="icon-box-sm" style={{ background: 'var(--bg-inset)', color: 'var(--text-3)' }}><Plus size={20} /></div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-3)' }}>Yeni Kanal Oluştur</span>
              </div>
          </div>
      )}

      {/* ─── MODALS ─── */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ width: 500, borderRadius: 32, padding: 32 }}>
            <div className="modal-header" style={{ marginBottom: 24 }}>
              <div>
                  <h3 style={{ fontSize: 20, fontWeight: 900 }}>{editId ? 'Sohbet Yetkisini Düzenle' : 'Yeni Sohbet Kullanıcısı'}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{editId ? 'Erişim ayarlarını ve şifre güncellemelerini buradan yapın.' : 'Personeli saha içi haberleşme sistemine dahil edin.'}</p>
              </div>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveUser}>
                 {!editId && (
                  <div style={{ marginBottom: 24, padding: 16, background: 'var(--green-soft)', borderRadius: 20, border: '1px solid var(--green-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Zap size={16} color="var(--green)" />
                        <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--green)' }}>Akıllı Personel Eşleştirme</span>
                    </div>
                    <select className="form-input" style={{ width: '100%', borderRadius: 12 }} onChange={handlePersonnelSelect} defaultValue="">
                      <option value="" disabled>Rehberden seçim yapın...</option>
                      {personnelList.map(p => (
                        <option key={p.id} value={p.id}>{p.adSoyad} ({p.bolum})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gap: 18 }}>
                  <div className="form-group">
                    <label className="form-label">Görünen Ad Soyad</label>
                    <input className="form-input" style={{ borderRadius: 12 }} value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sistem Kullanıcı Adı</label>
                    <input className="form-input" style={{ borderRadius: 12, fontWeight: 'bold' }} value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sistem Şifresi {editId && '(Değişmeyecekse boş bırakın)'}</label>
                    <input type="password" className="form-input" style={{ borderRadius: 12 }} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  </div>
                  
                  {editId && (
                    <div className="form-group">
                      <label className="form-label">Erişim Durumu</label>
                      <select className="form-input" style={{ borderRadius: 12 }} value={form.isActive} onChange={e => setForm({...form, isActive: e.target.value === 'true'})}>
                        <option value="true">Aktif (Giriş Yapabilir)</option>
                        <option value="false">Engelli (Oturum Kapatılır)</option>
                      </select>
                    </div>
                  )}
                </div>

              <div className="modal-footer" style={{ marginTop: 32, gap: 12 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(false)}>Vazgeç</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5, height: 48, borderRadius: 16 }}>{editId ? 'DEĞİŞİKLİKLERİ UYGULA' : 'PERSONELİ KAYDET'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ maxWidth: 400, borderRadius: 28, padding: 32, textAlign: 'center' }}>
            <div className="icon-box-sm" style={{ background: 'var(--red-soft)', color: 'var(--red)', margin: '0 auto 20px' }}><Trash2 size={24} /></div>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Onay Gerekiyor</h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 24 }}>Bu kullanıcının sohbet yetkisini ve mesaj geçmişini kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
               <button className="btn btn-ghost" onClick={() => setDeleteModal(false)}>Vazgeç</button>
               <button className="btn" style={{ background: 'var(--red)', color: '#fff', borderRadius: 14 }} onClick={confirmDeleteUserAction}>EVET, SİL</button>
            </div>
          </div>
        </div>
      )}

      {/* INVITE SUCCESS MODAL */}
      {inviteData && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ width: 520, borderRadius: 32, padding: 32 }}>
            <div className="modal-header" style={{ marginBottom: 20 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="icon-box-sm" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}><Check size={20} /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 900 }}>Personel Başarıyla Eklendi</h3>
               </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 20 }}>Giriş bilgilerini kopyalayıp personele iletebilirsiniz.</p>
            
            <div style={{ background: 'var(--bg-inset)', padding: 20, borderRadius: 16, border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, color: 'var(--text-1)' }}>
                {`Sn. ${inviteData.fullName},\n\nSaha İletişim sistemine erişiminiz tanımlandı.\n\nErişim Linki: ${inviteData.link}\nKullanıcı Adı: ${inviteData.username}\nParola: ${inviteData.password}`}
            </div>
            
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => setInviteData(null)}>Kapat</button>
                <button className="btn btn-primary" onClick={copyInviteToClipboard}><Copy size={16} /> METNİ KOPYALA</button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER MANAGEMENT MODAL */}
      {memberModal && (
          <div className="modal-overlay">
              <div className="modal-content animate-in" style={{ width: 500, borderRadius: 32, padding: 32 }}>
                  <div className="modal-header" style={{ marginBottom: 24 }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 900 }}>{selectedChannel?.name}: Üye Yönetimi</h3>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Kanala dahil olan personelleri seçin.</p>
                      </div>
                      <button className="btn-icon" onClick={() => setMemberModal(false)}><X size={20} /></button>
                  </div>
                  <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 6 }}>
                      {items.map(u => {
                          const isMember = channelMembers.includes(u.id);
                          return (
                              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-inset)', borderRadius: 16 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div style={{ width: 32, height: 32, borderRadius: 8, background: isMember ? 'var(--blue-soft)' : 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>{u.fullName[0]}</div>
                                      <div>
                                          <div style={{ fontWeight: 800, fontSize: 13 }}>{u.fullName}</div>
                                          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>@{u.email}</div>
                                      </div>
                                  </div>
                                  <button 
                                      className={`btn ${isMember ? 'btn-secondary' : 'btn-primary'}`} 
                                      style={{ padding: '6px 14px', fontSize: 11, height: 32, borderRadius: 10 }}
                                      onClick={() => toggleMembership(u.id)}
                                  >
                                      {isMember ? <><Check size={12} /> Seçildi</> : <><Plus size={12} /> Ekle</>}
                                  </button>
                              </div>
                          );
                      })}
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: 24, height: 44, borderRadius: 14 }} onClick={() => setMemberModal(false)}>TAMAMLA</button>
              </div>
          </div>
      )}

      {/* CHANNEL CREATE MODAL */}
      {channelModal && (
        <div className="modal-overlay">
            <div className="modal-content animate-in" style={{ width: 400, borderRadius: 32, padding: 32 }}>
              <div className="modal-header" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900 }}>Yeni Sohbet Kanalı</h3>
                <button className="btn-icon" onClick={() => setChannelModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveChannel}>
                <div style={{ display: 'grid', gap: 18 }}>
                    <div className="form-group">
                        <label className="form-label">Kanal Adı</label>
                        <input className="form-input" style={{ borderRadius: 12 }} placeholder="Örn: IT-Support, Duyurular" value={channelForm.name} onChange={e => setChannelForm({...channelForm, name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Açıklama</label>
                        <input className="form-input" style={{ borderRadius: 12 }} placeholder="Kanal amacı nedir?" value={channelForm.description} onChange={e => setChannelForm({...channelForm, description: e.target.value})} />
                    </div>
                </div>
                <div className="modal-footer" style={{ marginTop: 32, gap: 12 }}>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setChannelModal(false)}>İptal</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1.5, height: 44, borderRadius: 14 }}>KANALI OLUŞTUR</button>
                </div>
              </form>
            </div>
        </div>
      )}
    </div>
  );
}

function ChatStat({ title, value, icon: Icon, color, trend }) {
    return (
        <div className="card glass-card" style={{ padding: 24, borderRadius: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ 
                    width: 44, height: 44, borderRadius: 14, 
                    background: `${color}15`, border: `1px solid ${color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: color 
                }}>
                    <Icon size={22} />
                </div>
                <div style={{ height: 32, width: 70 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend.map(v => ({v}))}>
                            <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-3)', letterSpacing: 1.2 }}>{title}</div>
                <div style={{ fontSize: 28, fontWeight: 950, color: 'var(--text-1)', margin: '2px 0' }}>{value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>
                    <TrendingUp size={12} /> Stabil Bağlantı
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }) {
    return (
        <button 
            onClick={onClick}
            style={{ 
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
                background: active ? 'var(--blue-soft)' : 'transparent',
                color: active ? 'var(--blue-text)' : 'var(--text-3)',
                border: 'none', borderRadius: 14, cursor: 'pointer',
                fontSize: 13, fontWeight: 800, transition: 'all 0.2s'
            }}
        >
            <Icon size={16} /> {label}
        </button>
    );
}
