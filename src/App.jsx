import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Home, User, Trash2, MessageCircle, X, LogOut, Aperture, 
  Heart, Copy, Video, Lock, Upload, QrCode, Eye, EyeOff, 
  Users, Download, Loader, Image as ImageIcon, Sparkles, Sun, Moon,
  ChevronRight, ChevronDown, CheckCircle2, ArrowRight, Mail, UserMinus, ShieldAlert, Instagram,
  Maximize2, Share, PlusSquare, Smartphone, Edit2, Wifi, WifiOff, RefreshCw, Link as LinkIcon, Save,
  Megaphone, Bell, Globe, Grid, List, Play, Star 
} from 'lucide-react';

// --- IMPORTACIÓN PARA ANALYTICS ---
import { Analytics } from '@vercel/analytics/react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, 
  doc, serverTimestamp, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove,
  where, getDocs 
} from 'firebase/firestore';
// SE AGREGA uploadBytesResumable PARA LA BARRA DE PROGRESO
import { getStorage, ref, uploadBytes, uploadString, getDownloadURL, uploadBytesResumable } from 'firebase/storage';

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
const INTRO_KEY = 'celebrify_intro_seen_v1'; 
const REMEMBER_KEY = 'celebrify_user_remember_data';

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- DICCIONARIO DE TRADUCCIONES (GLOBAL) ---
const TRANSLATIONS = {
  es: {
    // Landing
    nav_login: "Ingresar",
    hero_badge: "La App para tus Eventos",
    hero_title_1: "Tus recuerdos,",
    hero_title_2: "en un solo lugar.",
    hero_desc: "La plataforma definitiva para tus eventos. Olvida perseguir a tus invitados para que te pasen las fotos; con Clebrify, ellos capturan los momentos en tiempo real.",
    btn_create: "Crear Evento",
    btn_code: "Tengo un Código",
    features_title: "Todo lo que necesitas",
    
    // Testimonios
    test_title: "Lo que dicen nuestros usuarios",
    test_1_name: "Ana y Carlos",
    test_1_role: "Recién Casados",
    test_1_text: "Fue increíble despertar al día siguiente y ver cientos de fotos y videos que no sabíamos que existían. ¡La mejor decisión de nuestra boda!",
    test_2_name: "Mariana L.",
    test_2_role: "Organizadora de Eventos",
    test_2_text: "Mis clientes aman la privacidad. Es mucho más seguro que un hashtag de Instagram y la calidad de los videos es impecable.",
    test_3_name: "Jorge D.",
    test_3_role: "Cumpleaños 30",
    test_3_text: "Lo mejor fue que mis amigos no tuvieron que descargar nada. Escanearon el QR y listo, todos subiendo fotos al instante.",

    // Final CTA
    cta_title: "¿Listo para tu próximo evento?",
    cta_desc: "Olvídate de pedir que te pasen las fotos mañana. Crea tu álbum compartido hoy y deja que tus invitados capturen la magia.",
    cta_btn: "Crear mi Evento",

    // Features Landing
    ft_1_title: "100% Privado", ft_1_desc: "Tus fotos no son públicas.", ft_1_det: "Solo tus invitados con el código único pueden ver y subir contenido.",
    ft_2_title: "Video HD", ft_2_desc: "Sube videos de los mejores momentos.", ft_2_det: "Soporte completo para videos en alta definición.",
    ft_3_title: "Fácil Acceso", ft_3_desc: "Imprime el QR y listo.", ft_3_det: "Tus invitados solo escanean para unirse.",
    ft_4_title: "Álbum ZIP", ft_4_desc: "Descarga todo al final.", ft_4_det: "Descarga todas las fotos y videos en un solo archivo.",
    ft_5_title: "Conecta", ft_5_desc: "Comparte tu Instagram.", ft_5_det: "Conecta con los demás invitados compartiendo tu perfil.",
    ft_6_title: "Anuncios", ft_6_desc: "Mensajes del anfitrión.", ft_6_det: "Alertas importantes con sonido para todos los invitados.",
    check_1: "Sin descargar app", check_2: "Calidad Original", footer_rights: "Todos los derechos reservados.",

    // Login & Create Forms
    welcome_title: "Bienvenido",
    welcome_desc_join: "Ingresa el código para unirte a la fiesta",
    welcome_desc_create: "Solicita tu evento privado",
    tab_join: "INGRESAR",
    tab_create: "SOLICITAR EVENTO",
    
    // Join Form
    lbl_code: "CÓDIGO DE EVENTO",
    lbl_name: "TU NOMBRE",
    lbl_lastname: "TU APELLIDO",
    chk_admin: "Soy Admin / Anfitrión",
    ph_admin_pin: "PIN ADMIN",
    btn_enter: "Entrar",
    
    // Create Form
    lbl_event_name: "NOMBRE DEL EVENTO *",
    ph_event_name: "Boda de Ana y Luis",
    lbl_host_1: "ANFITRIÓN 1 *",
    lbl_lastname_p: "APELLIDO PATERNO *",
    lbl_lastname_m: "MATERNO *",
    lbl_email: "CORREO ELECTRÓNICO *",
    lbl_phone: "TELÉFONO / WHATSAPP *",
    chk_host_2: "Añadir otro anfitrión",
    title_host_2: "Datos del Segundo Anfitrión",
    lbl_host_2: "ANFITRIÓN 2 *",
    lbl_email_2: "CORREO (2° ANFITRIÓN) *",
    lbl_phone_2: "TELÉFONO (2° ANFITRIÓN) *",
    btn_request: "Solicitar Evento",
    
    // Waiting Screen
    req_sent: "Solicitud Enviada",
    req_desc: "Hemos recibido tu solicitud. Estamos verificando tus datos.",
    req_warn: "Por favor, no cierres esta pantalla.",
    req_cancel: "Cancelar y volver",
    
    // Approved Screen
    approved: "¡Aprobado!",
    approved_desc: "Tu evento está listo para usarse.",
    code_guest: "Código de Invitados",
    pin_admin: "PIN Admin (Privado)",
    btn_enter_now: "Entrar ahora",

    // Profile & App
    profile_title: "Mi Perfil",
    host_badge: "Anfitrión",
    guest_badge: "Invitado",
    connect_insta: "Conecta tu Instagram",
    save_btn: "Guardar",
    saved_msg: "¡Guardado!",
    invite_friends: "Invitar amigos",
    code_copied: "¡Código copiado!",
    guest_list: "Lista de Invitados",
    kick_guest: "Expulsar invitado",
    download_album: "Descargar Álbum",
    downloading: "Descargando...",
    master_pin: "Tu PIN Maestro",
    logout: "Cerrar Sesión",
    need_help: "¿Necesitas ayuda?",
    
    // Feed & Comments
    no_photos: "Sin fotos aún",
    uploading: "Subiendo",
    waiting_net: "Esperando señal",
    host_msg_title: "Mensaje del Anfitrión",
    ph_comment: "Comentar...",
    btn_send: "Enviar",
    likes_list: "Le gusta a...",
    likes_count: "Me gusta",

    // Modals
    modal_edit_title: "Editar nombre del evento",
    lbl_new_name: "Nuevo nombre",
    btn_cancel: "Cancelar",
    modal_ann_title: "Publicar Anuncio",
    lbl_ann_msg: "Mensaje para los invitados",
    ph_ann_msg: "Escribe aquí... (déjalo vacío para borrar)",
    btn_post: "Publicar"
  },
  en: {
    // Landing
    nav_login: "Login",
    hero_badge: "The App for your Events",
    hero_title_1: "Your memories,",
    hero_title_2: "all in one place.",
    hero_desc: "The ultimate platform for your events. Forget chasing guests for photos; with Clebrify, they capture moments in real-time.",
    btn_create: "Create Event",
    btn_code: "I have a Code",
    features_title: "Everything you need",

    // Testimonials
    test_title: "What our users say",
    test_1_name: "Anna & Charles",
    test_1_role: "Just Married",
    test_1_text: "It was amazing to wake up the next day and see hundreds of photos and videos we didn't know existed. Best decision for our wedding!",
    test_2_name: "Mariana L.",
    test_2_role: "Event Planner",
    test_2_text: "My clients love the privacy. It is much safer than an Instagram hashtag and the video quality is impeccable.",
    test_3_name: "George D.",
    test_3_role: "30th Birthday",
    test_3_text: "The best part was that my friends didn't have to download anything. They scanned the QR and boom, uploading photos instantly.",

    // Final CTA
    cta_title: "Ready for your next event?",
    cta_desc: "Forget about chasing photos tomorrow. Create your shared album today and let your guests capture the magic.",
    cta_btn: "Create my Event",

    // Features Landing
    ft_1_title: "100% Private", ft_1_desc: "Your photos are not public.", ft_1_det: "Only guests with the unique code can view and upload.",
    ft_2_title: "HD Video", ft_2_desc: "Upload best moments videos.", ft_2_det: "Full support for high definition videos.",
    ft_3_title: "Easy Access", ft_3_desc: "Print the QR and go.", ft_3_det: "Guests just scan to join instantly.",
    ft_4_title: "ZIP Album", ft_4_desc: "Download everything at the end.", ft_4_det: "Download all photos and videos in a single file.",
    ft_5_title: "Connect", ft_5_desc: "Share your Instagram.", ft_5_det: "Connect with other guests by sharing your profile.",
    ft_6_title: "Announcements", ft_6_desc: "Messages from the host.", ft_6_det: "Important alerts with sound for all guests.",
    check_1: "No app download", check_2: "Original Quality", footer_rights: "All rights reserved.",

    // Login & Create Forms
    welcome_title: "Welcome",
    welcome_desc_join: "Enter the code to join the party",
    welcome_desc_create: "Request your private event",
    tab_join: "JOIN",
    tab_create: "REQUEST EVENT",
    
    // Join Form
    lbl_code: "EVENT CODE",
    lbl_name: "YOUR NAME",
    lbl_lastname: "YOUR LAST NAME",
    chk_admin: "I am Admin / Host",
    ph_admin_pin: "ADMIN PIN",
    btn_enter: "Enter",
    
    // Create Form
    lbl_event_name: "EVENT NAME *",
    ph_event_name: "Anna & Louis Wedding",
    lbl_host_1: "HOST 1 *",
    lbl_lastname_p: "LAST NAME (P) *",
    lbl_lastname_m: "LAST NAME (M) *",
    lbl_email: "EMAIL ADDRESS *",
    lbl_phone: "PHONE / WHATSAPP *",
    chk_host_2: "Add another host",
    title_host_2: "Second Host Details",
    lbl_host_2: "HOST 2 *",
    lbl_email_2: "EMAIL (2nd HOST) *",
    lbl_phone_2: "PHONE (2nd HOST) *",
    btn_request: "Request Event",
    
    // Waiting Screen
    req_sent: "Request Sent",
    req_desc: "We have received your request. We are verifying your data.",
    req_warn: "Please do not close this screen.",
    req_cancel: "Cancel and return",
    
    // Approved Screen
    approved: "Approved!",
    approved_desc: "Your event is ready to use.",
    code_guest: "Guest Code",
    pin_admin: "Admin PIN (Private)",
    btn_enter_now: "Enter now",

    // Profile & App
    profile_title: "My Profile",
    host_badge: "Host",
    guest_badge: "Guest",
    connect_insta: "Connect Instagram",
    save_btn: "Save",
    saved_msg: "Saved!",
    invite_friends: "Invite Friends",
    code_copied: "Code copied!",
    guest_list: "Guest List",
    kick_guest: "Kick guest",
    download_album: "Download Album",
    downloading: "Downloading...",
    master_pin: "Your Master PIN",
    logout: "Log Out",
    need_help: "Need help?",

    // Feed & Comments
    no_photos: "No photos yet",
    uploading: "Uploading",
    waiting_net: "Waiting for signal",
    host_msg_title: "Host Message",
    ph_comment: "Comment...",
    btn_send: "Send",
    likes_list: "Liked by...",
    likes_count: "Likes",

    // Modals
    modal_edit_title: "Edit Event Name",
    lbl_new_name: "New Name",
    btn_cancel: "Cancel",
    modal_ann_title: "Post Announcement",
    lbl_ann_msg: "Message for guests",
    ph_ann_msg: "Write here... (leave empty to delete)",
    btn_post: "Post"
  }
};

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
    
    @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-slide-down { animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `}</style>
);

// --- UTILIDADES ---
const generateCode = (length) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); }
  return result;
};

// CORRECCIÓN: Función mejorada para ignorar acentos y unificar usuarios
const normalizeName = (name) => {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD") // Separa letras de tildes
    .replace(/[\u0300-\u036f]/g, "") // Borra las tildes
    .replace(/\s+/g, ''); // Borra espacios
};

// --- COMPONENTE DE TEMA ---
const ThemeToggle = ({ theme, toggleTheme }) => (
  <button 
    onClick={toggleTheme} 
    className={`p-2.5 rounded-full transition-all duration-500 border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10' : 'bg-gray-100 border-gray-200 text-orange-500 hover:bg-gray-200'}`}
  >
    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
  </button>
);

