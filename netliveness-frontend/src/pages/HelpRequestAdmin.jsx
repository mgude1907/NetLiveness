import { useState, useEffect, useRef } from 'react';
import { 
  getHelpRequests, updateHelpRequest, deleteHelpRequest, 
  getHelpRequestReplies, addHelpRequestReply, assignHelpRequest,
  getTerminals
} from '../api';
import { 
  LifeBuoy, CheckCircle, Clock, AlertTriangle, Trash2, 
  Search, Send, Paperclip, UserPlus, Info, 
  ChevronRight, Calendar, Flag, MessageSquare,
  Inbox, User, CheckCircle2, Archive, Filter,
  Monitor, Wifi, ShieldAlert, MoreVertical,
  Maximize2, ArrowLeft, RefreshCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function HelpRequestAdmin() {
  const [requests, setRequests] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [folder, setFolder] = useState('inbox'); // inbox, assigned, resolved
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const selectedReq = requests.find(r => r.id === selectedId);
  const reporterPC = selectedReq ? terminals.find(t => 
    t.ipAddress === selectedReq.ipAddress || t.name?.toLowerCase().includes(selectedReq.senderName?.split(' ')[0].toLowerCase())
  ) : null;

  const loadData = async () => {
    try {
      const [reqs, terms] = await Promise.all([
        getHelpRequests(),
        getTerminals()
      ]);
      setRequests(reqs);
      setTerminals(terms);
      if (reqs.length > 0 && !selectedId) setSelectedId(reqs[0].id);
    } catch (e) {
      toast.error('Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async (id) => {
    if (!id) return;
    try {
      const data = await getHelpRequestReplies(id);
      setReplies(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadReplies(selectedId); }, [selectedId]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  const handleStatusChange = async (id, status) => {
    try {
      const req = requests.find(r => r.id === id);
      await updateHelpRequest(id, { ...req, status });
      toast.success('Statü güncellendi.');
      loadData();
    } catch (e) { toast.error('Güncelleme başarısız.'); }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() && !attachment) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('message', replyText);
      fd.append('isAdmin', 'true');
      if (attachment) fd.append('attachment', attachment);

      await addHelpRequestReply(selectedId, fd);
      setReplyText('');
      setAttachment(null);
      loadReplies(selectedId);
      loadData();
    } catch (e) { toast.error('Yanıt iletilemedi.'); }
    finally { setSending(false); }
  };

  const filtered = requests.filter(r => {
    const matchesFolder = 
      folder === 'inbox' ? r.status === 'Açık' :
      folder === 'assigned' ? r.status === 'İşlemde' :
      r.status === 'Çözüldü' || r.status === 'Kapalı';
    
    const matchesSearch = 
      r.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFolder && matchesSearch;
  });

  if (loading) return (
    <div className="modern-loader">
      <RefreshCcw className="spinner" size={32} />
      <span>Sistem Verileri Senkronize Ediliyor...</span>
    </div>
  );

  return (
    <div className="helpdesk-os">
      <style>{`
        .helpdesk-os {
          height: calc(100vh - 84px);
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 0;
          background: #f8fafc;
          overflow: hidden;
          margin: -28px;
          font-family: 'Inter', sans-serif;
        }

        /* Pane 1: Folders Sidebar */
        .pane-nav {
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          padding: 24px 12px;
        }
        .nav-folder {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 12px;
          cursor: pointer;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
          margin-bottom: 4px;
        }
        .nav-folder:hover { background: #f1f5f9; color: #0f172a; }
        .nav-folder.active { background: #fffbeb; color: #92400e; box-shadow: 0 4px 12px rgba(245,158,11,0.1); }
        .folder-badge {
          margin-left: auto;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 10px;
          color: #94a3b8;
        }
        .nav-folder.active .folder-badge { background: #fef3c7; color: #b45309; }

        /* Pane 2 & 3: Workspace Wrapper */
        .workspace-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          background: #f1f5f9;
        }

        /* Pane 2: Ticket List */
        .pane-feed {
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .feed-header { padding: 20px; border-bottom: 1px solid #f1f5f9; }
        .feed-search {
          position: relative;
          background: #f8fafc;
          border-radius: 12px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }
        .feed-search:focus-within { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
        .feed-search input {
          border: none;
          background: transparent;
          height: 40px;
          width: 100%;
          outline: none;
          padding: 0 8px;
          font-size: 13px;
        }
        
        .feed-list { flex: 1; overflow-y: auto; padding: 12px; }
        .ticket-card {
          padding: 16px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 8px;
          border: 1px solid transparent;
          position: relative;
        }
        .ticket-card:hover { background: #f8fafc; border-color: #f1f5f9; }
        .ticket-card.active { 
          background: #ffffff; 
          border-color: #f59e0b; 
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          z-index: 1;
        }
        .priority-indicator {
          position: absolute;
          left: 0; top: 20px; bottom: 20px;
          width: 3px;
          border-radius: 0 10px 10px 0;
        }

        /* Pane 3: Content View */
        .pane-view {
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          position: relative;
        }
        .view-header {
          height: 72px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          padding: 0 32px;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .view-body { flex: 1; overflow-y: auto; padding: 40px; }
        
        /* Chat Design */
        .bubble {
          max-width: 80%;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
        }
        .bubble.admin { align-self: flex-end; align-items: flex-end; }
        .bubble.user { align-self: flex-start; }
        
        .bubble-msg {
          padding: 16px 20px;
          border-radius: 20px;
          font-size: 14px;
          line-height: 1.6;
          position: relative;
        }
        .bubble.user .bubble-msg { 
          background: #ffffff; 
          color: #0f172a; 
          border: 1px solid #e2e8f0;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .bubble.admin .bubble-msg { 
          background: linear-gradient(135deg, #f59e0b, #d97706); 
          color: #ffffff;
          border-bottom-right-radius: 4px;
          box-shadow: 0 8px 20px rgba(245,158,11,0.2);
        }
        
        /* Telemetry Sidebar (Right Drawer) */
        .telemetry-bar {
          width: 280px;
          background: #ffffff;
          border-left: 1px solid #e2e8f0;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Utils */
        .modern-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; color: #94a3b8; font-weight: 600; }
        .spinner { animation: rotate 2s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .custom-tag {
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tag-amber { background: #fef3c7; color: #92400e; }
        .tag-blue { background: #eff6ff; color: #1e40af; }
        .tag-red { background: #fef2f2; color: #991b1b; }
      `}</style>

      {/* Pane 1: Navigation */}
      <aside className="pane-nav">
        <div style={{ marginBottom: '32px', padding: '0 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>KLASÖRLER</div>
          <div className={`nav-folder ${folder === 'inbox' ? 'active' : ''}`} onClick={() => setFolder('inbox')}>
            <Inbox size={18} />
            Yeniler / Bekleyenler
            <div className="folder-badge">{requests.filter(r => r.status === 'Açık').length}</div>
          </div>
          <div className={`nav-folder ${folder === 'assigned' ? 'active' : ''}`} onClick={() => setFolder('assigned')}>
            <User size={18} />
            İşlemdekiler
            <div className="folder-badge">{requests.filter(r => r.status === 'İşlemde').length}</div>
          </div>
          <div className={`nav-folder ${folder === 'resolved' ? 'active' : ''}`} onClick={() => setFolder('resolved')}>
            <CheckCircle2 size={18} />
            Tamamlananlar
            <div className="folder-badge">{requests.filter(r => r.status === 'Çözüldü' || r.status === 'Kapalı').length}</div>
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>DEPARTMANLAR</div>
          {['BT Destek', 'Üretim', 'Yazılım', 'Donanım'].map(cat => (
            <div key={cat} className="nav-folder" style={{ fontWeight: '500', opacity: 0.8 }}>
              <ChevronRight size={14} />
              {cat}
            </div>
          ))}
        </div>
      </aside>

      {/* Pane 2 & 3: Main Workspace */}
      <div className="workspace-grid">
        
        {/* Pane 2: Feed */}
        <div className="pane-feed">
          <div className="feed-header">
            <div className="feed-search">
              <Search size={16} color="#94a3b8" />
              <input 
                type="text" placeholder="Talep ara..." 
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="feed-list custom-scrollbar">
            {filtered.map(req => (
              <div 
                key={req.id} 
                className={`ticket-card ${selectedId === req.id ? 'active' : ''}`}
                onClick={() => setSelectedId(req.id)}
              >
                <div 
                  className="priority-indicator" 
                  style={{ background: req.priority === 'Kritik' ? '#ef4444' : (req.priority === 'Yüksek' ? '#f59e0b' : '#3b82f6') }} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="custom-tag tag-blue">#{req.id}</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>{new Date(req.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.subject}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#f1f5f9', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>{req.senderName[0]}</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{req.senderName}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <Archive size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <div style={{ fontSize: '12px', fontWeight: '600' }}>Seçili klasörde talep bulunmuyor.</div>
              </div>
            )}
          </div>
        </div>

        {/* Pane 3: View */}
        <div className="pane-view">
          {selectedReq ? (
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <header className="view-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#0f172a', margin: 0 }}>{selectedReq.subject}</h2>
                      <span className={`custom-tag ${selectedReq.status === 'Açık' ? 'tag-red' : 'tag-amber'}`}>{selectedReq.status}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="segmented-control">
                      <button className={selectedReq.status === 'Açık' ? 'active' : ''} onClick={() => handleStatusChange(selectedReq.id, 'Açık')}>AÇIK</button>
                      <button className={selectedReq.status === 'İşlemde' ? 'active' : ''} onClick={() => handleStatusChange(selectedReq.id, 'İşlemde')}>İŞLEMDE</button>
                      <button className={selectedReq.status === 'Çözüldü' ? 'active' : ''} onClick={() => handleStatusChange(selectedReq.id, 'Çözüldü')}>ÇÖZÜLDÜ</button>
                    </div>
                    <button className="btn-icon" style={{ borderRadius: '12px', background: '#fff' }}>
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </header>

                <div className="view-body custom-scrollbar">
                  {/* Reporter Intro */}
                  <div style={{ background: '#fef3c7', padding: '24px', borderRadius: '24px', marginBottom: '40px', border: '1px dashed #fbd38d' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                       <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900' }}>{selectedReq.senderName[0]}</div>
                       <div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#92400e' }}>{selectedReq.senderName} tarafından bir talep açıldı</div>
                          <div style={{ fontSize: '12px', color: '#b45309', opacity: 0.8 }}>Kategori: {selectedReq.category} • {new Date(selectedReq.createdAt).toLocaleString('tr-TR')}</div>
                       </div>
                    </div>
                    <p style={{ marginTop: '20px', fontSize: '15px', lineHeight: '1.7', color: '#78350f', fontWeight: '500' }}>{selectedReq.message}</p>
                  </div>

                  {/* Conversation */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {replies.map((reply, i) => (
                      <div key={reply.id} className={`bubble ${reply.isAdmin ? 'admin' : 'user'}`}>
                        <div className="bubble-msg">
                          {reply.message}
                          {reply.attachmentPath && (
                            <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                              <img src={`http://191.168.6.101:5006${reply.attachmentPath}`} style={{ maxWidth: '100%', display: 'block' }} />
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', fontWeight: '700' }}>
                          {reply.isAdmin ? 'Operatör' : 'Personel'} • {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </div>

                {/* Footer Input */}
                <footer style={{ padding: '24px 40px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ background: '#ffffff', borderRadius: '20px', padding: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <textarea 
                      placeholder="Cevap yazın..." 
                      style={{ width: '100%', border: 'none', background: 'transparent', padding: '12px 16px', outline: 'none', resize: 'none', height: '80px', fontSize: '14px' }}
                      value={replyText} onChange={e => setReplyText(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon" onClick={() => fileInputRef.current?.click()} style={{ border: 'none', background: '#f8fafc' }}>
                          <Paperclip size={18} />
                        </button>
                        <input type="file" ref={fileInputRef} hidden onChange={e => setAttachment(e.target.files[0])} />
                      </div>
                      <button 
                        className="btn btn-primary" 
                        style={{ borderRadius: '12px' }}
                        onClick={handleSendReply} disabled={sending}
                      >
                       <Send size={16} /> Gönder
                      </button>
                    </div>
                  </div>
                </footer>
              </div>

              {/* Telemetry Sidebar */}
              <aside className="telemetry-bar">
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f8fafc', margin: '0 auto 16px', border: '4px solid #fff', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={32} color="#f59e0b" />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>{selectedReq.senderName}</h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginTop: 4 }}>{selectedReq.senderEmail}</div>
                </div>

                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                     <Monitor size={16} color="#64748b" />
                     <span style={{ fontSize: '12px', fontWeight: '800' }}>SİSTEM TELEMETRİSİ</span>
                   </div>
                   {reporterPC ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                         <span style={{ color: '#94a3b8' }}>Bilgisayar</span>
                         <span style={{ fontWeight: '700' }}>{reporterPC.name}</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                         <span style={{ color: '#94a3b8' }}>IP Adresi</span>
                         <span style={{ fontWeight: '700' }}>{reporterPC.ipAddress}</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                         <span style={{ color: '#94a3b8' }}>Durum</span>
                         <span style={{ color: reporterPC.status === 'Online' ? '#10b981' : '#ef4444', fontWeight: '900' }}>{reporterPC.status?.toUpperCase()}</span>
                       </div>
                     </div>
                   ) : (
                     <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>Otomatik terminal eşleşmesi bulunamadı.</div>
                   )}
                </div>

                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                     <AlertTriangle size={16} color="#f59e0b" />
                     <span style={{ fontSize: '12px', fontWeight: '800' }}>KRİTİK NOTLAR</span>
                   </div>
                   <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.5', background: '#fffbeb', padding: '12px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                     Bu kullanıcı son 30 gün içinde toplam <b>4</b> farklı talep açmıştır.
                   </div>
                </div>
              </aside>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <LifeBuoy size={80} style={{ opacity: 0.1, marginBottom: '20px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600' }}>İşlem yapmak için bir talep seçiniz.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
