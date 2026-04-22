import { useState, useEffect, useRef } from 'react';
import { Zap, Hash, Send, Video, VideoOff, Paperclip, Image as ImageIcon, LogOut, User, Bell, Smile, Film, Search, Home, Plus, X as XIcon, Activity } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import api, { uploadMedia, getChatUsers, STATIC_URL } from '../api';
import { useNavigate } from 'react-router-dom';
import VideoCallModal from '../components/VideoCallModal';
import toast from 'react-hot-toast';

export default function ChatApp({ user, setAuth: _setAuth }) {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [activePrivateUserId, setActivePrivateUserId] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [connection, setConnection] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isShaking, setIsShaking] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', desc: '' });
  
  const emojis = ['😊', '😂', '👍', '🔥', '👏', '🚀', '🙌', '🤔', '😎', '🎉', '💡', '⚠️', '✅', '❌', '🏢', '💻'];

  // PRESENCE & STATUS
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // { channelId/privateUserId: [names] }
  const [connStatus, setConnStatus] = useState("Bağlanıyor...");

  // WEBRTC CALL STATE
  const [callState, setCallState] = useState({
      isCalling: false, isReceivingCall: false, callAccepted: false,
      callerId: null, callerName: null, targetId: null
  });
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerRef = useRef(null);

  // INITIAL DATA FETCH
  useEffect(() => {
    if (!user) return;
    const loadAppData = async () => {
      try {
        const [chRes, usersRes] = await Promise.all([
            api.get(`/chat/channels?userId=${user.id}`),
            getChatUsers()
        ]);
        setChannels(chRes.data);
        if (chRes.data.length > 0 && !activeChannelId && !activePrivateUserId) {
            setActiveChannelId(chRes.data[0].id);
        }
        setAllUsers(usersRes);
      } catch (err) { console.error("Data load error", err); }
    };
    loadAppData();
  }, [user]);

  // MESSAGE HISTORY FETCH
  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        let res;
        if (activePrivateUserId) {
            res = await api.get(`/Chat/history-private/${user.id}/${activePrivateUserId}`);
        } else if (activeChannelId) {
            res = await api.get(`/Chat/history/${activeChannelId}`);
        }
        if (res) {
            setMessages(res.data);
            setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
        }
      } catch (err) { console.error("History error", err); }
    };
    fetchHistory();
  }, [user, activeChannelId, activePrivateUserId]);


  // REFS FOR SIGNALR HANDLERS
  const activeChannelRef = useRef(activeChannelId);
  const activePrivateUserRef = useRef(activePrivateUserId);
  useEffect(() => { activeChannelRef.current = activeChannelId; }, [activeChannelId]);
  useEffect(() => { activePrivateUserRef.current = activePrivateUserId; }, [activePrivateUserId]);

  // SIGNALR SETUP & LISTENERS
  useEffect(() => {
    if (!user) return;
    const hubUrl = `${STATIC_URL}/chathub`;
    
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    newConnection.onreconnecting(() => setConnStatus("Tekrar Bağlanıyor..."));
    newConnection.onreconnected(() => {
        setConnStatus("Bağlandı");
        newConnection.invoke("RegisterPresence", user.id, user.fullName || user.username);
    });
    newConnection.onclose(() => setConnStatus("Bağlantı Koptu"));

    newConnection.on("UpdateOnlineUsers", (users) => { setOnlineUsers(users); });
    
    newConnection.on("ReceiveMessage", (msg) => {
        const curChannel = activeChannelRef.current;
        const curPrivateId = activePrivateUserRef.current;
        const isCurrentChannel = !curPrivateId && curChannel && msg.channelId === curChannel;
        const isCurrentDM = curPrivateId && (
            (msg.userId === user.id && msg.recipientId === curPrivateId) ||
            (msg.userId === curPrivateId && msg.recipientId === user.id)
        );

        if (isCurrentChannel || isCurrentDM) {
            setMessages(prev => [...prev, msg]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else if (msg.userId !== user.id) {
            toast(`Yeni mesaj: ${msg.senderName}`);
        }
        
        if (msg.channelId) {
            setChannels(prev => prev.map(c => c.id === msg.channelId ? { ...c, lastMessage: msg.content, lastMessageTime: msg.timestamp } : c));
        }
    });

    newConnection.on("UserTyping", (_userId, userName, channelId, _recipientId) => {
        const key = channelId ? `c_${channelId}` : `p_${_userId}`;
        setTypingUsers(prev => ({ ...prev, [key]: userName }));
        setTimeout(() => {
            setTypingUsers(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }, 3000);
    });

    newConnection.on("ReceiveNudge", (fromName) => {
        toast(`🔔 ${fromName} size titreşim gönderdi!`);
        setIsShaking(true);
        try { new Audio('https://www.myinstants.com/media/sounds/nudge.mp3').play(); } catch(_e){}
        setTimeout(() => setIsShaking(false), 1000);
    });

    newConnection.on("IncomingCall", (fromConnectionId, signalDataStr, fromFullName) => {
       const data = JSON.parse(signalDataStr);
       if (data.type === 'offer') {
           setCallState({
               isCalling: false, isReceivingCall: true, callAccepted: false,
               callerId: fromConnectionId, callerName: fromFullName, targetId: null, offer: data.sdp
           });
       }
    });

    newConnection.on("CallAccepted", (signalDataStr) => {
       const data = JSON.parse(signalDataStr);
       if (data.type === 'answer' && peerRef.current) {
           peerRef.current.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
           setCallState(s => ({...s, callAccepted: true}));
       }
    });

    newConnection.on("ReceiveSignal", async (_fromConnectionId, signalDataStr) => {
       const data = JSON.parse(signalDataStr);
       if (data.type === 'ice' && peerRef.current) {
           try { await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch(_err){}
       }
    });

    const startConn = async () => {
        try {
            if (newConnection.state === signalR.HubConnectionState.Disconnected) {
                setConnStatus("Bağlanıyor...");
                await newConnection.start();
                setConnStatus("Bağlandı");
                await newConnection.invoke("RegisterPresence", user.id, user.fullName || user.username);
                if (activeChannelRef.current) {
                    await newConnection.invoke("JoinChannel", activeChannelRef.current.toString());
                }
            }
        } catch (err) {
            console.error("SignalR: Start Error", err);
            setConnStatus("Bağlantı Hatası");
            setTimeout(startConn, 5000);
        }
    };
    startConn();

    setConnection(newConnection);

    return () => {
        if (newConnection) {
            newConnection.stop();
        }
    };
  }, [user]);

  // CHANNEL SWITCHING SYNC
  useEffect(() => {
     if (connection && connection.state === signalR.HubConnectionState.Connected && activeChannelId) {
         connection.invoke("JoinChannel", activeChannelId.toString()).catch(_err => console.error(_err));
     }
  }, [activeChannelId, connection]);

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) setFileToUpload(file);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !fileToUpload) || !connection || !user) return;
    
    let attachmentUrl = null, attachmentType = null;
    if (fileToUpload) {
        try {
            const res = await uploadMedia(fileToUpload);
            attachmentUrl = res.url;
            attachmentType = fileToUpload.type.startsWith('image/') ? 'image' : 'file';
        } catch (_err) { toast.error("Dosya yüklenemedi."); return; }
    }

    if (connection.state !== signalR.HubConnectionState.Connected) {
        toast.error("Bağlantı kuruluyor, lütfen bekleyin...");
        return;
    }

    try {
      if (activePrivateUserId) {
          await connection.invoke("SendMessage", null, user.id, user.fullName || user.username, input, attachmentUrl, attachmentType, activePrivateUserId);
      } else if (activeChannelId) {
          await connection.invoke("SendMessage", activeChannelId, user.id, user.fullName || user.username, input, attachmentUrl, attachmentType, null);
      }
      setInput(''); 
      setFileToUpload(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
      
      // Stop typing
      if (activePrivateUserId) {
          connection.invoke("SendTypingStatus", user.id, user.fullName, null, activePrivateUserId);
      } else if (activeChannelId) {
          connection.invoke("SendTypingStatus", user.id, user.fullName, activeChannelId, null);
      }
    } catch (e) { 
      console.error("SendMessage Error:", e);
      toast.error("Mesaj gönderilemedi: " + e.message);
    }
  };

  const handleInputChange = (val) => {
      setInput(val);
      if (connection && connection.state === signalR.HubConnectionState.Connected) {
          if (activeChannelId) connection.invoke("SendTypingStatus", user.id, user.fullName, activeChannelId, null);
          else if (activePrivateUserId) connection.invoke("SendTypingStatus", user.id, user.fullName, null, activePrivateUserId);
      }
  };

  const sendNudge = () => {
      if (!activePrivateUserId || !connection) return;
      const target = onlinePeerList.find(u => u.id === activePrivateUserId);
      if (target && target.connectionId) {
          connection.invoke("SendNudge", target.connectionId, user.fullName);
          toast.success("Titreşim gönderildi!");
      } else {
          toast.error("Titreşim sadece çevrimiçi kişilere gönderilebilir.");
      }
  };

  const addEmoji = (emoji) => {
      setInput(prev => prev + emoji);
  };

  const searchGifs = async () => {
      if (!gifSearch) return;
      const mockGifs = [
          { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJtZzZiamN4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKDkDbIDJieKbVm/giphy.gif', title: 'Work' },
          { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJtZzZiamN4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/upg0i1m4DLe5W/giphy.gif', title: 'Funny' },
          { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJtZzZiamN4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4Zmt4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/26gsjCZpPolPr3sBy/giphy.gif', title: 'Great Job' }
      ];
      setGifResults(mockGifs);
  };

  const sendGif = async (gifUrl) => {
      if (!connection) return;
      try {
          if (activePrivateUserId) {
              await connection.invoke("SendMessage", null, user.id, user.fullName, "", gifUrl, "image", activePrivateUserId);
          } else if (activeChannelId) {
              await connection.invoke("SendMessage", activeChannelId, user.id, user.fullName, "", gifUrl, "image", null);
          }
          setShowEmojiPicker(false);
      } catch (_e) { toast.error("GIF gönderilemedi."); }
  };

  const selectChannel = (id) => {
      setActiveChannelId(id);
      setActivePrivateUserId(null);
      if (connection) connection.invoke("JoinChannel", id.toString());
  };

  const selectUser = (id) => {
      setActivePrivateUserId(id);
      setActiveChannelId(null);
  };

  const createPeer = (targetConnectionId) => {
      const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peer.onicecandidate = e => { if (e.candidate) connection.invoke("SendSignal", targetConnectionId, JSON.stringify({ type: 'ice', candidate: e.candidate })); };
      peer.ontrack = e => setRemoteStream(e.streams[0]);
      return peer;
  };

  const startCall = (targetConnId, targetName) => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
          setLocalStream(stream);
          const peer = createPeer(targetConnId);
          stream.getTracks().forEach(track => peer.addTrack(track, stream));
          peerRef.current = peer;
          peer.createOffer().then(offer => {
             peer.setLocalDescription(offer);
             connection.invoke("CallUser", targetConnId, JSON.stringify({ type: 'offer', sdp: offer.sdp }), user.fullName);
             setCallState({ isCalling: true, isReceivingCall: false, callAccepted: false, callerId: null, targetId: targetConnId, callerName: targetName });
          });
      }).catch(() => toast.error("Cihaz izni reddedildi."));
  };

  const answerCall = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setLocalStream(stream); const peer = createPeer(callState.callerId);
          stream.getTracks().forEach(track => peer.addTrack(track, stream)); peerRef.current = peer;
          await peer.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: callState.offer }));
          const answer = await peer.createAnswer(); await peer.setLocalDescription(answer);
          connection.invoke("AnswerCall", callState.callerId, JSON.stringify({ type: 'answer', sdp: answer.sdp }));
          setCallState(s => ({...s, callAccepted: true}));
      } catch (_e) { toast.error("Kamera reddedildi veya ulaşılamadı."); }
  };

  const endCall = () => {
      if (peerRef.current) peerRef.current.close();
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      peerRef.current = null; setLocalStream(null); setRemoteStream(null);
      setCallState({ isCalling: false, isReceivingCall: false, callAccepted: false, callerId: null, targetId: null, callerName: null });
  };

  const manualReload = async () => {
    try {
        const usersRes = await getChatUsers();
        setAllUsers(usersRes);
        toast.success("Kullanıcı listesi güncellendi.");
    } catch(_e) { toast.error("Liste yenilenemedi."); }
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);
  const activePrivateUser = allUsers.find(u => u.id === activePrivateUserId);
  const currentUserIdStr = String(user?.id || '');

  const handleCreateGroup = async (e) => {
      e.preventDefault();
      if (!newGroup.name) return toast.error("Grup adı gereklidir.");
      try {
          const res = await api.post('/chat/channels', { 
              name: newGroup.name, 
              description: newGroup.desc,
              ownerId: user.id
          });
          setChannels([...channels, res.data]);
          setActiveChannelId(res.data.id);
          setActivePrivateUserId(null);
          setIsGroupModalOpen(false);
          setNewGroup({ name: '', desc: '' });
          toast.success("Grup oluşturuldu!");
      } catch (_err) { toast.error("Grup oluşturulamadı."); }
  };

  const activeUserMap = {};
  if (Array.isArray(onlineUsers)) {
      onlineUsers.forEach(u => { if (u.userId) activeUserMap[String(u.userId)] = u.connectionId; });
  }
  
  const onlinePeerList = [];
  const offlinePeerList = [];

  if (Array.isArray(allUsers)) {
      allUsers.forEach(sysUser => {
          const sId = String(sysUser.id);
          if (sId === currentUserIdStr) return;
          if (activeUserMap[sId]) onlinePeerList.push({ ...sysUser, connectionId: activeUserMap[sId] });
          else offlinePeerList.push(sysUser);
      });
  }

  if (!user) return <div style={{ color: 'white', padding: '20px' }}>Yükleniyor...</div>;

  return (
    <div className={isShaking ? 'shake' : ''} style={{ display: 'flex', height: '100vh', width: '100%', background: 'var(--bg-primary)', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* SİDEBAR KANALLAR & KULLANICILAR */}
      <div className="sidebar chat-sidebar" style={{ width: '320px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <div style={{ padding: '28px 20px', background: 'linear-gradient(180deg, var(--bg-inset) 0%, transparent 100%)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
              <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-1)' }}>
                <Zap size={22} color="var(--amber)" fill="var(--amber)" fillOpacity={0.2} /> Saha İletişim
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, marginTop: 4 }}>NetLiveness Network v2.4</div>
          </div>
          <button onClick={manualReload} className="btn-icon-sm" style={{ background: 'var(--bg-inset)' }}><Activity size={14} /></button>
        </div>

        <div style={{ padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <button onClick={() => navigate('/login')} className="sidebar-home-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'var(--bg-inset)', color: 'var(--text-1)', border: '1px solid var(--border)', borderRadius: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s ease', fontWeight: 800 }}>
            <Home size={18} />
            <span style={{ fontSize: '13px' }}>Kontrol Paneline Dön</span>
          </button>

          {/* KANALLAR SEKSİYONU */}
          <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 8px' }}>
                <h3 style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1.2px', margin: 0, fontWeight: 900 }}>GRUPLAR & KANALLAR</h3>
                <button onClick={() => setIsGroupModalOpen(true)} className="btn-icon-xs" style={{ background: 'var(--blue-soft)', color: 'var(--blue-text)' }}><Plus size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {channels.map(ch => {
                  const isActive = activeChannelId === ch.id;
                  const isTyping = typingUsers[`c_${ch.id}`];
                  return (
                    <button key={ch.id} onClick={() => selectChannel(ch.id)} className={`chat-list-item ${isActive ? 'active' : ''}`} style={{ 
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                        background: isActive ? 'var(--blue-soft)' : 'transparent', 
                        color: isActive ? 'var(--blue-text)' : 'var(--text-2)', 
                        border: 'none', borderRadius: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                        position: 'relative', outline: 'none'
                    }}>
                      <div className="icon-box-sm" style={{ background: isActive ? 'var(--blue-text)' : 'var(--bg-inset)', color: isActive ? '#fff' : 'var(--text-3)', borderRadius: 10 }}>
                        <Hash size={18} />
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '14px', fontWeight: isActive ? 800 : 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {ch.name}
                            {ch.lastMessageTime && <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.6 }}>12:45</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: isActive ? 'var(--blue-text)' : 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {isTyping ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>{isTyping} yazıyor...</span> : (ch.lastMessage || ch.description || 'Sohbete dahil olun')}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
          </section>

          {/* KİŞİLER SEKSİYONU */}
          <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 8px' }}>
                <h3 style={{ fontSize: '10px', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '1.2px', margin: 0, fontWeight: 900 }}>ÇEVRİMİÇİ ({onlinePeerList.length})</h3>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                 {onlinePeerList.map(u => {
                    const isActive = activePrivateUserId === u.id;
                    const isTyping = typingUsers[`p_${u.id}`];
                    return (
                        <div key={u.id} className={`chat-list-item user ${isActive ? 'active' : ''}`} style={{ 
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', 
                            background: isActive ? 'var(--amber-soft)' : 'var(--bg-surface)', 
                            borderRadius: '14px', border: isActive ? '1px solid var(--amber-border)' : '1px solid transparent', 
                            cursor: 'pointer', transition: 'all 0.2s'
                        }} onClick={() => selectUser(u.id)}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                                    {u.fullName?.[0].toUpperCase()}
                                </div>
                                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
                                </div>
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-1)' }}>{u.fullName}</div>
                                <div style={{ fontSize: '11px', color: isTyping ? 'var(--green)' : 'var(--text-3)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {isTyping ? 'yazıyor...' : 'Müsait'}
                                </div>
                            </div>
                            <button className="btn-icon-xs" onClick={(e) => { e.stopPropagation(); startCall(u.connectionId, u.fullName); }} style={{ background: 'var(--bg-inset)', color: 'var(--green)' }}><Video size={14} /></button>
                        </div>
                    );
                 })}
              </div>
          </section>

          <section>
              <h3 style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px', padding: '0 8px', fontWeight: 900 }}>ÇEVRİMDIŞI ({offlinePeerList.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                 {offlinePeerList.map(u => (
                    <div key={u.id} className="chat-list-item offline" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', opacity: 0.6, cursor: 'pointer' }} onClick={() => selectUser(u.id)}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--text-3)' }}>{u.fullName?.[0]}</div>
                        <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>{u.fullName}</span>
                    </div>
                 ))}
              </div>
          </section>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--amber)', boxShadow: '0 4px 12px var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: '16px' }}>{user.fullName ? user.fullName[0].toUpperCase() : 'U'}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
             <div style={{ color: 'var(--text-1)', fontSize: '13px', fontWeight: 800 }}>{user.fullName}</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: connStatus === "Bağlandı" ? "var(--green)" : (connStatus === "Bağlantı Hatası" ? "var(--red)" : "var(--amber)") }} />
                <span style={{ color: 'var(--text-3)', fontSize: '10px', fontWeight: 600 }}>{connStatus}</span>
             </div>
          </div>
          <button onClick={() => navigate(user.isAdmin ? '/' : '/chat')} className="btn-icon-sm" title="Çıkış / Geri"><LogOut size={16} /></button>
        </div>
      </div>

      {/* CHAT MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', position: 'relative' }}>
        <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', backdropFilter: 'blur(10px)', zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-box-lg" style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                {activePrivateUserId ? <div style={{ width: 14, height: 14, borderRadius: '50%', background: activeUserMap[String(activePrivateUserId)] ? 'var(--green)' : 'var(--text-3)' }} /> : <Hash size={24} color="var(--blue-text)" />}
            </div>
            <div>
              <div style={{ fontSize: '18px', margin: 0, fontWeight: 900, color: 'var(--text-1)' }}>{activePrivateUser ? activePrivateUser.fullName : activeChannel?.name}</div>
              <div style={{ fontSize: '12px', margin: 0, color: 'var(--text-3)', fontWeight: 600 }}>
                  {activePrivateUser ? (activeUserMap[String(activePrivateUserId)] ? 'Şu an çevrimiçi' : 'Şu an çevrimdışı') : activeChannel?.description}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
             {activePrivateUserId && (
                 <button onClick={sendNudge} className="btn btn-secondary danger" style={{ padding: '10px 16px' }}>
                    <Bell size={18} /> <span style={{ fontSize: '13px', fontWeight: 800 }}>TİTREŞİM</span>
                 </button>
             )}
             <button className="btn-icon" onClick={() => navigate('/')}><Search size={18} /></button>
          </div>
        </div>

        <div className="chat-history" style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-primary)' }}>
          {messages.map((msg, i) => {
            const isMe = String(msg.userId) === currentUserIdStr;
            const msgDate = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            
            return (
              <div key={i} className={`msg-row ${isMe ? 'me' : 'them'}`} style={{ display: 'flex', gap: '14px', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', animation: 'slideUp 0.3s ease-out' }}>
                 {!isMe && (
                     <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-inset)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: 'var(--text-2)', marginTop: 'auto' }}>
                         {msg.senderName?.[0]}
                     </div>
                 )}
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 4 }}>
                    {!isMe && <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginLeft: 4 }}>{msg.senderName}</div>}
                    <div style={{ 
                        padding: '12px 16px', 
                        background: isMe ? 'linear-gradient(135deg, var(--amber) 0%, #d97706 100%)' : 'var(--bg-surface)', 
                        color: isMe ? '#000' : 'var(--text-1)', 
                        borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                        fontWeight: 600, fontSize: 14,
                        border: isMe ? 'none' : '1px solid var(--border)', 
                        boxShadow: isMe ? '0 4px 15px var(--amber-dim)' : '0 2px 8px rgba(0,0,0,0.02)',
                        position: 'relative'
                    }}>
                      {msg.attachmentUrl && (
                          <div style={{ marginBottom: 8, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                               <img 
                                  src={`${STATIC_URL}${msg.attachmentUrl}`} 
                                  style={{ maxWidth: '100%', display: 'block', cursor: 'pointer' }} 
                                  onClick={() => window.open(`${STATIC_URL}${msg.attachmentUrl}`, '_blank')}
                                  alt="attachment"
                               />
                          </div>
                      )}
                      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                      <div style={{ fontSize: 9, opacity: 0.6, marginTop: 4, textAlign: 'right', fontWeight: 800 }}>{msgDate}</div>
                    </div>
                 </div>
              </div>
            );
          })}
          <div ref={bottomRef} style={{ height: 1 }} />
        </div>

        <div style={{ padding: '24px 30px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(10px)' }}>
          {showEmojiPicker && (
              <div className="animate-in" style={{ position: 'absolute', bottom: '100px', left: '30px', width: '320px', background: 'var(--bg-surface)', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '20px', zIndex: 100 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-1)' }}>EMOJİ & GİF</span>
                      <button className="btn-icon-xs" onClick={() => setShowEmojiPicker(false)}><XIcon size={14} /></button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', marginBottom: '16px' }}>
                      {emojis.map(e => <button key={e} onClick={() => addEmoji(e)} style={{ fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>{e}</button>)}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <input 
                            type="text" 
                            value={gifSearch} 
                            onChange={e => setGifSearch(e.target.value)} 
                            placeholder="Giphy'de ara..." 
                            className="form-input"
                            style={{ flex: 1, height: 36, fontSize: 13, borderRadius: 10 }} 
                            onKeyDown={e => e.key === 'Enter' && searchGifs()} 
                          />
                          <button onClick={searchGifs} className="btn btn-primary" style={{ padding: 0, width: 36, height: 36, borderRadius: 10 }}><Search size={16} /></button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: 4 }}>
                          {gifResults.map((g, i) => <img key={i} src={g.url} onClick={() => sendGif(g.url)} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--border)' }} alt="gif" />)}
                      </div>
                  </div>
              </div>
          )}
          
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: 6 }}>
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="btn-icon" style={{ background: showEmojiPicker ? 'var(--amber-soft)' : 'var(--bg-inset)', color: showEmojiPicker ? 'var(--amber)' : 'var(--text-3)' }}><Smile size={20} /></button>
                <button type="button" onClick={() => fileInputRef.current.click()} className="btn-icon" style={{ background: 'var(--bg-inset)', color: 'var(--text-3)' }}><Paperclip size={20} /></button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            </div>
            
            <div style={{ flex: 1, position: 'relative' }}>
                {fileToUpload && (
                    <div className="animate-in" style={{ position: 'absolute', bottom: '100%', left: 0, padding: '8px 12px', background: 'var(--amber-soft)', border: '1px solid var(--amber-border)', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--amber)' }}>
                        <ImageIcon size={14} /> {fileToUpload.name}
                        <button type="button" className="btn-icon-xs" onClick={() => setFileToUpload(null)}><XIcon size={12} /></button>
                    </div>
                )}
                <textarea 
                  value={input} 
                  onChange={(e) => handleInputChange(e.target.value)} 
                  placeholder="Bir mesaj yazın..." 
                  className="form-input chat-input"
                  rows={1}
                  onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(e);
                      }
                  }}
                  style={{ 
                      width: '100%', minHeight: '52px', maxHeight: '150px', 
                      borderRadius: fileToUpload ? '0 16px 16px 16px' : '16px', 
                      padding: '14px 20px', fontSize: '15px', fontWeight: 500,
                      background: 'var(--bg-inset)', border: '1px solid var(--border)',
                      resize: 'none', overflowY: 'auto'
                  }} 
                />
            </div>
            
            <button 
                type="submit" 
                disabled={!input.trim() && !fileToUpload} 
                className="btn btn-primary"
                style={{ 
                    width: '52px', height: '52px', borderRadius: '16px', padding: 0, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 0 
                }}
            >
                <Send size={22} />
            </button>
          </form>
        </div>
      </div>

      { (callState.isCalling || callState.isReceivingCall) && <VideoCallModal 
            callState={callState} 
            answerCall={answerCall} 
            endCall={endCall} 
            remoteStream={remoteStream} 
            localStream={localStream} 
        /> }

        {/* GRUP OLUŞTURMA MODALI */}
        {isGroupModalOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: '#1e293b', width: '100%', maxWidth: '400px', borderRadius: '24px', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#f59e0b' }}>Yeni Grup Oluştur</h2>
                        <button onClick={() => setIsGroupModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer' }}><XIcon size={20} /></button>
                    </div>
                    <form onSubmit={handleCreateGroup}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>Grup Adı</label>
                            <input autoFocus type="text" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '15px' }} placeholder="Grup adını yazın..." />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>Açıklama (Opsiyonel)</label>
                            <input type="text" value={newGroup.desc} onChange={e => setNewGroup({...newGroup, desc: e.target.value})} style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '15px' }} placeholder="Grup amacını kısaca yazın..." />
                        </div>
                        <button type="submit" style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)' }}>Grubu Oluştur</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}
