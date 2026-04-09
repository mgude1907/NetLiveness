import { useState, useEffect, useRef } from 'react';
import { Zap, Hash, Send, Video, VideoOff, Paperclip, Image as ImageIcon, LogOut, User, Bell, Smile, Film, Search, Home, Plus, X as XIcon } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import api, { uploadMedia, getChatUsers } from '../api';
import { useNavigate } from 'react-router-dom';
import VideoCallModal from '../components/VideoCallModal';
import toast from 'react-hot-toast';

export default function ChatApp({ user, setAuth }) {
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

  // PRESENCE
  const [onlineUsers, setOnlineUsers] = useState([]);

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

  // STATUS
  const [connStatus, setConnStatus] = useState("Bağlanıyor...");

  // REFS FOR SIGNALR HANDLERS
  const activeChannelRef = useRef(activeChannelId);
  const activePrivateUserRef = useRef(activePrivateUserId);
  useEffect(() => { activeChannelRef.current = activeChannelId; }, [activeChannelId]);
  useEffect(() => { activePrivateUserRef.current = activePrivateUserId; }, [activePrivateUserId]);

  // SIGNALR SETUP
  useEffect(() => {
    if (!user) return;
    const hubUrl = `http://${window.location.hostname}:5006/chathub`;
    
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
    return () => { 
        if (newConnection.state !== signalR.HubConnectionState.Disconnected) {
            newConnection.stop(); 
        }
    };
  }, [user]);

  // LISTENERS & STARTUP
  useEffect(() => {
    if (!connection) return;

    connection.onreconnecting(() => setConnStatus("Tekrar Bağlanıyor..."));
    connection.onreconnected(() => {
        setConnStatus("Bağlandı");
        connection.invoke("RegisterPresence", user.id, user.fullName || user.username);
    });
    connection.onclose(() => setConnStatus("Bağlantı Koptu"));

    connection.on("UpdateOnlineUsers", (users) => { setOnlineUsers(users); });
    
    connection.on("ReceiveMessage", (msg) => {
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
    });

    connection.on("ReceiveNudge", (fromName) => {
        toast(`🔔 ${fromName} size titreşim gönderdi!`);
        setIsShaking(true);
        try { new Audio('https://www.myinstants.com/media/sounds/nudge.mp3').play(); } catch(e){}
        setTimeout(() => setIsShaking(false), 1000);
    });

    connection.on("IncomingCall", (fromConnectionId, signalDataStr, fromFullName) => {
       const data = JSON.parse(signalDataStr);
       if (data.type === 'offer') {
           setCallState({
               isCalling: false, isReceivingCall: true, callAccepted: false,
               callerId: fromConnectionId, callerName: fromFullName, targetId: null, offer: data.sdp
           });
       }
    });

    connection.on("CallAccepted", (signalDataStr) => {
       const data = JSON.parse(signalDataStr);
       if (data.type === 'answer' && peerRef.current) {
           peerRef.current.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
           setCallState(s => ({...s, callAccepted: true}));
       }
    });

    connection.on("ReceiveSignal", async (fromConnectionId, signalDataStr) => {
       const data = JSON.parse(signalDataStr);
       if (data.type === 'ice' && peerRef.current) {
           try { await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch(e){}
       }
    });

    const startConn = async () => {
        try {
            if (connection.state === signalR.HubConnectionState.Disconnected) {
                setConnStatus("Bağlanıyor...");
                await connection.start();
                setConnStatus("Bağlandı");
                await connection.invoke("RegisterPresence", user.id, user.fullName || user.username);
                if (activeChannelRef.current) {
                    await connection.invoke("JoinChannel", activeChannelRef.current.toString());
                }
            }
        } catch (err) {
            console.error("SignalR: Start Error", err);
            setConnStatus("Bağlantı Hatası");
            setTimeout(startConn, 5000);
        }
    };
    startConn();

    return () => {
        connection.off("UpdateOnlineUsers");
        connection.off("ReceiveMessage");
        connection.off("ReceiveNudge");
        connection.off("IncomingCall");
        connection.off("CallAccepted");
        connection.off("ReceiveSignal");
    };
  }, [connection]);

  // CHANNEL SWITCHING SYNC
  useEffect(() => {
     if (connection && connection.state === signalR.HubConnectionState.Connected && activeChannelId) {
         connection.invoke("JoinChannel", activeChannelId.toString()).catch(e => console.error(e));
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
        } catch (e) { toast.error("Dosya yüklenemedi."); return; }
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
    } catch (e) { 
      console.error("SendMessage Error:", e);
      toast.error("Mesaj gönderilemedi: " + e.message);
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
      } catch (e) { toast.error("GIF gönderilemedi."); }
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
      }).catch(e => toast.error("Cihaz izni reddedildi."));
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
      } catch (e) { toast.error("Kamera reddedildi veya ulaşılamadı."); }
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
    } catch(e) { toast.error("Liste yenilenemedi."); }
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
      } catch (err) { toast.error("Grup oluşturulamadı."); }
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
      <div style={{ width: '280px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <div style={{ padding: '24px 20px', background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}><Zap size={22} color="#f59e0b" /> Saha İletişim</h2>
          <button onClick={manualReload} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer' }}><Hash size={14} style={{ rotate: '45deg' }} /></button>
        </div>

        <div style={{ padding: '20px 12px', flex: 1, overflowY: 'auto' }}>
          <button onClick={() => navigate('/login')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(245, 158, 11, 0.05)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', marginBottom: '24px', transition: 'all 0.3s ease', fontWeight: 600 }}>
            <Home size={18} />
            <span style={{ fontSize: '14px' }}>Ana Sayfaya Dön</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingRight: '8px' }}>
            <h3 style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0, paddingLeft: '8px', fontWeight: 600 }}>Kanallar</h3>
            <button onClick={() => setIsGroupModalOpen(true)} style={{ background: 'rgba(245, 158, 11, 0.1)', border: 'none', width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f59e0b' }} title="Yeni Grup Oluştur"><Plus size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {channels.map(ch => {
              const isActive = activeChannelId === ch.id;
              return (
                <button key={ch.id} onClick={() => selectChannel(ch.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isActive ? 'rgba(245, 158, 11, 0.1)' : 'transparent', color: isActive ? '#f59e0b' : '#cbd5e1', border: isActive ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s ease' }}>
                  <Hash size={18} color={isActive ? '#f59e0b' : '#64748b'} />
                  <span style={{ fontSize: '14px' }}>{ch.name}</span>
                </button>
              )
            })}
          </div>

          <h3 style={{ fontSize: '11px', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px', paddingLeft: '8px', fontWeight: 600 }}>Çevrimiçi ({onlinePeerList.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
             {onlinePeerList.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: activePrivateUserId === u.id ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: activePrivateUserId === u.id ? '1px solid #f59e0b' : '1px solid rgba(16, 185, 129, 0.15)', cursor: 'pointer' }} onClick={() => selectUser(u.id)}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '4px', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                      <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{u.fullName}</span>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); startCall(u.connectionId, u.fullName); }} style={{ background: 'rgba(16, 185, 129, 0.15)', border: 'none', width: '28px', height: '28px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#10b981' }}><Video size={14} /></button>
                </div>
             ))}
          </div>

          <h3 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px', paddingLeft: '8px', fontWeight: 600 }}>Çevrimdışı ({offlinePeerList.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             {offlinePeerList.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: activePrivateUserId === u.id ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.02)', borderRadius: '10px', border: activePrivateUserId === u.id ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.02)', cursor: 'pointer' }} onClick={() => selectUser(u.id)}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '4px', background: '#334155' }} />
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>{u.fullName}</span>
                   </div>
                   <button disabled style={{ background: 'transparent', border: 'none', color: '#475569' }}><VideoOff size={14} /></button>
                </div>
             ))}
          </div>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>{user.fullName ? user.fullName[0].toUpperCase() : 'U'}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
             <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{user.fullName}</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: connStatus === "Bağlandı" ? "#10b981" : (connStatus === "Bağlantı Hatası" ? "#ef4444" : "#f59e0b") }} />
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>{connStatus}</span>
             </div>
          </div>
          <button onClick={() => navigate(user.isAdmin ? '/' : '/chat')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} title="Çıkış / Geri"><LogOut size={18} style={{ transform: 'rotate(180deg)' }} /></button>
        </div>
      </div>

      {/* CHAT MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', position: 'relative' }}>
        <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activePrivateUserId ? <User size={24} color="#f59e0b" /> : <Hash size={24} color="#f59e0b" />}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 700 }}>{activePrivateUser ? activePrivateUser.fullName : activeChannel?.name}</h2>
              <p style={{ fontSize: '13px', margin: 0, color: '#94a3b8' }}>{activePrivateUser ? 'Özel Mesajlaşma' : activeChannel?.description}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
             {activePrivateUserId && (
                 <button onClick={sendNudge} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 16px', borderRadius: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }} title="Titreşim Gönder">
                    <Bell size={18} /> <span style={{ fontSize: '13px', fontWeight: 600 }}>Titreşim</span>
                 </button>
             )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundSize: '20px 20px', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.02) 1.5px, transparent 1.5px)' }}>
          {messages.map((msg, i) => {
            const isMe = String(msg.userId) === currentUserIdStr;
            return (
              <div key={i} style={{ display: 'flex', gap: '14px', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                 {!isMe && <div style={{ minWidth: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{msg.senderName?.[0]}</div>}
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ padding: '14px 18px', background: isMe ? '#f59e0b' : 'var(--bg-secondary)', color: isMe ? '#000' : '#fff', borderRadius: '16px', fontWeight: isMe ? 600 : 400, border: isMe ? 'none' : '1px solid var(--border-color)', boxShadow: isMe ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none' }}>
                      {msg.attachmentUrl && <img src={`http://localhost:5006${msg.attachmentUrl}`} style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.1)' }} />}
                      {msg.content}
                    </div>
                 </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '24px 30px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
          {showEmojiPicker && (
              <div style={{ position: 'absolute', bottom: '100px', left: '30px', width: '320px', background: '#121212', borderRadius: '16px', border: '1px solid var(--accent-amber)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', padding: '16px', zIndex: 100 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', marginBottom: '16px' }}>
                      {emojis.map(e => <button key={e} onClick={() => addEmoji(e)} style={{ fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>{e}</button>)}
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <input type="text" value={gifSearch} onChange={e => setGifSearch(e.target.value)} placeholder="GIF Ara..." style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }} onKeyDown={e => e.key === 'Enter' && searchGifs()} />
                          <button onClick={searchGifs} style={{ background: '#f59e0b', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><Search size={16} color="black" /></button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                          {gifResults.map((g, i) => <img key={i} src={g.url} onClick={() => sendGif(g.url)} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} />)}
                      </div>
                  </div>
              </div>
          )}
          {fileToUpload && <div style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '8px' }}><ImageIcon size={14} /> {fileToUpload.name}</div>}
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '5px' }}><Smile size={22} /></button>
                  <button type="button" onClick={() => setGifSearch(gifSearch ? '' : ' ')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '5px' }} title="GIF Ara"><Film size={22} /></button>
                  {activePrivateUserId && (
                      <button type="button" onClick={sendNudge} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: '8px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', marginLeft: '5px' }} title="Titreşim Gönder">
                        <Bell size={18} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>TİTREŞİM GÖNDER</span>
                      </button>
                  )}
               </div>
            <input type="file" ref={fileInputRef} hidden accept="image/*,.gif" onChange={handleFileChange} />
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Mesajınızı yazın..." style={{ flex: 1, background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: '15px' }} />
            <button type="submit" disabled={!input.trim() && !fileToUpload} style={{ background: '#f59e0b', width: '46px', height: '46px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Send size={20} color="black" /></button>
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
