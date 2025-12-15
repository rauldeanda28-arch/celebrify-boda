import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Home, User, Trash2, Send, MessageCircle, X,
  LogOut, Aperture, Heart, Lock, Copy, Share2
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';

/* ================= FIREBASE ================= */

const firebaseConfig = {
  apiKey: "AIzaSyDOPQdyUtsIcougnXwhaehhw3fs4gmAWv0",
  authDomain: "celebrify-e5de2.firebaseapp.com",
  projectId: "celebrify-e5de2",
  storageBucket: "celebrify-e5de2.firebasestorage.app",
  messagingSenderId: "486495542360",
  appId: "1:486495542360:web:8507dd9206611ccfa3fe2d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const STORAGE_KEY = 'celebrify_session_v1';
const MASTER_KEY = 'BODA2024';

/* ================= UTILS ================= */

const generateCode = (length) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/* ================= CAMERA VIEW ================= */

const CameraView = ({ onClose, onUpload }) => {
  const fileInputRef = useRef(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => onUpload(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <button onClick={onClose}>
          <X size={24} />
        </button>
        <h2 className="font-bold">Subir foto o video</h2>
        <div className="w-6" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <button
          onClick={triggerFileInput}
          className="bg-white text-black px-6 py-4 rounded-xl font-bold flex items-center gap-2"
        >
          <Camera size={24} />
          Abrir cámara / galería
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
};

/* ================= POST CARD ================= */

const PostCard = ({
  post,
  currentUser,
  currentUserId,
  onDeletePost,
  onAddComment,
  onDeleteComment,
  onToggleLike
}) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const isLiked = post.likes?.includes(currentUserId);
  const likeCount = post.likes?.length || 0;

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  return (
    <div className="bg-white mb-4 border-b">
      <div className="flex justify-between items-center p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-800 text-white flex items-center justify-center text-xs font-bold">
            {post.userName[0].toUpperCase()}
          </div>
          <span className="font-semibold">{post.userName}</span>
        </div>
        {currentUser.role === 'host' && (
          <button onClick={() => onDeletePost(post.id)}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="aspect-square bg-black">
        {post.imageUrl.startsWith('data:video') ? (
          <video src={post.imageUrl} controls className="w-full h-full object-cover" />
        ) : (
          <img src={post.imageUrl} className="w-full h-full object-cover" />
        )}
      </div>

      <div className="p-3">
        <div className="flex gap-4 mb-2">
          <button onClick={() => onToggleLike(post.id, isLiked)}>
            <Heart size={26} fill={isLiked ? "red" : "none"} />
          </button>
          <button onClick={() => setShowComments(!showComments)}>
            <MessageCircle size={26} />
          </button>
        </div>

        {likeCount > 0 && (
          <p className="text-sm font-bold">{likeCount} me gusta</p>
        )}

        {post.comments?.slice(showComments ? 0 : -2).map((c, i) => (
          <div key={i} className="text-sm flex justify-between">
            <span><b>{c.userName}</b> {c.text}</span>
            {currentUser.role === 'host' && (
              <button onClick={() => onDeleteComment(post.id, c)}>
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        <form onSubmit={handleSubmitComment} className="flex mt-2">
          <input
            className="flex-1 text-sm outline-none"
            placeholder="Comentar..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
          <button type="submit" disabled={!commentText.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

/* ================= APP ================= */

function CameraView({ onClose }) {
  const fileInputRef = useRef(null);

  const openFilePicker = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button onClick={onClose}>Cerrar</button>
        <span>Cámara</span>
        <div />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <button
          onClick={openFilePicker}
          className="bg-white text-black px-6 py-4 rounded-xl"
        >
          Abrir cámara / galería
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
        />
      </div>
    </div>
  );
}

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
    signInAnonymously(auth);
    const unsub = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser || !currentUser) return;
    const q = query(collection(db, 'events', currentUser.eventCode, 'posts'));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setPosts(data);
    });
  }, [firebaseUser, currentUser]);

  const handleUpload = async (dataUrl) => {
    setView('feed');
    await addDoc(collection(db, 'events', currentUser.eventCode, 'posts'), {
      imageUrl: dataUrl,
      userName: currentUser.name,
      userId: firebaseUser.uid,
      timestamp: serverTimestamp(),
      comments: [],
      likes: []
    });
  };

  const handleAddComment = async (postId, text) => {
    const ref = doc(db, 'events', currentUser.eventCode, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    await setDoc(ref, {
      comments: [...post.comments, {
        text,
        userName: currentUser.name,
        userId: firebaseUser.uid,
        timestamp: Date.now()
      }]
    }, { merge: true });
  };

  const handleToggleLike = async (postId, isLiked) => {
    const ref = doc(db, 'events', currentUser.eventCode, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    const likes = isLiked
      ? post.likes.filter(id => id !== firebaseUser.uid)
      : [...post.likes, firebaseUser.uid];
    await setDoc(ref, { likes }, { merge: true });
  };

  const handleDeletePost = async (postId) => {
    await deleteDoc(doc(db, 'events', currentUser.eventCode, 'posts', postId));
  };

  const handleDeleteComment = async (postId, comment) => {
    const ref = doc(db, 'events', currentUser.eventCode, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    await setDoc(ref, {
      comments: post.comments.filter(c => c.timestamp !== comment.timestamp)
    }, { merge: true });
  };

  if (loading) return <div>Cargando...</div>;
  if (!currentUser) return <div>Login pendiente (tu LoginScreen va aquí)</div>;

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col">
      {view === 'camera' ? (
        <CameraView onClose={() => setView('feed')} onUpload={handleUpload} />
      ) : (
        <>
          <main className="flex-1 overflow-y-auto">
            {posts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                currentUser={currentUser}
                currentUserId={firebaseUser.uid}
                onDeletePost={handleDeletePost}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onToggleLike={handleToggleLike}
              />
            ))}
          </main>

          <nav className="h-16 flex justify-around items-center border-t">
            <button onClick={() => setView('feed')}>
              <Home />
            </button>
            <button onClick={() => setView('camera')}>
              <Camera />
            </button>
            <button>
              <User />
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
