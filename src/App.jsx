import React, { useState, useEffect, useRef } from 'react';
import { Camera, Home, User, Trash2, MessageCircle, X, LogOut, Aperture, Heart, Share2, Copy, Video, Lock, Upload, QrCode, Eye, EyeOff, Users, Download, Loader, Image as ImageIcon } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc, serverTimestamp, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
const MASTER_PIN = "123456";  // <--- TU LLAVE MAESTRA
const CREATOR_PIN = "777777"; // <--- PARA CLIENTES

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const STORAGE_KEY = 'celebrify_session_v17'; 

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

// 1. Pantalla de Login / Bienvenida
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
          setError('PIN incorrecto. Acceso denegado.');
          setLoading(false);
          return;
        }
      }

      const cleanName = normalizeName(joinName);
      const userRef = doc(db, 'events', code, 'users', cleanName);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.deviceId === userUid) {
              // OK
          } else if (isValidAdmin) {
              await updateDoc(userRef, { deviceId: userUid });
          } else {
              setError(`⚠️ El nombre "${joinName}" ya está en uso. Por favor usa otro.`);
              setLoading(false);
              return;
          }
      } else {
          await setDoc(userRef, {
              originalName: joinName,
              deviceId: userUid,
              role: role,
              joinedAt: serverTimestamp()
          });
      }

      onJoin({ 
          name: joinName, 
          role, 
          eventCode: code, 
          eventName: eventData.eventName,
          adminPin: role === 'host' ? eventData.adminPin : null 
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
            <p className="text-xs text-red-300 uppercase font-bold mb-1">PIN Admin (Específico)</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-mono font-bold text-white">{createdEventData.pin}</span>
              <button onClick={() => copyToClipboard(createdEventData.pin)} className="p-2"><Copy size={16} /></button>
            </div>
            <p className="text-[10px] text-red-200 mt-2 text-left leading-tight">
                * Guarda este PIN. Es la única llave para moderar ESTE evento específico.
            </p>
          </div>
          <button onClick={() => onJoin({ name: createHostName, role: 'host', eventCode: createdEventData.code, eventName: createEventName, adminPin: createdEventData.pin })} className="w-full bg-white text-black font-bold py-3 rounded-xl">Ir al Evento</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-900 to-black text-white p-6">
      <div className="mb-8 text-center">
        <Aperture size={60} className="mx-auto mb-2 text-yellow-400" />
        <h1 className="text-4xl font-bold tracking-tighter">Clebrify</h1>
        <p className="text-blue-200 text-sm mt-2">Tu evento, tu control.</p>
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
              
              <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
                 <p className="text-[10px] text-blue-200 text-center">✨ Tu sesión se mantendrá activa automáticamente.</p>
              </div>

              <div className="flex items-center gap-2 mt-2">
                 <input type="checkbox" checked={isAdminLogin} onChange={() => setIsAdminLogin(!isAdminLogin)} className="w-4 h-4" />
                 <span className="text-sm text-gray-300">Soy el Anfitrión</span>
              </div>
              {isAdminLogin && (
                <input type="tel" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value)} className="w-full bg-yellow-900/20 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-200 placeholder-yellow-700" placeholder="PIN Admin" maxLength={6} />
              )}
              <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-2 shadow-lg shadow-blue-900/50">
                {loading ? 'Verificando...' : 'Entrar a la Fiesta'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <input type="text" value={createEventName} onChange={(e) => setCreateEventName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Nombre del Evento" />
              <input type="text" value={createHostName} onChange={(e) => setCreateHostName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Tu Nombre" />
              <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/30">
                <label className="text-[10px] uppercase font-bold text-red-300 mb-1 block flex items-center gap-1"><Lock size={10} /> Clave de Creación</label>
                <input type="password" value={masterPinInput} onChange={(e) => setMasterPinInput(e.target.value)} className="w-full bg-black/40 border border-red-500/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="Código Autorizado" />
              </div>
              <button disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl mt-2">
                 {loading ? 'Configurando...' : 'Crear Evento'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. Componente de Cámara (3 BOTONES: FOTO, VIDEO, GALERÍA)
const CameraView = ({ onClose, onUpload }) => {
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const canvasRef = useRef(null);

  const processAndUpload = (source, isVideo) => {
    if (isVideo) {
        onUpload(source); 
        return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const MAX_WIDTH = 800; 
    let width = source.width;
    let height = source.height;

    if (width > MAX_WIDTH) {
      height = height * (MAX_WIDTH / width);
      width = MAX_WIDTH;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0, width, height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.7);
    onUpload(imageDataUrl);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      if (isVideo && file.size > 2500000) { 
          alert("⚠️ El video es muy pesado. Intenta uno más corto (3-5 seg).");
          return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (isVideo) {
            processAndUpload(event.target.result, true);
        } else {
            const img = new Image();
            img.onload = () => processAndUpload(img, false);
            img.src = event.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
       <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition"><X size={24} /></button>
       
       <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center mb-4">
             <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                <Camera size={40} className="text-white" />
             </div>
          </div>
          
          <div>
            <h2 className="text-white text-2xl font-bold mb-2">Captura el Momento</h2>
            <p className="text-gray-400 text-sm">Elige qué quieres subir:</p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            {/* BOTÓN 1: CÁMARA FOTO */}
            <button 
                onClick={() => cameraInputRef.current.click()} 
                className="bg-blue-600 text-white font-bold py-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition"
            >
                <Camera size={28} />
                <span className="text-sm">Foto</span>
            </button>

            {/* BOTÓN 2: CÁMARA VIDEO */}
            <button 
                onClick={() => videoInputRef.current.click()} 
                className="bg-red-500 text-white font-bold py-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition"
            >
                <Video size={28} />
                <span className="text-sm">Video</span>
            </button>

            {/* BOTÓN 3: GALERÍA (ANCHO COMPLETO) */}
            <button 
                onClick={() => galleryInputRef.current.click()} 
                className="col-span-2 bg-white/10 border border-white/20 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-lg hover:bg-white/20 active:scale-95 transition"
            >
                <Upload size={24} />
                Subir de Galería
            </button>
          </div>
       </div>

       <canvas ref={canvasRef} className="hidden" />
       
       {/* INPUT 1: FOTO (capture="environment") */}
       <input 
          ref={cameraInputRef} 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleFileSelect} 
       />

       {/* INPUT 2: VIDEO (capture="environment") */}
       <input 
          ref={videoInputRef} 
          type="file" 
          accept="video/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleFileSelect} 
       />

       {/* INPUT 3: GALERÍA (AMBOS) */}
       <input 
          ref={galleryInputRef} 
          type="file" 
          accept="image/*,video/*" 
          className="hidden" 
          onChange={handleFileSelect} 
       />
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
    setShowComments(true);
  };

  const isLiked = post.likes && post.likes.includes(currentUserId);
  const commentsList = post.comments || []; 
  const isVideo = post.imageUrl && post.imageUrl.startsWith('data:video');

  return (
    <div className="bg-white mb-4 shadow-sm border-b border-gray-100 pb-2">
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
      <div className="w-full bg-gray-100">
        {isVideo ? (
            <video controls className="w-full h-auto max-h-[500px]" src={post.imageUrl} />
        ) : (
            <img src={post.imageUrl} alt="Momento" className="w-full h-auto object-cover" />
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={() => onToggleLike(post.id, isLiked)} className={`transition ${isLiked ? 'text-red-500' : 'text-gray-800'}`}>
            <Heart size={26} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button onClick={() => setShowComments(!showComments)} className="text-gray-800">
            <MessageCircle size={26} />
          </button>
        </div>
        {(post.likes?.length > 0) && (
          <p className="text-sm font-bold text-gray-900 mb-2">{post.likes.length} Me gusta</p>
        )}
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

// 4. Perfil con LISTA DE INVITADOS y CONTADOR (SOLO ADMIN)
const ProfileView = ({ user, onLogout, posts, usersList }) => {
  const [showPin, setShowPin] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(user.eventCode);
    alert("¡Código copiado!");
  };

  const handleDownloadAll = async () => {
    if (posts.length === 0) {
        alert("No hay fotos para descargar.");
        return;
    }
    setIsDownloading(true);
    try {
        const zip = new JSZip();
        const folder = zip.folder(`celebrify_${user.eventCode}`);

        posts.forEach((post, index) => {
            if (!post.imageUrl) return;
            const isVideo = post.imageUrl.startsWith('data:video');
            const ext = isVideo ? 'mp4' : 'jpg';
            const base64Data = post.imageUrl.split(',')[1];
            
            if (base64Data) {
                folder.file(`momento_${index + 1}_${post.userName}.${ext}`, base64Data, {base64: true});
            }
        });

        const content = await zip.generateAsync({type: "blob"});
        saveAs(content, `celebrify_${user.eventCode}_album.zip`);
    } catch (e) {
        console.error(e);
        alert("Error al comprimir el archivo.");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 overflow-y-auto pb-32">
       <div className="mb-8 mt-4 text-center">
         <div className="w-24 h-24 bg-blue-900 text-white rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-4 shadow-xl">
           {user.name.charAt(0).toUpperCase()}
         </div>
         <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
         <p className="text-blue-600 font-medium bg-blue-100 inline-block px-3 py-1 rounded-full text-xs mt-2 uppercase">
            {user.role === 'host' ? 'Anfitrión del Evento' : 'Invitado'}
         </p>
       </div>

       <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
         <div className="flex items-center gap-2 mb-2">
            <QrCode size={18} className="text-gray-400"/>
            <p className="text-xs font-bold text-gray-400 uppercase">Invitar amigos</p>
         </div>
         <p className="text-gray-500 text-sm mb-3">Comparte este código para que otros se unan:</p>
         <div onClick={copyCode} className="bg-gray-100 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-gray-200 transition">
            <span className="text-3xl font-mono font-bold text-blue-900 tracking-widest">{user.eventCode}</span>
            <Copy size={20} className="text-gray-400" />
         </div>
       </div>

       {/* SECCIÓN LISTA DE INVITADOS CON CONTADORES (Lógica especial para Admin) */}
       <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
         <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-600"/>
                <p className="text-xs font-bold text-blue-600 uppercase">Invitados ({usersList.length})</p>
            </div>
         </div>
         <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {usersList.map((u, i) => {
                // Calculamos cuántos posts tiene este usuario
                const postCount = posts.filter(p => p.userId === u.deviceId).length;
                
                return (
                    <div key={i} className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                {u.originalName.charAt(0).toUpperCase()}
                            </div>
                            <span>{u.originalName} {u.role === 'host' && '👑'}</span>
                        </div>
                        
                        {/* CONTADOR - SOLO VISIBLE SI ERES EL ANFITRIÓN */}
                        {user.role === 'host' && postCount > 0 && (
                            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                                <ImageIcon size={10} className="text-gray-400"/>
                                <span className="text-xs font-bold text-gray-600">{postCount}</span>
                            </div>
                        )}
                    </div>
                );
            })}
         </div>
         {user.role !== 'host' && usersList.length > 5 && (
             <p className="text-[10px] text-gray-400 text-center mt-2">Desliza para ver más</p>
         )}
       </div>

       {user.role === 'host' && (
         <>
             <button 
                onClick={handleDownloadAll} 
                disabled={isDownloading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mb-6 shadow-lg active:scale-95 transition disabled:opacity-70"
             >
                {isDownloading ? (
                    <>
                        <Loader size={20} className="animate-spin" /> Comprimiendo álbum...
                    </>
                ) : (
                    <>
                        <Download size={20} /> Descargar Álbum Completo (.zip)
                    </>
                )}
             </button>

             {user.adminPin && (
                <div className="bg-yellow-50 rounded-2xl p-6 shadow-sm border border-yellow-100 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock size={18} className="text-yellow-600"/>
                        <p className="text-xs font-bold text-yellow-600 uppercase">PIN de Administrador</p>
                    </div>
                    <p className="text-yellow-800 text-sm mb-3">Esta es la clave para moderar este evento:</p>
                    <div className="bg-white p-4 rounded-xl flex justify-between items-center border border-yellow-200">
                        <span className="text-xl font-mono font-bold text-gray-800 tracking-widest">
                        {showPin ? user.adminPin : '••••'}
                        </span>
                        <button onClick={() => setShowPin(!showPin)} className="text-gray-400 hover:text-blue-600">
                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
             )}
         </>
       )}

       <div className="mt-4">
         <button onClick={onLogout} className="w-full bg-white border border-red-200 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 transition">
           <LogOut size={20} /> Cerrar Sesión
         </button>
         <p className="text-center text-[10px] text-gray-300 mt-4">Tu evento, tu control.</p>
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser || !currentUser) return;
    
    // Escuchar Post
    const postsRef = collection(db, 'events', currentUser.eventCode, 'posts');
    const qPosts = query(postsRef);
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setPosts(data);
    });

    // Escuchar Usuarios
    const usersRef = collection(db, 'events', currentUser.eventCode, 'users');
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
       const users = snapshot.docs.map(doc => doc.data());
       setUsersList(users);
       setPeopleCount(snapshot.size); 
    });

    return () => {
        unsubPosts();
        unsubUsers();
    };
  }, [firebaseUser, currentUser]);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  const handleLogout = () => {
    if (confirm("¿Seguro que quieres salir?")) {
      setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEY);
      setView('feed');
    }
  };

  const handleUpload = async (fileDataUrl) => {
    if (!firebaseUser || !currentUser) return;
    if (fileDataUrl.length > 3500000) { 
       alert("⚠️ El archivo es demasiado grande.");
       return;
    }
    setView('feed');
    try {
      await addDoc(collection(db, 'events', currentUser.eventCode, 'posts'), {
        userId: firebaseUser.uid,
        userName: currentUser.name,
        userRole: currentUser.role,
        imageUrl: fileDataUrl, 
        timestamp: serverTimestamp(),
        comments: [],
        likes: []
      });
    } catch (e) {
      alert("Error subiendo.");
    }
  };

  const handleAddComment = async (postId, text) => {
    if (!firebaseUser || !currentUser) return;
    try {
      const postRef = doc(db, 'events', currentUser.eventCode, 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion({ text, userName: currentUser.name, userId: firebaseUser.uid, timestamp: Date.now() })
      });
    } catch (e) { alert("Error al comentar."); }
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
    if (isLiked) {
       await updateDoc(postRef, { likes: arrayUnion(firebaseUser.uid) });
       const post = posts.find(p => p.id === postId);
       const newLikes = (post.likes || []).filter(uid => uid !== firebaseUser.uid);
       await updateDoc(postRef, { likes: newLikes });
    } else {
       await updateDoc(postRef, { likes: arrayUnion(firebaseUser.uid) });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Cargando...</div>;
  if (!currentUser) return <LoginScreen onJoin={handleLogin} userUid={firebaseUser?.uid} />;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl relative">
      {view === 'camera' ? (
        <CameraView onClose={() => setView('feed')} onUpload={handleUpload} />
      ) : view === 'profile' ? (
        <>
           <header className="bg-white border-b px-4 py-3 sticky top-0 z-10 flex items-center">
             <button onClick={() => setView('feed')} className="mr-3"><X size={24} className="text-gray-400"/></button>
             <h1 className="text-lg font-bold text-gray-800">Mi Perfil</h1>
           </header>
           {/* Pasamos 'usersList' al perfil */}
           <ProfileView user={currentUser} onLogout={handleLogout} posts={posts} usersList={usersList} />
           <nav className="absolute bottom-0 w-full bg-white border-t h-16 flex justify-around items-center z-20 pb-safe">
            <button onClick={() => setView('feed')} className={`p-2 ${view === 'feed' ? 'text-blue-600' : 'text-gray-300'}`}>
              <Home size={28} />
            </button>
            <button onClick={() => setView('camera')} className="bg-blue-900 text-white p-4 rounded-full -translate-y-6 shadow-lg border-4 border-gray-50 hover:scale-105 transition">
              <Camera size={28} />
            </button>
            <button onClick={() => setView('profile')} className={`p-2 ${view === 'profile' ? 'text-blue-600' : 'text-gray-300'}`}>
              <User size={28} />
            </button>
          </nav>
        </>
      ) : (
        <>
          <header className="bg-white/95 backdrop-blur-sm border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-bold text-blue-900 flex items-center font-serif">
                Clebrify <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{currentUser.eventCode}</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                  <Users size={12} className="text-gray-500"/>
                  <span className="text-xs font-bold text-gray-600">{peopleCount}</span>
               </div>
               {currentUser.role === 'host' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold border border-yellow-200">ADMIN</span>}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-20 p-2">
            {posts.length === 0 ? (
              <div className="text-center mt-20 text-gray-400 px-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera size={30} />
                </div>
                <p>¡Aún no hay recuerdos! <br/> Sé el primero en compartir.</p>
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
            <button onClick={() => setView('profile')} className={`p-2 ${view === 'profile' ? 'text-blue-600' : 'text-gray-300'}`}>
              <User size={28} />
            </button>
          </nav>
        </>
      )}
    </div>
  );
}