// --- BOTÓN DE IDIOMA (REUTILIZABLE) ---
const LanguageToggle = ({ language, toggleLanguage, isDark }) => (
  <button 
    onClick={toggleLanguage}
    className={`px-3 py-2 rounded-full text-lg transition-all duration-300 border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}
    title={language === 'es' ? "Switch to English" : "Cambiar a Español"}
  >
    {language === 'es' ? '🇲🇽' : '🇺🇸'}
  </button>
);

// --- PANTALLA DE INSTRUCCIONES (ONBOARDING) ---
const OnboardingScreen = ({ onFinish }) => {
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

// --- LANDING PAGE (REDISEÑO VISUAL ELEGANTE) ---
const LandingPage = ({ onStart, theme, toggleTheme, language, toggleLanguage }) => {
  const isDark = theme === 'dark';
  const [imgError, setImgError] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
    
  const HERO_IMAGE_URL = "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";

  const text = TRANSLATIONS[language];

  // LISTA DE CARACTERÍSTICAS
  const features = [
    { icon: Lock, title: text.ft_1_title, desc: text.ft_1_desc, details: text.ft_1_det, color: "bg-yellow-500" },
    { icon: Video, title: text.ft_2_title, desc: text.ft_2_desc, details: text.ft_2_det, color: "bg-purple-500" },
    { icon: QrCode, title: text.ft_3_title, desc: text.ft_3_desc, details: text.ft_3_det, color: "bg-blue-500" },
    { icon: Download, title: text.ft_4_title, desc: text.ft_4_desc, details: text.ft_4_det, color: "bg-green-500" },
    { icon: Instagram, title: text.ft_5_title, desc: text.ft_5_desc, details: text.ft_5_det, color: "bg-pink-500" }, 
    { icon: Megaphone, title: text.ft_6_title, desc: text.ft_6_desc, details: text.ft_6_det, color: "bg-orange-500" }, 
  ];

  // LISTA DE TESTIMONIOS
  const testimonials = [
      { name: text.test_1_name, role: text.test_1_role, text: text.test_1_text, color: "bg-gradient-to-tr from-yellow-400 to-orange-500" },
      { name: text.test_2_name, role: text.test_2_role, text: text.test_2_text, color: "bg-gradient-to-tr from-purple-400 to-pink-500" },
      { name: text.test_3_name, role: text.test_3_role, text: text.test_3_text, color: "bg-gradient-to-tr from-blue-400 to-cyan-500" },
  ];

  const toggleFeature = (index) => {
    setActiveFeature(activeFeature === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] overflow-y-auto custom-scrollbar">
      {/* NAVBAR */}
      <nav className={`w-full px-6 py-4 flex justify-between items-center z-50 sticky top-0 backdrop-blur-md border-b transition-colors duration-500 ${isDark ? 'bg-[#0f172a]/80 border-white/5' : 'bg-white/80 border-gray-100'}`}>
        <div className="flex items-center gap-2">
          {/* Logo en la Navbar */}
          <img src="/logo.svg" alt="Clebrify" className="w-8 h-8 rounded-lg shadow-lg" />
          <span className={`text-xl font-serif font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Clebrify</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle language={language} toggleLanguage={toggleLanguage} isDark={isDark} />
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button onClick={onStart} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}>{text.nav_login} <ArrowRight size={16}/></button>
        </div>
      </nav>

      <header className="flex-1 flex flex-col md:flex-row items-center justify-center px-6 py-12 md:py-20 max-w-7xl mx-auto w-full gap-12 md:gap-20">
        <div className="flex-1 text-center md:text-left animate-enter space-y-8 max-w-xl">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${isDark ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-orange-50 text-orange-600 border-orange-100'}`}><Sparkles size={12} /> {text.hero_badge}</div>
          <h1 className={`text-5xl md:text-7xl font-serif font-bold leading-[1.1] ${isDark ? 'text-white' : 'text-gray-900'}`}>{text.hero_title_1} <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">{text.hero_title_2}</span></h1>
          <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{text.hero_desc}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-2">
            <button onClick={onStart} className="btn-primary px-8 py-4 rounded-xl text-lg shadow-xl shadow-yellow-500/10 hover:scale-105 transition active:scale-95 flex items-center justify-center gap-2">{text.btn_create}</button>
            <button onClick={onStart} className={`px-8 py-4 rounded-xl text-lg font-bold border flex items-center justify-center gap-2 transition hover:bg-gray-50/5 ${isDark ? 'border-white/20 text-white' : 'border-gray-200 text-gray-700'}`}><QrCode size={20}/> {text.btn_code}</button>
          </div>
          <div className="pt-4 flex items-center justify-center md:justify-start gap-6 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500"/> {text.check_1}</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500"/> {text.check_2}</span>
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

      {/* SECCIÓN DE CARACTERÍSTICAS (Minimalista) */}
      <section className={`py-20 px-6 ${isDark ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
         <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16"><h2 className={`text-3xl font-serif font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{text.features_title}</h2></div>
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

      {/* --- SECCIÓN DE TESTIMONIOS (REDISEÑADA: GLASS & CLEAN) --- */}
      <section className="py-24 px-6 relative overflow-hidden">
          {/* Fondo sutil para dar profundidad */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full blur-[120px] -z-10 ${isDark ? 'bg-purple-900/20' : 'bg-yellow-500/10'}`}></div>

          <div className="max-w-6xl mx-auto relative z-10">
              <div className="text-center mb-16">
                  <h2 className={`text-3xl font-serif font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{text.test_title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {testimonials.map((t, i) => (
                      // Aquí usamos glass-panel para que sea coherente con el resto de la app
                      <div key={i} className={`p-8 rounded-3xl border flex flex-col justify-between backdrop-blur-md transition hover:-translate-y-1 duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-white/40 shadow-xl shadow-gray-100/50'}`}>
                          <div className="mb-6">
                              <div className="flex gap-1 mb-4 text-yellow-500 opacity-80">
                                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                              </div>
                              <p className={`text-base italic leading-relaxed font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>"{t.text}"</p>
                          </div>
                          <div className="flex items-center gap-4 pt-6 border-t border-dashed border-gray-500/20">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${t.color}`}>
                                  {t.name.charAt(0)}
                              </div>
                              <div>
                                  <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.name}</p>
                                  <p className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{t.role}</p>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- SECCIÓN FINAL CTA (REDISEÑADA: MÁS SUTIL) --- */}
      <section className="py-24 px-6">
          <div className={`max-w-4xl mx-auto rounded-[3rem] p-12 text-center relative overflow-hidden backdrop-blur-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-white/50 shadow-2xl shadow-yellow-500/10'}`}>
              <div className="relative z-10 space-y-6">
                  <h2 className={`text-4xl md:text-5xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{text.cta_title}</h2>
                  <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{text.cta_desc}</p>
                  <button onClick={onStart} className="btn-primary px-10 py-5 rounded-2xl text-xl shadow-xl shadow-yellow-500/20 hover:scale-105 transition mt-4 inline-flex items-center gap-3">
                      {text.cta_btn} <ArrowRight size={20}/>
                  </button>
              </div>
          </div>
      </section>

      <footer className={`py-12 border-t text-center space-y-4 ${isDark ? 'border-white/5 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
        <p className="text-sm font-bold">Clebrify</p>
        <div className="flex items-center justify-center gap-4">
            <a href="mailto:contacto@clebrify.com" className="hover:text-yellow-500 transition p-2"><Mail size={20} /></a>
            <a href="https://www.instagram.com/clebrify?igsh=MXQxeTlhb2d0dWd4" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition p-2"><Instagram size={20} /></a>
        </div>
        <p className="text-[10px] opacity-60">© 2025 {text.footer_rights}</p>
      </footer>
    </div>
  );
};

// --- PANTALLA DE LOGIN / REGISTRO (AHORA CON TRADUCCIÓN) ---
const LoginScreen = ({ onJoin, userUid, theme, onBack, language }) => {
  const [mode, setMode] = useState('join'); // 'join', 'create', 'waiting_approval', 'success_create'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Usamos el diccionario
  const text = TRANSLATIONS[language];
  
  // Estados para INGRESAR
  const [joinFirstName, setJoinFirstName] = useState('');
  const [joinLastName, setJoinLastName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  
  // Estados para CREAR EVENTO
  const [createEventName, setCreateEventName] = useState('');
  
  // HOST 1
  const [createHost1, setCreateHost1] = useState('');
  const [createLastNameP, setCreateLastNameP] = useState(''); 
  const [createLastNameM, setCreateLastNameM] = useState(''); 
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  
  // HOST 2 (Opcional)
  const [hasSecondHost, setHasSecondHost] = useState(false);
  const [createHost2, setCreateHost2] = useState(''); 
  const [createLastNameP2, setCreateLastNameP2] = useState(''); 
  const [createLastNameM2, setCreateLastNameM2] = useState(''); 
  const [createEmail2, setCreateEmail2] = useState(''); 
  const [createPhone2, setCreatePhone2] = useState(''); 
  
  // Datos del evento creado
  const [createdEventData, setCreatedEventData] = useState(null);
  const [pendingCode, setPendingCode] = useState(null); 

  const isDark = theme === 'dark';
  const inputClass = `w-full rounded-xl px-4 py-3 text-center font-mono text-lg tracking-widest outline-none transition ${isDark ? 'bg-[#1e293b] border-white/10 text-white placeholder-gray-500 focus:border-yellow-500/50' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-yellow-500/50'}`;
  const inputRegularClass = `w-full rounded-xl px-4 py-3 outline-none transition ${isDark ? 'bg-[#1e293b] border-white/10 text-white placeholder-gray-500 focus:border-yellow-500/50' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-yellow-500/50'}`;

  // Cargar datos recordados y código desde URL
  useEffect(() => {
    const savedData = localStorage.getItem(REMEMBER_KEY);
    if(savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if(parsed.firstName) setJoinFirstName(parsed.firstName);
            if(parsed.lastName) setJoinLastName(parsed.lastName);
            if(parsed.code) setJoinCode(parsed.code);
        } catch(e) { console.error("Error leyendo datos guardados", e); }
    }

    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) setJoinCode(urlCode.toUpperCase());
  }, []);

  // --- ESCUCHA EN TIEMPO REAL PARA LA APROBACIÓN ---
  useEffect(() => {
    let unsub;
    if (mode === 'waiting_approval' && pendingCode) {
        const eventDocRef = doc(db, 'events', pendingCode);
        unsub = onSnapshot(eventDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.isActive === true) {
                    setCreatedEventData({ 
                        code: pendingCode, 
                        pin: data.adminPin, 
                        name: data.eventName 
                    });
                    setMode('success_create');
                }
            }
        });
    }
    return () => { if (unsub) unsub(); };
  }, [mode, pendingCode]);


  // --- FUNCIÓN PARA SOLICITAR CREACIÓN DE EVENTO ---
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    
    // 1. Validaciones
    if (!createEventName || !createHost1 || !createLastNameP || !createLastNameM || !createEmail || !createPhone) {
        setError('⚠️ Por favor llena todos los campos obligatorios del anfitrión 1.');
        return;
    }

    if (hasSecondHost) {
        if (!createHost2 || !createLastNameP2 || !createLastNameM2 || !createEmail2 || !createPhone2) {
            setError('⚠️ Si marcas un segundo anfitrión, debes completar todos sus datos.');
            return;
        }
    }

    setLoading(true); setError('');
    
    // Construimos el nombre completo del anfitrión principal
    const fullName = `${createHost1.trim()} ${createLastNameP.trim()} ${createLastNameM.trim()}`;
    
    // Construimos el nombre completo del segundo anfitrión (si existe)
    const fullName2 = hasSecondHost 
        ? `${createHost2.trim()} ${createLastNameP2.trim()} ${createLastNameM2.trim()}`
        : '';
    
    try {
      const newEventCode = generateCode(6);
      const newAdminPin = Math.floor(1000 + Math.random() * 9000).toString();
      
      const eventRef = doc(db, 'events', newEventCode);
      
      // 2. Guardamos en Firebase con isActive: FALSE
      await setDoc(eventRef, { 
          eventName: createEventName, 
          hostName: fullName, 
          email: createEmail,
          phone: createPhone,
          
          hostName2: fullName2,
          email2: hasSecondHost ? createEmail2 : '',
          phone2: hasSecondHost ? createPhone2 : '',
          
          adminPin: newAdminPin, 
          createdAt: serverTimestamp(), 
          code: newEventCode, 
          theme: 'elegant',
          isActive: false 
      });

      // Creamos al usuario Host
      const hostId = normalizeName(fullName);
      await setDoc(doc(db, 'events', newEventCode, 'users', hostId), { 
          originalName: fullName, 
          deviceId: userUid, 
          role: 'host', 
          joinedAt: serverTimestamp() 
      });

      // SI HAY HOST 2, LO CREAMOS DE UNA VEZ
      if (hasSecondHost && fullName2) {
          const hostId2 = normalizeName(fullName2);
          await setDoc(doc(db, 'events', newEventCode, 'users', hostId2), { 
              originalName: fullName2, 
              deviceId: 'pending_device_' + hostId2, 
              role: 'host', 
              joinedAt: serverTimestamp() 
          });
      }

      // 3. Cambiamos a modo de espera
      setPendingCode(newEventCode);
      setMode('waiting_approval');

    } catch (err) { 
        console.error(err);
        setError('Error al enviar solicitud.'); 
    } finally { 
        setLoading(false); 
    }
  };

  // --- FUNCIÓN PARA UNIRSE A EVENTO EXISTENTE ---
  const handleJoinEvent = async (e) => {
    e.preventDefault();
    
    if (!joinFirstName.trim() || !joinLastName.trim()) { setError('⚠️ Escribe tu nombre completo.'); return; }
    if (!joinCode.trim()) { setError('⚠️ Falta el código.'); return; }
    if (isAdminLogin && !adminPinInput) { setError('⚠️ Ingresa el PIN de admin.'); return; }

    setLoading(true); setError('');
    let fullName = `${joinFirstName.trim()} ${joinLastName.trim()}`;
    let role = 'guest';
    let targetUserId = normalizeName(fullName);
    let finalFullName = fullName;
    
    try {
      const code = joinCode.toUpperCase().trim();
      const eventRef = doc(db, 'events', code);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) { setError('¡Código no existe!'); setLoading(false); return; }
      
      const eventData = eventSnap.data();

      if (eventData.isActive === false && eventData.adminPin !== adminPinInput) {
          setError('⏳ Este evento aún está en revisión.');
          setLoading(false);
          return;
      }

      let isValidAdmin = false;

      if (isAdminLogin) {
        if (adminPinInput === eventData.adminPin || adminPinInput === MASTER_PIN) { 
            role = 'host'; 
            isValidAdmin = true;
            
            const usersRef = collection(db, 'events', code, 'users');
            const q = query(usersRef, where('role', '==', 'host'));
            const querySnapshot = await getDocs(q);

            const normalize = (str) => str.toLowerCase().replace(/\s+/g, '');
            const inputNameClean = normalize(fullName);

            let foundMatch = false;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const dbNameClean = normalize(data.originalName);
                if (dbNameClean.includes(inputNameClean) || inputNameClean.includes(dbNameClean)) {
                    targetUserId = doc.id; 
                    finalFullName = data.originalName; 
                    foundMatch = true;
                }
            });
            
            const banRef = doc(db, 'events', code, 'banned', userUid);
            await deleteDoc(banRef);

        } else { setError('PIN incorrecto.'); setLoading(false); return; }
      }

      if (!isValidAdmin) {
          const banRef = doc(db, 'events', code, 'banned', userUid);
          const banSnap = await getDoc(banRef);
          if (banSnap.exists()) { setError('⛔ Acceso denegado.'); setLoading(false); return; }
      }

      const userRef = doc(db, 'events', code, 'users', targetUserId);
      const userSnap = await getDoc(userRef);
      
      // Obtener datos si existen
      let existingInstagram = '';

      if (userSnap.exists()) { 
          const uData = userSnap.data();
          existingInstagram = uData.instagram || '';
          await updateDoc(userRef, { 
              deviceId: userUid, 
              joinedAt: serverTimestamp()
          }); 
      } else { 
          await setDoc(userRef, { 
              originalName: finalFullName, 
              deviceId: userUid, 
              role: role, 
              joinedAt: serverTimestamp(),
              instagram: ''
          }); 
      }
      
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({
          firstName: joinFirstName,
          lastName: joinLastName,
          code: code
      }));

      onJoin({ 
          name: finalFullName, 
          role, 
          eventCode: code, 
          eventName: eventData.eventName, 
          adminPin: role === 'host' ? eventData.adminPin : null,
          instagram: existingInstagram
      });
    
    } catch (err) { 
        console.error(err); 
        setError('Error de conexión.'); 
    } finally { 
        setLoading(false); 
    }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert('¡Copiado!'); };

  // --- PANTALLA: ÉXITO (APROBADO) ---
  if (mode === 'success_create') {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] p-6 relative overflow-hidden animate-in zoom-in duration-500">
        <div className="glass-panel p-8 rounded-3xl w-full max-w-sm text-center relative z-10 border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h2 className={`text-3xl font-serif font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{text.approved}</h2>
          <p className="text-sm text-gray-500 mb-6">{text.approved_desc}</p>
          
          <div className={`${isDark ? 'bg-white/5' : 'bg-black/5'} rounded-xl p-4 mb-4`}>
             <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-widest">{text.code_guest}</p>
             <div className="flex items-center justify-between">
                <span className="text-4xl font-mono font-bold text-yellow-500 tracking-wider">{createdEventData.code}</span>
                <button onClick={() => copyToClipboard(createdEventData.code)} className="p-2 hover:bg-white/10 rounded-full"><Copy size={20} className={isDark ? 'text-white' : 'text-gray-600'} /></button>
             </div>
          </div>
          
          <div className="bg-red-500/10 rounded-xl p-4 mb-8 border border-red-500/20">
             <p className="text-[10px] text-red-400 uppercase font-bold mb-2">{text.pin_admin}</p>
             <div className="flex items-center justify-between">
                <span className={`text-xl font-mono font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{createdEventData.pin}</span>
                <button onClick={() => copyToClipboard(createdEventData.pin)} className="p-2 hover:bg-red-500/20 rounded-full"><Copy size={16} className={isDark ? 'text-white' : 'text-gray-600'} /></button>
             </div>
          </div>

          <button onClick={() => onJoin({ name: `${createHost1} ${createLastNameP}`, role: 'host', eventCode: createdEventData.code, eventName: createdEventData.name, adminPin: createdEventData.pin })} className="w-full btn-primary py-4 rounded-xl shadow-lg">{text.btn_enter_now}</button>
        </div>
      </div>
    );
  }

  // --- PANTALLA: ESPERANDO APROBACIÓN ---
  if (mode === 'waiting_approval') {
      return (
        <div className="flex flex-col items-center justify-center h-[100dvh] p-8 text-center animate-in fade-in">
           <div className="mb-8 relative">
              <div className="w-24 h-24 rounded-full border-4 border-yellow-500/30 border-t-yellow-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldAlert size={32} className="text-yellow-500" />
              </div>
           </div>
           <h2 className={`text-2xl font-serif font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{text.req_sent}</h2>
           <p className="text-gray-400 mb-8 leading-relaxed max-w-xs mx-auto">
             {text.req_desc} <strong>{createEventName}</strong>. 
             <br/><br/>
             <span className="text-yellow-500 font-bold">{text.req_warn}</span>
           </p>
           <button onClick={() => { setMode('create'); setPendingCode(null); }} className="text-xs text-gray-500 underline hover:text-white">{text.req_cancel}</button>
        </div>
      );
  }

  // --- PANTALLA: FORMULARIOS (NORMAL) ---
  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] p-6 relative animate-in fade-in">
      
      {/* HEADER */}
      <nav className="absolute top-0 left-0 w-full px-6 py-6 flex items-center z-20">
        <button onClick={onBack} className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8 rounded-lg" />
          <span className={`text-xl font-serif font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Clebrify</span>
        </button>
      </nav>

      {/* TITULO */}
      <div className="mb-8 text-center z-10 animate-enter mt-12 md:mt-0">
        <h1 className={`text-3xl font-bold font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>{text.welcome_title}</h1>
        <p className="text-gray-400 text-sm mt-2">
            {mode === 'join' ? text.welcome_desc_join : text.welcome_desc_create}
        </p>
      </div>

      <div className="w-full max-w-md glass-panel rounded-3xl overflow-hidden z-10 shadow-2xl animate-enter flex flex-col max-h-[70vh]" style={{animationDelay: '0.1s'}}>
        
        {/* TABS */}
        <div className={`flex border-b shrink-0 ${isDark ? 'border-white/10' : 'border-black/5'}`}>
            <button onClick={() => setMode('join')} className={`flex-1 py-4 font-bold text-xs tracking-widest transition-colors ${mode === 'join' ? 'bg-white/5 text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-400'}`}>{text.tab_join}</button>
            <button onClick={() => setMode('create')} className={`flex-1 py-4 font-bold text-xs tracking-widest transition-colors ${mode === 'create' ? 'bg-white/5 text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-400'}`}>{text.tab_create}</button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center font-bold animate-in fade-in">{error}</div>}
          
          {mode === 'join' ? (
            <form onSubmit={handleJoinEvent} className="space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_code}</label><input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className={`${inputClass} border`} placeholder="XY2Z" maxLength={6} /></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_name}</label><input type="text" value={joinFirstName} onChange={(e) => setJoinFirstName(e.target.value)} className={`${inputRegularClass} border`} placeholder="Juan" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_lastname}</label><input type="text" value={joinLastName} onChange={(e) => setJoinLastName(e.target.value)} className={`${inputRegularClass} border`} placeholder="Pérez" /></div></div>
              
              <div className="flex items-center gap-3 pt-2"><input type="checkbox" checked={isAdminLogin} onChange={() => setIsAdminLogin(!isAdminLogin)} className="h-4 w-4 accent-yellow-400 bg-black/30 rounded border-gray-600" /><span className="text-xs text-gray-500">{text.chk_admin}</span></div>
              {isAdminLogin && (<div className="animate-in fade-in slide-in-from-top-2"><input type="tel" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value)} className={`${inputRegularClass} text-center tracking-widest border border-yellow-500/30 text-yellow-600`} placeholder={text.ph_admin_pin} maxLength={6} /></div>)}
              <button disabled={loading} className="w-full btn-primary py-4 rounded-xl mt-4 shadow-lg">{loading ? <Loader className="animate-spin mx-auto text-black" /> : text.btn_enter}</button>
            </form>
          ) : (
            <form onSubmit={handleCreateRequest} className="space-y-4">
              {/* DATOS DEL EVENTO */}
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-yellow-600 ml-1 tracking-widest">{text.lbl_event_name}</label>
                 <input type="text" value={createEventName} onChange={(e) => setCreateEventName(e.target.value)} className={`${inputRegularClass} border`} placeholder={text.ph_event_name} />
              </div>

              {/* ANFITRIONES - SECCIÓN 1 */}
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_host_1}</label>
                  <input type="text" value={createHost1} onChange={(e) => setCreateHost1(e.target.value)} className={`${inputRegularClass} border`} placeholder="Nombre" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_lastname_p}</label>
                    <input type="text" value={createLastNameP} onChange={(e) => setCreateLastNameP(e.target.value)} className={`${inputRegularClass} border`} placeholder="López" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_lastname_m}</label>
                    <input type="text" value={createLastNameM} onChange={(e) => setCreateLastNameM(e.target.value)} className={`${inputRegularClass} border`} placeholder="García" />
                 </div>
              </div>

              {/* CONTACTO HOST 1 */}
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_email}</label>
                 <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} className={`${inputRegularClass} border`} placeholder="ejemplo@correo.com" />
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_phone}</label>
                 <input type="tel" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} className={`${inputRegularClass} border`} placeholder="55 1234 5678" />
              </div>

              {/* CHECKBOX PARA ACTIVAR 2DO ANFITRIÓN */}
              <div className="flex items-center gap-2 py-1 mt-4 border-t border-gray-500/20 pt-4">
                 <input 
                   type="checkbox" 
                   checked={hasSecondHost} 
                   onChange={() => setHasSecondHost(!hasSecondHost)} 
                   className="h-4 w-4 accent-yellow-400 bg-black/30 rounded border-gray-600" 
                 />
                 <span className="text-xs text-gray-500">{text.chk_host_2}</span>
              </div>

              {/* CAMPO ANFITRIÓN 2 (COMPLETO) */}
              {hasSecondHost && (
                <div className="space-y-4 pt-2 border-t border-dashed border-gray-500/20 animate-in fade-in slide-in-from-top-1">
                    <p className="text-center text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">{text.title_host_2}</p>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_host_2}</label>
                        <input type="text" value={createHost2} onChange={(e) => setCreateHost2(e.target.value)} className={`${inputRegularClass} border`} placeholder="Nombre" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_lastname_p}</label>
                            <input type="text" value={createLastNameP2} onChange={(e) => setCreateLastNameP2(e.target.value)} className={`${inputRegularClass} border`} placeholder="López" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_lastname_m}</label>
                            <input type="text" value={createLastNameM2} onChange={(e) => setCreateLastNameM2(e.target.value)} className={`${inputRegularClass} border`} placeholder="García" />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_email_2}</label>
                        <input type="email" value={createEmail2} onChange={(e) => setCreateEmail2(e.target.value)} className={`${inputRegularClass} border`} placeholder="ejemplo2@correo.com" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest">{text.lbl_phone_2}</label>
                        <input type="tel" value={createPhone2} onChange={(e) => setCreatePhone2(e.target.value)} className={`${inputRegularClass} border`} placeholder="55 8765 4321" />
                    </div>
                </div>
              )}

              <button disabled={loading} className="w-full btn-primary py-4 rounded-xl mt-4 shadow-lg flex items-center justify-center gap-2">
                  {loading ? <Loader className="animate-spin text-black" /> : text.btn_request}
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="absolute bottom-4 z-10 text-center opacity-40 text-xs"><a href="mailto:contacto@clebrify.com" className="hover:underline flex items-center justify-center gap-1 transition hover:text-yellow-600"><Mail size={12} /> contacto@clebrify.com</a></div>
    </div>
  );
};

