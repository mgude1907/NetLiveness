import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, MicOff, Mic, Video, VideoOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VideoCallModal({
  isReceivingCall,
  callerName,
  callAccepted,
  onAcceptCall,
  onRejectCall,
  endCall,
  localStream,
  remoteStream
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoMuted(!isVideoMuted);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
    }}>
      <div style={{
        background: '#1e293b', padding: '20px', borderRadius: '24px',
        width: '900px', maxWidth: '95vw', border: '1px solid rgba(56,189,248,0.3)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        
        {/* HEADER */}
        <div style={{ textAlign: 'center' }}>
           <h2 style={{ color: '#fff', margin: 0, fontSize: '24px' }}>
              {callAccepted ? `${callerName} İle Görüşülüyor` : isReceivingCall ? `${callerName} Sizi Arıyor...` : `Aranıyor...`}
           </h2>
        </div>

        {/* VIDEOS */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', position: 'relative' }}>
          {/* Karşı Taraf veya Bekleme */}
          <div style={{ 
            flex: 1, background: '#0f172a', borderRadius: '16px', overflow: 'hidden', 
            position: 'relative', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)'
          }}>
             {callAccepted && remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             ) : (
                <div style={{ color: '#64748b', fontSize: '16px' }}>{isReceivingCall ? 'Çağrı bekleniyor...' : 'Bağlanılıyor...'}</div>
             )}
          </div>

          {/* Benim Kameram (Sağ Altta Küçük veya Yan Yana) */}
          <div style={{ 
            position: 'absolute', bottom: '20px', right: '20px', 
            width: '200px', height: '150px', background: '#0f172a', borderRadius: '12px', 
            overflow: 'hidden', border: '2px solid #38bdf8', boxShadow: '0 0 20px rgba(0,0,0,0.5)'
          }}>
             <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '10px 0' }}>
          {isReceivingCall && !callAccepted ? (
            <>
              <button 
                onClick={onAcceptCall}
                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(16,185,129,0.5)' }}
              >
                Cevapla
              </button>
              <button 
                onClick={onRejectCall}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(239,68,68,0.5)' }}
              >
                Reddet
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={toggleMic}
                style={{ background: isMicMuted ? '#ef4444' : 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', width: '56px', height: '56px', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {isMicMuted ? <MicOff /> : <Mic />}
              </button>
              <button 
                onClick={toggleVideo}
                style={{ background: isVideoMuted ? '#ef4444' : 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', width: '56px', height: '56px', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {isVideoMuted ? <VideoOff /> : <Video />}
              </button>
              <button 
                onClick={endCall}
                style={{ background: '#ef4444', color: '#fff', border: 'none', width: '56px', height: '56px', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 15px rgba(239,68,68,0.5)' }}
              >
                <PhoneOff />
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
