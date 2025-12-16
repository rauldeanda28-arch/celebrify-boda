import React, { useState, useEffect, useRef } from 'react';
import { Camera, Home, User, Trash2, MessageCircle, X, LogOut, Aperture, Heart, Share2, Copy, Video, Lock, Upload, QrCode, Eye, EyeOff, Users, Download, Loader, Image as ImageIcon, Sparkles } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc, serverTimestamp, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import QRCode from "react-qr-code";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDOPQdyUtsIcougnXwhaehhw3fs4gmAWv0",
  authDomain: "celebrify-e5de2.firebaseapp.com",
  projectId: "celebrify-e5de2",
  storageBucket: "celebrify-e5de2.firebasestorage.app",
  messagingSenderId: "486495542360",
  appId: "1:486495542360:web:8507dd9206611ccfa3fe2d"
};

// --- SISTEMA DE SEGURIDAD ---
const MASTER_PIN = "123456";  
const CREATOR_PIN = "777777"; 

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const STORAGE_KEY = 'celebrify_midnight_v1'; 

// --- ESTILOS GLOBALES (INYECCIÓN DE FUENTES) ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
    
    body {
      background-color: #020617; /* Slate 950 */
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
    }
    
    h1, h2, h3, .font-serif {
      font-family: 'Playfair Display', serif;
    }

    .glass-panel {
      background: rgba(30, 41, 59, 0.4);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .glass-card {
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05); 
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2); 
      border-radius: 10px;
    }
  `}</style>
);

// --- UTILIDADES ---
const generateCode = (length) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const normalizeName = (name) => name.trim().toLowerCase().replace(/\s+/g, '');

// --- COMPONENTES ---

// 1. Pantalla de Login / Bienvenida (Diseño Premium)
const LoginScreen = ({ onJoin, userUid }) => {
  const [mode, setMode] = useState('join');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [createEventName, setCreateEventName] = useState('');
  const [createHostName, setCreateHostName] = useState('');
  const [masterPinInput, setMasterPinInput] = useState('');
  const [createdEventData, setCreatedEventData] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) setJoinCode(urlCode.toUpperCase());
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!createEventName || !createHostName || !masterPinInput) return;
    if (masterPinInput !== MASTER_PIN && masterPinInput !== CREATOR_PIN) {
        setError('⛔ Código de autorización inválido.');
        return;
    }
    setLoading(true);
    setError('');
    try {
      const newEventCode = generateCode(6);
      const newAdminPin = Math.floor(1000 + Math.random() * 9000).toString();
      const eventRef = doc(db, 'events', newEventCode);
      await setDoc(eventRef, {
        eventName: createEventName,
        hostName: createHostName,
        adminPin: newAdminPin,
        createdAt: serverTimestamp(),
        code: newEventCode
      });
      const hostId = normalizeName(createHostName);
      await setDoc(doc(db, 'events', newEventCode, 'users', hostId), {
          originalName: createHostName,
          deviceId: userUid,
          role: 'host',
          joinedAt: serverTimestamp()
      });
      setCreatedEventData({ code: newEventCode, pin: newAdminPin, name: createEventName });
      setMode('success_create');
    } catch (err) {
      setError('Error al crear. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (e) => {
    e.preventDefault();
    if (!joinName || !joinCode) return;
    if (isAdminLogin && !adminPinInput) return;
    setLoading(true);
    setError('');
    try {
      const code = joinCode.toUpperCase().trim();
      const eventRef = doc(db, 'events', code);
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) {
        setError('¡Código de evento no existe!');
        setLoading(false);
        return;
      }
      const eventData = eventSnap.data();
      let role = 'guest';
      let isValidAdmin = false;
      if (isAdminLogin) {
        if (adminPinInput === eventData.adminPin || adminPinInput === MASTER_PIN) {
          role = 'host';
          isValidAdmin = true;
        } else {
          setError('PIN incorrecto.');
          setLoading(false);
          return;
        }
      }
      const cleanName = normalizeName(joinName);
      const userRef = doc(db, 'events', code, 'users', cleanName);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.deviceId === userUid) { /* OK */ } 
          else if (isValidAdmin) { await updateDoc(userRef, { deviceId: userUid }); } 
          else { setError(`⚠️ El nombre "${joinName}" ya está en uso.`); setLoading(false); return; }
      } else {
          await setDoc(userRef, { originalName: joinName, deviceId: userUid, role: role, joinedAt: serverTimestamp() });
      }
      onJoin({ name: joinName, role, eventCode: code, eventName: eventData.eventName, adminPin: role === 'host' ? eventData.adminPin : null });
    } catch (err) { setError('Error de conexión.'); } finally { setLoading(false); }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert('¡Copiado!'); };

  if (mode === 'success_create') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#020617] text-white p-6 relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[100px] rounded-full"></div>

        <div className="glass-panel p-8 rounded-3xl w-full max-w-sm text-center relative z-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <Share2 size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">¡Evento Listo!</h2>
          
          <div className="bg-black/40 rounded-xl p-4 mb-4 mt-6 border border-white/5">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Código de Invitados</p>
            <div className="flex items-center justify-between">
              <span className="text-4xl font-mono font-bold text-yellow-400 tracking-wider">{createdEventData.code}</span>
              <button onClick={() => copyToClipboard(createdEventData.code)} className="p-2 hover:bg-white/10 rounded-full transition"><Copy size={20} /></button>
            </div>
          </div>

          <div className="bg-red-500/10 rounded-xl p-4 mb-8 border border-red-500/20">
            <p className="text-[10px] text-red-300 uppercase tracking-widest font-bold mb-2">PIN Admin (Privado)</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-mono font-bold text-white">{createdEventData.pin}</span>
              <button onClick={() => copyToClipboard(createdEventData.pin)} className="p-2 hover:bg-red-500/20 rounded-full transition"><Copy size={16} /></button>
            </div>
          </div>
          <button onClick={() => onJoin({ name: createHostName, role: 'host', eventCode: createdEventData.code, eventName: createEventName, adminPin: createdEventData.pin })} className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-gray-100 transition shadow-lg">Ir al Evento</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#020617] text-white p-6 relative">
      {/* Fondo Ambient */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[10%] left-[20%] w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-purple-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="mb-10 text-center z-10">
        <div className="inline-block p-4 rounded-full bg-gradient-to-tr from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 mb-4 backdrop-blur-md">
           <Aperture size={50} className="text-yellow-400" />
        </div>
        <h1 className="text-5xl font-bold tracking-tighter mb-2 font-serif text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">Clebrify</h1>
        <p className="text-blue-200/80 text-sm tracking-widest uppercase">Tu evento, tu control</p>
      </div>

      <div className="w-full max-w-sm glass-panel rounded-3xl overflow-hidden z-10 shadow-2xl shadow-black/50">
        <div className="flex border-b border-white/5">
          <button onClick={() => setMode('join')} className={`flex-1 py-4 font-bold text-sm tracking-wide transition ${mode === 'join' ? 'bg-white/5 text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}>UNIRSE</button>
          <button onClick={() => setMode('create')} className={`flex-1 py-4 font-bold text-sm tracking-wide transition ${mode === 'create' ? 'bg-white/5 text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}>CREAR</button>
        </div>
        <div className="p-8">
          {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-lg text-center">{error}</div>}
          
          {mode === 'join' ? (
            <form onSubmit={handleJoinEvent} className="space-y-5">
              <div className="space-y-1">
                 <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider ml-1">Código del Evento</label>
                 <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:border-yellow-400/50 focus:outline-none transition text-center font-mono text-lg uppercase tracking-widest" placeholder="AB1234" maxLength={6} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider ml-1">Tu Nombre</label>
                 <input type="text" value={joinName} onChange={(e) => setJoinName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:border-yellow-400/50 focus:outline-none transition" placeholder="Ej. Ana Pérez" />
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                 <div className="relative flex items-center">
                    <input type="checkbox" checked={isAdminLogin} onChange={() => setIsAdminLogin(!isAdminLogin)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-black/30 checked:border-yellow-400 checked:bg-yellow-400 transition-all" />
                    <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-black opacity-0 peer-checked:opacity-100">
                      <Users size={12} />
                    </div>
                 </div>
                 <span className="text-xs text-gray-400">Soy el Anfitrión</span>
              </div>

              {isAdminLogin && (
                <input type="tel" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value)} className="w-full bg-yellow-900/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-200 placeholder-yellow-800/50 text-center tracking-widest" placeholder="PIN ADMIN" maxLength={6} />
              )}

              <button disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-blue-900/40 transition transform active:scale-[0.98]">
                {loading ? <Loader className="animate-spin mx-auto" /> : 'Entrar a la Fiesta'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateEvent} className="space-y-5">
              <input type="text" value={createEventName} onChange={(e) => setCreateEventName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-purple-400/50 focus:outline-none transition" placeholder="Nombre del Evento" />
              <input type="text" value={createHostName} onChange={(e) => setCreateHostName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-purple-400/50 focus:outline-none transition" placeholder="Tu Nombre" />
              <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                <label className="text-[10px] uppercase font-bold text-red-300/70 mb-2 block flex items-center gap-1"><Lock size={10} /> Clave de Licencia</label>
                <input type="password" value={masterPinInput} onChange={(e) => setMasterPinInput(e.target.value)} className="w-full bg-black/50 border border-red-500/20 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-red-500/50 transition" placeholder="Código Autorizado" />
              </div>
              <button disabled={loading} className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold py-4 rounded-xl mt-2 shadow-lg shadow-yellow-900/20 transition transform active:scale-[0.98]">
                 {loading ? <Loader className="animate-spin mx-auto text-black" /> : 'Crear Evento'}
              </button>
            </form>
          )}
        </div>
      </div>
      <p className="absolute bottom-6 text-[10px] text-gray-600 uppercase tracking-widest">Powered by Clebrify</p>
    </div>
  );
};

// 2. Componente de Cámara (Diseño Premium)
const CameraView = ({ onClose, onUpload }) => {
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const canvasRef = useRef(null);

  const processAndUpload = (source, isVideo) => {
    if (isVideo) { onUpload(source); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const MAX_WIDTH = 1080; // Mejor calidad
    let width = source.width;
    let height = source.height;
    if (width > MAX_WIDTH) { height = height * (MAX_WIDTH / width); width = MAX_WIDTH; }
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0, width, height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85); // Mejor calidad JPG
    onUpload(imageDataUrl);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('video/') && file.size > 25000000) { alert("⚠️ El video es muy pesado. Intenta uno más corto."); return; }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (file.type.startsWith('video/')) { processAndUpload(event.target.result, true); } 
        else { const img = new Image(); img.onload = () => processAndUpload(img, false); img.src = event.target.result; }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617] z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
       <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>
       <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition backdrop-blur-md z-10"><X size={24} /></button>
       
       <div className="w-full max-w-sm text-center space-y-8 relative z-10">
          <div className="flex justify-center mb-6">
             <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.5)] animate-pulse">
                <Camera size={48} className="text-white" />
             </div>
          </div>
          <div>
            <h2 className="text-white text-3xl font-serif font-bold mb-2">Nuevo Recuerdo</h2>
            <p className="text-blue-200/60 text-sm tracking-wide">Captura el momento para siempre</p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
            <button onClick={() => cameraInputRef.current.click()} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white p-6 rounded-3xl flex flex-col items-center gap-3 transition active:scale-95 group">
                <Camera size={32} className="text-blue-400 group-hover:scale-110 transition" />
                <span className="font-bold text-sm">Cámara</span>
            </button>
            <button onClick={() => videoInputRef.current.click()} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white p-6 rounded-3xl flex flex-col items-center gap-3 transition active:scale-95 group">
                <Video size={32} className="text-red-400 group-hover:scale-110 transition" />
                <span className="font-bold text-sm">Video</span>
            </button>
            <button onClick={() => galleryInputRef.current.click()} className="col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 text-gray-300 py-5 rounded-2xl flex items-center justify-center gap-3 text-base hover:text-white active:scale-95 transition shadow-lg">
                <Upload size={20} /> Subir desde Galería
            </button>
          </div>
       </div>
       <canvas ref={canvasRef} className="hidden" />
       <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
       <input ref={videoInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={handleFileSelect} />
       <input ref={galleryInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};

// 3. Tarjeta de Foto (Diseño Dark/Glass)
const PostCard = ({ post, currentUser, currentUserId, onDeletePost, onAddComment, onDeleteComment, onToggleLike }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const handleSubmitComment = (e) => { e.preventDefault(); if (!commentText.trim()) return; onAddComment(post.id, commentText); setCommentText(''); setShowComments(true); };
  const isLiked = post.likes && post.likes.includes(currentUserId);
  const isVideo = post.imageUrl && post.imageUrl.startsWith('data:video');

  return (
    <div className="glass-card mb-6 rounded-3xl overflow-hidden shadow-lg animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between p-4 bg-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-black flex items-center justify-center font-bold text-xs shadow-md">
            {post.userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-bold text-gray-200">{post.userName}</span>
        </div>
        {currentUser.role === 'host' && (
          <button onClick={() => onDeletePost(post.id)} className="text-gray-500 hover:text-red-400 p-2 transition"><Trash2 size={16} /></button>
        )}
      </div>
      
      <div className="w-full bg-black relative">
        {isVideo ? ( <video controls className="w-full h-auto max-h-[600px]" src={post.imageUrl} /> ) : ( <img src={post.imageUrl} alt="Momento" className="w-full h-auto object-cover" /> )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-5 mb-4">
          <button onClick={() => onToggleLike(post.id, isLiked)} className={`transition transform active:scale-125 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
            <Heart size={28} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button onClick={() => setShowComments(!showComments)} className="text-gray-400 hover:text-white transition">
            <MessageCircle size={28} />
          </button>
        </div>
        {(post.likes?.length > 0) && <p className="text-sm font-bold text-white mb-2">{post.likes.length} Me gusta</p>}
        
        <div className="space-y-2 mb-3">
          {(post.comments || []).slice(showComments ? 0 : -2).map((comment, idx) => (
            <div key={idx} className="text-sm flex justify-between group">
              <span>
                <span className="font-bold mr-2 text-yellow-500/80">{comment.userName}</span>
                <span className="text-gray-300">{comment.text}</span>
              </span>
              {currentUser.role === 'host' && <button onClick={() => onDeleteComment(post.id, comment)} className="text-gray-600 hover:text-red-500"><X size={12} /></button>}
            </div>
          ))}
          {!showComments && (post.comments || []).length > 2 && <button onClick={() => setShowComments(true)} className="text-gray-500 text-xs">Ver los {(post.comments || []).length} comentarios</button>}
        </div>

        <form onSubmit={handleSubmitComment} className="flex items-center pt-3 border-t border-white/5">
          <input type="text" placeholder="Añadir un comentario..." className="flex-1 text-sm bg-transparent outline-none text-white placeholder-gray-600" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
          <button type="submit" disabled={!commentText.trim()} className="text-blue-400 font-bold text-sm ml-2 disabled:opacity-30 hover:text-blue-300 transition">Publicar</button>
        </form>
      </div>
    </div>
  );
};

