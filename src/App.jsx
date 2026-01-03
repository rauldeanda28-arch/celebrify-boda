import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Home, User, Trash2, MessageCircle, X, LogOut, Aperture, 
  Heart, Copy, Video, Lock, Upload, QrCode, Eye, EyeOff, 
  Users, Download, Loader, Image as ImageIcon, Sparkles, Sun, Moon,
  ChevronRight, ChevronDown, CheckCircle2, ArrowRight, Mail, UserMinus, ShieldAlert, Instagram,
  Maximize2, Share, PlusSquare, Smartphone
} from 'lucide-react';

// --- IMPORTACIÓN PARA EL MAPA DE VISITAS ---
import { Analytics } from '@vercel/analytics/react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, 
  doc, serverTimestamp, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';

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

// --- SEGURIDAD ---
const MASTER_PIN = "123456";  
const CREATOR_PIN = "777777"; 
const STORAGE_KEY = 'celebrify_v5_7_session'; 
const THEME_KEY = 'celebrify_theme_pref';
const INTRO_KEY = 'celebrify_intro_seen_v1'; // Llave para el tutorial

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- ESTILOS GLOBALES ---
const GlobalStyles = ({ theme }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    
    body {
      background: ${theme === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #172554 100%)' 
        : '#FFFFFF'};
      color: ${theme === 'dark' ? '#f8fafc' : '#1a1a1a'};
      font-family: 'Inter', sans-serif;
      overflow-x: hidden; 
      transition: background 0.5s ease, color 0.5s ease;
    }
    
    h1, h2, h3, .font-serif {
      font-family: 'Playfair Display', serif;
    }

    /* Paneles */
    .glass-panel {
      background: ${theme === 'dark' ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.9)'};
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}; 
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .glass-card {
      background: ${theme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : '#ffffff'};
      backdrop-filter: blur(10px);
      border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }

    /* Botones */
    .btn-primary {
      background: linear-gradient(135deg, #d4af37 0%, #b4932a 100%);
      color: black;
      font-weight: 700;
      transition: all 0.3s ease;
      letter-spacing: 0.02em;
    }
    .btn-primary:active { transform: scale(0.98); opacity: 0.9; }

    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.3); border-radius: 10px; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-enter { animation: fadeIn 0.8s ease-out forwards; }
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

// --- COMPONENTE DE TEMA ---
const ThemeToggle = ({ theme, toggleTheme }) => (
  <button 
    onClick={toggleTheme} 
    className={`p-2.5 rounded-full transition-all duration-500 border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10' : 'bg-gray-100 border-gray-200 text-orange-500 hover:bg-gray-200'}`}
  >
    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
  </button>
);

// --- PANTALLA DE INSTRUCCIONES (ONBOARDING) ---
const OnboardingScreen = ({ onFinish }) => {
  // Detectar si es un dispositivo iOS (iPhone/iPad)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="fixed inset-0 z-[60] bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 overflow-y-auto">
      <div className="w-full max-w-md space-y-6 text-center my-auto">
        
        <div className="mb-4">
           <img src="/logo.svg" alt="Logo" className="w-24 h-24 mx-auto mb-4 rounded-3xl shadow-2xl shadow-yellow-500/20" />
           <h1 className="text-3xl font-serif font-bold text-yellow-500">¡Hola! 👋</h1>
           <p className="text-gray-400 mt-2 text-sm">Bienvenido a Clebrify. Sigue estos pasos para la mejor experiencia.</p>
        </div>

        <div className="space-y-4 text-left bg-white/5 p-6 rounded-2xl border border-white/10">
           {/* PASO 1: INSTALAR */}
           <div className="flex gap-4">
              <div className="bg-yellow-500/20 p-3 rounded-xl h-fit text-yellow-500 flex-shrink-0"><Smartphone size={24}/></div>
              <div>
                 <h3 className="font-bold text-lg mb-1 text-white">1. Instala la App</h3>
                 {isIOS ? (
                    <div className="text-sm text-gray-300 leading-relaxed space-y-2">
                       <p>Para verla en pantalla completa:</p>
                       <p>1. Pulsa el botón <span className="font-bold text-white"><Share size={14} className="inline"/> Compartir</span> en la barra inferior.</p>
                       <p>2. Desliza hacia abajo y selecciona <span className="font-bold text-white"><PlusSquare size={14} className="inline"/> Agregar a Inicio</span>.</p>
                    </div>
                 ) : (
                    <p className="text-sm text-gray-300 leading-relaxed">
                       Si usas Chrome, pulsa el menú de 3 puntos arriba y selecciona <span className="text-white font-bold">"Instalar aplicación"</span> o "Agregar a la pantalla principal".
                    </p>
                 )}
              </div>
           </div>

           {/* PASO 2: REGISTRO */}
           <div className="flex gap-4 pt-4 border-t border-white/5">
              <div className="bg-blue-500/20 p-3 rounded-xl h-fit text-blue-400 flex-shrink-0"><User size={24}/></div>
              <div>
                 <h3 className="font-bold text-lg mb-1 text-white">2. Tu Nombre</h3>
                 <p className="text-sm text-gray-400">Ingresa tu nombre y el código del evento para unirte a la fiesta.</p>
              </div>
           </div>

           {/* PASO 3: FOTOS */}
           <div className="flex gap-4 pt-4 border-t border-white/5">
              <div className="bg-purple-500/20 p-3 rounded-xl h-fit text-purple-400 flex-shrink-0"><Camera size={24}/></div>
              <div>
                 <h3 className="font-bold text-lg mb-1 text-white">3. ¡Captura!</h3>
                 <p className="text-sm text-gray-400">Toma fotos y videos. Todos los invitados verán los momentos en tiempo real.</p>
              </div>
           </div>
        </div>

        <button 
          onClick={onFinish}
          className="w-full btn-primary py-4 rounded-xl text-lg font-bold shadow-lg shadow-yellow-500/20 animate-enter"
        >
          ¡Entendido, vamos! 🚀
        </button>

      </div>
    </div>
  );
};

