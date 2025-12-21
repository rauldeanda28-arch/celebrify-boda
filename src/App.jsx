import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Home, User, Trash2, MessageCircle, X, LogOut, Aperture, 
  Heart, Share2, Copy, Video, Lock, Upload, QrCode, Eye, EyeOff, 
  Users, Download, Loader, Image as ImageIcon, Sparkles, Snowflake, Gift 
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, 
  doc, serverTimestamp, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
// 👇 NUEVO: Importamos las funciones de Storage
import { getStorage, ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import QRCode from "react-qr-code";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDOPQdyUtsIcougnXwhaehhw3fs4gmAWv0",
  authDomain: "celebrify-e5de2.firebaseapp.com",
  projectId: "celebrify-e5de2",
  storageBucket: "celebrify-e5de2.firebasestorage.app", // ✅ Ahora sí se usará esto
  messagingSenderId: "486495542360",
  appId: "1:486495542360:web:8507dd9206611ccfa3fe2d"
};

// --- SEGURIDAD ---
const MASTER_PIN = "123456";  
const CREATOR_PIN = "777777"; 
const STORAGE_KEY = 'celebrify_christmas_final_v4_2'; // Subí versión para limpiar caché vieja

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // 👇 Inicializamos Storage

// --- ESTILOS GLOBALES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
    
    body {
      background-color: #051F15; 
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      overflow: hidden; 
    }
    
    h1, h2, h3, .font-serif {
      font-family: 'Playfair Display', serif;
    }

    .glass-panel {
      background: rgba(20, 50, 40, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 215, 0, 0.15); 
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .glass-card {
      background: rgba(10, 30, 20, 0.85);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(220, 38, 38, 0.5); border-radius: 10px; }
    
    @keyframes snowfall {
      0% { transform: translateY(-10vh) translateX(0); opacity: 1; }
      100% { transform: translateY(100vh) translateX(20px); opacity: 0.3; }
    }
    .snowflake {
      position: absolute;
      top: -10px;
      color: white;
      animation: snowfall 10s linear infinite;
      pointer-events: none;
      z-index: 1;
    }
  `}</style>
);

// --- UTILIDADES ---
const generateCode = (length) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); }
  return result;
};

const normalizeName = (name) => name.trim().toLowerCase().replace(/\s+/g, '');

const SnowOverlay = () => {
  const flakes = Array.from({ length: 20 }); 
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {flakes.map((_, i) => (
        <div key={i} className="snowflake opacity-50" style={{ left: `${Math.random() * 100}%`, animationDuration: `${5 + Math.random() * 10}s`, animationDelay: `${Math.random() * 5}s`, fontSize: `${10 + Math.random() * 20}px` }}>❄</div>
      ))}
    </div>
  );
};

// --- COMPONENTES ---

const LoginScreen = ({ onJoin, userUid }) => {
  const [mode, setMode] = useState('join');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados Formulario Unirse
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  
  // Estados Formulario Crear
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
    if (masterPinInput !== MASTER_PIN && masterPinInput !== CREATOR_PIN) { setError('⛔ Código inválido.'); return; }
    
    setLoading(true); setError('');
    try {
      const newEventCode = generateCode(6);
      const newAdminPin = Math.floor(1000 + Math.random() * 9000).toString();
      const eventRef = doc(db, 'events', newEventCode);
      
      await setDoc(eventRef, { eventName: createEventName, hostName: createHostName, adminPin: newAdminPin, createdAt: serverTimestamp(), code: newEventCode, theme: 'christmas' });
      
      const hostId = normalizeName(createHostName);
      await setDoc(doc(db, 'events', newEventCode, 'users', hostId), { originalName: createHostName, deviceId: userUid, role: 'host', joinedAt: serverTimestamp() });
      
      setCreatedEventData({ code: newEventCode, pin: newAdminPin, name: createEventName });
      setMode('success_create');
    } catch (err) { setError('Error al crear.'); } finally { setLoading(false); }
  };

  const handleJoinEvent = async (e) => {
    e.preventDefault();
    if (!joinName || !joinCode) return;
    if (isAdminLogin && !adminPinInput) return;
    
    setLoading(true); setError('');
    try {
      const code = joinCode.toUpperCase().trim();
      const eventRef = doc(db, 'events', code);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) { setError('¡Código no existe!'); setLoading(false); return; }
      
      const eventData = eventSnap.data();
      let role = 'guest';
      let isValidAdmin = false;
      
      if (isAdminLogin) {
        if (adminPinInput === eventData.adminPin || adminPinInput === MASTER_PIN) { role = 'host'; isValidAdmin = true; } 
        else { setError('PIN incorrecto.'); setLoading(false); return; }
      }
      
      const cleanName = normalizeName(joinName);
      const userRef = doc(db, 'events', code, 'users', cleanName);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.deviceId === userUid) { /* OK */ } 
          else if (isValidAdmin) { await updateDoc(userRef, { deviceId: userUid }); } 
          else { setError(`⚠️ "${joinName}" ya está en uso.`); setLoading(false); return; }
      } else { 
        await setDoc(userRef, { originalName: joinName, deviceId: userUid, role: role, joinedAt: serverTimestamp() }); 
      }
      onJoin({ name: joinName, role, eventCode: code, eventName: eventData.eventName, adminPin: role === 'host' ? eventData.adminPin : null });
    } catch (err) { setError('Error de conexión.'); } finally { setLoading(false); }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert('¡Copiado!'); };

  if (mode === 'success_create') {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-[#051F15] text-white p-6 relative overflow-hidden">
        <SnowOverlay />
        <div className="glass-panel p-8 rounded-3xl w-full max-w-sm text-center relative z-10 border border-yellow-500/30">
          <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"><Gift size={32} className="text-white" /></div>
          <h2 className="text-3xl font-serif font-bold mb-6 text-yellow-400">¡Fiesta Lista!</h2>
          <div className="bg-black/40 rounded-xl p-4 mb-4 border border-white/5">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Código de Invitados</p>
            <div className="flex items-center justify-between">
              <span className="text-4xl font-mono font-bold text-red-400 tracking-wider">{createdEventData.code}</span>
              <button onClick={() => copyToClipboard(createdEventData.code)} className="p-2 hover:bg-white/10 rounded-full"><Copy size={20} /></button>
            </div>
          </div>
          <div className="bg-red-900/20 rounded-xl p-4 mb-8 border border-red-500/20">
            <p className="text-[10px] text-red-300 uppercase font-bold mb-2">PIN Admin (Privado)</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-mono font-bold text-white">{createdEventData.pin}</span>
              <button onClick={() => copyToClipboard(createdEventData.pin)} className="p-2 hover:bg-red-500/20 rounded-full"><Copy size={16} /></button>
            </div>
          </div>
          <button onClick={() => onJoin({ name: createHostName, role: 'host', eventCode: createdEventData.code, eventName: createEventName, adminPin: createdEventData.pin })} className="w-full bg-white text-green-900 font-bold py-4 rounded-xl shadow-lg">Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-[#051F15] text-white p-6 relative">
      <SnowOverlay />
      <div className="mb-10 text-center z-10">
        <div className="inline-block p-4 rounded-full bg-white/5 border border-yellow-400/30 mb-4"><Snowflake size={50} className="text-yellow-400" /></div>
        <h1 className="text-5xl font-bold tracking-tighter mb-2 font-serif text-white">Clebrify</h1>
        <p className="text-red-200/60 text-[10px] tracking-[0.3em] uppercase mt-2">Captura la magia</p>
      </div>
      <div className="w-full max-w-sm glass-panel rounded-3xl overflow-hidden z-10 shadow-2xl">
        <div className="flex border-b border-white/5">
          <button onClick={() => setMode('join')} className={`flex-1 py-4 font-bold text-sm tracking-wide ${mode === 'join' ? 'bg-white/5 text-yellow-400' : 'text-gray-400'}`}>UNIRSE</button>
          <button onClick={() => setMode('create')} className={`flex-1 py-4 font-bold text-sm tracking-wide ${mode === 'create' ? 'bg-white/5 text-yellow-400' : 'text-gray-400'}`}>CREAR</button>
        </div>
        <div className="p-8">
          {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-lg text-center">{error}</div>}
          {mode === 'join' ? (
            <form onSubmit={handleJoinEvent} className="space-y-5">
              <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white text-center font-mono text-lg tracking-widest uppercase placeholder-gray-600" placeholder="CÓDIGO" maxLength={6} />
              <input type="text" value={joinName} onChange={(e) => setJoinName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600" placeholder="Tu Nombre" />
              <div className="flex items-center gap-3 pt-2">
                 <input type="checkbox" checked={isAdminLogin} onChange={() => setIsAdminLogin(!isAdminLogin)} className="h-5 w-5 accent-yellow-400 bg-black/30" />
                 <span className="text-xs text-gray-400">Soy el Anfitrión</span>
              </div>
              {isAdminLogin && <input type="tel" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value)} className="w-full bg-yellow-900/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-200 text-center tracking-widest" placeholder="PIN ADMIN" maxLength={6} />}
              <button disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-4 rounded-xl mt-4 shadow-lg">
                {loading ? <Loader className="animate-spin mx-auto" /> : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateEvent} className="space-y-5">
              <input type="text" value={createEventName} onChange={(e) => setCreateEventName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white" placeholder="Nombre del Evento" />
              <input type="text" value={createHostName} onChange={(e) => setCreateHostName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white" placeholder="Tu Nombre" />
              <input type="password" value={masterPinInput} onChange={(e) => setMasterPinInput(e.target.value)} className="w-full bg-black/30 border border-red-500/20 rounded-xl px-4 py-4 text-white" placeholder="Clave de Licencia" />
              <button disabled={loading} className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold py-4 rounded-xl mt-2 shadow-lg">
                 {loading ? <Loader className="animate-spin mx-auto text-black" /> : 'Crear Evento'}
              </button>
            </form>
          )}
        </div>
      </div>
      
      {/* FOOTER DE CONTACTO EN LOGIN */}
      <div className="absolute bottom-8 z-10 text-center">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
          Powered by Celebrify
        </p>
        <a 
          href="mailto:contacto@clebrify.com" 
          className="text-xs text-white/40 font-medium hover:text-white transition-colors border-b border-transparent hover:border-white/40 pb-0.5"
        >
          contacto@clebrify.com
        </a>
      </div>
      
    </div>
  );
};

// --- COMPONENTE CÁMARA MEJORADO PARA VIDEOS ---
const CameraView = ({ onClose, onUpload }) => {
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Procesa imágenes para comprimirlas un poco
  const processImage = (source) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const MAX_WIDTH = 1080;
    let width = source.width; let height = source.height;
    if (width > MAX_WIDTH) { height = height * (MAX_WIDTH / width); width = MAX_WIDTH; }
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(source, 0, 0, width, height);
    // Devuelve string base64
    onUpload({ type: 'image', data: canvas.toDataURL('image/jpeg', 0.85) });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 👇 AUMENTÉ LÍMITE A 100MB Y PASO EL ARCHIVO DIRECTO
      if (file.type.startsWith('video/')) {
        if (file.size > 100000000) { alert("⚠️ Video muy pesado (Max 100MB)."); return; }
        // Para video, pasamos el objeto File directo (no base64) para ahorrar memoria
        onUpload({ type: 'video', data: file });
      } else {
        // Para imagen, usamos FileReader para dibujarla en Canvas y redimensionar
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image(); 
          img.onload = () => processImage(img); 
          img.src = event.target.result; 
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#051F15] z-50 flex flex-col items-center justify-center p-6 animate-in fade-in">
       <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white z-10"><X size={24} /></button>
       <div className="w-full max-w-sm text-center space-y-6 relative z-10">
          <div className="flex justify-center mb-4"><div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/50 animate-pulse"><Camera size={40} className="text-white" /></div></div>
          <h2 className="text-white text-3xl font-serif font-bold">Capturar</h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => cameraInputRef.current.click()} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/10"><Camera size={32} className="text-red-400" /><span className="text-sm font-bold">Foto</span></button>
            <button onClick={() => videoInputRef.current.click()} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/10"><Video size={32} className="text-green-400" /><span className="text-sm font-bold">Video</span></button>
            <button onClick={() => galleryInputRef.current.click()} className="col-span-2 bg-slate-800 p-4 rounded-xl flex items-center justify-center gap-2"><Upload size={20} /> Galería</button>
          </div>
       </div>
       <canvas ref={canvasRef} className="hidden" />
       <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
       <input ref={videoInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={handleFileSelect} />
       <input ref={galleryInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};

const PostCard = ({ post, currentUser, currentUserId, onDeletePost, onAddComment, onDeleteComment, onToggleLike }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const handleSubmitComment = (e) => { e.preventDefault(); if (!commentText.trim()) return; onAddComment(post.id, commentText); setCommentText(''); setShowComments(true); };
  const isLiked = post.likes && post.likes.includes(currentUserId);
  
  // Detecta si es video revisando si el URL contiene tokens de firebase storage o data:video
  // O simplemente si el tipo de archivo se guardó como video (opcional), pero por URL suele bastar
  const isVideo = post.imageUrl?.includes('firebasestorage') ? post.imageUrl.includes('video') || post.contentType?.startsWith('video') : post.imageUrl?.startsWith('data:video');

  // Helper para saber si es video basado en extensión o contenido (simple check)
  const looksLikeVideo = (url) => {
     return url?.includes('.mp4') || url?.includes('video') || url?.startsWith('data:video');
  }

  return (
    <div className="glass-card mb-8 rounded-3xl overflow-hidden shadow-xl border border-white/5">
      <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center font-bold text-xs shadow-inner border border-white/10">
            {post.userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-bold text-gray-100">{post.userName}</span>
        </div>
        {currentUser.role === 'host' && (
          <button onClick={() => onDeletePost(post.id)} className="text-gray-500 hover:text-red-400 p-2"><Trash2 size={18} /></button>
        )}
      </div>
      
      <div className="w-full bg-black/50">
        {looksLikeVideo(post.imageUrl) ? ( 
             <video controls playsInline className="w-full h-auto max-h-[500px]" src={post.imageUrl} /> 
        ) : ( 
             <img src={post.imageUrl} alt="Momento" className="w-full h-auto object-cover" /> 
        )}
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-6">
          <button onClick={() => onToggleLike(post.id, isLiked)} className={`transition active:scale-90 ${isLiked ? 'text-red-500' : 'text-gray-300'}`}>
            <Heart size={26} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button onClick={() => setShowComments(!showComments)} className="text-gray-300">
            <MessageCircle size={26} />
          </button>
        </div>
        
        {post.likes?.length > 0 && <p className="text-sm font-bold text-white">{post.likes.length} Me gusta</p>}
        
        <div className="flex flex-col gap-2">
          {(post.comments || []).slice(showComments ? 0 : -2).map((comment, idx) => (
            <div key={idx} className="text-sm flex justify-between items-start">
              <span><span className="font-bold mr-2 text-yellow-500">{comment.userName}</span><span className="text-gray-300">{comment.text}</span></span>
              {currentUser.role === 'host' && <button onClick={() => onDeleteComment(post.id, comment)} className="text-gray-600"><X size={12} /></button>}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmitComment} className="flex items-center gap-2 pt-2 border-t border-white/10 mt-1">
          <input type="text" placeholder="Comentar..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500 py-2" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
          <button type="submit" disabled={!commentText.trim()} className="text-yellow-500 font-bold text-sm disabled:opacity-30">Enviar</button>
        </form>
      </div>
    </div>
  );
};

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
      const zip = new JSZip(); 
      const folder = zip.folder(`celebrify_${user.eventCode}`); 
      
      // Promesas para descargar cada archivo
      const downloadPromises = posts.map(async (post, index) => {
          if (!post.imageUrl) return;
          
          try {
             // Si es URL de Storage, necesitamos hacer fetch
             let data;
             let ext = 'jpg';

             if (post.imageUrl.startsWith('http')) {
                 const response = await fetch(post.imageUrl);
                 const blob = await response.blob();
                 data = blob;
                 if (post.imageUrl.includes('video') || post.imageUrl.includes('.mp4')) ext = 'mp4';
             } else {
                 // Es base64 antigua
                 const isVideo = post.imageUrl.startsWith('data:video');
                 ext = isVideo ? 'mp4' : 'jpg';
                 data = post.imageUrl.split(',')[1];
             }

             const filename = `momento_${index + 1}_${post.userName}.${ext}`;
             if (post.imageUrl.startsWith('http')) {
                 folder.file(filename, data);
             } else {
                 folder.file(filename, data, {base64: true});
             }
          } catch (err) {
              console.error("Error descargando uno:", err);
          }
      });

      await Promise.all(downloadPromises);

      const content = await zip.generateAsync({type: "blob"}); 
      saveAs(content, `celebrify_${user.eventCode}_album.zip`); 
    } catch (e) { alert("Error al generar ZIP."); console.error(e); } finally { setIsDownloading(false); } 
  };

  return (
    // Espacio inferior (pb-44) aumentado para que no se oculte tras el dock
    <div className="flex flex-col h-full p-6 overflow-y-auto pb-44 relative z-10">
       <SnowOverlay />
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

       <div className="mb-10 mt-6 text-center z-10">
         <div className="w-28 h-28 bg-gradient-to-br from-red-700 to-red-900 border-2 border-yellow-400/30 text-white rounded-full flex items-center justify-center text-5xl font-serif font-bold mx-auto mb-4 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
           {user.name.charAt(0).toUpperCase()}
         </div>
         <h2 className="text-3xl font-bold text-white font-serif">{user.name}</h2>
         <div className="flex justify-center mt-3">
            <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'host' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-white/10 text-gray-300 border border-white/20'}`}>
                {user.role === 'host' ? 'Anfitrión' : 'Invitado'}
            </span>
         </div>
       </div>

       <div className="glass-panel rounded-3xl p-6 mb-6 z-10">
         <div className="flex items-center gap-2 mb-4">
            <QrCode size={18} className="text-yellow-400"/>
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Invitar amigos</p>
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

       <div className="glass-panel rounded-3xl p-6 mb-6 z-10">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Users size={18} className="text-green-400"/>
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest">Lista de Invitados ({usersList.length})</p>
            </div>
         </div>
         <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {usersList.map((u, i) => {
                const postCount = posts.filter(p => p.userId === u.deviceId).length;
                return (
                    <div key={i} className="flex items-center justify-between text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {u.originalName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{u.originalName} {u.role === 'host' && '👑'}</span>
                        </div>
                        {postCount > 0 && (
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
         <div className="z-10 relative">
             <button onClick={handleDownloadAll} disabled={isDownloading} className="w-full bg-green-900/40 border border-green-500/30 text-green-300 font-bold py-4 rounded-xl flex items-center justify-center gap-2 mb-4">{isDownloading ? 'Descargando...' : 'Descargar Álbum'}</button>
             {user.adminPin && (
                <div className="bg-red-900/20 rounded-2xl p-6 border border-red-500/20 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock size={18} className="text-red-400"/>
                        <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Tu PIN Maestro</p>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl flex justify-between items-center border border-red-500/10">
                        <span className="text-xl font-mono font-bold text-red-100 tracking-[0.3em]">{showPin ? user.adminPin : '••••'}</span>
                        <button onClick={() => setShowPin(!showPin)} className="text-red-500/50 hover:text-red-400">{showPin ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                    </div>
                </div>
             )}
         </div>
       )}

       <div className="mt-6 mb-10 z-10 relative">
         <button onClick={onLogout} className="w-full bg-white/5 border border-red-500/20 text-red-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/10 transition relative z-10">
           <LogOut size={20} /> Cerrar Sesión
         </button>
         
         {/* --- FOOTER DE CONTACTO EN PERFIL --- */}
         <div className="text-center mt-6 opacity-40">
            <Aperture size={20} className="mx-auto mb-2" />
            <p className="text-[10px] uppercase tracking-widest mb-1">Clebrify Holiday v1.0</p>
            <a 
              href="mailto:contacto@clebrify.com" 
              className="text-xs text-white/40 font-medium hover:text-white transition-colors border-b border-transparent hover:border-white/40 pb-0.5"
            >
              contacto@clebrify.com
            </a>
         </div>
       </div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : null; });
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  const [peopleCount, setPeopleCount] = useState(0); 
  const [view, setView] = useState('feed'); 
  const [loading, setLoading] = useState(true);
  const [uploadingStatus, setUploadingStatus] = useState(false); // Estado para mostrar spinner al subir

  useEffect(() => { 
    signInAnonymously(auth)
      .then(u => setFirebaseUser(u.user))
      .catch(console.error)
      .finally(() => setLoading(false)); 
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsubP = onSnapshot(query(collection(db, 'events', currentUser.eventCode, 'posts')), s => {
      setPosts(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b)=>(b.timestamp?.seconds||0)-(a.timestamp?.seconds||0)));
    });
    const unsubU = onSnapshot(collection(db, 'events', currentUser.eventCode, 'users'), s => {
       setUsersList(s.docs.map(d=>d.data())); 
       setPeopleCount(s.size);
    });
    return () => { unsubP(); unsubU(); };
  }, [currentUser]);

  const handleLogin = (d) => { setCurrentUser(d); localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); };
  
  const handleLogout = () => { 
    if(confirm("¿Salir?")){ 
      setCurrentUser(null); 
      localStorage.removeItem(STORAGE_KEY); 
      setView('feed'); 
    }
  };

  // 👇 LÓGICA DE SUBIDA CORREGIDA: Storage primero, luego Firestore
  const handleUpload = async (uploadObject) => {
    // uploadObject trae { type: 'image'|'video', data: Blob|String }
    setUploadingStatus(true);
    setView('feed'); // Regresamos al feed y mostramos carga
    
    try {
        const timestamp = Date.now();
        const type = uploadObject.type;
        let downloadUrl = '';
        
        // 1. Crear referencia al archivo en Storage
        // Videos: 'events/CODIGO/videos/timestamp.mp4'
        // Fotos: 'events/CODIGO/images/timestamp.jpg'
        const folder = type === 'video' ? 'videos' : 'images';
        const ext = type === 'video' ? 'mp4' : 'jpg';
        const fileName = `${timestamp}_${Math.floor(Math.random()*1000)}.${ext}`;
        const storageRef = ref(storage, `events/${currentUser.eventCode}/${folder}/${fileName}`);

        // 2. Subir el archivo
        if (type === 'video') {
            // Subida de Blob/File (Eficiente)
            const snapshot = await uploadBytes(storageRef, uploadObject.data);
            downloadUrl = await getDownloadURL(snapshot.ref);
        } else {
            // Subida de String Base64 (Imagen)
            const snapshot = await uploadString(storageRef, uploadObject.data, 'data_url');
            downloadUrl = await getDownloadURL(snapshot.ref);
        }

        // 3. Guardar referencia en Firestore
        await addDoc(collection(db, 'events', currentUser.eventCode, 'posts'), { 
          userId: firebaseUser.uid, 
          userName: currentUser.name, 
          userRole: currentUser.role, 
          imageUrl: downloadUrl, // Ahora es una URL corta de Google, no el archivo gigante
          contentType: type,
          timestamp: serverTimestamp(), 
          comments: [], 
          likes: [] 
        });

    } catch (error) {
        console.error("Error subiendo:", error);
        alert("Error al subir. Intenta de nuevo.");
    } finally {
        setUploadingStatus(false);
    }
  };

  const handleAddComment = async (pid, txt) => { 
    await updateDoc(doc(db, 'events', currentUser.eventCode, 'posts', pid), { 
      comments: arrayUnion({ text: txt, userName: currentUser.name, timestamp: Date.now() }) 
    }); 
  };

  const handleDeletePost = async (pid) => { 
    if(confirm("¿Borrar?")) await deleteDoc(doc(db, 'events', currentUser.eventCode, 'posts', pid)); 
  };

  const handleDeleteComment = async (pid, c) => { 
    const r = doc(db, 'events', currentUser.eventCode, 'posts', pid); 
    const p = posts.find(x=>x.id===pid); 
    if(p) await updateDoc(r, { comments: p.comments.filter(x=>x.timestamp !== c.timestamp) }); 
  };

  const onToggleLike = async (pid, isLiked) => { 
    const r = doc(db, 'events', currentUser.eventCode, 'posts', pid); 
    await updateDoc(r, { 
      likes: isLiked ? arrayRemove(firebaseUser.uid) : arrayUnion(firebaseUser.uid) 
    }); 
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#051F15] text-white"><Loader className="animate-spin" /></div>;
  
  if (!currentUser) return ( <> <GlobalStyles /> <LoginScreen onJoin={handleLogin} userUid={firebaseUser?.uid} /> </> );

  return (
    <>
    <GlobalStyles />
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#051F15] shadow-2xl relative overflow-hidden">
      {/* Overlay de carga cuando se está subiendo un archivo */}
      {uploadingStatus && (
          <div className="absolute inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center text-white">
              <Loader className="animate-spin mb-4" size={40} />
              <p className="font-bold">Subiendo momento...</p>
              <p className="text-xs text-gray-400 mt-2">Por favor no cierres la app</p>
          </div>
      )}

      {view === 'camera' ? <CameraView onClose={() => setView('feed')} onUpload={handleUpload} /> : view === 'profile' ? (
        <>
           <header className="bg-[#051F15]/90 backdrop-blur-md px-6 py-4 flex items-center border-b border-white/5">
             <button onClick={() => setView('feed')}><X/></button>
             <h1 className="ml-4 font-bold font-serif">Mi Perfil</h1>
           </header>
           <ProfileView user={currentUser} onLogout={handleLogout} posts={posts} usersList={usersList} />
        </>
      ) : (
        <>
          <header className="bg-[#051F15]/90 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-30 border-b border-white/5">
            <h1 className="text-xl font-bold font-serif text-white">Clebrify <span className="text-xs bg-white/10 px-2 py-1 rounded ml-2 font-mono text-gray-300">{currentUser.eventCode}</span></h1>
            <div className="flex gap-2"><div className="bg-white/10 px-2 py-1 rounded-full flex items-center gap-1 text-xs"><Users size={12}/> {peopleCount}</div></div>
          </header>
          <main className="flex-1 overflow-y-auto pb-24 p-5 custom-scrollbar relative z-10">
            {posts.length === 0 ? <div className="text-center mt-32 opacity-50"><Snowflake size={40} className="mx-auto mb-4"/><p>Sin fotos aún</p></div> : posts.map(p => <PostCard key={p.id} post={p} currentUser={currentUser} currentUserId={firebaseUser?.uid} onDeletePost={handleDeletePost} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} onToggleLike={onToggleLike} />)}
          </main>
        </>
      )}

      {/* --- DOCK FIJO Y PLANO --- */}
      <nav className="fixed bottom-6 left-0 right-0 mx-auto w-[90%] max-w-[350px] bg-[#02100a]/95 backdrop-blur-xl border border-white/10 rounded-full h-20 flex justify-around items-center z-50 shadow-2xl px-2">
        <button onClick={() => setView('feed')} className={`p-3 rounded-full transition ${view === 'feed' ? 'bg-white/10 text-green-400' : 'text-gray-500'}`}><Home size={28} /></button>
        
        <button onClick={() => setView('camera')} className="bg-gradient-to-tr from-red-600 to-red-700 text-white p-3.5 rounded-2xl shadow-lg hover:scale-105 transition active:scale-95 flex items-center justify-center">
          <Camera size={32} />
        </button>
        
        <button onClick={() => setView('profile')} className={`p-3 rounded-full transition ${view === 'profile' ? 'bg-white/10 text-green-400' : 'text-gray-500'}`}><User size={28} /></button>
      </nav>
    </div>
    </>
  );
}