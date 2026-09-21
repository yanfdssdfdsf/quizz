import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Trophy, Zap, Clock, Star, Heart,
  Users, Lock, Unlock, Copy, Check, Crown, Medal, Award,
  Target, ArrowLeft, Volume2, VolumeX,
  Sparkles, Moon, Sun, BarChart2, User, Plus, Minus,
  Home, RefreshCw, LogIn, Search, X, Tag, UserMinus, Mail, Eye, EyeOff
} from "lucide-react";

/* ════════════════════════════════════════════════════
   CONSTANTES
════════════════════════════════════════════════════ */
const CATEGORIES = [
  { name:"📰 Actualités",         color:["#ef4444","#dc2626"], emoji:"📰" },
  { name:"🧠 Culture Générale",   color:["#a855f7","#ec4899"], emoji:"🧠" },
  { name:"🔬 Sciences",           color:["#3b82f6","#06b6d4"], emoji:"🔬" },
  { name:"🎬 Cinéma & Séries",   color:["#ef4444","#f97316"], emoji:"🎬" },
  { name:"🎮 Gaming",             color:["#6366f1","#a855f7"], emoji:"🎮" },
  { name:"🌍 Géographie",         color:["#22c55e","#14b8a6"], emoji:"🌍" },
  { name:"📚 Littérature",        color:["#eab308","#f59e0b"], emoji:"📚" },
  { name:"🎵 Musique",            color:["#ec4899","#f43f5e"], emoji:"🎵" },
  { name:"⚽ Sports",             color:["#f97316","#ef4444"], emoji:"⚽" },
  { name:"💻 Technologie",        color:["#06b6d4","#3b82f6"], emoji:"💻" },
  { name:"🎨 Art & Histoire",     color:["#8b5cf6","#a855f7"], emoji:"🎨" },
  { name:"🎌 Anime & Manga",      color:["#ec4899","#8b5cf6"], emoji:"🎌" },
];
const OPT = [
  { bg:"#ef4444", label:"A" },
  { bg:"#3b82f6", label:"B" },
  { bg:"#eab308", label:"C" },
  { bg:"#22c55e", label:"D" },
];
const RANKS = [
  { min:85, title:"LÉGENDAIRE", icon:"👑", bg:["#facc15","#f97316"] },
  { min:70, title:"EXPERT",     icon:"⭐", bg:["#a855f7","#ec4899"] },
  { min:55, title:"COMPÉTENT",  icon:"💪", bg:["#3b82f6","#06b6d4"] },
  { min:40, title:"APPRENTI",   icon:"🎓", bg:["#22c55e","#14b8a6"] },
  { min:0,  title:"DÉBUTANT",   icon:"🌱", bg:["#6b7280","#9ca3af"] },
];
const getRank = p => RANKS.find(r => p >= r.min) || RANKS[4];
const uid     = () => Date.now() + Math.random();
const clamp   = (v,a,b) => Math.max(a, Math.min(b, v));
const randCode= () => {
  const c="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join("");
};

/* ════════════════════════════════════════════════════
   ROOMS - Persistance localStorage
════════════════════════════════════════════════════ */
const STORAGE_ROOMS = "quizmaster_rooms";

const getRooms = () => {
  try {
    const rooms = JSON.parse(localStorage.getItem(STORAGE_ROOMS) || "{}");
    // Cleanup des rooms de plus de 2h
    const now = Date.now();
    Object.keys(rooms).forEach(code => {
      if (now - rooms[code].createdAt > 7200000) { // 2h
        delete rooms[code];
      }
    });
    localStorage.setItem(STORAGE_ROOMS, JSON.stringify(rooms));
    return rooms;
  } catch {
    return {};
  }
};

const saveRooms = (rooms) => {
  try {
    localStorage.setItem(STORAGE_ROOMS, JSON.stringify(rooms));
  } catch (e) {
    console.error("Erreur sauvegarde rooms:", e);
  }
};

const ROOMS = getRooms(); // Charger au démarrage

/* ════════════════════════════════════════════════════
   STORAGE - Comptes utilisateurs (localStorage)
════════════════════════════════════════════════════ */
const STORAGE_USERS = "quizmaster_users";
const STORAGE_SESSION = "quizmaster_session";

const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_USERS) || "{}");
  } catch {
    return {};
  }
};

const saveUsers = (users) => {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
};

const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_SESSION) || "null");
  } catch {
    return null;
  }
};

const saveSession = (email) => {
  localStorage.setItem(STORAGE_SESSION, JSON.stringify(email));
};

const clearSession = () => {
  localStorage.removeItem(STORAGE_SESSION);
};

/* ════════════════════════════════════════════════════
   LOGGING SYSTEM
════════════════════════════════════════════════════ */
const STORAGE_LOGS = "quizmaster_logs";
const STORAGE_ERRORS = "quizmaster_errors";

const getIP = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return "Unknown";
  }
};

let cachedIP = null;
const ensureIP = async () => {
  if (!cachedIP) cachedIP = await getIP();
  return cachedIP;
};

const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const logAction = async (action, details = "") => {
  const ip = await ensureIP();
  const time = formatTime();
  const logEntry = {
    ip,
    time,
    action,
    details,
    timestamp: Date.now()
  };
  
  // Console log
  console.log(`🟢 ${ip} | ${time} | ${action}${details ? ` | ${details}` : ""}`);
  
  // Stockage
  try {
    const logs = JSON.parse(localStorage.getItem(STORAGE_LOGS) || "[]");
    logs.unshift(logEntry);
    if (logs.length > 1000) logs.length = 1000; // Garder max 1000 logs
    localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error("Erreur sauvegarde log:", e);
  }
};

const logError = (problem, message = "", code = 0) => {
  const time = formatTime();
  const errorEntry = {
    time,
    problem,
    message,
    code,
    timestamp: Date.now()
  };
  
  // Console log
  console.error(`🔴 ${time} | ${problem} | ${message} | CODE: ${code}`);
  
  // Stockage
  try {
    const errors = JSON.parse(localStorage.getItem(STORAGE_ERRORS) || "[]");
    errors.unshift(errorEntry);
    if (errors.length > 500) errors.length = 500; // Garder max 500 erreurs
    localStorage.setItem(STORAGE_ERRORS, JSON.stringify(errors));
  } catch (e) {
    console.error("Erreur sauvegarde error:", e);
  }
};

const getLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_LOGS) || "[]");
  } catch {
    return [];
  }
};

const getErrors = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_ERRORS) || "[]");
  } catch {
    return [];
  }
};

const clearLogs = () => {
  localStorage.removeItem(STORAGE_LOGS);
  localStorage.removeItem(STORAGE_ERRORS);
  console.log("🧹 Logs cleared");
};

/* ════════════════════════════════════════════════════
   COMPOSANTS SOUS
════════════════════════════════════════════════════ */
function FloatBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(16)].map((_,i) => (
        <div key={i} className="absolute rounded-full" style={{
          width:  80+(i*41)%120+"px",
          height: 80+(i*41)%120+"px",
          left:   (i*19)%92+"%",
          top:    (i*25)%88+"%",
          opacity: 0.07,
          background:`radial-gradient(circle,${["#a855f7","#ec4899","#3b82f6","#22c55e","#f97316"][i%5]}aa,transparent 70%)`,
          animation:`float ${4+(i%3)}s ease-in-out infinite`,
          animationDelay:`${(i*0.5)%2.5}s`,
        }}/>
      ))}
    </div>
  );
}

function ToastBanner({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed top-5 left-1/2 z-50" style={{transform:"translateX(-50%)",animation:"slideDown .3s ease"}}>
      <div className={`px-7 py-3 rounded-2xl shadow-2xl font-bold text-lg flex items-center gap-2 ${toast.type==="error"?"bg-red-500 text-white":"bg-emerald-500 text-white"}`}>
        {toast.type==="error"?"⚠️":"✅"} {toast.msg}
      </div>
    </div>
  );
}

function CopyBtn({ text }) {
  const [ok,setOk] = useState(false);
  return (
    <button onClick={()=>{navigator.clipboard?.writeText(text);setOk(true);setTimeout(()=>setOk(false),1500);}}
      className="p-2 rounded-xl bg-violet-500 text-white hover:bg-violet-600 transition">
      {ok ? <Check size={20}/> : <Copy size={20}/>}
    </button>
  );
}

