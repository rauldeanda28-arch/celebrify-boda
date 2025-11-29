import React, { useState, useEffect, useRef } from 'react';
import { Camera, Home, User, Trash2, Send, MessageCircle, X, LogOut, Aperture, Heart, MoreHorizontal, PlusCircle, Lock, Copy, Share2, ArrowRight, ArrowLeft, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE (TUS CLAVES REALES) ---
const firebaseConfig = {
  apiKey: "AIzaSyDOPQdyUtsIcougnXwhaehhw3fs4gmAWv0",
  authDomain: "celebrify-e5de2.firebaseapp.com",
  projectId: "celebrify-e5de2",
  storageBucket: "celebrify-e5de2.firebasestorage.app",
  messagingSenderId: "486495542360",
  appId: "1:486495542360:web:8507dd9206611ccfa3fe2d"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const STORAGE_KEY = 'celebrify_session_v1';

// --- UTILIDADES ---
const generateCode = (length) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// --- COMPONENTES ---

// 1. Pantalla de Login / Bienvenida
const LoginScreen = ({ onJoin }) => {
  const [mode, setMode] = useState('join');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para Unirse
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');

  // Estados para Crear
  const [createEventName, setCreateEventName] = useState('');
  const [createHostName, setCreateHostName] = useState('');
  const [createdEventData, setCreatedEventData] = useState(null);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!createEventName || !createHostName) return;
    setLoading(true);
    setError('');

    try {
      const newEventCode = generateCode(6);
      const newAdminPin = Math.floor(1000 + Math.random() * 9000).toString();

      // RUTA REAL: Colección 'events' en la raíz
      const eventRef = doc(db, 'events', newEventCode);
      
      await setDoc(eventRef, {
        eventName: createEventName,
        hostName: createHostName,
        adminPin: newAdminPin,
        createdAt: serverTimestamp(),
        code: newEventCode
      });

      setCreatedEventData({ code: newEventCode, pin: newAdminPin, name: createEventName });
      setMode('success_create');
    } catch (err) {
      console.error(err);
      setError('Error al crear evento. Verifica tu configuración de Firebase.');
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
      // RUTA REAL: Buscar en colección 'events'
      const docRef = doc(db, 'events', code);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('¡Este código de evento no existe!');
        setLoading(false);
        return;
      }

      const eventData = docSnap.data();

      let role = 'guest';
      if (isAdminLogin) {
        if (adminPinInput === eventData.adminPin) {
          role = 'host';
        } else {
          setError('PIN de administrador incorrecto.');
          setLoading(false);
          return;
        }
      }

      onJoin({ 
        name: joinName, 
        role, 
        eventCode: code, 
        eventName: eventData.eventName 
      });

    } catch (err) {
      console.error(err);
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado!');
  };

  if (mode === 'success_create') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-900 via-blue-950 to-black text-white p-6">
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
            <Share2 size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Evento Creado!</h2>
          <p className="text-blue-200 text-sm mb-6">Comparte este código con tus invitados.</p>

          <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/10">
            <p className="text-xs text-blue-300 uppercase font-bold mb-1">Código de Invitados</p>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-mono font-bold tracking-widest text-yellow-400">{createdEventData.code}</span>
              <button onClick={() => copyToClipboard(createdEventData.code)} className="p-2 hover:bg-white/10 rounded-full transition">
                <Copy size={20} />
              </button>
            </div>
          </div>

          <div className="bg-red-500/20 rounded-xl p-4 mb-6 border border-red-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={12} className="text-red-300" />
              <p className="text-xs text-red-300 uppercase font-bold">Tu PIN de Admin (Secreto)</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-mono font-bold text-white">{createdEventData.pin}</span>
              <button onClick={() => copyToClipboard(createdEventData.pin)} className="p-2 hover:bg-white/10 rounded-full transition">
                <Copy size={16} />
              </button>
            </div>
            <p className="text-[10px] text-red-200 mt-2 text-left leading-tight">
              * Usa este PIN junto con el código del evento para entrar como Administrador y borrar fotos.
            </p>
          </div>

          <button 
            onClick={() => {
              onJoin({
                 name: createHostName, 
                 role: 'host',
                 eventCode: createdEventData.code,
                 eventName: createEventName
              });
            }}
            className="w-full bg-white text-blue-900 font-bold py-3 rounded-xl shadow-lg hover:bg-blue-50 transition"
          >
            Ir a mi Evento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-900 via-blue-950 to-black text-white p-6">
      <div className="mb-6 flex flex-col items-center animate-bounce-slow">
        <Aperture size={50} className="mb-2 text-yellow-400" />
        <h1 className="text-3xl font-bold tracking-tighter">Celebrify</h1>
      </div>

      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        <div className="flex border-b border-white/10">
          <button 
            onClick={() => setMode('join')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition ${mode === 'join' ? 'bg-white/10 text-yellow-400' : 'text-blue-300 hover:text-white'}`}
          >
            Unirse
          </button>
          <button 
            onClick={() => setMode('create')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition ${mode === 'create' ? 'bg-white/10 text-yellow-400' : 'text-blue-300 hover:text-white'}`}
          >
            Crear
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-xs flex items-center gap-2">
               <X size={14} /> {error}
            </div>
          )}

          {mode === 'join' ? (
            <form onSubmit={handleJoinEvent} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-blue-200 ml-1">Código del Evento</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-400/50 focus:outline-none focus:border-yellow-400/50 transition font-mono tracking-widest uppercase"
                  placeholder="Ej. AB12CD"
                  maxLength={6}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-blue-200 ml-1">Tu Nombre</label>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-400/50 focus:outline-none focus:border-yellow-400/50 transition"
                  placeholder="Ej. Ana García"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${isAdminLogin ? 'bg-yellow-400 border-yellow-400' : 'border-blue-300'}`}>
                    {isAdminLogin && <User size={12} className="text-black" />}
                  </div>
                  <input type="checkbox" checked={isAdminLogin} onChange={() => setIsAdminLogin(!isAdminLogin)} className="hidden" />
                  <span className="text-sm text-blue-200 group-hover:text-white transition">Soy el Anfitrión</span>
                </label>
              </div>

              {isAdminLogin && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold uppercase text-yellow-200 ml-1 flex items-center gap-1">
                    <Lock size={10} /> PIN de Administrador
                  </label>
                  <input
                    type="tel"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    className="w-full bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3 text-yellow-300 placeholder-yellow-600/50 focus:outline-none focus:border-yellow-400 transition font-mono tracking-widest"
                    placeholder="****"
                    maxLength={4}
                  />
                </div>
              )}

              <button 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-xl shadow-lg mt-2 transition transform active:scale-95 disabled:opacity-50 disabled:scale-100 flex justify-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Entrar a la Fiesta'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-blue-200 ml-1">Nombre del Evento</label>
                <input
                  type="text"
                  value={createEventName}
                  onChange={(e) => setCreateEventName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-400/50 focus:outline-none focus:border-yellow-400/50 transition"
                  placeholder="Ej. Boda de Luis y María"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-blue-200 ml-1">Tu Nombre (Anfitrión)</label>
                <input
                  type="text"
                  value={createHostName}
                  onChange={(e) => setCreateHostName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-400/50 focus:outline-none focus:border-yellow-400/50 transition"
                  placeholder="Ej. Luis"
                />
              </div>

              <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                <p className="text-[10px] text-blue-200 leading-tight">
                  Al crear, recibirás un código único para compartir y un PIN secreto para moderar el contenido.
                </p>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 font-bold py-3 rounded-xl shadow-lg hover:shadow-yellow-500/50 transition transform active:scale-95 mt-2 flex justify-center"
              >
                 {loading ? <div className="w-5 h-5 border-2 border-purple-900/30 border-t-purple-900 rounded-full animate-spin" /> : 'Crear Evento Nuevo'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. Componente de Cámara
const CameraView = ({ onClose, onUpload, user }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [flash, setFlash] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    let activeStream = null;
    let mounted = true;

    if (!cameraActive) return;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            frameRate: { ideal: 15, max: 20 }
          } 
        });
        
        if (!mounted) {
           mediaStream.getTracks().forEach(t => t.stop());
           return;
        }

        activeStream = mediaStream;
        setStream(mediaStream);
        setCameraError(false);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
        }
      } catch (err) {
        console.warn("Cámara no disponible, activando modo fallback:", err);
        if (mounted) setCameraError(true);
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (activeStream) activeStream.getTracks().forEach(track => track.stop());
    };
  }, [cameraActive]);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const MAX_WIDTH = 800;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const finalWidth = Math.min(MAX_WIDTH, video.videoWidth);
    const finalHeight = video.videoHeight * (finalWidth / video.videoWidth);

    canvas.width = finalWidth;
    canvas.height = finalHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, finalWidth, finalHeight);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    onUpload(imageDataUrl);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const MAX_WIDTH = 800;
          const finalWidth = Math.min(MAX_WIDTH, img.width);
          const finalHeight = img.height * (finalWidth / img.width);

          canvas.width = finalWidth;
          canvas.height = finalHeight;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
          
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          onUpload(imageDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 ${flash ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {cameraError ? (
           <div className="flex flex-col items-center justify-center p-8 text-center w-full max-w-sm animate-in fade-in">
             <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mb-4">
                <Video size={32} className="text-red-400" />
             </div>
             <h3 className="text-white text-lg font-bold mb-2">Video en Vivo no disponible</h3>
             <p className="text-gray-400 text-sm mb-6">
               Tu dispositivo no soporta la cámara en esta web. Usa el modo nativo.
             </p>
             <button onClick={triggerFileInput} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
               <Camera size={20} /> Usar Cámara Nativa
             </button>
           </div>
        ) : cameraActive && stream ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            webkit-playsinline="true"
            muted
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center w-full max-w-sm animate-in zoom-in-95 duration-300">
             <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-blue-900/20">
                <Aperture size={40} className="text-blue-400" />
             </div>
             <h3 className="text-white text-2xl font-bold mb-2">Modo Cámara</h3>
             <p className="text-gray-400 text-sm mb-8">
               Elige cómo quieres capturar el momento.
             </p>
             <div className="w-full space-y-3">
               <button 
                  onClick={() => setCameraActive(true)}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition"
               >
                 <Video size={20} /> Activar Cámara en Vivo
               </button>
               <button 
                  onClick={triggerFileInput}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50 transition"
               >
                 <Camera size={20} /> Usar Cámara Nativa
               </button>
             </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white">
          <button onClick={onClose} className="p-2 bg-black/40 rounded-full backdrop-blur-md hover:bg-black/60 transition"><X size={24} /></button>
          {cameraActive && !cameraError && <div className="bg-black/40 px-3 py-1 rounded-full text-xs font-mono text-green-400 flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> LIVE</div>}
        </div>
      </div>

      {cameraActive && !cameraError && (
        <div className="h-32 bg-black flex items-center justify-center relative flex-col gap-2">
          <button 
            onClick={takePhoto} 
            disabled={!stream}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center relative group active:scale-95 transition disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-white rounded-full group-hover:bg-gray-200 transition" />
          </button>
          <button onClick={triggerFileInput} className="text-gray-400 text-xs flex items-center gap-1 hover:text-white transition py-2 px-4 rounded-full bg-gray-900/50">
             Problemas? Usa la Nativa
          </button>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};

// 3. Tarjeta de Foto
const PostCard = ({ post, currentUser, currentUserId, onDeletePost, onAddComment, onDeleteComment, onToggleLike }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  const isLiked = post.likes && post.likes.includes(currentUserId);
  const likeCount = post.likes ? post.likes.length : 0;

  return (
    <div className="bg-white mb-4 shadow-sm border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-blue-900 flex items-center justify-center text-white text-xs font-bold shadow-md">
            {post.userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-gray-900">{post.userName}</span>
        </div>
        {currentUser.role === 'host' && (
          <button onClick={() => onDeletePost(post.id)} className="text-gray-300 hover:text-red-500 transition p-1 bg-gray-50 rounded-full hover:bg-red-50">
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
        <img src={post.imageUrl} alt="Evento" className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <div className="flex items-center space-x-4 mb-3">
          <button 
            onClick={() => onToggleLike(post.id, isLiked)}
            className={`transition active:scale-90 transform flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-800 hover:text-red-500'}`}
          >
            <Heart size={26} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2} />
          </button>
          
          <button onClick={() => setShowComments(!showComments)} className="text-gray-800 hover:text-blue-500 transition"><MessageCircle size={26} /></button>
        </div>
        
        {likeCount > 0 && (
          <p className="text-sm font-bold text-gray-900 mb-1">
            {likeCount} {likeCount === 1 ? 'Me gusta' : 'Me gustas'}
          </p>
        )}

        <p className="text-xs text-gray-400 uppercase font-medium mb-2">{post.timestamp?.toDate ? post.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ahora'}</p>
        <div className="space-y-1">
          {post.comments && post.comments.slice(showComments ? 0 : -2).map((comment, idx) => (
            <div key={idx} className="text-sm flex justify-between group py-0.5">
              <span><span className="font-semibold mr-2 text-blue-900">{comment.userName}</span><span className="text-gray-700">{comment.text}</span></span>
              {currentUser.role === 'host' && (
                <button onClick={() => onDeleteComment(post.id, comment)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition text-xs"><X size={14} /></button>
              )}
            </div>
          ))}
          {!showComments && post.comments && post.comments.length > 2 && (
            <button onClick={() => setShowComments(true)} className="text-gray-400 text-xs mt-1 hover:text-blue-500">Ver los {post.comments.length} comentarios</button>
          )}
        </div>
        <form onSubmit={handleSubmitComment} className="mt-3 flex items-center border-t border-gray-100 pt-3">
          <input type="text" placeholder="Comentar..." className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
          <button type="submit" disabled={!commentText.trim()} className="text-blue-600 font-semibold text-sm disabled:opacity-50 ml-2">Enviar</button>
        </form>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

export default function App() {
  // Inicialización Lazy de usuario
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      try {
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        console.error("Error recuperando sesión", e);
        return null;
      }
    }
    return null;
  });

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('feed');
  const [loading, setLoading] = useState(true);

  // Auth Init
  useEffect(() => {
    const initAuth = async () => {
      // PRODUCCIÓN: En producción real ya no se usa signInWithCustomToken de la preview
      // Sino que usamos signInAnonymously directamente
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Error de autenticación", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Posts
  useEffect(() => {
    if (!firebaseUser || !currentUser) return;
    
    // RUTA REAL: events/{eventCode}/posts
    const postsRef = collection(db, 'events', currentUser.eventCode, 'posts');
    const q = query(postsRef);
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      postsData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setPosts(postsData);
    });
    return () => unsubscribePosts();
  }, [firebaseUser, currentUser]);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  const handleLogout = () => {
    if (confirm("¿Quieres salir del evento? Tendrás que volver a ingresar el código.")) {
      setCurrentUser(null);
      setPosts([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleUpload = async (imageDataUrl) => {
    if (!firebaseUser || !currentUser) return;
    setView('feed');
    try {
      // RUTA REAL: events/{eventCode}/posts
      await addDoc(collection(db, 'events', currentUser.eventCode, 'posts'), {
        userId: firebaseUser.uid,
        userName: currentUser.name,
        userRole: currentUser.role,
        imageUrl: imageDataUrl,
        timestamp: serverTimestamp(),
        comments: [],
        likes: []
      });
    } catch (e) { alert("Error al subir."); }
  };

  const handleAddComment = async (postId, text) => {
    if (!firebaseUser || !currentUser) return;
    try {
      // RUTA REAL: events/{eventCode}/posts
      const postRef = doc(db, 'events', currentUser.eventCode, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const newComment = { text, userName: currentUser.name, userId: firebaseUser.uid, timestamp: Date.now() };
      await setDoc(postRef, { ...post, comments: [...(post.comments || []), newComment] }, { merge: true });
    } catch (e) { console.error(e); }
  };
// Cambio para Vercel
  const handleToggleLike = async (postId, isLiked) => {
     if (!firebaseUser || !currentUser) return;
     try {
       // RUTA REAL: events/{eventCode}/posts
       const postRef = doc(db, 'events', currentUser.eventCode, 'posts', postId);
       const post = posts.find(p => p.id === postId);
       if (!post) return;
       
       let currentLikes = post.likes || [];
       let newLikes;
       
       if (isLiked) {
         newLikes = currentLikes.filter(uid => uid !== firebaseUser.uid);
       } else {
         newLikes = [...currentLikes, firebaseUser.uid];
       }

       await setDoc(postRef, { ...post, likes: newLikes }, { merge: true });
     } catch (e) { console.error(e); }
  };

  const handleDeletePost = async (postId) => {
    if (currentUser.role !== 'host') return;
    if (!confirm("¿Eliminar foto permanentemente?")) return;
    try { await deleteDoc(doc(db, 'events', currentUser.eventCode, 'posts', postId)); } catch (e) {}
  };

  const handleDeleteComment = async (postId, commentToDelete) => {
    if (currentUser.role !== 'host') return;
    try {
      const postRef = doc(db, 'events', currentUser.eventCode, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const updatedComments = post.comments.filter(c => c.timestamp !== commentToDelete.timestamp);
      await setDoc(postRef, { ...post, comments: updatedComments }, { merge: true });
    } catch (e) {}
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-900 text-blue-400">Iniciando Celebrify...</div>;
  if (!currentUser) return <LoginScreen onJoin={handleLogin} />;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden relative">
      {view === 'camera' ? (
        <CameraView onClose={() => setView('feed')} onUpload={handleUpload} user={currentUser} />
      ) : (
        <>
          <header className="bg-white/95 backdrop-blur-sm border-b border-blue-100 px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <div>
              <h1 className="text-xl font-bold font-serif tracking-tight flex items-center text-blue-900">
                Celebrify <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 font-sans font-bold">{currentUser.eventCode}</span>
              </h1>
              {currentUser.eventName && <p className="text-xs text-gray-500 truncate max-w-[200px]">{currentUser.eventName}</p>}
            </div>
            <div className="flex items-center space-x-3">
               {currentUser.role === 'host' && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full border border-yellow-200">ADMIN</span>}
               <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition"><LogOut size={20} /></button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gray-50 scrollbar-hide pb-20">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-8 text-center mt-10">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <Camera size={40} className="text-blue-200" />
                </div>
                <h3 className="text-lg font-medium text-gray-600">¡Que empiece la fiesta!</h3>
                <p className="text-sm mt-2 text-gray-500 max-w-xs mx-auto">Toma la primera foto para inaugurar el álbum digital de {currentUser.eventName || 'este evento'}.</p>
                {currentUser.role === 'host' && (
                   <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800 text-left w-full">
                     <p className="font-bold mb-1">👑 Tip de Anfitrión:</p>
                     Comparte el código <span className="font-mono bg-white px-1 rounded border border-yellow-200">{currentUser.eventCode}</span> con tus invitados por WhatsApp o ponlo en un cartel en la entrada.
                   </div>
                )}
              </div>
            ) : (
              posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={currentUser} 
                  currentUserId={firebaseUser?.uid}
                  onDeletePost={handleDeletePost} 
                  onAddComment={handleAddComment} 
                  onDeleteComment={handleDeleteComment}
                  onToggleLike={handleToggleLike}
                />
              ))
            )}
          </main>

          <nav className="bg-white border-t border-gray-200 h-16 flex justify-around items-center px-2 pb-2 safe-area-bottom z-20">
            <button onClick={() => setView('feed')} className={`p-2 rounded-xl transition ${view === 'feed' ? 'text-blue-900' : 'text-gray-300'}`}>
              <Home size={28} strokeWidth={view === 'feed' ? 2.5 : 2} />
            </button>
            <button onClick={() => setView('camera')} className="bg-gradient-to-tr from-blue-900 to-black text-white p-4 rounded-full shadow-xl shadow-blue-900/40 transform -translate-y-6 hover:scale-105 transition active:scale-95 border-4 border-gray-50">
              <Camera size={28} />
            </button>
            <button className="p-2 rounded-xl text-gray-300 hover:text-blue-900 transition"><User size={28} /></button>
          </nav>
        </>
      )}
    </div>
  );
}