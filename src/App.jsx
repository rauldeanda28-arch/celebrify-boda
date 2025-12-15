import React, { useState, useEffect, useRef } from 'react';
import { Camera, Home, User, Trash2, X, LogOut, Aperture, Heart, Share2, Copy, Video } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
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
      setError('Error al crear evento. Revisa si la base de datos está creada en Firebase.');
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
      setError('Error de conexión. Revisa tu internet o configuración.');
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
              <p className="text-xs text-red-300 uppercase font-bold">Tu PIN de Admin (Secreto)</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-mono font-bold text-white">{createdEventData.pin}</span>
              <button onClick={() => copyToClipboard(createdEventData.pin)} className="p-2 hover:bg-white/10 rounded-full transition">
                <Copy size={16} />
              </button>
            </div>
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
      <div className="mb-6 flex flex-col items-center">
        <Aperture size={50} className="mb-2 text-yellow-400" />
        <h1 className="text-3xl font-bold tracking-tighter">Clebrify</h1>
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
                  <input
                    type="tel"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    className="w-full bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3 text-yellow-300 placeholder-yellow-600/50 focus:outline-none focus:border-yellow-400 transition font-mono tracking-widest"
                    placeholder="PIN de Admin"
                    maxLength={4}
                  />
                </div>
              )}

              <button 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-xl shadow-lg mt-2 transition transform active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Entrar a la Fiesta'}
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

              <button 
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 font-bold py-3 rounded-xl shadow-lg hover:shadow-yellow-500/50 transition transform active:scale-95 mt-2"
              >
                 {loading ? 'Creando...' : 'Crear Evento Nuevo'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. Componente de Cámara (OPTIMIZADO PARA FIREBASE)
const CameraView = ({ onClose, onUpload }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    let activeStream = null;
    if (!cameraActive) return;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        setCameraError(false);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (err) {
        console.warn("Error cámara:", err);
        setCameraError(true);
      }
    };
    startCamera();
    return () => {
      if (activeStream) activeStream.getTracks().forEach(t => t.stop());
    };
  }, [cameraActive]);

  const processImage = (source, isVideo = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // IMPORTANTE: Reducimos calidad para que quepa en Firebase
    const MAX_WIDTH = 600; 
    let width = isVideo ? source.videoWidth : source.width;
    let height = isVideo ? source.videoHeight : source.height;

    if (width > MAX_WIDTH) {
      height = height * (MAX_WIDTH / width);
      width = MAX_WIDTH;
    }

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0, width, height);
    
    // Calidad 0.6 para ahorrar espacio
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.6);
    onUpload(imageDataUrl);
  };

  const takePhoto = () => {
    if (videoRef.current) processImage(videoRef.current, true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => processImage(img, false);
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {cameraActive && !cameraError && stream ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-8 text-white">
            <h3 className="text-xl font-bold mb-4">Cámara</h3>
            <div className="space-y-4">
              <button onClick={() => setCameraActive(true)} className="w-full bg-white/20 p-4 rounded-xl flex items-center justify-center gap-2">
                 <Video size={20} /> Abrir Cámara en Vivo
              </button>
              <button onClick={() => fileInputRef.current.click()} className="w-full bg-blue-600 p-4 rounded-xl flex items-center justify-center gap-2">
                 <Camera size={20} /> Subir desde Galería/Nativa
              </button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white"><X size={24} /></button>
      </div>

      {cameraActive && !cameraError && (
        <div className="h-32 bg-black flex items-center justify-center relative">
          <button onClick={takePhoto} className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 transition"></button>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};

// 3. Tarjeta de Foto
const PostCard = ({ post, currentUser, currentUserId, onDeletePost, onToggleLike }) => {
  const isLiked = post.likes && post.likes.includes(currentUserId);
  const likeCount = post.likes ? post.likes.length : 0;

  return (
    <div className="bg-white mb-4 shadow-sm border-b border-gray-100 pb-2">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
            {post.userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-gray-900">{post.userName}</span>
        </div>
        {currentUser.role === 'host' && (
          <button onClick={() => onDeletePost(post.id)} className="text-gray-300 hover:text-red-500">
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="w-full bg-gray-100">
        <img src={post.imageUrl} alt="Momento" className="w-full h-auto object-cover" loading="lazy" />
      </div>
      <div className="p-3">
        <button 
          onClick={() => onToggleLike(post.id, isLiked)}
          className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-800'}`}
        >
          <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
          {likeCount > 0 && <span className="text-sm font-bold">{likeCount}</span>}
        </button>
        <p className="text-xs text-gray-400 mt-2">{post.timestamp?.toDate ? post.timestamp.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</p>
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
  const [view, setView] = useState('feed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Error Auth:", err));
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser || !currentUser) return;
    const postsRef = collection(db, 'events', currentUser.eventCode, 'posts');
    const q = query(postsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setPosts(data);
    });
    return () => unsubscribe();
  }, [firebaseUser, currentUser]);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  const handleLogout = () => {
    if (confirm("¿Salir del evento?")) {
      setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleUpload = async (imageDataUrl) => {
    if (!firebaseUser || !currentUser) return;
    
    // Verificación de tamaño
    const sizeInBytes = (imageDataUrl.length * 3) / 4;
    if (sizeInBytes > 1000000) {
       alert("La foto es demasiado grande para la versión gratuita. Intenta de nuevo.");
       return;
    }

    setView('feed');
    try {
      await addDoc(collection(db, 'events', currentUser.eventCode, 'posts'), {
        userId: firebaseUser.uid,
        userName: currentUser.name,
        userRole: currentUser.role,
        imageUrl: imageDataUrl,
        timestamp: serverTimestamp(),
        likes: []
      });
    } catch (e) {
      alert("Error al subir. Verifica tu internet.");
      console.error(e);
    }
  };

  const handleDeletePost = async (postId) => {
    if (currentUser.role !== 'host') return;
    if (confirm("¿Borrar foto permanentemente?")) {
      await deleteDoc(doc(db, 'events', currentUser.eventCode, 'posts', postId));
    }
  };

  const handleToggleLike = async (postId, isLiked) => {
    if (!firebaseUser) return;
    const postRef = doc(db, 'events', currentUser.eventCode, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const currentLikes = post.likes || [];
    const newLikes = isLiked 
      ? currentLikes.filter(uid => uid !== firebaseUser.uid)
      : [...currentLikes, firebaseUser.uid];

    await setDoc(postRef, { ...post, likes: newLikes }, { merge: true });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Cargando...</div>;
  if (!currentUser) return <LoginScreen onJoin={handleLogin} />;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl relative">
      {view === 'camera' ? (
        <CameraView onClose={() => setView('feed')} onUpload={handleUpload} />
      ) : (
        <>
          <header className="bg-white/95 backdrop-blur-sm border-b border-blue-100 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-bold text-blue-900 flex items-center">
                Celebrify <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 rounded-full">{currentUser.eventCode}</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
               {currentUser.role === 'host' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">ADMIN</span>}
               <button onClick={handleLogout} className="text-gray-400 hover:text-red-500"><LogOut size={20} /></button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-20 p-2">
            {posts.length === 0 ? (
              <div className="text-center mt-20 text-gray-400 px-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera size={30} />
                </div>
                <p>¡Aún no hay fotos! Sé el primero.</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={currentUser}
                  currentUserId={firebaseUser?.uid}
                  onDeletePost={handleDeletePost}
                  onToggleLike={handleToggleLike}
                />
              ))
            )}
          </main>

          <nav className="absolute bottom-0 w-full bg-white border-t h-16 flex justify-around items-center z-20">
            <button onClick={() => setView('feed')} className={`p-2 ${view === 'feed' ? 'text-blue-600' : 'text-gray-400'}`}>
              <Home size={28} />
            </button>
            <button onClick={() => setView('camera')} className="bg-blue-900 text-white p-4 rounded-full -translate-y-6 shadow-lg border-4 border-gray-50">
              <Camera size={28} />
            </button>
            <button className="p-2 text-gray-400"><User size={28} /></button>
          </nav>
        </>
      )}
    </div>
  );
}