// --- COMPONENTE CÁMARA ---
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
        // CORRECCIÓN: Límite subido a 500MB
        if (file.size > 500000000) { 
            alert("⚠️ Video demasiado pesado (Máx 500MB). Intenta uno más corto."); 
            e.target.value = ""; // Limpiar memoria
            return; 
        }
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

// --- COMPONENTE VISOR DE MEDIOS ---
const MediaViewer = ({ media, onClose }) => {
  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-200 cursor-pointer backdrop-blur-sm"
    >
      <button className="absolute top-5 right-5 text-white/50 hover:text-white transition">
        <X size={32} />
      </button>

      {media.type === 'video' ? (
        <video 
            src={media.url} 
            controls 
            autoPlay 
            className="max-w-full max-h-[90vh] rounded shadow-2xl outline-none" 
            onClick={(e) => e.stopPropagation()} 
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

// --- COMPONENTE POST CARD (AHORA CON TRADUCCIÓN) ---
const PostCard = ({ post, currentUser, currentUserId, onDeletePost, onAddComment, onDeleteComment, onToggleLike, theme, onOpenMedia, usersList, language }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  
  // Usamos el diccionario
  const text = TRANSLATIONS[language];
  
  // --- MODAL DE LIKES ---
  const [showLikesModal, setShowLikesModal] = useState(false);

  const handleSubmitComment = (e) => { e.preventDefault(); if (!commentText.trim()) return; onAddComment(post.id, commentText); setCommentText(''); setShowComments(true); };
  const isLiked = post.likes && post.likes.includes(currentUserId);
  const looksLikeVideo = (url) => url?.includes('.mp4') || url?.includes('video') || url?.startsWith('data:video');
  const isDark = theme === 'dark';

  const author = usersList?.find(u => u.deviceId === post.userId);
  const instagramHandle = author ? author.instagram : post.userInstagram;

  const likedByUsers = post.likes && post.likes.length > 0 
      ? usersList.filter(u => post.likes.includes(u.deviceId)) 
      : [];

  return (
    <>
    {/* MODAL DE LIKES */}
    {showLikesModal && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowLikesModal(false)}>
            <div className={`w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/5">
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{text.likes_list}</h3>
                    <button onClick={() => setShowLikesModal(false)}><X size={20} className="text-gray-400"/></button>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                    {likedByUsers.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-4">Cargando...</p>
                    ) : (
                        likedByUsers.map((u, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 hover:bg-black/5 rounded-xl transition">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                    {u.originalName.charAt(0).toUpperCase()}
                                </div>
                                <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                    {u.originalName}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )}

    <div className="glass-card mb-8 rounded-3xl overflow-hidden transition-all duration-500">
      <div className={`flex items-center justify-between p-4 backdrop-blur-md ${isDark ? 'bg-[#0f172a]/90 border-white/5' : 'bg-white/60'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-inner border ${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>{post.userName.charAt(0).toUpperCase()}</div>
          <div className="flex flex-col">
              <span className={`text-sm font-bold leading-none ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{post.userName}</span>
              {instagramHandle && (
                  <a href={`https://instagram.com/${instagramHandle.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-1 text-[10px] text-pink-500 hover:underline">
                      <Instagram size={10} /> {instagramHandle}
                  </a>
              )}
          </div>
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
        
        {post.likes?.length > 0 && (
            <button 
                onClick={() => setShowLikesModal(true)} 
                className={`text-sm font-bold text-left hover:underline ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
                {post.likes.length} {text.likes_count}
            </button>
        )}

        <div className="flex flex-col gap-2">
          {(post.comments || []).slice(showComments ? 0 : -2).map((comment, idx) => (
            <div key={idx} className="text-sm flex justify-between items-start">
              <span><span className="font-bold mr-2 text-yellow-600">{comment.userName}</span><span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{comment.text}</span></span>
              {currentUser.role === 'host' && <button onClick={() => onDeleteComment(post.id, comment)} className="text-gray-400"><X size={12} /></button>}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmitComment} className={`flex items-center gap-2 pt-2 border-t mt-1 ${isDark ? 'border-white/10' : 'border-black/5'}`}>
          <input type="text" placeholder={text.ph_comment} className={`flex-1 bg-transparent text-sm outline-none py-2 ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} value={commentText} onChange={(e) => setCommentText(e.target.value)} />
          <button type="submit" disabled={!commentText.trim()} className="text-yellow-600 font-bold text-sm disabled:opacity-30">{text.btn_send}</button>
        </form>
      </div>
    </div>
    </>
  );
};

// --- COMPONENTE PERFIL ---
const ProfileView = ({ user, onLogout, posts, usersList, theme, toggleTheme, onKickGuest, onUpdateInstagram, language, toggleLanguage }) => {
  const [showPin, setShowPin] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const liveUser = usersList.find(u => u.deviceId === user.deviceId) || user;
  
  const [editInsta, setEditInsta] = useState(liveUser.instagram || '');
  const [savedMsg, setSavedMsg] = useState('');
  
  const text = TRANSLATIONS[language];

  useEffect(() => {
    if (liveUser.instagram !== undefined) {
      setEditInsta(liveUser.instagram);
    }
  }, [liveUser.instagram]);

  const appUrl = typeof window !== 'undefined' ? `${window.location.origin}?code=${user.eventCode}` : '';
  const copyCode = () => { navigator.clipboard.writeText(user.eventCode); alert(text.code_copied); };
  const isDark = theme === 'dark';

  const handleSaveInsta = () => {
      const clean = editInsta.trim().replace('@','').replace(/\s+/g, '');
      onUpdateInstagram(clean);
      setSavedMsg(text.saved_msg);
      setTimeout(() => setSavedMsg(''), 2000);
  };

  const handleDownloadAll = async () => { 
    if (posts.length === 0) { alert(text.no_photos); return; } 
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
       
       {/* HEADER PERFIL (CON BANDERITA) */}
       <div className="flex justify-end gap-3 mb-4">
          <LanguageToggle language={language} toggleLanguage={toggleLanguage} isDark={isDark} />
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
       </div>

       <div className="mb-10 text-center z-10">
         <div className={`w-28 h-28 border-2 rounded-full flex items-center justify-center text-5xl font-serif font-bold mx-auto mb-4 shadow-xl ${isDark ? 'bg-gradient-to-br from-gray-700 to-black border-yellow-500/30 text-white' : 'bg-white border-yellow-500/30 text-gray-900'}`}>
            {user.name.charAt(0).toUpperCase()}
         </div>
         <h2 className={`text-3xl font-bold font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</h2>
         <div className="flex justify-center mt-3"><span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'host' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{user.role === 'host' ? text.host_badge : text.guest_badge}</span></div>
       </div>

       {/* INSTAGRAM BOX */}
       <div className="glass-panel rounded-3xl p-6 mb-6 relative z-10">
           <div className="flex items-center gap-2 mb-3">
               <Instagram size={18} className="text-pink-500"/>
               <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">{text.connect_insta}</p>
           </div>
           
           <div className="flex gap-2 relative z-20">
               <div 
                   className={`flex-1 flex items-center px-4 py-3 rounded-xl border relative z-20 transition cursor-text ${isDark ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                   style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}
               >
                   <span className="text-gray-400 font-bold mr-1">@</span>
                   <input 
                       type="text" 
                       value={editInsta} 
                       onChange={(e) => setEditInsta(e.target.value)} 
                       placeholder="usuario"
                       className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder-gray-500 text-inherit h-full"
                   />
               </div>
               
               <button onClick={handleSaveInsta} className={`px-4 rounded-xl flex items-center justify-center transition active:scale-95 shadow-md ${isDark ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-pink-500 text-white hover:bg-pink-600'}`}>
                   <Save size={20} />
               </button>
           </div>
           
           {savedMsg && <p className="text-xs text-green-500 font-bold mt-2 animate-in fade-in flex items-center justify-center gap-1"><CheckCircle2 size={12}/> {savedMsg}</p>}
       </div>

       <div className="glass-panel rounded-3xl p-6 mb-6 z-10 relative"><div className="flex items-center gap-2 mb-4"><QrCode size={18} className="text-yellow-500"/><p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">{text.invite_friends}</p></div><div className="flex gap-3"><div onClick={copyCode} className={`flex-1 border p-4 rounded-xl flex justify-between items-center cursor-pointer transition group ${isDark ? 'bg-black/30 border-white/10 hover:bg-white/5' : 'bg-white border-gray-100 hover:bg-gray-50'}`}><span className={`text-3xl font-mono font-bold tracking-widest group-hover:text-yellow-500 transition ${isDark ? 'text-white' : 'text-gray-800'}`}>{user.eventCode}</span><Copy size={20} className="text-gray-400 group-hover:text-white" /></div><button onClick={() => setShowQRModal(true)} className={`p-4 rounded-xl flex items-center justify-center transition shadow-lg ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}><QrCode size={28} /></button></div></div>
       
       <div className="glass-panel rounded-3xl p-6 mb-6 z-10">
         <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Users size={18} className="text-green-500"/><p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{text.guest_list} ({usersList.length})</p></div></div>
         <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {usersList.map((u, i) => {
                // CORRECCIÓN CRÍTICA: Contar fotos si coincide ID de sesión O si coincide el NOMBRE
                const postCount = posts.filter(p => {
                    // 1. Coincidencia técnica (misma sesión)
                    if (p.userId === u.deviceId) return true;
                    // 2. Coincidencia humana (mismo nombre, ignorando acentos)
                    if (p.userName && u.originalName) {
                        return normalizeName(p.userName) === normalizeName(u.originalName);
                    }
                    return false;
                }).length;

                return (
                    <div key={i} className={`flex items-center justify-between text-sm p-3 rounded-xl border ${isDark ? 'text-gray-300 bg-white/5 border-white/5' : 'text-gray-600 bg-white border-gray-100'}`}>
                        <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>{u.originalName.charAt(0).toUpperCase()}</div>
                        <div className="flex flex-col">
                            <span className="font-medium">{u.originalName} {u.role === 'host' && '👑'}</span>
                            {u.instagram && <span className="text-[10px] text-pink-500 flex items-center gap-0.5"><Instagram size={8}/> {u.instagram}</span>}
                        </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* CONTADOR DE FOTOS VISIBLE SIEMPRE */}
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${postCount > 0 ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-gray-500/10 border-gray-500/20 text-gray-400'}`}>
                                <ImageIcon size={10} className={postCount > 0 ? "text-green-500" : "text-gray-400"}/>
                                <span className="text-xs font-bold">{postCount} {postCount === 1 ? 'foto' : 'fotos'}</span>
                            </div>
                            {user.role === 'host' && u.role !== 'host' && (<button onClick={() => onKickGuest(u.id, u.deviceId)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition" title={text.kick_guest}><UserMinus size={16} /></button>)}
                        </div>
                    </div>
                );
            })}
         </div>
       </div>

       {user.role === 'host' && (<div className="z-10 relative"><button onClick={handleDownloadAll} disabled={isDownloading} className="w-full bg-green-900/20 border border-green-500/30 text-green-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2 mb-4 hover:bg-green-900/30 transition">{isDownloading ? text.downloading : text.download_album}</button>{user.adminPin && (<div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/20 mb-6"><div className="flex items-center gap-2 mb-2"><Lock size={18} className="text-red-400"/><p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{text.master_pin}</p></div><div className={`p-4 rounded-xl flex justify-between items-center border ${isDark ? 'bg-black/40 border-red-500/10' : 'bg-white border-red-200'}`}><span className={`text-xl font-mono font-bold tracking-[0.3em] ${isDark ? 'text-red-100' : 'text-red-900'}`}>{showPin ? user.adminPin : '••••'}</span><button onClick={() => setShowPin(!showPin)} className="text-red-400 hover:text-red-500">{showPin ? <EyeOff size={20} /> : <Eye size={20} />}</button></div></div>)}</div>)}
       <div className="mt-6 mb-6 z-10 relative"><button onClick={onLogout} className="w-full bg-red-500/5 border border-red-500/20 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/10 transition relative z-10"><LogOut size={20} /> {text.logout}</button></div>
       <div className="text-center opacity-40 pb-10 text-xs"><p className="mb-1">{text.need_help}</p><a href="mailto:contacto@clebrify.com" className="font-bold hover:underline flex items-center justify-center gap-1"><Mail size={12} /> contacto@clebrify.com</a></div>
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
  
  // -- NUEVO ESTADO: CONTROL DE VISTA (LISTA vs GRID) --
  const [feedLayout, setFeedLayout] = useState('grid'); 

  // -- ESTADO DEL EVENTO EN TIEMPO REAL --
  const [eventData, setEventData] = useState(null);
  const lastMessageRef = useRef('');

  // -- ESTADO PARA LA COLA DE SUBIDA --
  const [uploadQueue, setUploadQueue] = useState([]); 
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // NUEVO ESTADO: Progreso de subida (0 a 100)
  const [uploadProgress, setUploadProgress] = useState(0);

  const [showLanding, setShowLanding] = useState(true);
  const [banned, setBanned] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null); 
  
  const [showIntro, setShowIntro] = useState(false);

  // --- NUEVOS ESTADOS PARA LOS MODALES PERSONALIZADOS ---
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementValue, setAnnouncementValue] = useState('');

  // -- TEMA (Dark/Light) --
  const [theme, setTheme] = useState(() => {
      const savedTheme = localStorage.getItem(THEME_KEY);
      return savedTheme ? savedTheme : 'dark';
  });

  // --- ESTADO DE IDIOMA ---
  const [language, setLanguage] = useState('es'); // 'es' o 'en'

  const toggleTheme = () => {
      setTheme(prev => {
          const newTheme = prev === 'dark' ? 'light' : 'dark';
          localStorage.setItem(THEME_KEY, newTheme);
          return newTheme;
      });
  };

  const toggleLanguage = () => {
      setLanguage(prev => prev === 'es' ? 'en' : 'es');
  };

  const isDark = theme === 'dark';
  const text = TRANSLATIONS[language];

  // --- SONIDO DE NOTIFICACIÓN ---
  const playNotificationSound = () => {
      try {
          const audio = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3");
          audio.volume = 0.5;
          audio.play().catch(e => console.log("Audio play prevented by browser policy", e));
      } catch (e) {
          console.error(e);
      }
  };

  // --- DETECTOR DE CONEXIÓN A INTERNET ---
  useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  // --- PROCESADOR DE LA COLA DE SUBIDA (ACTUALIZADO CON PROGRESS BAR) ---
  useEffect(() => {
      if (!isOnline || isProcessingQueue || uploadQueue.length === 0) return;
      
      const itemToUpload = uploadQueue.find(item => item.status === 'pending');
      if (!itemToUpload) return;

      const processItem = async () => {
          setIsProcessingQueue(true);
          setUploadProgress(0); // Reiniciar barra
          
          // Marcar como subiendo
          setUploadQueue(prev => prev.map(i => i.id === itemToUpload.id ? { ...i, status: 'uploading' } : i));

          try {
              const timestamp = Date.now();
              const type = itemToUpload.type;
              let downloadUrl = '';
              const folder = type === 'video' ? 'videos' : 'images';
              const ext = type === 'video' ? 'mp4' : 'jpg';
              const fileName = `${timestamp}_${Math.floor(Math.random()*1000)}.${ext}`;
              const storageRef = ref(storage, `events/${currentUser.eventCode}/${folder}/${fileName}`);

              // LÓGICA DE SUBIDA CON PROGRESO (Videos o Fotos pesadas)
              if (type === 'video') {
                  const uploadTask = uploadBytesResumable(storageRef, itemToUpload.data);
                  
                  // Promesa para esperar a que termine el Task
                  await new Promise((resolve, reject) => {
                      uploadTask.on('state_changed', 
                          (snapshot) => {
                              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                              setUploadProgress(progress);
                          }, 
                          (error) => reject(error), 
                          () => resolve()
                      );
                  });
                  
                  downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

              } else {
                  // Para fotos (base64 string) usamos uploadString que es más directo
                  // Simulamos un progreso rápido
                  setUploadProgress(10);
                  const snapshot = await uploadString(storageRef, itemToUpload.data, 'data_url');
                  setUploadProgress(100);
                  downloadUrl = await getDownloadURL(snapshot.ref);
              }

              await addDoc(collection(db, 'events', currentUser.eventCode, 'posts'), { 
                userId: firebaseUser.uid, 
                userName: currentUser.name, 
                userRole: currentUser.role, 
                userInstagram: currentUser.instagram || '', 
                imageUrl: downloadUrl, 
                contentType: type,
                timestamp: serverTimestamp(), 
                comments: [], 
                likes: [] 
              });

              // Éxito: Eliminar de la cola
              setUploadQueue(prev => prev.filter(i => i.id !== itemToUpload.id));
              setUploadProgress(0); // Limpiar barra al final

          } catch (error) {
              console.error("Error subiendo (background):", error);
              if (!navigator.onLine) {
                 setUploadQueue(prev => prev.map(i => i.id === itemToUpload.id ? { ...i, status: 'waiting_connection' } : i));
              } else {
                 setUploadQueue(prev => prev.map(i => i.id === itemToUpload.id ? { ...i, status: 'pending' } : i));
              }
          } finally {
              setIsProcessingQueue(false);
          }
      };

      processItem();

  }, [uploadQueue, isOnline, isProcessingQueue, currentUser, firebaseUser]);


  useEffect(() => {
    document.title = "Clebrify";
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = '/logo.svg'; 
    link.type = 'image/svg+xml';

    let appleLink = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.getElementsByTagName('head')[0].appendChild(appleLink);
    }
    appleLink.href = '/logo.svg';
  }, []);

  useEffect(() => {
    const hasSeen = localStorage.getItem(INTRO_KEY);
    if (!hasSeen && !currentUser) {
        setShowIntro(true);
    }
  }, [currentUser]);

  const handleFinishIntro = () => {
      setShowIntro(false);
      localStorage.setItem(INTRO_KEY, 'true'); 
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
    
    // Escuchar posts
    const unsubP = onSnapshot(query(collection(db, 'events', currentUser.eventCode, 'posts')), s => {
      setPosts(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b)=>(b.timestamp?.seconds||0)-(a.timestamp?.seconds||0)));
    });
    
    // Escuchar usuarios
    const unsubU = onSnapshot(collection(db, 'events', currentUser.eventCode, 'users'), s => {
       setUsersList(s.docs.map(d => ({ id: d.id, ...d.data() }))); 
       setPeopleCount(s.size);
    });

    // Escuchar METADATA DEL EVENTO
    const unsubE = onSnapshot(doc(db, 'events', currentUser.eventCode), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setEventData(data);

            if (data.hostMessage && data.hostMessage !== lastMessageRef.current) {
                if (lastMessageRef.current !== '') {
                    playSoundAndVibrate();
                }
            }
            lastMessageRef.current = data.hostMessage || '';
        }
    });

    return () => { unsubP(); unsubU(); unsubE(); };
  }, [currentUser]);

  const playSoundAndVibrate = () => {
      playNotificationSound();
      if (navigator.vibrate) navigator.vibrate(200);
  };

  const handleLogin = (d) => { 
    setCurrentUser(d); 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); 
    setShowLanding(false);
  };
  
  const handleLogout = async () => { 
    if(confirm("¿Salir y cerrar sesión?")){ 
      try {
        await signOut(auth); 
      } catch(e) { console.error(e); }
      
      setCurrentUser(null); 
      localStorage.removeItem(STORAGE_KEY); 
      setView('feed'); 
      setShowLanding(true); 
      window.location.reload();
    }
  };

  // --- FUNCIONES MODIFICADAS PARA USAR LOS NUEVOS MODALES ---
  const openEditNameModal = () => {
      setEditNameValue(eventData?.eventName || currentUser.eventName);
      setShowEditNameModal(true);
  };

  const submitEditName = async () => {
    const currentName = eventData?.eventName || currentUser.eventName;
    const newName = editNameValue;
    if (newName && newName.trim() !== "" && newName !== currentName) {
      try {
        const eventRef = doc(db, 'events', currentUser.eventCode);
        await updateDoc(eventRef, { eventName: newName.trim() });
      } catch (error) {
        console.error("Error al actualizar:", error);
        alert("No se pudo actualizar el nombre.");
      }
    }
    setShowEditNameModal(false);
  };

  const openAnnouncementModal = () => {
      setAnnouncementValue(eventData?.hostMessage || "");
      setShowAnnouncementModal(true);
  };

  const submitAnnouncement = async () => {
      const newMsg = announcementValue;
      try {
          const eventRef = doc(db, 'events', currentUser.eventCode);
          await updateDoc(eventRef, { hostMessage: newMsg.trim() });
      } catch (e) {
          console.error("Error al actualizar anuncio:", e);
          alert("Error al guardar el anuncio.");
      }
      setShowAnnouncementModal(false);
  };
  // ---------------------------------------------------------

  const handleUpdateInstagram = async (newInsta) => {
      try {
          const usersRef = collection(db, 'events', currentUser.eventCode, 'users');
          let q = query(usersRef, where('deviceId', '==', firebaseUser.uid));
          let snap = await getDocs(q);
          
          if (snap.empty) {
             const normalize = (str) => str.toLowerCase().replace(/\s+/g, '');
             const currentNameClean = normalize(currentUser.name);
             const allDocs = await getDocs(usersRef);
             let foundDoc = null;
             allDocs.forEach(d => {
                 if (normalize(d.data().originalName) === currentNameClean) foundDoc = d;
             });
             if (foundDoc) {
                 await updateDoc(foundDoc.ref, { instagram: newInsta });
             }
          } else {
              const myDoc = snap.docs[0];
              await updateDoc(myDoc.ref, { instagram: newInsta });
          }

          const updatedUser = { ...currentUser, instagram: newInsta };
          setCurrentUser(updatedUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      } catch (e) {
          console.error("Error guardando insta", e);
          alert("Error al guardar");
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

  const handleUpload = (uploadObject) => {
    const tempId = Date.now().toString();
    setUploadQueue(prev => [...prev, {
        id: tempId,
        type: uploadObject.type,
        data: uploadObject.data,
        status: 'pending', 
        timestamp: Date.now()
    }]);
    setView('feed');
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

  if (showIntro) {
      return (
          <>
            <GlobalStyles theme="dark" />
            <OnboardingScreen onFinish={handleFinishIntro} />
          </>
      );
  }

  if (showLanding && !currentUser) {
    return (
      <>
        <GlobalStyles theme={theme} />
        <LandingPage 
            onStart={() => setShowLanding(false)} 
            theme={theme} 
            toggleTheme={toggleTheme} 
            language={language}
            toggleLanguage={toggleLanguage}
        />
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <GlobalStyles theme={theme} />
        <LoginScreen 
            onJoin={handleLogin} 
            userUid={firebaseUser?.uid} 
            theme={theme} 
            onBack={() => setShowLanding(true)}
            language={language}
        />
      </>
    );
  }

  // APP PRINCIPAL
  return (
    <>
    <GlobalStyles theme={theme} />
    <Analytics />
    
    <div className="flex flex-col h-screen max-w-md mx-auto shadow-2xl relative overflow-hidden transition-colors duration-500" style={{ background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #172554 100%)' : '#FFFFFF' }}>
      
      {selectedMedia && (
        <MediaViewer media={selectedMedia} onClose={() => setSelectedMedia(null)} />
      )}

      {/* --- NUEVOS MODALES PERSONALIZADOS --- */}

      {/* Modal Editar Nombre */}
      {showEditNameModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowEditNameModal(false)}>
              <div className={`w-full max-w-md glass-panel rounded-3xl p-6 relative ${isDark ? 'text-white' : 'text-gray-900'}`} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowEditNameModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  <h3 className="font-bold font-serif text-xl mb-4">{text.modal_edit_title}</h3>
                  
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-yellow-600 ml-1 tracking-widest uppercase">{text.lbl_new_name}</label>
                      <input 
                          type="text" 
                          value={editNameValue} 
                          onChange={(e) => setEditNameValue(e.target.value)} 
                          className={`w-full rounded-xl px-4 py-3 outline-none transition border ${isDark ? 'bg-[#1e293b] border-white/10 text-white placeholder-gray-500 focus:border-yellow-500/50' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-yellow-500/50'}`}
                      />
                  </div>

                  <div className="flex gap-3 mt-6">
                     <button onClick={() => setShowEditNameModal(false)} className={`flex-1 py-3 rounded-xl font-bold transition border ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>{text.btn_cancel}</button>
                     <button onClick={submitEditName} disabled={!editNameValue.trim()} className="flex-1 btn-primary py-3 rounded-xl shadow-lg disabled:opacity-50">{text.save_btn}</button>
                  </div>
              </div>
          </div>
      )}

      {/* Modal Publicar Anuncio */}
      {showAnnouncementModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowAnnouncementModal(false)}>
              <div className={`w-full max-w-md glass-panel rounded-3xl p-6 relative ${isDark ? 'text-white' : 'text-gray-900'}`} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowAnnouncementModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  <h3 className="font-bold font-serif text-xl mb-4 flex items-center gap-2"><Megaphone size={20} className="text-yellow-500"/> {text.modal_ann_title}</h3>
                  
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 ml-1 tracking-widest uppercase">{text.lbl_ann_msg}</label>
                      <textarea 
                          rows={4}
                          value={announcementValue} 
                          onChange={(e) => setAnnouncementValue(e.target.value)} 
                          placeholder={text.ph_ann_msg}
                          className={`w-full rounded-xl px-4 py-3 outline-none transition border resize-none ${isDark ? 'bg-[#1e293b] border-white/10 text-white placeholder-gray-500 focus:border-yellow-500/50' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-yellow-500/50'}`}
                      />
                  </div>

                  <div className="flex gap-3 mt-6">
                     <button onClick={() => setShowAnnouncementModal(false)} className={`flex-1 py-3 rounded-xl font-bold transition border ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>{text.btn_cancel}</button>
                     <button onClick={submitAnnouncement} className="flex-1 btn-primary py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"><Megaphone size={16}/> {text.btn_post}</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- BARRA DE ESTADO DE SUBIDA (AHORA CON TEMA Y PROGRESO) --- */}
      {uploadQueue.length > 0 && (
         <div className="absolute top-20 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none animate-in slide-in-from-top-2">
            <div className={`backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border flex flex-col gap-2 min-w-[200px] transition-colors ${
                isDark 
                ? 'bg-slate-900/95 border-slate-700 text-white' 
                : 'bg-white/95 border-gray-200 text-gray-900 shadow-2xl'
            }`}>
               <div className="flex items-center gap-3">
                   { !isOnline ? <WifiOff size={16} className="animate-pulse text-red-500" /> : <RefreshCw size={16} className={`animate-spin ${isDark ? 'text-white' : 'text-black'}`} /> }
                   <span className="text-xs font-bold">
                      { !isOnline 
                        ? `${text.waiting_net} (${uploadQueue.length})` 
                        : `${text.uploading} ${uploadQueue.length}...`
                      }
                   </span>
               </div>
               
               {/* BARRA DE PROGRESO */}
               {isOnline && (
                   <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                       <div 
                           className="h-full bg-green-500 rounded-full transition-all duration-300 ease-out" 
                           style={{ width: `${Math.max(5, uploadProgress)}%` }} // Minimo 5% para que se vea algo
                       ></div>
                   </div>
               )}
            </div>
         </div>
      )}

      {view === 'camera' ? <CameraView onClose={() => setView('feed')} onUpload={handleUpload} theme={theme} /> : view === 'profile' ? (
        <>
           <div className={`px-6 py-4 flex justify-between items-center border-b transition-colors ${isDark ? 'bg-[#0f172a]/90 border-white/5' : 'bg-white/90 border-gray-100'}`}>
             <div className="flex items-center gap-4">
                <button onClick={() => setView('feed')}><X className={isDark ? 'text-white' : 'text-black'}/></button>
                <h1 className={`text-xl font-bold font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>{text.profile_title}</h1>
             </div>
           </div>
           <ProfileView 
                user={currentUser} 
                onLogout={handleLogout} 
                posts={posts} 
                usersList={usersList} 
                theme={theme} 
                toggleTheme={toggleTheme} 
                onKickGuest={handleKickGuest} 
                onUpdateInstagram={handleUpdateInstagram}
                language={language}
                toggleLanguage={toggleLanguage}
           />
        </>
      ) : (
        <>
          <header className={`backdrop-blur-md px-6 py-3 flex justify-between items-center sticky top-0 z-30 border-b transition-colors ${isDark ? 'bg-[#0f172a]/90 border-white/5' : 'bg-white/90 border-gray-100'}`}>
            <div onClick={() => setView('feed')} className="cursor-pointer">
              <h1 className={`text-lg font-bold font-serif leading-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Clebrify
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border tracking-widest ${isDark ? 'bg-white/5 text-gray-400 border-white/5' : 'bg-black/5 text-gray-500 border-black/5'}`}>{currentUser.eventCode}</span>
              </h1>
              
              <div className="flex items-center gap-2">
                <p className="text-sm text-yellow-600/90 font-medium max-w-[200px] truncate">
                    {eventData ? eventData.eventName : currentUser.eventName}
                </p>
                
                {currentUser.role === 'host' && (
                  <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditNameModal(); }} 
                        className="p-1.5 rounded-full hover:bg-yellow-500/10 text-yellow-600/50 hover:text-yellow-600 transition"
                        title="Editar nombre"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openAnnouncementModal(); }} 
                        className={`p-1.5 rounded-full hover:bg-yellow-500/10 transition ${eventData?.hostMessage ? 'text-yellow-600' : 'text-yellow-600/50 hover:text-yellow-600'}`}
                        title="Publicar anuncio"
                      >
                        <Megaphone size={12} />
                        {eventData?.hostMessage && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
                      </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className={`border px-2 py-1 rounded-full flex items-center gap-1 text-xs ${isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-black/5 border-black/5 text-gray-600'}`}>
                <Users size={12} /> {peopleCount}
              </div>
              {/* BOTÓN TOGGLE GRID/LIST */}
              <button 
                onClick={() => setFeedLayout(prev => prev === 'list' ? 'grid' : 'list')}
                className={`border px-2 py-1 rounded-full flex items-center justify-center transition ${isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-black/5 border-black/5 text-gray-600 hover:bg-black/10'}`}
              >
                {feedLayout === 'list' ? <Grid size={12} /> : <List size={12} />}
              </button>
            </div>
          </header>

          {/* --- BURBUJA DE ANUNCIOS DEL ANFITRIÓN --- */}
          {eventData?.hostMessage && (
              <div className="px-6 py-4 animate-slide-down sticky top-[73px] z-20">
                  <div className={`rounded-2xl p-4 shadow-lg border relative overflow-hidden ${isDark ? 'bg-gradient-to-r from-indigo-900/80 to-purple-900/80 border-indigo-500/30 text-white' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 text-indigo-900'}`}>
                      <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                      <div className="flex gap-3 items-start relative z-10">
                          <div className={`p-2 rounded-full flex-shrink-0 ${isDark ? 'bg-white/10 text-yellow-300' : 'bg-white text-indigo-600 shadow-sm'}`}>
                              <Megaphone size={18} className="animate-pulse"/>
                          </div>
                          <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">{text.host_msg_title}</p>
                              <p className="text-sm font-medium leading-relaxed">
                                  {eventData.hostMessage}
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          <main className="flex-1 overflow-y-auto pb-24 p-5 custom-scrollbar relative z-10">
            {posts.length === 0 ? (
                <div className="text-center mt-32 opacity-50"><Aperture size={40} className="mx-auto mb-4 text-gray-500"/><p className="text-gray-500 font-serif">{text.no_photos}</p></div> 
            ) : feedLayout === 'list' ? (
                // --- VISTA DE LISTA (FEED) ---
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
                      usersList={usersList} 
                      language={language}
                    />
                ))
            ) : (
                // --- VISTA DE GRID (GALERÍA) ---
                <div className="grid grid-cols-3 gap-0.5 animate-in fade-in duration-500">
                    {posts.map(p => {
                        const isVid = p.imageUrl.includes('video') || p.imageUrl.includes('.mp4');
                        return (
                            <div 
                                key={p.id} 
                                className="aspect-square relative cursor-pointer overflow-hidden bg-gray-900 group"
                                onClick={() => setSelectedMedia({ url: p.imageUrl, type: isVid ? 'video' : 'image' })}
                            >
                                {isVid ? (
                                    <>
                                        <video src={p.imageUrl} className="w-full h-full object-cover opacity-80" muted preload="metadata" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Play size={24} className="text-white/80 drop-shadow-md" fill="white" />
                                        </div>
                                    </>
                                ) : (
                                    <img src={p.imageUrl} alt="grid-thumb" className="w-full h-full object-cover transition duration-300 group-hover:scale-110" loading="lazy" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
          </main>
        </>
      )}

      <nav className={`fixed bottom-6 left-0 right-0 mx-auto w-[90%] max-w-[350px] backdrop-blur-xl border rounded-2xl h-16 flex justify-between items-center z-50 shadow-2xl px-6 transition-colors duration-500 ${isDark ? 'bg-[#0f172a]/95 border-white/10' : 'bg-white/90 border-gray-200'}`}>
        <button onClick={() => setView('feed')} className={`relative p-3 rounded-xl transition ${view === 'feed' ? (isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black') : 'text-gray-400 hover:text-gray-600'}`}>
          <Home size={24} />
          {eventData?.hostMessage && view !== 'feed' && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0f172a] animate-pulse"></span>
          )}
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