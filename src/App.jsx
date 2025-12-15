import React, { useState, useEffect, useRef } from 'react';
import { Camera, Home, User, Trash2, MessageCircle, X, LogOut, Aperture, Heart, Share2, Copy, Video, Send } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc, serverTimestamp, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

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
const STORAGE_KEY = 'celebrify_session_v2'; // Cambié la clave para limpiar errores viejos

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
      const docRef = doc(db, 'events', code);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('¡Código incorrecto!');
        setLoading(false);
        return;
      }

      const eventData = docSnap.data();
      let role = 'guest';
      if (isAdminLogin) {
        if (adminPinInput === eventData.adminPin) {
          role = 'host';
        } else {
          setError('PIN incorrecto.');
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
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6">
        <div className="bg-gray-800 p-8 rounded-3xl w-full max-w-sm text-center border border-gray-700">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Evento Listo!</h2>
          <div className="bg-black/50 rounded-xl p-4 mb-4 mt-6">
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Código de Invitados</p>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-mono font-bold text-yellow-400">{createdEventData.code}</span>
              <button onClick={() => copyToClipboard(createdEventData.code)} className="p-2"><Copy size={20} /></button>
            </div>
          </div>
          <div className="bg-red-900/30 rounded-xl p-4 mb-6 border border-red-900/50">
            <p className="text-xs text-red-300 uppercase font-bold mb-1">PIN Admin</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-mono font-bold text-white">{createdEventData.pin}</span>
              <button onClick={() => copyToClipboard(createdEventData.pin)} className="p-2"><Copy size={16} /></button>
            </div>
          </div>
          <button onClick={() => onJoin({ name: createHostName, role: 'host', eventCode: createdEventData.code, eventName: createEventName })} className="w-full bg-white text-black font-bold py-3 rounded-xl">Ir al Evento</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-900 to-black text-white p-6">
      <div className="mb-8 text-center">
        <Aperture size={60} className="mx-auto mb-2 text-yellow-400" />
        <h1 className="text-4xl font-bold tracking-tighter">Clebrify</h1>
      </div>

      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
        <div className="flex border-b border-white/10">
          <button onClick={() => setMode('join')} className={`flex-1 py-4 font-bold ${mode === 'join' ? 'bg-white/10 text-yellow-400' : 'text-gray-400'}`}>Unirse</button>
          <button onClick={() => setMode('create')} className={`flex-1 py-4 font-bold ${mode === 'create' ? 'bg-white/10 text-yellow-400' : 'text-gray-400'}`}>Crear</button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-2 bg-red-500/20 text-red-200 text-xs rounded text-center">{error}</div>}

          {mode === 'join' ? (
            <form onSubmit={handleJoinEvent} className="space-y-4">
              <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white uppercase" placeholder="CÓDIGO (Ej. AB12)" maxLength={6} />
              <input type="text" value={joinName} onChange={(e) => setJoinName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Tu Nombre" />
              
              <div className="flex items-center gap-2">
                 <input type="checkbox" checked={isAdminLogin} onChange={() => setIsAdminLogin(!isAdminLogin)} className="w-4 h-4" />
                 <span className="text-sm text-gray-300">Soy el Anfitrión</span>
              </div>
              
              {isAdminLogin && (
                <input type="tel" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value)} className="w-full bg-yellow-900/20 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-200 placeholder-yellow-700" placeholder="PIN Admin" maxLength={4} />
              )}

              <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-2">
                {loading ? 'Entrando...' : '¡Vamos!'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <input type="text" value={createEventName} onChange={(e) => setCreateEventName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Nombre del Evento" />
              <input type="text" value={createHostName} onChange={(e) => setCreateHostName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Tu Nombre" />
              <button disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl mt-2">
                 {loading ? 'Creando...' : 'Crear Evento'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. Componente de Cámara (OPTIMIZADO PARA FOTOS)
const CameraView = ({ onClose, onUpload }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

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
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (err) {
        console.warn("Cámara no disponible, usando fallback de archivo");
      }
    };
    startCamera();
    return () => {
      if (activeStream) activeStream.getTracks().forEach(t => t.stop());
    };
  }, [cameraActive]);

  const processAndUpload = (source, isVideo = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // REDUCIR CALIDAD (Esencial para que funcione)
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
    
    // Convertir a JPG ligero
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.6);
    onUpload(imageDataUrl);
  };

  const takePhoto = () => {
    if (videoRef.current) processAndUpload(videoRef.current, true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Bloqueamos video para que no falle
      if(file.type.startsWith('video/')) {
        alert("⚠️ Solo se permiten FOTOS en esta versión gratuita.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => processAndUpload(img, false);
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {cameraActive && stream ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-8 text-white space-y-4 w-full max-w-sm">
            <h3 className="text-xl font-bold">Modo Cámara</h3>
            <button onClick={() => setCameraActive(true)} className="w-full bg-white/20 p-4 rounded-xl flex items-center justify-center gap-2 font-bold">
               <Camera size={24} /> Cámara en Vivo
            </button>
            <button onClick={() => fileInputRef.current.click()} className="w-full bg-blue-600 p-4 rounded-xl flex items-center justify-center gap-2 font-bold">
               <Video size={24} /> Subir de Galería
            </button>
            <p className="text-xs text-gray-500 mt-4">* Solo Fotos soportadas actualmente</p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white"><X size={24} /></button>
      </div>

      {cameraActive && (
        <div className="h-32 bg-black flex items-center justify-center">
          <button onClick={takePhoto} className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 transition active:scale-95"></button>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};

// 3. Tarjeta de Foto (CON COMENTARIOS ARREGLADOS)
const PostCard = ({ post, currentUser, currentUserId, onDeletePost, onAddComment, onDeleteComment, onToggleLike }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
    setShowComments(true); // Abrir comentarios al enviar
  };

  const isLiked = post.likes && post.likes.includes(currentUserId);
  const commentsList = post.comments || []; // Seguridad si está vacío

  return (
    <div className="bg-white mb-4 shadow-sm border-b border-gray-100 pb-2">
      {/* Header Post */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs shadow">
            {post.userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-bold text-gray-900">{post.userName}</span>
        </div>
        {currentUser.role === 'host' && (
          <button onClick={() => onDeletePost(post.id)} className="text-gray-300 hover:text-red-500 p-1">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Imagen */}
      <div className="w-full bg-gray-100">
        <img src={post.imageUrl} alt="Momento" className="w-full h-auto object-cover" />
      </div>

      {/* Acciones y Comentarios */}
      <div className="p-3">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={() => onToggleLike(post.id, isLiked)} className={`transition ${isLiked ? 'text-red-500' : 'text-gray-800'}`}>
            <Heart size={26} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button onClick={() => setShowComments(!showComments)} className="text-gray-800">
            <MessageCircle size={26} />
          </button>
        </div>

        {/* Lista de Likes */}
        {(post.likes?.length > 0) && (
          <p className="text-sm font-bold text-gray-900 mb-2">{post.likes.length} Me gusta</p>
        )}

        {/* Lista de Comentarios */}
        <div className="space-y-1 mb-2">
          {commentsList.slice(showComments ? 0 : -2).map((comment, idx) => (
            <div key={idx} className="text-sm flex justify-between group">
              <span>
                <span className="font-bold mr-2 text-blue-900">{comment.userName}</span>
                <span className="text-gray-700">{comment.text}</span>
              </span>
              {currentUser.role === 'host' && (
                <button onClick={() => onDeleteComment(post.id, comment)} className="text-gray-300 hover:text-red-500"><X size={12} /></button>
              )}
            </div>
          ))}
          {!showComments && commentsList.length > 2 && (
            <button onClick={() => setShowComments(true)} className="text-gray-400 text-xs mt-1">Ver los {commentsList.length} comentarios</button>
          )}
        </div>

        {/* Input Comentario (Visible siempre) */}
        <form onSubmit={handleSubmitComment} className="flex items-center pt-2 border-t border-gray-100">
          <input 
            type="text" 
            placeholder="Añadir un comentario..." 
            className="flex-1 text-sm outline-none bg-transparent py-1" 
            value={commentText} 
            onChange={(e) => setCommentText(e.target.value)} 
          />
          <button type="submit" disabled={!commentText.trim()} className="text-blue-600 font-bold text-sm ml-2 disabled:opacity-50">
            Publicar
          </button>
        </form>
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

  // Autenticación
  useEffect(() => {
    signInAnonymously(auth).catch(e => console.error(e));
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Cargar Posts
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

  // Subir Foto
  const handleUpload = async (imageDataUrl) => {
    if (!firebaseUser || !currentUser) return;
    
    // Verificación de seguridad de tamaño
    if (imageDataUrl.length > 2000000) {
       alert("Imagen muy grande. Intenta tomarla de nuevo.");
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
        comments: [], // Importante inicializar vacío
        likes: []
      });
    } catch (e) {
      alert("Error subiendo foto.");
    }
  };

  // COMENTAR (ARREGLADO CON ARRAYUNION)
  const handleAddComment = async (postId, text) => {
    if (!firebaseUser || !currentUser) return;
    try {
      const postRef = doc(db, 'events', currentUser.eventCode, 'posts', postId);
      // ArrayUnion es la clave para que no falle nunca
      await updateDoc(postRef, {
        comments: arrayUnion({
          text,
          userName: currentUser.name,
          userId: firebaseUser.uid,
          timestamp: Date.now()
        })
      });
    } catch (e) {
      console.error(e);
      alert("No se pudo enviar el comentario.");
    }
  };

  const handleDeletePost = async (postId) => {
    if (currentUser.role !== 'host') return;
    if (confirm("¿Borrar permanentemente?")) {
      await deleteDoc(doc(db, 'events', currentUser.eventCode, 'posts', postId));
    }
  };

  const handleDeleteComment = async (postId, commentToDelete) => {
    if (currentUser.role !== 'host') return;
    try {
      const postRef = doc(db, 'events', currentUser.eventCode, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const newComments = post.comments.filter(c => c.timestamp !== commentToDelete.timestamp);
      await updateDoc(postRef, { comments: newComments });
    } catch (e) {}
  };

  const handleToggleLike = async (postId, isLiked) => {
    if (!firebaseUser) return;
    const postRef = doc(db, 'events', currentUser.eventCode, 'posts', postId);
    // Usamos arrayUnion y arrayRemove para likes perfectos
    if (isLiked) {
       await updateDoc(postRef, { likes: arrayUnion(firebaseUser.uid) }); // Pequeño hack: primero agregamos por si acaso
       // Firebase no tiene arrayRemove simple sin valor exacto, asi que lo hacemos manual o con arrayRemove
       const post = posts.find(p => p.id === postId);
       const newLikes = (post.likes || []).filter(uid => uid !== firebaseUser.uid);
       await updateDoc(postRef, { likes: newLikes });
    } else {
       await updateDoc(postRef, { likes: arrayUnion(firebaseUser.uid) });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Cargando...</div>;
  if (!currentUser) return <LoginScreen onJoin={handleLogin} />;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl relative">
      {view === 'camera' ? (
        <CameraView onClose={() => setView('feed')} onUpload={handleUpload} />
      ) : (
        <>
          <header className="bg-white/95 backdrop-blur-sm border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-bold text-blue-900 flex items-center font-serif">
                Celebrify <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{currentUser.eventCode}</span>
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
                <p>¡Aún no hay fotos! <br/> Sé el primero en compartir.</p>
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

          <nav className="absolute bottom-0 w-full bg-white border-t h-16 flex justify-around items-center z-20 pb-safe">
            <button onClick={() => setView('feed')} className={`p-2 ${view === 'feed' ? 'text-blue-600' : 'text-gray-300'}`}>
              <Home size={28} />
            </button>
            <button onClick={() => setView('camera')} className="bg-blue-900 text-white p-4 rounded-full -translate-y-6 shadow-lg border-4 border-gray-50 hover:scale-105 transition">
              <Camera size={28} />
            </button>
            <button className="p-2 text-gray-300"><User size={28} /></button>
          </nav>
        </>
      )}
    </div>
  );
}