/* ════════════════════════════════════════════════════
   APP PRINCIPALE
════════════════════════════════════════════════════ */
export default function App() {
  const [dark,setDark]         = useState(true);
  const [sound,setSound]       = useState(true);
  const [page,setPage]         = useState("auth"); // auth | home | setup | joinScreen | lobby | quiz | results | history
  const [authMode,setAuthMode] = useState("login"); // login | register
  const [currentUser,setCurrentUser] = useState(null);
  const [playerName,setName]   = useState("");
  const [isHost,setIsHost]     = useState(false);
  const [room,setRoom]         = useState(null);
  const pollerRef              = useRef(null);
  
  // auth states
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [showPassword,setShowPassword] = useState(false);
  const [selCats,setSelCats]   = useState([]);
  const [customKeywords,setCustomKeywords] = useState([]);
  const [searchInput,setSearchInput]       = useState("");
  const [diff,setDiff]         = useState("moyen");
  const [numQ,setNumQ]         = useState(5);
  const [isPublic,setIsPublic] = useState(true);
  const [roomPwd,setRoomPwd]   = useState("");
  const [questions,setQuestions]= useState([]);
  const [qIdx,setQIdx]         = useState(0);
  const [chosen,setChosen]     = useState(null);
  const [feedback,setFeedback] = useState(false);
  const [correct,setCorrect]   = useState(false);
  const [myScore,setMyScore]   = useState(0);
  const [streak,setStreak]     = useState(0);
  const [combo,setCombo]       = useState(1);
  const [elapsed,setElapsed]   = useState(0);
  const [flash,setFlash]       = useState(0);
  const [particles,setParticles]= useState([]);
  const timerRef               = useRef(null);
  const [leaderboard,setLeaderboard] = useState([]);
  const [toast,setToast]       = useState(null);
  const scoreRef               = useRef(0);
  const [joinRoomCode,setJoinRoomCode] = useState("");
  const [joinRoomPwd,setJoinRoomPwd]   = useState("");
  const [roomsRefresh,setRoomsRefresh] = useState(0); // Pour forcer le reload

  // theme
  const bg      = dark ? "from-slate-950 via-slate-900 to-slate-950" : "from-violet-50 via-pink-50 to-fuchsia-50";
  const cardBg  = dark ? "bg-slate-800/80 border-slate-700" : "bg-white/90 border-purple-100";
  const textPri = dark ? "text-white"    : "text-gray-900";
  const textSec = dark ? "text-slate-400": "text-gray-500";
  const inputBg = dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                       : "bg-white border-purple-200 text-gray-800 placeholder-gray-400";

  /* ── toast ── */
  const showToast = useCallback((msg,type="info")=>{
    setToast({msg,type,id:uid()});
    setTimeout(()=>setToast(null),2600);
  },[]);

  /* ── check session on mount ── */
  useEffect(()=>{
    const session = getSession();
    if(session){
      const users = getUsers();
      if(users[session]){
        setCurrentUser(users[session]);
        setName(users[session].pseudo);
        setPage("home");
      } else {
        clearSession();
      }
    }
  },[]);

  /* ═══ AUTH ACTIONS ═══ */
  const handleRegister = () => {
    if(!email.trim() || !password.trim()){
      logError("REGISTER_FAILED", "Champs vides", 400);
      return showToast("Remplis tous les champs !","error");
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      logError("REGISTER_FAILED", "Email invalide", 400);
      return showToast("Email invalide !","error");
    }
    if(password.length < 6){
      logError("REGISTER_FAILED", "Mot de passe trop court", 400);
      return showToast("Mot de passe trop court (min 6 caractères) !","error");
    }
    
    const users = getUsers();
    if(users[email]){
      logError("REGISTER_FAILED", "Email déjà utilisé", 409);
      return showToast("Email déjà utilisé !","error");
    }
    
    const pseudo = email.split("@")[0];
    users[email] = {
      email,
      password,
      pseudo,
      history: [],
      createdAt: Date.now()
    };
    saveUsers(users);
    saveSession(email);
    setCurrentUser(users[email]);
    setName(pseudo);
    setPage("home");
    logAction("USER_REGISTERED", `Email: ${email}, Pseudo: ${pseudo}`);
    showToast("Compte créé avec succès ! 🎉","info");
  };

  const handleLogin = () => {
    if(!email.trim() || !password.trim()){
      logError("LOGIN_FAILED", "Champs vides", 400);
      return showToast("Remplis tous les champs !","error");
    }
    
    const users = getUsers();
    const user = users[email];
    if(!user || user.password !== password){
      logError("LOGIN_FAILED", "Identifiants incorrects", 401);
      return showToast("Email ou mot de passe incorrect !","error");
    }
    
    saveSession(email);
    setCurrentUser(user);
    setName(user.pseudo);
    setPage("home");
    logAction("USER_LOGIN", `Email: ${email}, Pseudo: ${user.pseudo}`);
    showToast(`Bienvenue ${user.pseudo} ! 👋`,"info");
  };

  const handleLogout = () => {
    const pseudo = currentUser?.pseudo || "Unknown";
    clearSession();
    setCurrentUser(null);
    setPage("auth");
    setEmail("");
    setPassword("");
    logAction("USER_LOGOUT", `Pseudo: ${pseudo}`);
    showToast("Déconnecté","info");
  };

  /* ── timers ── */
  const stopTimer  = useCallback(()=>{ if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;}  },[]);
  const stopPoller = useCallback(()=>{ if(pollerRef.current){clearInterval(pollerRef.current);pollerRef.current=null;} },[]);
  useEffect(()=>()=>{stopTimer();stopPoller();},[stopTimer,stopPoller]);

  /* ── quiz timer ── */
  useEffect(()=>{
    if(page==="quiz" && !feedback && chosen===null){
      setElapsed(0);
      timerRef.current = setInterval(()=>setElapsed(e=>+(e+0.1).toFixed(1)),100);
      return ()=>stopTimer();
    }
  },[qIdx,page,feedback,chosen,stopTimer]);

  /* ── lobby poller (non-hôte) ── */
  useEffect(()=>{
    if(page==="lobby" && room && !isHost){
      pollerRef.current = setInterval(()=>{
        const r = ROOMS[room.code];
        if(!r){ showToast("Room supprimée","error"); stopPoller(); setPage("home"); return; }
        setRoom({...r});
        if(r.status==="playing" && r.questions.length){
          setQuestions(r.questions);
          setQIdx(0); setMyScore(0); scoreRef.current=0;
          setStreak(0); setCombo(1); setChosen(null); setFeedback(false);
          setPage("quiz"); stopPoller();
        }
      },1200);
      return ()=>stopPoller();
    }
  },[page,room,isHost,showToast,stopPoller]);

  /* ── score poller pendant quiz (non-hôte) ── */
  useEffect(()=>{
    if(page==="quiz" && room && !isHost){
      pollerRef.current = setInterval(()=>{
        const r=ROOMS[room.code]; if(r) setRoom({...r});
      },1500);
      return ()=>stopPoller();
    }
  },[page,room,isHost,stopPoller]);

  /* ── rooms refresh sur joinScreen ── */
  useEffect(()=>{
    if(page==="joinScreen"){
      // Recharger les rooms toutes les 2 secondes
      const interval = setInterval(()=>{
        const freshRooms = getRooms();
        Object.keys(freshRooms).forEach(code => {
          ROOMS[code] = freshRooms[code];
        });
        setRoomsRefresh(r => r + 1); // Force re-render
      }, 2000);
      return () => clearInterval(interval);
    }
  },[page]);

  /* ── particles spawn ── */
  const spawnParticles = (ok) => {
    const cols = ok ? ["#10b981","#facc15","#f59e0b","#22c55e"] : ["#ef4444","#991b1b"];
    setParticles(Array.from({length:ok?24:10},(_,i)=>({
      id:uid(), x:35+Math.random()*30,
      color:cols[i%cols.length],
      dur:1+Math.random()*1, delay:Math.random()*0.2, size:5+Math.random()*10
    })));
    setTimeout(()=>setParticles([]),2100);
  };

  /* ═══ ACTIONS ═══ */
  const toggleCat = n => setSelCats(p=>p.includes(n)?p.filter(c=>c!==n):[...p,n]);
  
  const addKeyword = () => {
    const kw = searchInput.trim();
    if(!kw) return;
    
    // validation basique
    if(kw.length < 3){
      return showToast("⚠️ Mot-clé trop court ! Minimum 3 caractères.","error");
    }
    
    // mots trop vagues ou génériques
    const vagueWords = ["truc","chose","machin","stuff","thing","ça","test","aaa","zzz","xxx"];
    if(vagueWords.some(v => kw.toLowerCase() === v)){
      return showToast("⚠️ Mot-clé trop vague ! Sois plus précis (ex: SpaceX, Einstein, NBA)","error");
    }
    
    // vérifier si déjà ajouté
    if(selCats.includes(kw) || customKeywords.includes(kw)){
      return showToast("Déjà ajouté !","error");
    }
    
    // si c'est une catégorie existante, l'ajouter direct
    const matchCat = CATEGORIES.find(c=>c.name.toLowerCase().includes(kw.toLowerCase()));
    if(matchCat){
      setSelCats(p=>[...p,matchCat.name]);
      setSearchInput("");
    } else {
      // sinon c'est un mot-clé custom
      setCustomKeywords(p=>[...p,kw]);
      setSearchInput("");
      showToast(`✅ Mot-clé ajouté : "${kw}"`, "info");
    }
  };

  const removeKeyword = kw => setCustomKeywords(p=>p.filter(k=>k!==kw));

  const createRoom = () => {
    if(!playerName.trim()){
      logError("CREATE_ROOM_FAILED", "Pas de pseudo", 400);
      return showToast("Entre ton pseudo !","error");
    }
    if(!selCats.length && !customKeywords.length){
      logError("CREATE_ROOM_FAILED", "Pas de thème", 400);
      return showToast("Ajoute au moins un thème !","error");
    }
    if(!isPublic && !roomPwd.trim()){
      logError("CREATE_ROOM_FAILED", "Pas de mot de passe", 400);
      return showToast("Mets un mot de passe !","error");
    }
    const r = {
      code:randCode(), host:playerName, isPublic, password:isPublic?"":roomPwd,
      categories:selCats, keywords:customKeywords, difficulty:diff, numQ,
      players:[{name:playerName,score:0,id:uid()}],
      status:"lobby", questions:[], createdAt:Date.now()
    };
    ROOMS[r.code]=r;
    saveRooms(ROOMS); // 💾 SAUVEGARDER
    setRoom(r); setIsHost(true); setPage("lobby");
    logAction("ROOM_CREATED", `Code: ${r.code}, Host: ${playerName}, ${r.isPublic?"Public":"Privé"}`);
  };

  const joinRoom = (code,pwd) => {
    const rooms = getRooms(); // 🔄 RECHARGER les rooms
    const r = rooms[code.toUpperCase()];
    if(!r){
      logError("JOIN_ROOM_FAILED", `Room ${code} introuvable`, 404);
      return showToast("Room introuvable !","error");
    }
    if(r.status!=="lobby"){
      logError("JOIN_ROOM_FAILED", `Room ${code} déjà lancée`, 409);
      return showToast("Partie déjà lancée !","error");
    }
    if(!r.isPublic && r.password!==pwd){
      logError("JOIN_ROOM_FAILED", `Mot de passe incorrect pour ${code}`, 401);
      return showToast("Mot de passe incorrect !","error");
    }
    if(r.players.some(p=>p.name===playerName)){
      logError("JOIN_ROOM_FAILED", `Pseudo ${playerName} déjà pris`, 409);
      return showToast("Pseudo déjà pris !","error");
    }
    r.players.push({name:playerName,score:0,id:uid()});
    ROOMS[r.code] = r; // Mettre à jour l'objet global
    saveRooms(ROOMS); // 💾 SAUVEGARDER
    setRoom({...r}); setIsHost(false);
    setSelCats(r.categories||[]); setCustomKeywords(r.keywords||[]); setDiff(r.difficulty); setNumQ(r.numQ);
    setPage("lobby");
    logAction("ROOM_JOINED", `Code: ${code}, Player: ${playerName}`);
  };

  const kickPlayer = (playerId) => {
    if(!room || !isHost) return;
    const r = ROOMS[room.code];
    if(r){
      r.players = r.players.filter(p=>p.id!==playerId);
      saveRooms(ROOMS); // 💾 SAUVEGARDER
      setRoom({...r});
      showToast("Joueur exclu","info");
    }
  };

  const leaveRoom = () => {
    if(room){
      if(isHost) {
        delete ROOMS[room.code];
      } else { 
        const r=ROOMS[room.code]; 
        if(r) r.players=r.players.filter(p=>p.name!==playerName); 
      }
      saveRooms(ROOMS); // 💾 SAUVEGARDER
    }
    stopPoller(); setRoom(null); setIsHost(false);
  };

  const generateQuiz = async () => {
    if(!selCats.length && !customKeywords.length) return showToast("Ajoute au moins un thème !","error");
    setPage("loading");
    
    try {
      const themes = [...selCats, ...customKeywords].join(", ");
      
      // Prompt ultra-simple et direct
      const prompt = `Tu es un générateur de quiz. Crée ${numQ} questions en français sur: ${themes}

Difficulté: ${diff}

IMPORTANT - MÉDIAS (40% des questions):
- Images: URLs Wikimedia Commons (ex: https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons.jpg/800px-Tour_Eiffel.jpg)
- Audio: YouTube embed (ex: https://www.youtube.com/embed/dQw4w9WgXcQ)
- Vidéo: YouTube embed (ex: https://www.youtube.com/embed/jNQXAC9IVRw)

RÉPONDS UNIQUEMENT avec ce JSON (PAS de texte avant/après, PAS de \`\`\`):
{
  "questions": [
    {
      "question": "Quelle est la capitale de la France ?",
      "media": {
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/800px-Tour_Eiffel.jpg",
        "caption": "Monument parisien"
      },
      "options": ["Paris", "Londres", "Berlin", "Madrid"],
      "correctAnswer": 0
    },
    {
      "question": "Combien font 2+2 ?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1
    }
  ]
}

Si pas de média: ne mets PAS la clé "media".
${numQ} questions exactement. 4 options par question.`;

      console.log("🚀 Génération quiz avec Groq (gpt-oss-120b)");
      logAction("QUIZ_GENERATION_START", `${numQ}Q - ${themes}`);
      
      // Appel API avec timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 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"
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: "Tu es un générateur de quiz. Tu réponds uniquement avec un objet JSON valide, sans texte autour." },
              { role: "user", content: prompt }
            ],
            temperature: 1,
            max_completion_tokens: 8581,
            top_p: 1,
            reasoning_effort: "medium",
            stream: false,
            response_format: { type: "json_object" },
            stop: null
          })
        }
      );
      
      clearTimeout(timeout);
      
      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Erreur HTTP:", res.status, errText);
        logError("API_HTTP_ERROR", `Status ${res.status}`, res.status);
        
        // Messages d'erreur spécifiques
        if (res.status === 429) throw new Error("Trop de requêtes. Attends 1 minute et réessaie.");
        if (res.status === 401 || res.status === 403) throw new Error("Clé API invalide ou révoquée.");
        if (res.status === 400) throw new Error("Requête mal formée.");
        
        throw new Error(`Erreur API (${res.status})`);
      }
      
      const data = await res.json();
      console.log("📦 Réponse Groq:", data);
      
      // Vérifier la structure de réponse
      if (!data.choices || data.choices.length === 0) {
        console.error("❌ Pas de choix:", data);
        logError("NO_CHOICES", JSON.stringify(data), 500);
        throw new Error("Réponse API vide");
      }
      
      const choice = data.choices[0];
      
      // Vérifier si bloqué par les filtres de contenu
      if (choice.finish_reason === "content_filter") {
        console.error("❌ Bloqué par les filtres de contenu:", choice);
        logError("SAFETY_BLOCK", "Contenu bloqué", 400);
        throw new Error("Contenu bloqué par les filtres de sécurité. Essaie un autre thème.");
      }
      
      if (!choice.message || !choice.message.content) {
        console.error("❌ Structure invalide:", choice);
        logError("INVALID_STRUCTURE", JSON.stringify(choice), 500);
        throw new Error("Structure de réponse invalide");
      }
      
      let text = choice.message.content;
      console.log("📝 Texte brut (200 chars):", text.substring(0, 200));
      
      // Nettoyage ultra-agressif
      text = text.trim();
      
      // Enlever markdown
      text = text.replace(/```json\s*/gi, "");
      text = text.replace(/```javascript\s*/gi, "");
      text = text.replace(/```\s*/g, "");
      
      // Trouver le JSON (entre premier { et dernier })
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        console.error("❌ Pas de JSON trouvé dans:", text);
        logError("NO_JSON", "Aucun JSON trouvé", 500);
        throw new Error("Pas de JSON dans la réponse");
      }
      
      text = text.substring(firstBrace, lastBrace + 1);
      console.log("🧹 JSON extrait (200 chars):", text.substring(0, 200));
      
      // Parser le JSON
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        console.error("❌ Erreur parsing:", e.message);
        console.error("JSON problématique:", text);
        logError("JSON_PARSE_ERROR", e.message, 500);
        throw new Error(`JSON invalide: ${e.message}`);
      }
      
      // Valider la structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        console.error("❌ Pas de tableau questions:", parsed);
        logError("NO_QUESTIONS_ARRAY", JSON.stringify(parsed), 500);
        throw new Error("Format invalide: pas de tableau 'questions'");
      }
      
      if (parsed.questions.length === 0) {
        console.error("❌ Tableau vide");
        logError("EMPTY_QUESTIONS", "0 questions", 500);
        throw new Error("Aucune question générée");
      }
      
      // Filtrer et valider chaque question
      const valid = parsed.questions.filter(q => {
        const isValid = 
          q.question && 
          typeof q.question === 'string' &&
          Array.isArray(q.options) && 
          q.options.length === 4 &&
          q.options.every(o => typeof o === 'string') &&
          typeof q.correctAnswer === 'number' &&
          q.correctAnswer >= 0 && 
          q.correctAnswer <= 3;
        
        if (!isValid) {
          console.warn("⚠️ Question invalide filtrée:", q);
        }
        
        return isValid;
      });
      
      if (valid.length === 0) {
        console.error("❌ Aucune question valide après filtrage");
        console.error("Questions brutes:", parsed.questions);
        logError("NO_VALID_QUESTIONS", `${parsed.questions.length} questions invalides`, 500);
        throw new Error("Toutes les questions sont invalides");
      }
      
      console.log(`✅ ${valid.length}/${parsed.questions.length} questions valides`);
      
      // Compter les médias
      const withMedia = valid.filter(q => q.media).length;
      console.log(`📷 ${withMedia} questions avec média (${Math.round(withMedia/valid.length*100)}%)`);
      
      logAction("QUIZ_GENERATED", `${valid.length} questions, ${withMedia} avec média`);
      
      // Sauvegarder les questions
      setQuestions(valid);
      setQIdx(0);
      setMyScore(0);
      scoreRef.current = 0;
      setStreak(0);
      setCombo(1);
      setChosen(null);
      setFeedback(false);
      
      // Pour les rooms multi
      if (room && isHost) {
        const r = ROOMS[room.code];
        if (r) {
          r.questions = valid;
          r.status = "playing";
          saveRooms(ROOMS); // 💾 SAUVEGARDER
        }
        setRoom({ ...r });
      }
      
      setPage("quiz");
      showToast(`✅ ${valid.length} questions générées !`, "info");
      
    } catch (e) {
      console.error("💥 Erreur globale:", e);
      
      // Log l'erreur
      logError("QUIZ_GENERATION_FAILED", e.message, 500);
      
      // Messages d'erreur utilisateur clairs
      let userMessage = "Erreur de génération";
      
      if (e.name === "AbortError") {
        userMessage = "Timeout: l'API met trop de temps à répondre. Réessaie.";
      } else if (e.message.includes("Failed to fetch")) {
        userMessage = "Impossible de contacter l'API. Vérifie ta connexion internet.";
      } else {
        userMessage = e.message;
      }
      
      showToast(userMessage, "error");
      setPage(room ? "lobby" : "setup");
    }
  };

  const answerQ = (idx) => {
    if(feedback || chosen!==null) return;
    stopTimer();
    setChosen(idx);
    const isOk = idx === questions[qIdx].correctAnswer;
    setCorrect(isOk);
    setFeedback(true);
    spawnParticles(isOk);
    let pts=0;
    if(isOk){
      const tBonus = clamp(Math.floor((20-elapsed)*4),0,60);
      pts = Math.floor((100+tBonus)*combo);
      setFlash(pts);
      setMyScore(s=>s+pts);
      scoreRef.current += pts;
      setStreak(s=>s+1);
      setCombo(c=>clamp(c+0.3,1,3.5));
    } else {
      setFlash(0); setStreak(0); setCombo(1);
    }
    if(room){
      const r=ROOMS[room.code];
      if(r){ 
        const pl=r.players.find(p=>p.name===playerName); 
        if(pl) {
          pl.score+=pts; 
          saveRooms(ROOMS); // 💾 SAUVEGARDER
        }
      }
    }
    setTimeout(()=>{
      if(qIdx < questions.length-1){
        setQIdx(i=>i+1); setChosen(null); setFeedback(false); setFlash(0);
      } else {
        finishQuiz();
      }
    },2200);
  };

  const finishQuiz = () => {
    const finalScore = scoreRef.current;
    let board;
    if(room){
      const r=ROOMS[room.code];
      if(r){ 
        r.status="finished"; 
        board=[...r.players].sort((a,b)=>b.score-a.score); 
        saveRooms(ROOMS); // 💾 SAUVEGARDER
      }
    }
    if(!board) board=[{name:playerName,score:finalScore,id:uid()}];
    setLeaderboard(board);
    const pct = clamp(Math.round((finalScore/(questions.length*160))*100),0,100);
    
    // sauvegarder dans l'historique du compte
    const newHistoryEntry = {
      date:new Date(), score:finalScore, pct,
      rank:getRank(pct), questions:questions.length,
      mode:room?"multi":"solo", id:uid()
    };
    
    if(currentUser){
      const users = getUsers();
      users[currentUser.email].history.unshift(newHistoryEntry);
      saveUsers(users);
      setCurrentUser(users[currentUser.email]);
    }
    
    setPage("results");
  };

  /* ═══════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════ */
  const resPct    = questions.length ? clamp(Math.round((myScore/(questions.length*160))*100),0,100) : 0;
  const resRank   = getRank(resPct);
  const resMyPos  = leaderboard.findIndex(p=>p.name===playerName)+1;
  const resMulti  = !!room;

  return (
    <>
      <style>{`
        @keyframes float      { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-20px) rotate(2deg)} }
        @keyframes slideDown  { from{transform:translateX(-50%) translateY(-40px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
        @keyframes popIn      { 0%{transform:scale(.6);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        @keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes shake      { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes pop        { 0%{transform:scale(.6);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes floatUp    { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-140px);opacity:0} }
        @keyframes confetti   { to{transform:translateY(110vh) rotate(720deg)} }
        @keyframes bounce     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-26px)} }
        @keyframes riseUp     { from{transform:translateY(50px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:.4} }
        .shm { background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent); background-size:200% 100%; animation:shimmer 2.4s infinite; }
      `}</style>

      <ToastBanner toast={toast}/>

      {/* ════ AUTH PAGE ════ */}
      {page==="auth" && (
        <div className={`min-h-screen bg-gradient-to-br ${bg} relative flex flex-col items-center justify-center p-6 overflow-hidden`}>
          <FloatBg/>
          <button onClick={()=>setDark(d=>!d)} className={`absolute top-4 right-4 p-3 rounded-2xl border shadow z-10 ${dark?"bg-slate-800 border-slate-600":"bg-white border-purple-200"}`}>
            {dark ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-700"/>}
          </button>

          <div className="relative z-10 text-center mb-8" style={{animation:"popIn .7s cubic-bezier(.34,1.56,.64,1)"}}>
            <div className={`inline-flex items-center gap-3 px-8 py-5 rounded-3xl shadow-2xl border shm ${cardBg}`}>
              <Sparkles size={44} className="text-yellow-400"/>
              <h1 className={`text-5xl font-black tracking-tight ${textPri}`}>
                QUIZ<span className="text-transparent bg-clip-text" style={{backgroundImage:"linear-gradient(135deg,#a855f7,#ec4899,#f97316)"}}>MASTER</span>
              </h1>
              <Sparkles size={44} className="text-yellow-400"/>
            </div>
          </div>

          <div className={`w-full max-w-md rounded-3xl border p-8 shadow-2xl relative z-10 ${cardBg}`}>
            <div className="flex gap-2 mb-6">
              <button onClick={()=>setAuthMode("login")} className={`flex-1 py-3 rounded-xl font-black text-lg transition ${authMode==="login"?"bg-violet-500 text-white":(dark?"bg-slate-700/50 text-slate-400":"bg-gray-200 text-gray-600")}`}>
                Connexion
              </button>
              <button onClick={()=>setAuthMode("register")} className={`flex-1 py-3 rounded-xl font-black text-lg transition ${authMode==="register"?"bg-violet-500 text-white":(dark?"bg-slate-700/50 text-slate-400":"bg-gray-200 text-gray-600")}`}>
                Inscription
              </button>
            </div>

            <h2 className={`text-2xl font-black mb-6 ${textPri}`}>
              {authMode==="login" ? "👋 Bon retour !" : "🎮 Créer un compte"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSec}`}>Email</label>
                <div className="relative">
                  <Mail size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textSec}`}/>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e=>setEmail(e.target.value)}
                    placeholder="ton-email@exemple.com"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:border-violet-500 ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${textSec}`}>Mot de passe</label>
                <div className="relative">
                  <Lock size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textSec}`}/>
                  <input 
                    type={showPassword?"text":"password"}
                    value={password} 
                    onChange={e=>setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 focus:outline-none focus:border-violet-500 ${inputBg}`}
                  />
                  <button 
                    onClick={()=>setShowPassword(s=>!s)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${textSec} hover:text-violet-400 transition`}
                  >
                    {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                  </button>
                </div>
              </div>

              {authMode==="register" && (
                <p className={`text-xs ${textSec} italic`}>
                  💡 Ton pseudo sera automatiquement créé à partir de ton email (avant le @)
                </p>
              )}

              <button 
                onClick={authMode==="login" ? handleLogin : handleRegister}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xl font-black shadow-xl hover:scale-[1.02] transition"
              >
                {authMode==="login" ? "Se connecter" : "Créer mon compte"}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${dark?"border-slate-600":"border-gray-300"}`}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-4 ${dark?"bg-slate-800":"bg-white"} ${textSec} font-bold`}>OU</span>
                </div>
              </div>

              <button 
                onClick={()=>{setCurrentUser(null);setName("");setPage("home");showToast("Mode invité activé","info");}}
                className={`w-full py-4 rounded-xl border-2 ${dark?"border-slate-600 text-slate-300 hover:bg-slate-700":"border-purple-300 text-gray-700 hover:bg-purple-50"} font-bold transition`}
              >
                👤 Continuer en invité
              </button>
              <p className={`text-xs text-center mt-2 ${textSec} italic`}>
                ⚠️ Aucune statistique ne sera sauvegardée en mode invité
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ════ LOADING ════ */}
      {page==="loading" && (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 flex flex-col items-center justify-center">
          <Sparkles size={80} className="text-yellow-300 mb-6" style={{animation:"bounce 1s ease-in-out infinite"}}/>
          <h2 className="text-5xl font-black text-white mb-6">Génération du quiz…</h2>
          <div className="flex gap-3">{[...Array(5)].map((_,i)=>(
            <div key={i} className="w-5 h-5 rounded-full bg-white" style={{animation:"bounce 1s ease-in-out infinite",animationDelay:`${i*.18}s`}}/>
          ))}</div>
        </div>
      )}

      {/* ════ HOME ════ */}
      {page==="home" && (
        <div className={`min-h-screen bg-gradient-to-br ${bg} relative flex flex-col items-center justify-center p-6 overflow-hidden`}>
          <FloatBg/>
          <div className="absolute top-4 right-4 flex gap-3 z-10">
            <button onClick={()=>setDark(d=>!d)} className={`p-3 rounded-2xl border shadow ${dark?"bg-slate-800 border-slate-600":"bg-white border-purple-200"}`}>
              {dark ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-700"/>}
            </button>
            <button onClick={()=>setSound(s=>!s)} className={`p-3 rounded-2xl border shadow ${dark?"bg-slate-800 border-slate-600":"bg-white border-purple-200"}`}>
              {sound ? <Volume2 size={20} className={dark?"text-slate-300":"text-slate-600"}/> : <VolumeX size={20} className="text-red-400"/>}
            </button>
            {currentUser && (
              <>
                <button onClick={()=>setPage("history")} className={`p-3 rounded-2xl border shadow ${dark?"bg-slate-800 border-slate-600":"bg-white border-purple-200"}`}>
                  <BarChart2 size={20} className={dark?"text-slate-300":"text-slate-600"}/>
                </button>
                <button onClick={handleLogout} className="p-3 rounded-2xl border shadow bg-red-500 border-red-600 text-white hover:bg-red-600 transition" title="Déconnexion">
                  <ArrowLeft size={20}/>
                </button>
              </>
            )}
            {!currentUser && (
              <button onClick={()=>setPage("auth")} className={`p-3 rounded-2xl border shadow bg-violet-500 border-violet-600 text-white hover:bg-violet-600 transition`} title="Se connecter">
                <User size={20}/>
              </button>
            )}
          </div>
          <div className="relative z-10 text-center mb-10" style={{animation:"popIn .7s cubic-bezier(.34,1.56,.64,1)"}}>
            <div className={`inline-flex items-center gap-3 px-8 py-5 rounded-3xl shadow-2xl border shm ${cardBg}`}>
              <Sparkles size={44} className="text-yellow-400"/>
              <h1 className={`text-6xl font-black tracking-tight ${textPri}`}>
                QUIZ<span className="text-transparent bg-clip-text" style={{backgroundImage:"linear-gradient(135deg,#a855f7,#ec4899,#f97316)"}}>MASTER</span>
              </h1>
              <Sparkles size={44} className="text-yellow-400"/>
            </div>
            {currentUser ? (
              <p className={`mt-3 text-xl font-semibold ${textSec}`}>👋 Salut {currentUser.pseudo} !</p>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <span className="px-4 py-1 bg-orange-500 text-white text-sm font-black rounded-full">👤 MODE INVITÉ</span>
                <button onClick={()=>setPage("auth")} className={`text-sm font-bold ${textSec} hover:text-violet-400 underline`}>
                  Créer un compte
                </button>
              </div>
            )}
          </div>
          <div className="relative z-10 w-full max-w-md mb-8">
            <label className={`block text-lg font-bold mb-2 flex items-center gap-2 ${textSec}`}>
              <User size={20}/> Ton pseudo
              {!currentUser && <span className="text-xs font-normal px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">Mode invité</span>}
            </label>
            <input value={playerName} onChange={e=>setName(e.target.value.slice(0,18))} placeholder="Ex: GameMaster69"
              className={`w-full px-6 py-4 rounded-2xl text-xl font-bold border-2 focus:outline-none focus:border-purple-500 ${inputBg}`}
              disabled={!!currentUser}
            />
            {currentUser ? (
              <p className={`text-xs mt-1 ${textSec} italic`}>📌 Pseudo lié à ton compte</p>
            ) : (
              <p className={`text-xs mt-1 ${textSec} italic`}>⚠️ Tes statistiques ne seront pas sauvegardées</p>
            )}
          </div>
          <div className="relative z-10 grid sm:grid-cols-3 gap-5 w-full max-w-2xl">
            {[
              {label:"Solo",         icon:<Play size={28}/>,  color:"from-emerald-500 to-teal-600",  go:()=>{setIsHost(false);setSelCats([]);setCustomKeywords([]);setPage("setup");}},
              {label:"Créer Partie", icon:<Plus size={28}/>,  color:"from-violet-500 to-purple-600", go:()=>{setIsHost(true);setSelCats([]);setCustomKeywords([]);setPage("setup");}},
              {label:"Rejoindre",    icon:<LogIn size={28}/>, color:"from-blue-500 to-cyan-600",     go:()=>setPage("joinScreen")},
            ].map((b,i)=>(
              <button key={i} onClick={()=>{
                if(!currentUser && !playerName.trim()){
                  showToast("Entre ton pseudo pour jouer en invité !","error");
                  return;
                }
                b.go();
              }}
                className={`relative overflow-hidden bg-gradient-to-br ${b.color} text-white rounded-3xl p-7 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200`}>
                <div className="shm absolute inset-0 rounded-3xl"/>
                <div className="relative z-10 flex flex-col items-center gap-2">{b.icon}<span className="text-xl font-black">{b.label}</span></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════ SETUP ════ */}
      {page==="setup" && (
        <div className={`min-h-screen bg-gradient-to-br ${bg} relative p-5 overflow-hidden`}>
          <FloatBg/>
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="flex items-center justify-between mb-6">
              <button onClick={()=>setPage("home")} className={`flex items-center gap-2 px-5 py-2 rounded-2xl border ${cardBg} ${textPri} font-bold hover:opacity-80`}><ArrowLeft size={18}/> Retour</button>
              <div className="flex gap-3">
                <button onClick={()=>setIsHost(false)} className={`px-5 py-2 rounded-2xl font-bold ${!isHost?"bg-emerald-500 text-white shadow-lg":(dark?"bg-slate-700 text-slate-300":"bg-gray-100 text-gray-600")}`}>🎮 Solo</button>
                <button onClick={()=>setIsHost(true)}  className={`px-5 py-2 rounded-2xl font-bold ${isHost ?"bg-violet-500 text-white shadow-lg":(dark?"bg-slate-700 text-slate-300":"bg-gray-100 text-gray-600")}`}>👥 Multi</button>
              </div>
            </div>
            <h2 className={`text-4xl font-black mb-5 ${textPri}`}>{isHost?"🏆 Créer une partie":"🎯 Configuration"}</h2>

            {/* BARRE DE RECHERCHE */}
            <div className={`rounded-3xl border p-6 mb-5 ${cardBg}`}>
              <h3 className={`text-xl font-black mb-4 flex items-center gap-2 ${textPri}`}>
                <Search size={22} className="text-violet-400"/> Recherche de thèmes
              </h3>
              <div className="flex gap-2 mb-2">
                <input
                  value={searchInput}
                  onChange={e=>setSearchInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")addKeyword();}}
                  placeholder="Ex: SpaceX, Taylor Swift, Actualités 2024, IA..."
                  className={`flex-1 px-5 py-4 rounded-2xl text-lg font-semibold border-2 focus:outline-none focus:border-violet-500 transition ${inputBg}`}
                />
                <button
                  onClick={addKeyword}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-black shadow-lg hover:shadow-xl hover:scale-[1.03] transition flex items-center gap-2">
                  <Plus size={20}/> Ajouter
                </button>
              </div>
              <p className={`text-xs ${textSec} mb-4 italic`}>
                💡 Sois précis : noms propres (Einstein, Tesla), événements (JO 2024), ou domaines clairs (IA). Évite les mots vagues.
              </p>

              {/* suggestions populaires */}
              <div className="mb-4">
                <p className={`text-sm font-bold mb-2 flex items-center gap-2 ${textSec}`}><Tag size={16}/> Suggestions populaires :</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.slice(0,8).map(cat=>(
                    <button key={cat.name} onClick={()=>{setSelCats(p=>p.includes(cat.name)?p:[...p,cat.name]);}}
                      className={`px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition ${selCats.includes(cat.name)?"text-white":"text-gray-700 bg-white"}`}
                      style={selCats.includes(cat.name)?{background:`linear-gradient(135deg,${cat.color[0]},${cat.color[1]})`}:{background:"white"}}>
                      {cat.emoji} {cat.name.split(" ").slice(1).join(" ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* sélection active */}
              {(selCats.length > 0 || customKeywords.length > 0) && (
                <div>
                  <p className={`text-sm font-bold mb-2 ${textSec}`}>
                    Sélection active ({selCats.length + customKeywords.length}) :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selCats.map(cat=>{
                      const c = CATEGORIES.find(x=>x.name===cat);
                      return (
                        <button key={cat} onClick={()=>toggleCat(cat)}
                          className="px-4 py-2 rounded-full font-bold text-white shadow-lg hover:opacity-80 transition flex items-center gap-2"
                          style={{background:`linear-gradient(135deg,${c?.color[0]},${c?.color[1]})`}}>
                          {c?.emoji} {cat.split(" ").slice(1).join(" ")}
                          <X size={16}/>
                        </button>
                      );
                    })}
                    {customKeywords.map(kw=>(
                      <button key={kw} onClick={()=>removeKeyword(kw)}
                        className="px-4 py-2 rounded-full font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:opacity-80 transition flex items-center gap-2">
                        🔍 {kw}
                        <X size={16}/>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              {/* difficulté */}
              <div className={`rounded-3xl border p-6 ${cardBg}`}>
                <h3 className={`text-xl font-black mb-3 flex items-center gap-2 ${textPri}`}><Zap size={22} className="text-yellow-400"/> Difficulté</h3>
                {[
                  {k:"facile",  l:"😊 Facile",    g:"from-emerald-400 to-green-500"},
                  {k:"moyen",   l:"😎 Moyen",     g:"from-yellow-400 to-orange-500"},
                  {k:"difficile",l:"🔥 Difficile",g:"from-red-500 to-pink-600"},
                ].map(d=>(
                  <button key={d.k} onClick={()=>setDiff(d.k)}
                    className={`w-full px-5 py-3 rounded-2xl font-bold text-lg mb-2 transition-all ${diff===d.k?`bg-gradient-to-r ${d.g} text-white shadow-lg scale-[1.02]`:(dark?"bg-slate-700/60 text-slate-300":"bg-gray-100 text-gray-700")}`}>
                    {d.l}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-5">
                {/* nb questions */}
                <div className={`rounded-3xl border p-6 flex-1 ${cardBg}`}>
                  <h3 className={`text-xl font-black mb-3 flex items-center gap-2 ${textPri}`}><Clock size={22} className="text-blue-400"/> Questions</h3>
                  <div className="flex items-center justify-center gap-5">
                    <button onClick={()=>setNumQ(n=>clamp(n-1,3,20))} className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition"><Minus size={24}/></button>
                    <span className={`text-7xl font-black ${textPri}`}>{numQ}</span>
                    <button onClick={()=>setNumQ(n=>clamp(n+1,3,20))} className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition"><Plus size={24}/></button>
                  </div>
                </div>
                {/* visibilité (multi seulement) */}
                {isHost && (
                  <div className={`rounded-3xl border p-6 ${cardBg}`}>
                    <h3 className={`text-xl font-black mb-3 flex items-center gap-2 ${textPri}`}>
                      {isPublic?<Unlock size={22} className="text-emerald-400"/>:<Lock size={22} className="text-orange-400"/>} Visibilité
                    </h3>
                    <div className="flex gap-3 mb-3">
                      <button onClick={()=>setIsPublic(true)}  className={`flex-1 py-2 rounded-xl font-bold ${isPublic ?"bg-emerald-500 text-white":(dark?"bg-slate-700 text-slate-300":"bg-gray-100 text-gray-600")}`}>🌐 Public</button>
                      <button onClick={()=>setIsPublic(false)} className={`flex-1 py-2 rounded-xl font-bold ${!isPublic?"bg-orange-500 text-white":(dark?"bg-slate-700 text-slate-300":"bg-gray-100 text-gray-600")}`}>🔒 Privé</button>
                    </div>
                    {!isPublic && <input value={roomPwd} onChange={e=>setRoomPwd(e.target.value)} placeholder="Mot de passe…" className={`w-full px-4 py-2 rounded-xl border font-bold focus:outline-none focus:border-orange-500 ${inputBg}`}/>}
                  </div>
                )}
              </div>
            </div>

            <button onClick={()=>isHost?createRoom():generateQuiz()}
              className="w-full py-5 rounded-3xl bg-gradient-to-r from-violet-600 via-pink-500 to-fuchsia-500 text-white text-3xl font-black shadow-2xl hover:scale-[1.02] transition flex items-center justify-center gap-3">
              {isHost?<><Plus size={34}/> CRÉER LA ROOM</>:<><Play size={34}/> LANCER LE QUIZ</>}
            </button>
          </div>
        </div>
      )}

      {/* ════ JOIN SCREEN - toutes les rooms (publiques + privées) ════ */}
      {page==="joinScreen" && (
        <div className={`min-h-screen bg-gradient-to-br ${bg} relative p-5 overflow-hidden`}>
          <FloatBg/>
          <div className="max-w-4xl mx-auto relative z-10">
            <button onClick={()=>setPage("home")} className={`flex items-center gap-2 px-5 py-2 rounded-2xl border mb-6 ${cardBg} ${textPri} font-bold hover:opacity-80`}>
              <ArrowLeft size={18}/> Retour
            </button>
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-4xl font-black ${textPri}`}>🔗 Parties disponibles</h2>
              <button 
                onClick={() => {
                  const freshRooms = getRooms();
                  Object.keys(ROOMS).forEach(code => delete ROOMS[code]);
                  Object.keys(freshRooms).forEach(code => ROOMS[code] = freshRooms[code]);
                  setRoomsRefresh(r => r + 1);
                  showToast("Rooms rechargées !","info");
                }}
                className={`px-4 py-2 rounded-xl border ${cardBg} ${textPri} font-bold hover:opacity-80 flex items-center gap-2`}
              >
                <RefreshCw size={18}/> Actualiser
              </button>
            </div>

            {/* TOUTES les parties en lobby */}
            {Object.values(ROOMS).filter(r => r.status === "lobby").length > 0 ? (
              <div className={`rounded-3xl border p-6 mb-5 ${cardBg}`}>
                <h3 className={`text-xl font-black mb-4 flex items-center gap-2 ${textPri}`}>
                  <Users size={22} className="text-emerald-400"/> {Object.values(ROOMS).filter(r => r.status === "lobby").length} partie{Object.values(ROOMS).filter(r => r.status === "lobby").length > 1 ? "s" : ""} en attente
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {Object.values(ROOMS).filter(r => r.status === "lobby").map(r=>(
                    <div key={r.code} className={`rounded-2xl border p-5 ${dark?"bg-slate-700/50 border-slate-600":"bg-gray-50 border-gray-200"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {r.isPublic ? 
                            <Unlock size={18} className="text-emerald-400"/> : 
                            <Lock size={18} className="text-orange-400"/>
                          }
                          <div>
                            <div className={`font-black text-lg ${textPri}`}>{r.host}</div>
                            <div className={`text-xs ${textSec}`}>
                              {r.isPublic ? "🌐 Public" : "🔒 Privé"} • {r.players.length} joueur{r.players.length>1?"s":""}
                            </div>
                          </div>
                        </div>
                        <div className={`text-2xl font-black ${textPri}`}>{r.code}</div>
                      </div>
                      <div className="flex items-center gap-2 mb-3 text-xs">
                        <span className={`px-2 py-1 rounded ${dark?"bg-violet-500/30 text-violet-300":"bg-violet-100 text-violet-700"}`}>{r.numQ}Q</span>
                        <span className={`px-2 py-1 rounded ${dark?"bg-blue-500/30 text-blue-300":"bg-blue-100 text-blue-700"}`}>{r.difficulty}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(r.categories||[]).slice(0,2).map(c=><span key={c} className={`text-xs px-2 py-0.5 rounded-full ${dark?"bg-pink-500/30 text-pink-300":"bg-pink-100 text-pink-700"}`}>{c.split(" ")[0]}</span>)}
                        {(r.keywords||[]).slice(0,2).map(k=><span key={k} className={`text-xs px-2 py-0.5 rounded-full ${dark?"bg-cyan-500/30 text-cyan-300":"bg-cyan-100 text-cyan-700"}`}>🔍 {k}</span>)}
                      </div>
                      
                      {r.isPublic ? (
                        <button onClick={()=>{logAction("JOIN_ROOM_PUBLIC", r.code);joinRoom(r.code,"");}} 
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition">
                          Rejoindre
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <input 
                            type="password" 
                            placeholder="Mot de passe..." 
                            id={`pwd-${r.code}`}
                            className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-orange-500 ${inputBg}`}
                          />
                          <button onClick={()=>{
                            const pwd = document.getElementById(`pwd-${r.code}`).value;
                            logAction("JOIN_ROOM_PRIVATE_ATTEMPT", r.code);
                            joinRoom(r.code, pwd);
                          }}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition">
                            🔓 Déverrouiller
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`rounded-3xl border p-16 text-center mb-5 ${cardBg}`}>
                <p className={`text-xl ${textSec}`}>Aucune partie disponible pour le moment</p>
                <button onClick={()=>setPage("setup")} className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold">
                  Créer une partie
                </button>
              </div>
            )}

            {/* Rejoindre avec code manuel */}
            <div className={`rounded-3xl border p-6 ${cardBg}`}>
              <h3 className={`text-xl font-black mb-4 flex items-center gap-2 ${textPri}`}>
                <Tag size={22} className="text-blue-400"/> Rejoindre avec code
              </h3>
              <label className={`block text-sm font-bold uppercase tracking-wide mb-2 ${textSec}`}>Code de la room</label>
              <input value={joinRoomCode} onChange={e=>setJoinRoomCode(e.target.value.toUpperCase().slice(0,6))} placeholder="ABC123"
                className={`w-full px-5 py-4 text-3xl font-black text-center rounded-2xl border-2 focus:outline-none focus:border-violet-500 tracking-widest uppercase ${inputBg} mb-4`}/>
              <label className={`block text-sm font-bold uppercase tracking-wide mb-2 ${textSec}`}>Mot de passe (si privé)</label>
              <input type="password" value={joinRoomPwd} onChange={e=>setJoinRoomPwd(e.target.value)} placeholder="Optionnel"
                className={`w-full px-5 py-4 text-lg rounded-2xl border-2 focus:outline-none focus:border-violet-500 ${inputBg} mb-4`}/>
              <button onClick={()=>{logAction("JOIN_ROOM_MANUAL", joinRoomCode);joinRoom(joinRoomCode,joinRoomPwd);}}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-2xl font-black shadow-xl hover:scale-[1.02] flex items-center justify-center gap-3">
                <LogIn size={28}/> REJOINDRE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ LOBBY ════ */}
      {page==="lobby" && (
        <div className={`min-h-screen bg-gradient-to-br ${bg} relative p-5 overflow-hidden`}>
          <FloatBg/>
          <div className="max-w-3xl mx-auto relative z-10">
            <button onClick={()=>{leaveRoom();setPage("home");}} className="mb-4 flex items-center gap-2 px-5 py-2 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600">
              <ArrowLeft size={18}/> Quitter
            </button>
            <div className={`rounded-3xl border p-8 text-center mb-5 ${cardBg}`}>
              <p className={`text-sm font-bold uppercase tracking-widest mb-2 ${textSec}`}>Code de la room</p>
              <div className="flex items-center justify-center gap-3">
                <span className={`text-6xl font-black tracking-widest ${textPri}`}>{room?.code}</span>
                <CopyBtn text={room?.code||""}/>
              </div>
              <div className="flex justify-center gap-3 mt-3 flex-wrap">
                <span className={`text-sm font-bold px-4 py-1 rounded-full ${room?.isPublic?"bg-emerald-500/20 text-emerald-400":"bg-orange-500/20 text-orange-400"}`}>{room?.isPublic?"🌐 Public":"🔒 Privé"}</span>
                <span className="text-sm font-bold px-4 py-1 rounded-full bg-violet-500/20 text-violet-400">⚡ {room?.difficulty?.toUpperCase()}</span>
                <span className="text-sm font-bold px-4 py-1 rounded-full bg-blue-500/20 text-blue-400">📝 {room?.numQ} questions</span>
              </div>
            </div>
            <div className={`rounded-3xl border p-6 mb-5 ${cardBg}`}>
              <h3 className={`text-xl font-black mb-3 flex items-center gap-2 ${textPri}`}><Users size={22}/> Joueurs ({room?.players?.length})</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {room?.players?.map(p=>(
                  <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border ${p.name===playerName?(dark?"bg-violet-900/40 border-violet-500":"bg-violet-100 border-violet-400"):(dark?"bg-slate-700/40 border-slate-600":"bg-gray-50 border-gray-200")}`}>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{p.name===room?.host?"👑":"🎮"}</div>
                      <div>
                        <div className={`font-black ${textPri}`}>{p.name}{p.name===playerName&&" (Toi)"}</div>
                        <div className={`text-xs ${textSec}`}>{p.name===room?.host?"Hôte":"Joueur"}</div>
                      </div>
                    </div>
                    {isHost && p.name!==playerName && (
                      <button onClick={()=>kickPlayer(p.id)} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition">
                        <UserMinus size={18}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={`rounded-3xl border p-5 mb-5 ${cardBg}`}>
              <h3 className={`text-lg font-black mb-2 ${textPri}`}>📂 Thèmes sélectionnés</h3>
              <div className="flex flex-wrap gap-2">
                {room?.categories?.map(c=><span key={c} className="px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-bold">{c}</span>)}
                {room?.keywords?.map(k=><span key={k} className="px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold">🔍 {k}</span>)}
              </div>
            </div>
            {isHost ? (
              <button onClick={generateQuiz} className="w-full py-5 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-3xl font-black shadow-2xl hover:scale-[1.02] flex items-center justify-center gap-3">
                <Play size={36}/> LANCER LE QUIZ
              </button>
            ) : (
              <div className={`text-center py-6 rounded-3xl border ${cardBg}`}>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-violet-400" style={{animation:"pulse 1.2s infinite"}}/>
                  <span className={`text-xl font-bold ${textSec}`}>En attente que l'hôte lance…</span>
                  <div className="w-3 h-3 rounded-full bg-violet-400" style={{animation:"pulse 1.2s infinite",animationDelay:".4s"}}/>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ QUIZ ════ */}
      {page==="quiz" && questions.length>0 && (
        <div className={`min-h-screen bg-gradient-to-br ${bg} relative p-5 overflow-hidden`}>
          <FloatBg/>
          {particles.map(p=>(
            <div key={p.id} className="fixed pointer-events-none z-50 rounded-full" style={{
              width:p.size, height:p.size, left:p.x+"%", top:"50%",
              backgroundColor:p.color,
              animation:`floatUp ${p.dur}s ease-out forwards`,
              animationDelay:`${p.delay}s`
            }}/>
          ))}
          <div className="max-w-4xl mx-auto relative z-10">
            <div className={`flex items-center justify-between rounded-2xl border px-5 py-3 mb-4 ${cardBg}`}>
              <div className="flex items-center gap-3">
                <Trophy size={24} className="text-yellow-400"/>
                <span className={`text-3xl font-black ${textPri}`}>{myScore}</span>
                {streak>1 && <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm font-black px-3 py-1 rounded-full flex items-center gap-1" style={{animation:"pop .4s ease"}}>
                  <Zap size={13}/> x{combo.toFixed(1)} · {streak} streak!
                </span>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${textSec}`}>Q {qIdx+1}/{questions.length}</span>
                <div className={`w-36 h-3 rounded-full overflow-hidden ${dark?"bg-slate-700":"bg-gray-200"}`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-500" style={{width:(qIdx/questions.length*100)+"%"}}/>
                </div>
              </div>
            </div>
            {room && (
              <div className={`rounded-2xl border px-5 py-2 mb-4 flex gap-5 overflow-x-auto ${cardBg}`}>
                {[...room.players].sort((a,b)=>b.score-a.score).map(p=>(
                  <div key={p.id} className="flex items-center gap-2 whitespace-nowrap">
                    <span className={p.name===playerName?"text-yellow-400":textSec}>🎮</span>
                    <span className={`text-sm font-bold ${p.name===playerName?textPri:textSec}`}>{p.name}</span>
                    <span className={`text-sm font-black ${p.name===playerName?"text-yellow-400":textSec}`}>{p.score}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={`rounded-3xl border p-10 text-center mb-5 relative overflow-hidden ${cardBg}`}>
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{background:"linear-gradient(90deg,#a855f7,#ec4899,#f97316)"}}/>
              
              {questions[qIdx].media && (
                <div className="mb-6">
                  {questions[qIdx].media.type === "image" && (
                    <img 
                      src={questions[qIdx].media.url} 
                      alt={questions[qIdx].media.caption||"Question"} 
                      onError={(e)=>{e.target.style.display='none';}}
                      className="max-w-full max-h-80 mx-auto rounded-2xl shadow-2xl object-contain"
                    />
                  )}
                  {questions[qIdx].media.type === "audio" && (
                    <div className="max-w-2xl mx-auto">
                      <iframe 
                        src={questions[qIdx].media.url} 
                        className="w-full h-32 rounded-2xl" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen 
                      />
                    </div>
                  )}
                  {questions[qIdx].media.type === "video" && (
                    <div className="max-w-2xl mx-auto aspect-video">
                      <iframe 
                        src={questions[qIdx].media.url} 
                        className="w-full h-full rounded-2xl shadow-2xl" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen 
                      />
                    </div>
                  )}
                  {questions[qIdx].media.caption && (
                    <p className={`text-sm ${textSec} mt-2 italic`}>{questions[qIdx].media.caption}</p>
                  )}
                </div>
              )}

              <h2 className={`text-3xl sm:text-4xl font-black leading-snug ${textPri}`}>{questions[qIdx].question}</h2>
              {chosen===null && <p className={`mt-3 text-lg font-bold ${textSec}`}>⏱️ {elapsed.toFixed(1)} s</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {questions[qIdx].options.map((opt,i)=>{
                const isC = chosen===i;
                const isCorrect = i===questions[qIdx].correctAnswer;
                let bg2 = {background:OPT[i].bg};
                let extra = "hover:brightness-110 hover:scale-[1.02]";
                let anim = "";
                if(feedback){
                  if(isCorrect)      { bg2={background:"#16a34a",boxShadow:"0 0 36px #16a34a88"}; anim="pop .4s ease"; }
                  else if(isC)       { bg2={background:"#b91c1c"};  anim="shake .4s ease"; }
                  else               { bg2={background:OPT[i].bg,opacity:.3}; }
                  extra="";
                }
                return (
                  <button key={i} disabled={feedback||chosen!==null} onClick={()=>answerQ(i)}
                    className={`flex items-center gap-4 px-6 py-6 rounded-2xl text-white font-black text-xl shadow-xl transition-all ${extra}`}
                    style={{...bg2,animation:anim}}>
                    <span className="text-3xl opacity-70">{OPT[i].label}</span>
                    <span className="text-left flex-1">{opt}</span>
                    {feedback && isCorrect && <Check size={26}/>}
                  </button>
                );
              })}
            </div>
            {feedback && (
              <div className="mt-5 rounded-3xl p-6 text-center text-white font-black text-2xl shadow-xl"
                style={{background:correct?"linear-gradient(135deg,#16a34a,#22c55e)":"linear-gradient(135deg,#dc2626,#ef4444)",animation:"pop .35s ease"}}>
                {correct ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-1"><Star size={30}/> PARFAIT ! <Star size={30}/></div>
                    <div className="text-4xl">+{flash} pts</div>
                    {streak>1 && <div className="text-lg mt-1 opacity-80">🔥 Série de {streak} !</div>}
                    {elapsed<4 && <div className="text-sm mt-1 opacity-70">⚡ Ultra-rapide !</div>}
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Heart size={26}/> Oups ! La bonne réponse était <strong>{OPT[questions[qIdx].correctAnswer].label}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ RESULTS ════ */}
      {page==="results" && (
        <div className={`min-h-screen bg-gradient-to-br ${bg} relative p-5 overflow-hidden`}>
          <FloatBg/>
          {[...Array(50)].map((_,i)=>(
            <div key={i} className="fixed rounded-sm pointer-events-none" style={{
              width:7+(i%5)*3, height:7+(i%3)*4,
              left:(i*2.05)%100+"%", top:-20,
              backgroundColor:["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#ec4899"][i%6],
              animation:`confetti ${2.4+(i%3)*1.1}s linear infinite`,
              animationDelay:`${(i*.07)%2.4}s`
            }}/>
          ))}
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-6">
              <Trophy size={90} className="mx-auto text-yellow-400 mb-2" style={{animation:"bounce 2s ease-in-out infinite"}}/>
              <h1 className={`text-5xl font-black ${textPri}`}>{resMulti?"Classement Final":"Quiz Terminé !"}</h1>
            </div>

            {resMulti && leaderboard.length>0 && (
              <div className="mb-8">
                <div className="flex items-end justify-center gap-4 mb-6" style={{animation:"riseUp .7s ease"}}>
                  {[1,0,2].map(pos=>{
                    const p=leaderboard[pos]; if(!p) return null;
                    const idx = pos===0?1:pos===1?0:2;
                    const H    = [160,200,130];
                    const icons = [<Medal size={34} className="text-gray-400"/>,<Crown size={40} className="text-yellow-400"/>,<Award size={30} className="text-orange-500"/>];
                    const labs  = ["2ème","1er","3ème"];
                    const grads = ["from-gray-400 to-gray-500","from-yellow-400 to-amber-500","from-orange-400 to-amber-600"];
                    const hl    = p.name===playerName;
                    return (
                      <div key={pos} className="flex flex-col items-center">
                        <div className={`w-36 rounded-t-2xl p-4 text-center shadow-xl border-2 ${hl?(dark?"border-yellow-400 bg-yellow-900/30":"border-yellow-400 bg-yellow-50"):cardBg}`}>
                          <div className="flex justify-center mb-1">{icons[idx]}</div>
                          <div className={`text-lg font-black ${textPri}`}>{labs[idx]}</div>
                          <div className={`text-sm font-bold truncate ${hl?"text-yellow-400":textSec}`}>{p.name}{hl&&" 🎮"}</div>
                          <div className={`text-xl font-black mt-1 ${textPri}`}>{p.score}</div>
                        </div>
                        <div className={`w-36 rounded-b-2xl bg-gradient-to-t ${grads[idx]} shadow-lg`} style={{height:H[idx]}}/>
                      </div>
                    );
                  })}
                </div>
                
                {resMyPos > 3 && (
                  <div className={`rounded-2xl border-2 p-5 mx-auto max-w-md ${dark?"bg-violet-900/40 border-violet-500":"bg-violet-100 border-violet-400"}`}>
                    <div className="text-center">
                      <p className={`text-sm font-bold uppercase tracking-widest mb-2 ${textSec}`}>Ta position</p>
                      <div className="flex items-center justify-center gap-4">
                        <div className={`text-6xl font-black ${textPri}`}>#{resMyPos}</div>
                        <div className="text-left">
                          <p className={`text-lg font-bold ${textSec}`}>sur {leaderboard.length} joueur{leaderboard.length>1?"s":""}</p>
                          <p className={`text-2xl font-black text-yellow-400`}>{myScore} pts</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={`rounded-3xl border p-8 mb-5 text-center ${cardBg}`}>
              {resMulti && resMyPos <= 3 && (
                <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${textSec}`}>Tu es #{resMyPos} 🎉</p>
              )}
              {!resMulti && <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${textSec}`}>Ton Score</p>}
              <div className={`text-8xl font-black ${textPri}`}>{myScore}</div>
              <div className="mt-3 inline-flex items-center gap-3 px-8 py-3 rounded-2xl text-white font-black text-2xl shadow-xl"
                style={{background:`linear-gradient(135deg,${resRank.bg[0]},${resRank.bg[1]})`}}>
                <span className="text-3xl">{resRank.icon}</span> {resRank.title}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-5">
                {[
                  {l:"Questions",val:questions.length,ic:"📝"},
                  {l:"Performance",val:resPct+"%",ic:"📊"},
                  {l:"Meilleur combo",val:"x"+combo.toFixed(1),ic:"🔥"},
                ].map((s,i)=>(
                  <div key={i} className={`rounded-xl p-4 ${dark?"bg-slate-700/50":"bg-gray-50"}`}>
                    <div className="text-lg">{s.ic}</div>
                    <div className={`text-xs font-bold ${textSec}`}>{s.l}</div>
                    <div className={`text-xl font-black ${textPri}`}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={()=>{setSelCats([]);setCustomKeywords([]);setPage("setup");}}
                className="py-5 rounded-3xl bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xl font-black shadow-xl hover:scale-[1.02] flex items-center justify-center gap-3">
                <RefreshCw size={24}/> Nouvelle Partie
              </button>
              <button onClick={()=>{leaveRoom();setPage("home");}}
                className="py-5 rounded-3xl bg-gradient-to-r from-slate-600 to-slate-700 text-white text-xl font-black shadow-xl hover:scale-[1.02] flex items-center justify-center gap-3">
                <Home size={24}/> Accueil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ HISTORY ════ */}
      {page==="history" && (
        <div className={`min-h-screen bg-gradient-to-br ${bg} relative p-5 overflow-hidden`}>
          <FloatBg/>
          <div className="max-w-2xl mx-auto relative z-10">
            <button onClick={()=>setPage("home")} className={`flex items-center gap-2 px-5 py-2 rounded-2xl border mb-6 ${cardBg} ${textPri} font-bold hover:opacity-80`}><ArrowLeft size={18}/> Retour</button>
            <h1 className={`text-4xl font-black mb-5 flex items-center gap-3 ${textPri}`}><BarChart2 size={32} className="text-violet-400"/> Historique</h1>
            {!currentUser ? (
              <div className={`rounded-3xl border p-16 text-center ${cardBg}`}>
                <p className={`text-xl mb-4 ${textPri}`}>📊 L'historique est disponible uniquement avec un compte</p>
                <p className={`text-sm mb-6 ${textSec}`}>Crée un compte pour sauvegarder tes statistiques !</p>
                <button onClick={()=>setPage("auth")} className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-black shadow-xl hover:scale-[1.02] transition">
                  Créer un compte
                </button>
              </div>
            ) : (!currentUser.history || currentUser.history.length===0) ? (
              <div className={`rounded-3xl border p-16 text-center ${cardBg}`}>
                <p className={`text-xl ${textSec}`}>Aucune partie encore… Lance un quiz !</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {currentUser.history.map(h=>(
                  <div key={h.id} className={`rounded-2xl border p-5 flex items-center justify-between ${cardBg}`}>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{h.rank.icon}</div>
                      <div>
                        <div className={`font-black text-lg ${textPri}`}>{h.rank.title}</div>
                        <div className={`text-sm ${textSec}`}>{h.questions} questions · {h.mode==="multi"?"👥 Multi":"🎮 Solo"} · {new Date(h.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-black ${textPri}`}>{h.score}</div>
                      <div className={`text-sm ${textSec}`}>{h.pct}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