// --- PANTALLA DE ACCESO DENEGADO (BANEADO) ---
const BannedScreen = ({ onTryAdmin }) => (
  <div className="flex flex-col items-center justify-center h-[100dvh] bg-red-950 text-white p-8 text-center animate-in fade-in zoom-in">
    <div className="bg-red-900/50 p-6 rounded-full mb-6 border border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
        <ShieldAlert size={64} className="text-red-200" />
    </div>
    <h1 className="text-4xl font-serif font-bold mb-4">Acceso Denegado</h1>
    <p className="text-red-200/80 text-lg mb-8">Has sido eliminado de este evento por el anfitrión.</p>
    
    <div className="w-full max-w-xs bg-black/20 p-4 rounded-xl border border-red-500/20 mb-8">
        <p className="text-xs uppercase tracking-widest text-red-400 font-bold">Dispositivo Bloqueado</p>
    </div>

    <button 
        onClick={onTryAdmin}
        className="text-xs text-red-300 underline hover:text-white transition"
    >
        Soy el anfitrión (Ingresar PIN)
    </button>
  </div>
);

// --- LANDING PAGE ---
const LandingPage = ({ onStart, theme, toggleTheme }) => {
  const isDark = theme === 'dark';
  const [imgError, setImgError] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  
  const HERO_IMAGE_URL = "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";

  const features = [
    { icon: Lock, title: "100% Privado", desc: "Tus fotos no son públicas.", details: "Tus recuerdos están encriptados y seguros. Solo tus invitados con el código único pueden ver y subir contenido.", color: "bg-yellow-500" },
    { icon: Video, title: "Video HD", desc: "Sube videos de los mejores momentos.", details: "Soporte completo para videos en alta definición. En Clebrify se ven tal cual los grabaste.", color: "bg-purple-500" },
    { icon: QrCode, title: "Fácil Acceso", desc: "Imprime el QR y listo.", details: "Tus invitados solo tienen que escanearlo con la cámara de su celular para unirse al instante.", color: "bg-blue-500" },
    { icon: Download, title: "Álbum ZIP", desc: "Descarga todo en un solo archivo.", details: "Al final, descarga absolutamente todas las fotos y videos recopilados en un solo archivo ZIP.", color: "bg-green-500" },
  ];

  const toggleFeature = (index) => {
    setActiveFeature(activeFeature === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] overflow-y-auto custom-scrollbar">
      {/* NAVBAR */}
      <nav className={`w-full px-6 py-4 flex justify-between items-center z-50 sticky top-0 backdrop-blur-md border-b ${isDark ? 'bg-[#0f172a]/90 border-white/5' : 'bg-white/90 border-gray-100'}`}>
        <div className="flex items-center gap-2">
          {/* Logo en la Navbar */}
          <img src="/logo.svg" alt="Clebrify" className="w-8 h-8 rounded-lg" />
          <span className={`text-xl font-serif font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Clebrify</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button onClick={onStart} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}>Ingresar <ArrowRight size={16}/></button>
        </div>
      </nav>

      <header className="flex-1 flex flex-col md:flex-row items-center justify-center px-6 py-12 md:py-20 max-w-7xl mx-auto w-full gap-12 md:gap-20">
        <div className="flex-1 text-center md:text-left animate-enter space-y-8 max-w-xl">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${isDark ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-orange-50 text-orange-600 border-orange-100'}`}><Sparkles size={12} /> La App para tus Eventos</div>
          <h1 className={`text-5xl md:text-7xl font-serif font-bold leading-[1.1] ${isDark ? 'text-white' : 'text-gray-900'}`}>Tus recuerdos, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">en un solo lugar.</span></h1>
          <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>La plataforma definitiva <strong>para tus eventos</strong>. Olvida perseguir a tus invitados para que te pasen las fotos; con Clebrify, ellos capturan los momentos en tiempo real y todo se guarda automáticamente en un único álbum privado.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-2">
            <button onClick={onStart} className="btn-primary px-8 py-4 rounded-xl text-lg shadow-xl shadow-yellow-500/10 hover:scale-105 transition active:scale-95 flex items-center justify-center gap-2">Crear Evento</button>
            <button onClick={onStart} className={`px-8 py-4 rounded-xl text-lg font-bold border flex items-center justify-center gap-2 transition hover:bg-gray-50/5 ${isDark ? 'border-white/20 text-white' : 'border-gray-200 text-gray-700'}`}><QrCode size={20}/> Tengo un Código</button>
          </div>
          <div className="pt-4 flex items-center justify-center md:justify-start gap-6 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500"/> Sin descargar app</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500"/> Calidad Original</span>
          </div>
        </div>
        <div className="flex-1 w-full max-w-md md:max-w-lg relative animate-enter" style={{animationDelay: '0.2s'}}>
           <div className={`relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/5] border-4 ${isDark ? 'border-white/5' : 'border-white'} bg-gray-800`}>
              {!imgError ? (<img src={HERO_IMAGE_URL} alt="Fiesta boda elegante" onError={() => setImgError(true)} className="object-cover w-full h-full hover:scale-105 transition duration-1000"/>) : (<div className="w-full h-full bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center text-center p-8"><p className="text-white font-serif text-2xl">Momentos Inolvidables</p></div>)}
              <div className={`absolute bottom-8 left-8 right-8 p-5 rounded-2xl backdrop-blur-xl border ${isDark ? 'bg-[#0f172a]/60 border-white/10' : 'bg-white/80 border-white/40'}`}>
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500 p-0.5"><div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden"><div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-[10px] font-bold">SM</div></div></div>
                       <div><p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sofia M.</p><p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>hace 2 min</p></div>
                    </div>
                    <Heart size={20} className="text-red-500 fill-red-500" />
                 </div>
                 <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>¡Qué noche tan increíble! ✨ Los novios se ven espectaculares.</p>
              </div>
           </div>
        </div>
      </header>

      <section className={`py-20 px-6 ${isDark ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
         <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16"><h2 className={`text-3xl font-serif font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Todo lo que necesitas</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((f, i) => (
                  <button key={i} onClick={() => toggleFeature(i)} className={`text-left w-full p-8 rounded-3xl border transition-all duration-300 hover:scale-[1.01] active:scale-95 cursor-pointer relative group ${activeFeature === i ? (isDark ? 'bg-white/10 border-yellow-500/50' : 'bg-white border-orange-200 shadow-md') : (isDark ? 'bg-[#1e293b] border-white/5 hover:bg-white/5' : 'bg-white border-gray-100 hover:shadow-lg hover:shadow-gray-200/50')}`}>
                     <div className="flex items-start justify-between">
                        <div><div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}><f.icon size={24} /></div><h3 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{f.title}</h3><p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p></div>
                        <div className={`mt-2 transition-transform duration-300 ${activeFeature === i ? 'rotate-180' : ''}`}><ChevronDown size={20} className={isDark ? 'text-gray-500' : 'text-gray-400'} /></div>
                     </div>
                     <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeFeature === i ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}><div className={`pt-4 border-t ${isDark ? 'border-white/10 text-gray-300' : 'border-gray-100 text-gray-600'} text-sm leading-relaxed`}>{f.details}</div></div>
                  </button>
                ))}
            </div>
         </div>
      </section>
      <footer className={`py-12 border-t text-center space-y-4 ${isDark ? 'border-white/5 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
        <p className="text-sm font-bold">Clebrify</p>
        <div className="flex items-center justify-center gap-4">
            <a href="mailto:contacto@clebrify.com" className="hover:text-yellow-500 transition p-2"><Mail size={20} /></a>
            <a href="https://www.instagram.com/clebrify?igsh=MXQxeTlhb2d0dWd4" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition p-2"><Instagram size={20} /></a>
        </div>
        <p className="text-[10px] opacity-60">© 2025 Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

// --- PANTALLA DE LOGIN / REGISTRO ---
const LoginScreen = ({ onJoin, userUid, theme, onBack }) => {
  const [mode, setMode] = useState('join');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [joinFirstName, setJoinFirstName] = useState('');
  const [joinLastName, setJoinLastName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  
  const [createEventName, setCreateEventName] = useState('');
  const [createFirstName, setCreateFirstName] = useState('');
  const [createLastName, setCreateLastName] = useState('');
  const [masterPinInput, setMasterPinInput] = useState('');
  const [createdEventData, setCreatedEventData] = useState(null);

  const isDark = theme === 'dark';
  const inputClass = `w-full rounded-xl px-4 py-3 text-center font-mono text-lg tracking-widest outline-none transition ${isDark ? 'bg-[#1e293b] border-white/10 text-white placeholder-gray-500 focus:border-yellow-500/50' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-yellow-500/50'}`;
  const inputRegularClass = `w-full rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-[#1e293b] border-white/10 text-white placeholder-gray-500 focus:border-yellow-500/50' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-yellow-500/50'}`;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) setJoinCode(urlCode.toUpperCase());
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!createEventName || !createFirstName || !createLastName || !masterPinInput) {
        setError('⚠️ Debes llenar todos los datos del evento.');
        return;
    }
    
    if (masterPinInput !== MASTER_PIN && masterPinInput !== CREATOR_PIN) { setError('⛔ Licencia inválida.'); return; }
    setLoading(true); setError('');
    const fullName = `${createFirstName.trim()} ${createLastName.trim()}`;
    try {
      const newEventCode = generateCode(6);
      const newAdminPin = Math.floor(1000 + Math.random() * 9000).toString();
      const eventRef = doc(db, 'events', newEventCode);
      await setDoc(eventRef, { eventName: createEventName, hostName: fullName, adminPin: newAdminPin, createdAt: serverTimestamp(), code: newEventCode, theme: 'elegant' });
      const hostId = normalizeName(fullName);
      await setDoc(doc(db, 'events', newEventCode, 'users', hostId), { originalName: fullName, deviceId: userUid, role: 'host', joinedAt: serverTimestamp() });
      setCreatedEventData({ code: newEventCode, pin: newAdminPin, name: createEventName });
      setMode('success_create');
    } catch (err) { setError('Error al crear.'); } finally { setLoading(false); }
  };

  const handleJoinEvent = async (e) => {
    e.preventDefault();
    
    if (!joinFirstName.trim() || !joinLastName.trim()) {
        setError('⚠️ Por favor escribe tu Nombre y Apellido completos.');
        return;
    }
    if (!joinCode.trim()) {
        setError('⚠️ Falta el código del evento.');
        return;
    }

    if (isAdminLogin && !adminPinInput) {
        setError('⚠️ Debes ingresar el PIN de administrador.');
        return;
    }

    setLoading(true); setError('');
    const fullName = `${joinFirstName.trim()} ${joinLastName.trim()}`;
    try {
      const code = joinCode.toUpperCase().trim();
      const eventRef = doc(db, 'events', code);
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) { setError('¡Código no existe!'); setLoading(false); return; }
      
      const eventData = eventSnap.data();
      let role = 'guest';
      let isValidAdmin = false;

      // 1. VERIFICAR SI ES ADMIN (INMUNIDAD)
      if (isAdminLogin) {
        if (adminPinInput === eventData.adminPin || adminPinInput === MASTER_PIN) { 
            role = 'host'; 
            isValidAdmin = true; 
            const banRef = doc(db, 'events', code, 'banned', userUid);
            await deleteDoc(banRef);
        } else { 
            setError('PIN incorrecto.'); 
            setLoading(false); 
            return; 
        }
      }

      // 2. VERIFICAR BANEOS
      if (!isValidAdmin) {
          const banRef = doc(db, 'events', code, 'banned', userUid);
          const banSnap = await getDoc(banRef);
          if (banSnap.exists()) {
              setError('⛔ Has sido vetado de este evento.');
              setLoading(false);
              return;
          }
      }

      const cleanName = normalizeName(fullName);
      const userRef = doc(db, 'events', code, 'users', cleanName);
      const userSnap = await getDoc(userRef);
      
      // --- LÓGICA DE REINGRESO ---
      if (userSnap.exists()) {
          await updateDoc(userRef, { deviceId: userUid, joinedAt: serverTimestamp() });
      } else { 
          await setDoc(userRef, { originalName: fullName, deviceId: userUid, role: role, joinedAt: serverTimestamp() }); 
      }

      onJoin({ name: fullName, role, eventCode: code, eventName: eventData.eventName, adminPin: role === 'host' ? eventData.adminPin : null });
    } catch (err) { setError('Error de conexión.'); } finally { setLoading(false); }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert('¡Copiado!'); };

  if (mode === 'success_create') {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] p-6 relative overflow-hidden">
        <div className="glass-panel p-8 rounded-3xl w-full max-w-sm text-center relative z-10 border border-yellow-500/20">
          <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/20"><Sparkles size={32} className="text-black" /></div>
          <h2 className={`text-3xl font-serif font-bold mb-6 ${isDark ? 'text-yellow-50' : 'text-gray-900'}`}>¡Evento Creado!</h2>
          <div className={`${isDark ? 'bg-white/5' : 'bg-black/5'} rounded-xl p-4 mb-4`}><p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-widest">Código de Invitados</p><div className="flex items-center justify-between"><span className="text-4xl font-mono font-bold text-yellow-500 tracking-wider">{createdEventData.code}</span><button onClick={() => copyToClipboard(createdEventData.code)} className="p-2 hover:bg-white/10 rounded-full"><Copy size={20} className={isDark ? 'text-white' : 'text-gray-600'} /></button></div></div>
          <div className="bg-red-500/10 rounded-xl p-4 mb-8 border border-red-500/20"><p className="text-[10px] text-red-400 uppercase font-bold mb-2">PIN Admin (Privado)</p><div className="flex items-center justify-between"><span className={`text-xl font-mono font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{createdEventData.pin}</span><button onClick={() => copyToClipboard(createdEventData.pin)} className="p-2 hover:bg-red-500/20 rounded-full"><Copy size={16} className={isDark ? 'text-white' : 'text-gray-600'} /></button></div></div>
          <button onClick={() => onJoin({ name: `${createFirstName} ${createLastName}`, role: 'host', eventCode: createdEventData.code, eventName: createEventName, adminPin: createdEventData.pin })} className="w-full btn-primary py-4 rounded-xl shadow-lg">Entrar ahora</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] p-6 relative animate-in fade-in">
      
      {/* HEADER CON LOGO */}
      <nav className="absolute top-0 left-0 w-full px-6 py-6 flex items-center z-20">
        <button onClick={onBack} className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8 rounded-lg" />
          <span className={`text-xl font-serif font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Clebrify</span>
        </button>
      </nav>

      {/* SECCIÓN DE BIENVENIDA */}
      <div className="mb-8 text-center z-10 animate-enter mt-10">
        <img src="/logo.svg" alt="Clebrify Logo" className="w-20 h-20 mx-auto mb-6 shadow-xl rounded-[2rem] hover:scale-105 transition duration-500" />
        <h1 className={`text-4xl font-bold font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Bienvenido</h1>
        <p className="text-gray-400 text-sm mt-2">Ingresa tu nombre para acceder al evento</p>
      </div>

      <div className="w-full max-w-sm glass-panel rounded-3xl overflow-hidden z-10 shadow-2xl animate-enter" style={{animationDelay: '0.1s'}}>
        {/* PESTAÑAS INVITADO / ADMINISTRADOR */}
        <div className={`flex border-b ${isDark ? 'border-white/10' : 'border-black/5'}`}>
            <button onClick={() => setMode('join')} className={`flex-1 py-4 font-bold text-sm tracking-wide transition-colors ${mode === 'join' ? 'bg-white/5 text-yellow-500' : 'text-gray-500 hover:text-gray-400'}`}>INVITADO</button>
            <button onClick={() => setMode('create')} className={`flex-1 py-4 font-bold text-sm tracking-wide transition-colors ${mode === 'create' ? 'bg-white/5 text-yellow-500' : 'text-gray-500 hover:text-gray-400'}`}>ADMINISTRADOR</button>
        </div>
        
        <div className="p-8">
          {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center flex items-center justify-center gap-2 font-bold animate-in fade-in slide-in-from-top-2"><ShieldAlert size={16}/> {error}</div>}
          {mode === 'join' ? (
            <form onSubmit={handleJoinEvent} className="space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">CÓDIGO</label><input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className={`${inputClass} border`} placeholder="XY2Z" maxLength={6} /></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">NOMBRE</label><input type="text" value={joinFirstName} onChange={(e) => setJoinFirstName(e.target.value)} className={`${inputRegularClass} border`} placeholder="Juan" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">APELLIDO</label><input type="text" value={joinLastName} onChange={(e) => setJoinLastName(e.target.value)} className={`${inputRegularClass} border`} placeholder="Pérez" /></div></div>
              <div className="flex items-center gap-3 pt-2"><input type="checkbox" checked={isAdminLogin} onChange={() => setIsAdminLogin(!isAdminLogin)} className="h-4 w-4 accent-yellow-400 bg-black/30 rounded border-gray-600" /><span className="text-xs text-gray-500">Soy Admin / Anfitrión</span></div>
              {isAdminLogin && (<div className="animate-in fade-in slide-in-from-top-2"><input type="tel" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value)} className={`${inputRegularClass} text-center tracking-widest border border-yellow-500/30 text-yellow-600`} placeholder="PIN ADMIN" maxLength={6} /></div>)}
              <button disabled={loading} className="w-full btn-primary py-4 rounded-xl mt-4 shadow-lg">{loading ? <Loader className="animate-spin mx-auto text-black" /> : 'Entrar'}</button>
            </form>
          ) : (
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">EVENTO</label><input type="text" value={createEventName} onChange={(e) => setCreateEventName(e.target.value)} className={`${inputRegularClass} border`} placeholder="Ej. Boda Ana y Luis" /></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">NOMBRE</label><input type="text" value={createFirstName} onChange={(e) => setCreateFirstName(e.target.value)} className={`${inputRegularClass} border`} placeholder="Ana" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">APELLIDO</label><input type="text" value={createLastName} onChange={(e) => setCreateLastName(e.target.value)} className={`${inputRegularClass} border`} placeholder="López" /></div></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">LICENCIA</label><input type="password" value={masterPinInput} onChange={(e) => setMasterPinInput(e.target.value)} className={`${inputRegularClass} border border-red-500/20`} placeholder="PIN Maestro" /></div>
              <button disabled={loading} className="w-full btn-primary py-4 rounded-xl mt-2 shadow-lg">{loading ? <Loader className="animate-spin mx-auto text-black" /> : 'Crear Evento'}</button>
            </form>
          )}
        </div>
      </div>
      <div className="absolute bottom-6 z-10 text-center opacity-40 text-xs"><a href="mailto:contacto@clebrify.com" className="hover:underline flex items-center justify-center gap-1 transition hover:text-yellow-600"><Mail size={12} /> contacto@clebrify.com</a></div>
    </div>
  );
};

// --- COMPONENTE CÁMARA (Sin cambios) ---
const CameraView = ({ onClose, onUpload, theme }) => {
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const canvasRef = useRef(null);
  const isDark = theme === 'dark';

  const processImage = (source) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const MAX_WIDTH = 1080;
    let width = source.width; let height = source.height;
    if (width > MAX_WIDTH) { height = height * (MAX_WIDTH / width); width = MAX_WIDTH; }
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(source, 0, 0, width, height);
    onUpload({ type: 'image', data: canvas.toDataURL('image/jpeg', 0.85) });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        if (file.size > 100000000) { alert("⚠️ Video muy pesado (Max 100MB)."); return; }
        onUpload({ type: 'video', data: file });
      } else {
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
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in`} style={{background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #172554 100%)' : '#FFFFFF'}}>
       <button onClick={onClose} className={`absolute top-6 right-6 p-3 rounded-full z-10 ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}><X size={24} /></button>
       <div className="w-full max-w-sm text-center space-y-6 relative z-10">
          <div className="flex justify-center mb-4"><div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}><Camera size={40} className={isDark ? 'text-white' : 'text-black'} /></div></div>
          <h2 className={`text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Capturar</h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => cameraInputRef.current.click()} className={`p-6 rounded-2xl flex flex-col items-center gap-2 border transition ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-100 hover:bg-gray-50 shadow-sm'}`}><Camera size={32} className="text-yellow-500" /><span className="text-sm font-bold">Foto</span></button>
            <button onClick={() => videoInputRef.current.click()} className={`p-6 rounded-2xl flex flex-col items-center gap-2 border transition ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-100 hover:bg-gray-50 shadow-sm'}`}><Video size={32} className="text-purple-500" /><span className="text-sm font-bold">Video</span></button>
            <button onClick={() => galleryInputRef.current.click()} className={`col-span-2 p-4 rounded-xl flex items-center justify-center gap-2 border ${isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-white border-gray-100 text-gray-600 shadow-sm'}`}><Upload size={20} /> Galería</button>
          </div>
       </div>
       <canvas ref={canvasRef} className="hidden" />
       <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
       <input ref={videoInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={handleFileSelect} />
       <input ref={galleryInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};

// --- COMPONENTE VISOR DE MEDIOS (SIMPLE) ---
const MediaViewer = ({ media, onClose }) => {
  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-200 cursor-pointer backdrop-blur-sm"
    >
      {/* Botón X muy discreto en la esquina por si acaso */}
      <button className="absolute top-5 right-5 text-white/50 hover:text-white transition">
        <X size={32} />
      </button>

      {media.type === 'video' ? (
        <video 
            src={media.url} 
            controls 
            autoPlay 
            className="max-w-full max-h-[90vh] rounded shadow-2xl outline-none" 
            onClick={(e) => e.stopPropagation()} // Para que el click en los controles del video no lo cierre
        />
      ) : (
        <img 
            src={media.url} 
            alt="Full screen" 
            className="max-w-full max-h-[95vh] object-contain shadow-2xl transition-transform duration-300 hover:scale-[1.02]" 
        />
      )}
    </div>
  );
};

// --- COMPONENTE POST CARD ---
const PostCard = ({ post, currentUser, currentUserId, onDeletePost, onAddComment, onDeleteComment, onToggleLike, theme, onOpenMedia }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const handleSubmitComment = (e) => { e.preventDefault(); if (!commentText.trim()) return; onAddComment(post.id, commentText); setCommentText(''); setShowComments(true); };
  const isLiked = post.likes && post.likes.includes(currentUserId);
  const looksLikeVideo = (url) => url?.includes('.mp4') || url?.includes('video') || url?.startsWith('data:video');
  const isDark = theme === 'dark';

  return (
    <div className="glass-card mb-8 rounded-3xl overflow-hidden transition-all duration-500">
      <div className={`flex items-center justify-between p-4 backdrop-blur-md ${isDark ? 'bg-[#0f172a]/90 border-white/5' : 'bg-white/60'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-inner border ${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>{post.userName.charAt(0).toUpperCase()}</div>
          <span className={`text-sm font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{post.userName}</span>
        </div>
        {currentUser.role === 'host' && (
          <button onClick={() => onDeletePost(post.id)} className="text-gray-400 hover:text-red-400 p-2"><Trash2 size={18} /></button>
        )}
      </div>
      
      <div 
        className="w-full bg-black/50 cursor-pointer relative group"
        onClick={() => onOpenMedia({ url: post.imageUrl, type: looksLikeVideo(post.imageUrl) ? 'video' : 'image' })}
      >
        {looksLikeVideo(post.imageUrl) ? ( 
           <>
             <video className="w-full h-auto max-h-[500px] object-cover" src={post.imageUrl} />
             <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/30 text-white"><Maximize2 size={24} /></div>
             </div>
           </>
        ) : ( 
           <img src={post.imageUrl} alt="Momento" className="w-full h-auto object-cover" /> 
        )}
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-6">
          <button onClick={() => onToggleLike(post.id, isLiked)} className={`transition active:scale-90 ${isLiked ? 'text-red-500' : isDark ? 'text-gray-300' : 'text-gray-600'}`}><Heart size={26} fill={isLiked ? "currentColor" : "none"} /></button>
          <button onClick={() => setShowComments(!showComments)} className={isDark ? 'text-gray-300' : 'text-gray-600'}><MessageCircle size={26} /></button>
        </div>
        {post.likes?.length > 0 && <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{post.likes.length} Me gusta</p>}
        <div className="flex flex-col gap-2">
          {(post.comments || []).slice(showComments ? 0 : -2).map((comment, idx) => (
            <div key={idx} className="text-sm flex justify-between items-start">
              <span><span className="font-bold mr-2 text-yellow-600">{comment.userName}</span><span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{comment.text}</span></span>
              {currentUser.role === 'host' && <button onClick={() => onDeleteComment(post.id, comment)} className="text-gray-400"><X size={12} /></button>}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmitComment} className={`flex items-center gap-2 pt-2 border-t mt-1 ${isDark ? 'border-white/10' : 'border-black/5'}`}>
          <input type="text" placeholder="Comentar..." className={`flex-1 bg-transparent text-sm outline-none py-2 ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} value={commentText} onChange={(e) => setCommentText(e.target.value)} />
          <button type="submit" disabled={!commentText.trim()} className="text-yellow-600 font-bold text-sm disabled:opacity-30">Enviar</button>
        </form>
      </div>
    </div>
  );
};

// --- COMPONENTE PERFIL ---
const ProfileView = ({ user, onLogout, posts, usersList, theme, toggleTheme, onKickGuest }) => {
  const [showPin, setShowPin] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const appUrl = typeof window !== 'undefined' ? `${window.location.origin}?code=${user.eventCode}` : '';
  const copyCode = () => { navigator.clipboard.writeText(user.eventCode); alert("¡Código copiado!"); };
  const isDark = theme === 'dark';

  const handleDownloadAll = async () => { 
    if (posts.length === 0) { alert("No hay fotos."); return; } 
    setIsDownloading(true); 
    try { 
      const zip = new JSZip(); 
      const folder = zip.folder(`celebrify_${user.eventCode}`); 
      const downloadPromises = posts.map(async (post, index) => {
          if (!post.imageUrl) return;
          try {
             let data; let ext = 'jpg';
             if (post.imageUrl.startsWith('http')) {
                 const response = await fetch(post.imageUrl);
                 const blob = await response.blob();
                 data = blob;
                 if (post.imageUrl.includes('video') || post.imageUrl.includes('.mp4')) ext = 'mp4';
             } else {
                 const isVideo = post.imageUrl.startsWith('data:video');
                 ext = isVideo ? 'mp4' : 'jpg';
                 data = post.imageUrl.split(',')[1];
             }
             const filename = `momento_${index + 1}_${post.userName}.${ext}`;
             if (post.imageUrl.startsWith('http')) folder.file(filename, data);
             else folder.file(filename, data, {base64: true});
          } catch (err) { console.error("Error descargando uno:", err); }
      });
      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({type: "blob"}); 
      saveAs(content, `celebrify_${user.eventCode}_album.zip`); 
    } catch (e) { alert("Error al generar ZIP."); console.error(e); } finally { setIsDownloading(false); } 
  };

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto pb-44 relative z-10">
       
       {showQRModal && (<div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in cursor-pointer" onClick={() => setShowQRModal(false)}><button onClick={() => setShowQRModal(false)} className="absolute top-6 right-6 text-white p-3 bg-white/10 rounded-full hover:bg-white/20"><X size={24}/></button><div onClick={(e) => e.stopPropagation()} className="bg-white p-8 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)] flex flex-col items-center relative"><button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X size={20}/></button><h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Escanea para unirte</h3><div className="border-2 border-gray-100 rounded-xl overflow-hidden"><QRCode value={appUrl} size={256} /></div><p className="mt-6 text-3xl font-mono font-bold text-slate-900 tracking-[0.2em]">{user.eventCode}</p></div></div>)}
       
       <div className="mb-10 mt-6 text-center z-10">
         <div className={`w-28 h-28 border-2 rounded-full flex items-center justify-center text-5xl font-serif font-bold mx-auto mb-4 shadow-xl ${isDark ? 'bg-gradient-to-br from-gray-700 to-black border-yellow-500/30 text-white' : 'bg-white border-yellow-500/30 text-gray-900'}`}>
            {user.name.charAt(0).toUpperCase()}
         </div>
         <h2 className={`text-3xl font-bold font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</h2>
         <div className="flex justify-center mt-3"><span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'host' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{user.role === 'host' ? 'Anfitrión' : 'Invitado'}</span></div>
       </div>

       <div className="glass-panel rounded-3xl p-6 mb-6 z-10"><div className="flex items-center gap-2 mb-4"><QrCode size={18} className="text-yellow-500"/><p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Invitar amigos</p></div><div className="flex gap-3"><div onClick={copyCode} className={`flex-1 border p-4 rounded-xl flex justify-between items-center cursor-pointer transition group ${isDark ? 'bg-black/30 border-white/10 hover:bg-white/5' : 'bg-white border-gray-100 hover:bg-gray-50'}`}><span className={`text-3xl font-mono font-bold tracking-widest group-hover:text-yellow-500 transition ${isDark ? 'text-white' : 'text-gray-800'}`}>{user.eventCode}</span><Copy size={20} className="text-gray-400 group-hover:text-white" /></div><button onClick={() => setShowQRModal(true)} className={`p-4 rounded-xl flex items-center justify-center transition shadow-lg ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}><QrCode size={28} /></button></div></div>
       <div className="glass-panel rounded-3xl p-6 mb-6 z-10">
         <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Users size={18} className="text-green-500"/><p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Lista de Invitados ({usersList.length})</p></div></div>
         <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {usersList.map((u, i) => {
                const postCount = posts.filter(p => p.userId === u.deviceId).length;
                return (
                    <div key={i} className={`flex items-center justify-between text-sm p-3 rounded-xl border ${isDark ? 'text-gray-300 bg-white/5 border-white/5' : 'text-gray-600 bg-white border-gray-100'}`}>
                        <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>{u.originalName.charAt(0).toUpperCase()}</div><span className="font-medium">{u.originalName} {u.role === 'host' && '👑'}</span></div>
                        <div className="flex items-center gap-2">{postCount > 0 && (<div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20"><ImageIcon size={10} className="text-green-500"/><span className="text-xs font-bold text-green-600">{postCount}</span></div>)}{user.role === 'host' && u.role !== 'host' && (<button onClick={() => onKickGuest(u.id, u.deviceId)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition" title="Expulsar invitado"><UserMinus size={16} /></button>)}</div>
                    </div>
                );
            })}
         </div>
       </div>
       {user.role === 'host' && (<div className="z-10 relative"><button onClick={handleDownloadAll} disabled={isDownloading} className="w-full bg-green-900/20 border border-green-500/30 text-green-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2 mb-4 hover:bg-green-900/30 transition">{isDownloading ? 'Descargando...' : 'Descargar Álbum'}</button>{user.adminPin && (<div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/20 mb-6"><div className="flex items-center gap-2 mb-2"><Lock size={18} className="text-red-400"/><p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Tu PIN Maestro</p></div><div className={`p-4 rounded-xl flex justify-between items-center border ${isDark ? 'bg-black/40 border-red-500/10' : 'bg-white border-red-200'}`}><span className={`text-xl font-mono font-bold tracking-[0.3em] ${isDark ? 'text-red-100' : 'text-red-900'}`}>{showPin ? user.adminPin : '••••'}</span><button onClick={() => setShowPin(!showPin)} className="text-red-400 hover:text-red-500">{showPin ? <EyeOff size={20} /> : <Eye size={20} />}</button></div></div>)}</div>)}
       <div className="mt-6 mb-6 z-10 relative"><button onClick={onLogout} className="w-full bg-red-500/5 border border-red-500/20 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/10 transition relative z-10"><LogOut size={20} /> Cerrar Sesión</button></div>
       <div className="text-center opacity-40 pb-10 text-xs"><p className="mb-1">¿Necesitas ayuda?</p><a href="mailto:contacto@clebrify.com" className="font-bold hover:underline flex items-center justify-center gap-1"><Mail size={12} /> contacto@clebrify.com</a></div>
    </div>
  );
};

// --- COMPONENTE MAIN APP ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : null; });
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  const [peopleCount, setPeopleCount] = useState(0); 
  const [view, setView] = useState('feed'); 
  const [loading, setLoading] = useState(true);
  const [uploadingStatus, setUploadingStatus] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [banned, setBanned] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null); 
  
  // -- ESTADO PARA LA INTRODUCCIÓN --
  const [showIntro, setShowIntro] = useState(false);

  // -- TEMA (Dark/Light) --
  const [theme, setTheme] = useState(() => {
      const savedTheme = localStorage.getItem(THEME_KEY);
      return savedTheme ? savedTheme : 'dark';
  });

  const toggleTheme = () => {
      setTheme(prev => {
          const newTheme = prev === 'dark' ? 'light' : 'dark';
          localStorage.setItem(THEME_KEY, newTheme);
          return newTheme;
      });
  };

  const isDark = theme === 'dark';

  // --- EFECTO PARA CAMBIAR EL FAVICON Y TITULO AL LOGO ---
  useEffect(() => {
    // 1. Poner el nombre correcto
    document.title = "Clebrify";

    // 2. Icono estándar
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = '/logo.svg'; 
    link.type = 'image/svg+xml';

    // 3. NUEVO: Icono especial para Apple (Safari)
    let appleLink = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.getElementsByTagName('head')[0].appendChild(appleLink);
    }
    appleLink.href = '/logo.svg';

  }, []);

  // --- EFECTO: REVISAR SI MOSTRAR LA INTRODUCCIÓN ---
  useEffect(() => {
    // Solo mostramos la intro si:
    // 1. No hay usuario logueado actualmente.
    // 2. No la ha visto antes (revisando localStorage).
    const hasSeen = localStorage.getItem(INTRO_KEY);
    if (!hasSeen && !currentUser) {
        setShowIntro(true);
    }
  }, [currentUser]);

  const handleFinishIntro = () => {
      setShowIntro(false);
      localStorage.setItem(INTRO_KEY, 'true'); // Guardamos que ya la vio
  };

  useEffect(() => {
    if (currentUser) {
      setShowLanding(false);
    }
  }, [currentUser]);

  useEffect(() => { 
    signInAnonymously(auth)
      .then(u => setFirebaseUser(u.user))
      .catch(console.error)
      .finally(() => setLoading(false)); 
  }, []);

  useEffect(() => {
    if (!currentUser || !firebaseUser) return;
    const code = currentUser.eventCode;
    const myUid = firebaseUser.uid;

    const banRef = doc(db, 'events', code, 'banned', myUid);
    const unsubBan = onSnapshot(banRef, (docSnap) => {
        if (docSnap.exists() && currentUser.role !== 'host') {
            setBanned(true);
            setCurrentUser(null);
            localStorage.removeItem(STORAGE_KEY);
        }
    });

    return () => unsubBan();
  }, [currentUser, firebaseUser]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubP = onSnapshot(query(collection(db, 'events', currentUser.eventCode, 'posts')), s => {
      setPosts(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b)=>(b.timestamp?.seconds||0)-(a.timestamp?.seconds||0)));
    });
    const unsubU = onSnapshot(collection(db, 'events', currentUser.eventCode, 'users'), s => {
       setUsersList(s.docs.map(d => ({ id: d.id, ...d.data() }))); 
       setPeopleCount(s.size);
    });
    return () => { unsubP(); unsubU(); };
  }, [currentUser]);

  const handleLogin = (d) => { 
    setCurrentUser(d); 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); 
    setShowLanding(false);
  };
  
  const handleLogout = async () => { 
    if(confirm("¿Salir y cerrar sesión?")){ 
      try {
        await signOut(auth); // Esto borra la identidad de Firebase
      } catch(e) { console.error(e); }
      
      setCurrentUser(null); 
      localStorage.removeItem(STORAGE_KEY); 
      setView('feed'); 
      setShowLanding(true); 
      
      // Recargamos la página para asegurar que el sistema inicie limpio
      window.location.reload();
    }
  };

  const handleKickGuest = async (guestId, guestUid) => {
    if(!confirm("¿Estás seguro? Esta acción bloqueará el dispositivo del usuario para siempre.")) return;
    try {
        await setDoc(doc(db, 'events', currentUser.eventCode, 'banned', guestUid), {
            bannedAt: serverTimestamp(),
            originalName: guestId 
        });
        await deleteDoc(doc(db, 'events', currentUser.eventCode, 'users', guestId));
    } catch(e) {
        console.error("Error al expulsar:", e);
        alert("No se pudo expulsar al usuario.");
    }
  };

  const handleUpload = async (uploadObject) => {
    setUploadingStatus(true);
    setView('feed'); 
    try {
        const timestamp = Date.now();
        const type = uploadObject.type;
        let downloadUrl = '';
        const folder = type === 'video' ? 'videos' : 'images';
        const ext = type === 'video' ? 'mp4' : 'jpg';
        const fileName = `${timestamp}_${Math.floor(Math.random()*1000)}.${ext}`;
        const storageRef = ref(storage, `events/${currentUser.eventCode}/${folder}/${fileName}`);

        if (type === 'video') {
            const snapshot = await uploadBytes(storageRef, uploadObject.data);
            downloadUrl = await getDownloadURL(snapshot.ref);
        } else {
            const snapshot = await uploadString(storageRef, uploadObject.data, 'data_url');
            downloadUrl = await getDownloadURL(snapshot.ref);
        }

        await addDoc(collection(db, 'events', currentUser.eventCode, 'posts'), { 
          userId: firebaseUser.uid, 
          userName: currentUser.name, 
          userRole: currentUser.role, 
          imageUrl: downloadUrl, 
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#09090b] text-white"><Loader className="animate-spin" /></div>;
  
  if (banned) {
      return (
        <>
            <GlobalStyles theme="dark" />
            <BannedScreen onTryAdmin={() => setBanned(false)} />
        </>
      );
  }

  // --- NUEVA LÓGICA: MOSTRAR INTRO ANTES DEL LANDING ---
  if (showIntro) {
      return (
          <>
            <GlobalStyles theme="dark" /> {/* La intro siempre es dark mode para elegancia */}
            <OnboardingScreen onFinish={handleFinishIntro} />
          </>
      );
  }

  if (showLanding && !currentUser) {
    return (
      <>
        <GlobalStyles theme={theme} />
        <LandingPage onStart={() => setShowLanding(false)} theme={theme} toggleTheme={toggleTheme} />
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <GlobalStyles theme={theme} />
        <LoginScreen onJoin={handleLogin} userUid={firebaseUser?.uid} theme={theme} onBack={() => setShowLanding(true)} />
      </>
    );
  }

  // APP PRINCIPAL
  return (
    <>
    <GlobalStyles theme={theme} />
    <Analytics />
    
    <div className="flex flex-col h-screen max-w-md mx-auto shadow-2xl relative overflow-hidden transition-colors duration-500" style={{ background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #172554 100%)' : '#FFFFFF' }}>
      
      {/* VISOR DE MEDIOS SE MUESTRA SI HAY ALGO SELECCIONADO */}
      {selectedMedia && (
        <MediaViewer media={selectedMedia} onClose={() => setSelectedMedia(null)} />
      )}

      {uploadingStatus && (
          <div className="absolute inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center text-white backdrop-blur-sm">
              <Loader className="animate-spin mb-4 text-yellow-500" size={40} />
              <p className="font-bold font-serif text-lg">Subiendo momento...</p>
              <p className="text-xs text-gray-400 mt-2">Por favor no cierres la app</p>
          </div>
      )}

      {view === 'camera' ? <CameraView onClose={() => setView('feed')} onUpload={handleUpload} theme={theme} /> : view === 'profile' ? (
        <>
           <div className={`px-6 py-4 flex justify-between items-center border-b transition-colors ${isDark ? 'bg-[#0f172a]/90 border-white/5' : 'bg-white/90 border-gray-100'}`}>
             <div className="flex items-center gap-4">
                <button onClick={() => setView('feed')}><X className={isDark ? 'text-white' : 'text-black'}/></button>
                <h1 className={`text-xl font-bold font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Mi Perfil</h1>
             </div>
             <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
           </div>
           <ProfileView user={currentUser} onLogout={handleLogout} posts={posts} usersList={usersList} theme={theme} toggleTheme={toggleTheme} onKickGuest={handleKickGuest} />
        </>
      ) : (
        <>
          <header className={`backdrop-blur-md px-6 py-3 flex justify-between items-center sticky top-0 z-30 border-b transition-colors ${isDark ? 'bg-[#0f172a]/90 border-white/5' : 'bg-white/90 border-gray-100'}`}>
            <div onClick={() => setView('feed')} className="cursor-pointer">
              <h1 className={`text-lg font-bold font-serif leading-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Clebrify
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border tracking-widest ${isDark ? 'bg-white/5 text-gray-400 border-white/5' : 'bg-black/5 text-gray-500 border-black/5'}`}>{currentUser.eventCode}</span>
              </h1>
              <p className="text-sm text-yellow-600/90 font-medium max-w-[200px] truncate">{currentUser.eventName}</p>
            </div>
            <div className="flex gap-2">
              <div className={`border px-2 py-1 rounded-full flex items-center gap-1 text-xs ${isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-black/5 border-black/5 text-gray-600'}`}>
                <Users size={12} /> {peopleCount}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto pb-24 p-5 custom-scrollbar relative z-10">
            {posts.length === 0 ? <div className="text-center mt-32 opacity-50"><Aperture size={40} className="mx-auto mb-4 text-gray-500"/><p className="text-gray-500 font-serif">Sin fotos aún</p></div> : 
              posts.map(p => (
                <PostCard 
                  key={p.id} 
                  post={p} 
                  currentUser={currentUser} 
                  currentUserId={firebaseUser?.uid} 
                  onDeletePost={handleDeletePost} 
                  onAddComment={handleAddComment} 
                  onDeleteComment={handleDeleteComment} 
                  onToggleLike={onToggleLike} 
                  theme={theme}
                  onOpenMedia={setSelectedMedia} 
                />
              ))
            }
          </main>
        </>
      )}

      <nav className={`fixed bottom-6 left-0 right-0 mx-auto w-[90%] max-w-[350px] backdrop-blur-xl border rounded-2xl h-16 flex justify-between items-center z-50 shadow-2xl px-6 transition-colors duration-500 ${isDark ? 'bg-[#0f172a]/95 border-white/10' : 'bg-white/90 border-gray-200'}`}>
        <button onClick={() => setView('feed')} className={`p-3 rounded-xl transition ${view === 'feed' ? (isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black') : 'text-gray-400 hover:text-gray-600'}`}>
          <Home size={24} />
        </button>
        
        <button onClick={() => setView('camera')} className={`p-3 rounded-xl hover:scale-105 transition active:scale-95 flex items-center justify-center border-2 ${isDark ? 'text-white border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-gradient-to-tr from-yellow-500 to-amber-600 text-black border-yellow-400/20 shadow-[0_0_15px_rgba(234,179,8,0.3)]'}`}>
          <Camera size={24} />
        </button>
        
        <button onClick={() => setView('profile')} className={`p-3 rounded-xl transition ${view === 'profile' ? (isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black') : 'text-gray-400 hover:text-gray-600'}`}>
          <User size={24} />
        </button>
      </nav>
    </div>
    </>
  );
}