// 4. Perfil (Diseño Dark/Glass)
const ProfileView = ({ user, onLogout, posts, usersList }) => {
  const [showPin, setShowPin] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const appUrl = typeof window !== 'undefined' ? `${window.location.origin}?code=${user.eventCode}` : '';
  const copyCode = () => { navigator.clipboard.writeText(user.eventCode); alert("¡Código copiado!"); };

  const handleDownloadAll = async () => {
    if (posts.length === 0) { alert("No hay fotos."); return; }
    setIsDownloading(true);
    try {
        const zip = new JSZip(); const folder = zip.folder(`celebrify_${user.eventCode}`);
        posts.forEach((post, index) => {
            if (!post.imageUrl) return;
            const isVideo = post.imageUrl.startsWith('data:video'); const ext = isVideo ? 'mp4' : 'jpg'; const base64Data = post.imageUrl.split(',')[1];
            if (base64Data) folder.file(`momento_${index + 1}_${post.userName}.${ext}`, base64Data, {base64: true});
        });
        const content = await zip.generateAsync({type: "blob"}); saveAs(content, `celebrify_${user.eventCode}_album.zip`);
    } catch (e) { alert("Error al comprimir."); } finally { setIsDownloading(false); }
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] p-6 overflow-y-auto pb-32">
       {/* Modal QR */}
       {showQRModal && (
         <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in">
            <button onClick={() => setShowQRModal(false)} className="absolute top-6 right-6 text-white p-3 bg-white/10 rounded-full"><X size={24}/></button>
            <div className="bg-white p-8 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)] flex flex-col items-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Escanea para unirte</h3>
                <div className="border-2 border-gray-100 rounded-xl overflow-hidden">
                    <QRCode value={appUrl} size={256} />
                </div>
                <p className="mt-6 text-3xl font-mono font-bold text-slate-900 tracking-[0.2em]">{user.eventCode}</p>
            </div>
         </div>
       )}

       <div className="mb-10 mt-6 text-center">
         <div className="w-28 h-28 bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 text-white rounded-full flex items-center justify-center text-5xl font-serif font-bold mx-auto mb-4 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
           {user.name.charAt(0).toUpperCase()}
         </div>
         <h2 className="text-3xl font-bold text-white font-serif">{user.name}</h2>
         <div className="flex justify-center mt-3">
            <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'host' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                {user.role === 'host' ? 'Anfitrión' : 'Invitado'}
            </span>
         </div>
       </div>

       <div className="glass-panel rounded-3xl p-6 mb-6">
         <div className="flex items-center gap-2 mb-4">
            <QrCode size={18} className="text-purple-400"/>
            <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Invitar amigos</p>
         </div>
         <div className="flex gap-3">
            <div onClick={copyCode} className="flex-1 bg-black/30 border border-white/10 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-white/5 transition group">
                <span className="text-3xl font-mono font-bold text-white tracking-widest group-hover:text-yellow-400 transition">{user.eventCode}</span>
                <Copy size={20} className="text-gray-500 group-hover:text-white" />
            </div>
            <button onClick={() => setShowQRModal(true)} className="bg-white text-black p-4 rounded-xl flex items-center justify-center hover:bg-gray-200 transition shadow-lg shadow-white/10">
                <QrCode size={28} />
            </button>
         </div>
       </div>

       <div className="glass-panel rounded-3xl p-6 mb-6">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-400"/>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Lista de Invitados ({usersList.length})</p>
            </div>
         </div>
         <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {usersList.map((u, i) => {
                const postCount = posts.filter(p => p.userId === u.deviceId).length;
                return (
                    <div key={i} className="flex items-center justify-between text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {u.originalName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{u.originalName} {u.role === 'host' && '👑'}</span>
                        </div>
                        {user.role === 'host' && postCount > 0 && (
                            <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-lg border border-green-500/30">
                                <ImageIcon size={10} className="text-green-400"/>
                                <span className="text-xs font-bold text-green-300">{postCount}</span>
                            </div>
                        )}
                    </div>
                );
            })}
         </div>
       </div>

       {user.role === 'host' && (
         <>
             <button onClick={handleDownloadAll} disabled={isDownloading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mb-6 shadow-lg shadow-emerald-900/40 active:scale-95 transition disabled:opacity-50">
                {isDownloading ? <><Loader size={20} className="animate-spin" /> Preparando...</> : <><Download size={20} /> Descargar Álbum (.zip)</>}
             </button>
             {user.adminPin && (
                <div className="bg-amber-900/10 rounded-2xl p-6 border border-amber-500/20 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock size={18} className="text-amber-500"/>
                        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Tu PIN Maestro</p>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl flex justify-between items-center border border-amber-500/10">
                        <span className="text-xl font-mono font-bold text-amber-100 tracking-[0.3em]">{showPin ? user.adminPin : '••••'}</span>
                        <button onClick={() => setShowPin(!showPin)} className="text-amber-500/50 hover:text-amber-400">{showPin ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                    </div>
                </div>
             )}
         </>
       )}

       <div className="mt-6 mb-10">
         <button onClick={onLogout} className="w-full bg-white/5 border border-red-500/20 text-red-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/10 transition">
           <LogOut size={20} /> Cerrar Sesión
         </button>
         <div className="text-center mt-6 opacity-40">
            <Aperture size={20} className="mx-auto mb-2" />
            <p className="text-[10px] uppercase tracking-widest">Clebrify Midnight v1.0</p>
         </div>
       </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  const [peopleCount, setPeopleCount] = useState(0); 
  const [view, setView] = useState('feed'); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    signInAnonymously(auth).catch(e => console.error(e));
    const unsubscribe = onAuthStateChanged(auth, (user) => { setFirebaseUser(user); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser || !currentUser) return;
    const postsRef = collection(db, 'events', currentUser.eventCode, 'posts');
    const qPosts = query(postsRef);
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setPosts(data);
    });
    const usersRef = collection(db, 'events', currentUser.eventCode, 'users');
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
       const users = snapshot.docs.map(doc => doc.data());
       setUsersList(users); setPeopleCount(snapshot.size); 
    });
    return () => { unsubPosts(); unsubUsers(); };
  }, [firebaseUser, currentUser]);

  const handleLogin = (userData) => { setCurrentUser(userData); localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); };
  
  const handleLogout = () => { if (confirm("¿Cerrar sesión?")) { setCurrentUser(null); localStorage.removeItem(STORAGE_KEY); setView('feed'); } };
  
  const handleUpload = async (fileDataUrl) => {
    if (!firebaseUser || !currentUser) return;
    setView('feed');
    try {
      await addDoc(collection(db, 'events', currentUser.eventCode, 'posts'), {
        userId: firebaseUser.uid, userName: currentUser.name, userRole: currentUser.role, imageUrl: fileDataUrl, timestamp: serverTimestamp(), comments: [], likes: []
      });
    } catch (e) { alert("Error subiendo."); }
  };

  const handleAddComment = async (postId, text) => { if (!firebaseUser) return; try { const postRef = doc(db, 'events', currentUser.eventCode, 'posts', postId); await updateDoc(postRef, { comments: arrayUnion({ text, userName: currentUser.name, userId: firebaseUser.uid, timestamp: Date.now() }) }); } catch (e) {} };
  const handleDeletePost = async (postId) => { if (currentUser.role !== 'host') return; if (confirm("¿Borrar?")) { await deleteDoc(doc(db, 'events', currentUser.eventCode, 'posts', postId)); } };
  const handleDeleteComment = async (postId, commentToDelete) => { if (currentUser.role !== 'host') return; try { const postRef = doc(db, 'events', currentUser.eventCode, 'posts', postId); const post = posts.find(p => p.id === postId); if (!post) return; const newComments = post.comments.filter(c => c.timestamp !== commentToDelete.timestamp); await updateDoc(postRef, { comments: newComments }); } catch (e) {} };
  const handleToggleLike = async (postId, isLiked) => { if (!firebaseUser) return; const postRef = doc(db, 'events', currentUser.eventCode, 'posts', postId); if (isLiked) { await updateDoc(postRef, { likes: arrayUnion(firebaseUser.uid) }); const post = posts.find(p => p.id === postId); const newLikes = (post.likes || []).filter(uid => uid !== firebaseUser.uid); await updateDoc(postRef, { likes: newLikes }); } else { await updateDoc(postRef, { likes: arrayUnion(firebaseUser.uid) }); } };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#020617] text-white"><Loader className="animate-spin text-blue-500" size={40} /></div>;
  if (!currentUser) return ( <> <GlobalStyles /> <LoginScreen onJoin={handleLogin} userUid={firebaseUser?.uid} /> </> );

  return (
    <>
    <GlobalStyles />
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#020617] shadow-2xl relative overflow-hidden">
      {view === 'camera' ? (
        <CameraView onClose={() => setView('feed')} onUpload={handleUpload} />
      ) : view === 'profile' ? (
        <>
           <header className="bg-[#020617]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 sticky top-0 z-20 flex items-center">
             <button onClick={() => setView('feed')} className="mr-4 text-gray-400 hover:text-white transition"><X size={24}/></button>
             <h1 className="text-xl font-bold text-white font-serif">Mi Perfil</h1>
           </header>
           <ProfileView user={currentUser} onLogout={handleLogout} posts={posts} usersList={usersList} />
        </>
      ) : (
        <>
          <header className="bg-[#020617]/80 backdrop-blur-md border-b border-white/5 px-5 py-4 flex justify-between items-center sticky top-0 z-20">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 flex items-center font-serif">
                Clebrify <span className="ml-3 text-[10px] bg-white/10 border border-white/10 text-gray-300 px-2 py-0.5 rounded-md font-mono tracking-widest">{currentUser.eventCode}</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                  <Users size={12} className="text-blue-400"/>
                  <span className="text-xs font-bold text-gray-300">{peopleCount}</span>
               </div>
               {currentUser.role === 'host' && <div className="bg-yellow-500/20 border border-yellow-500/30 p-1.5 rounded-full"><Sparkles size={12} className="text-yellow-400"/></div>}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-24 p-4 custom-scrollbar">
            {posts.length === 0 ? (
              <div className="text-center mt-32 px-6 opacity-60">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <Camera size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-serif text-white mb-2">Sin recuerdos aún</h3>
                <p className="text-gray-400 text-sm">Sé el primero en capturar la magia.</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} currentUser={currentUser} currentUserId={firebaseUser?.uid} onDeletePost={handleDeletePost} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} onToggleLike={handleToggleLike} />
              ))
            )}
          </main>
        </>
      )}

      {/* DOCK FLOTANTE DE NAVEGACIÓN */}
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[350px] bg-white/10 backdrop-blur-xl border border-white/10 rounded-full h-16 flex justify-around items-center z-30 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <button onClick={() => setView('feed')} className={`p-3 rounded-full transition duration-300 ${view === 'feed' ? 'bg-white/10 text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)]' : 'text-gray-400 hover:text-white'}`}>
          <Home size={24} />
        </button>
        
        <button onClick={() => setView('camera')} className="relative -top-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-[0_10px_20px_rgba(79,70,229,0.4)] border-4 border-[#020617] transform transition hover:scale-110 active:scale-95">
          <Camera size={28} />
        </button>
        
        <button onClick={() => setView('profile')} className={`p-3 rounded-full transition duration-300 ${view === 'profile' ? 'bg-white/10 text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)]' : 'text-gray-400 hover:text-white'}`}>
          <User size={24} />
        </button>
      </nav>
    </div>
    </>
  );
  
}