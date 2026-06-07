/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { InterviewSession, Difficulty, RoundHistoryItem } from "./types";
import { INTERVIEWERS } from "./data";
import SetupScreen from "./components/SetupScreen";
import InterviewerWelcome from "./components/InterviewerWelcome";
import InterviewConsole from "./components/InterviewConsole";
import Dashboard from "./components/Dashboard";
import { useWebSocketRoom } from "./hooks/useWebSocketRoom";
import PeerSpectatorConsole from "./components/PeerSpectatorConsole";
import { Cpu, Terminal, ShieldCheck, Sparkles, MessageSquareCode, LogIn, LogOut, History, Award, BookOpen, Clock, Trash2, Loader2 } from "lucide-react";
// @ts-ignore
import logoImg from "./assets/images/ai_arena_logo_1780838673031.png";

// Import Firebase Auth and Service items
import { auth, db } from "./firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { 
  loginWithGoogle, 
  logOut, 
  persistInterviewSession, 
  fetchUserSessions, 
  syncUserProfile, 
  UserProfile 
} from "./services/firebaseService";
import { doc, deleteDoc } from "firebase/firestore";

export default function App() {
  // Master Session State tracker
  const [session, setSession] = useState<InterviewSession>({
    id: "",
    difficulty: "Senior",
    topic: "",
    interviewerId: "sia",
    roundsCount: 3,
    status: "SETUP",
    currentRoundIndex: 0,
    history: []
  });

  // User Auth & Profiles state trackers
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSessions, setUserSessions] = useState<InterviewSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // WebSocket Live Sync states
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'candidate' | 'peer'>('candidate');
  const [userNameForWS, setUserNameForWS] = useState<string>("");
  const [isNameConfirmed, setIsNameConfirmed] = useState<boolean>(false);

  // Check URL parameters for spectating room on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get("roomId");
    if (urlRoomId) {
      setActiveRoomId(urlRoomId);
      setUserRole("peer");
      const stored = localStorage.getItem("ws_nickname");
      if (stored) {
        setUserNameForWS(stored);
        setIsNameConfirmed(true);
      }
    }
  }, []);

  // Sync WebSocket client hook
  const {
    connectionStatus,
    roomState,
    liveReactions,
    liveHint,
    clearLiveHint,
    triggerReaction,
    sendLiveHint,
    sendChatMessage,
    syncDraftText,
    syncActiveQuestion,
    syncStatusAndHistory
  } = useWebSocketRoom(
    activeRoomId,
    userRole,
    userNameForWS || (currentUser?.displayName) || `Guest Observer #${Math.floor(1000 + Math.random() * 9000)}`,
    currentUser?.photoURL || undefined,
    userRole === 'candidate' ? {
      topic: session.topic,
      difficulty: session.difficulty,
      status: session.status,
      currentRound: session.currentRoundIndex,
      activeDraft: "",
      history: session.history
    } : undefined
  );


  // Sync auth trigger
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthChecking(true);
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          const profile = await syncUserProfile(firebaseUser);
          setUserProfile(profile);
          
          setSessionsLoading(true);
          const past = await fetchUserSessions(firebaseUser.uid);
          setUserSessions(past);
        } catch (err) {
          console.error("Failed loading profile/sessions:", err);
        } finally {
          setSessionsLoading(false);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setUserSessions([]);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const profile = await loginWithGoogle();
      if (profile) {
        setUserProfile(profile);
        setSessionsLoading(true);
        const past = await fetchUserSessions(profile.uid);
        setUserSessions(past);
      }
    } catch (err) {
      console.error("Authentication failed:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const handleDeleteSession = async (sessionIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to delete this session from your history?")) return;

    try {
      await deleteDoc(doc(db, "sessions", sessionIdToDelete));
      setUserSessions(prev => prev.filter(s => s.id !== sessionIdToDelete));
    } catch (err) {
      console.error("Failed to delete session log:", err);
    }
  };

  const handleSelectPreviousSession = (selected: InterviewSession) => {
    setSession({
      ...selected,
      status: "COMPLETED"
    });
  };

  const activeInterviewer = INTERVIEWERS.find(it => it.id === session.interviewerId) || INTERVIEWERS[0];

  // Callback: Launch parameter configurations
  const handleLaunchSession = (config: {
    topic: string;
    difficulty: Difficulty;
    interviewerId: string;
    roundsCount: number;
    enableWSSync: boolean;
  }) => {
    const freshSession: InterviewSession = {
      id: Math.random().toString(36).substring(7),
      difficulty: config.difficulty,
      topic: config.topic,
      interviewerId: config.interviewerId,
      roundsCount: config.roundsCount,
      status: "INTERVIEWING", // Go straight into active interview sequence
      currentRoundIndex: 1,
      history: []
    };
    
    setSession(freshSession);

    if (config.enableWSSync) {
      setActiveRoomId(freshSession.id);
      setUserRole("candidate");
    } else {
      setActiveRoomId(null);
    }

    // Persist session to database if logged-in
    if (currentUser) {
      persistInterviewSession(freshSession, currentUser.uid).then(() => {
        // Reload list in background
        fetchUserSessions(currentUser.uid).then(setUserSessions).catch(console.error);
      }).catch(console.error);
    }
  };

  // Callback: Evaluation completed for all rounds
  const handleCompleteSession = (finalHistory: RoundHistoryItem[]) => {
    const finalizedSession: InterviewSession = {
      ...session,
      history: finalHistory,
      status: "COMPLETED"
    };

    setSession(finalizedSession);

    if (activeRoomId && userRole === 'candidate') {
      syncStatusAndHistory("COMPLETED", finalHistory);
    }

    if (currentUser) {
      persistInterviewSession(finalizedSession, currentUser.uid).then(() => {
        // Refetch sessions list
        fetchUserSessions(currentUser.uid).then(setUserSessions).catch(console.error);
      }).catch(console.error);
    }
  };

  // Callback: Reset assessment back to custom configs
  const handleRestart = () => {
    setActiveRoomId(null);
    setUserRole("candidate");
    setSession({
      id: "",
      difficulty: "Senior",
      topic: "",
      interviewerId: "sia",
      roundsCount: 3,
      status: "SETUP",
      currentRoundIndex: 0,
      history: []
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between" id="applet-viewport-frame">
      {/* GLOBAL HUD GLOW BAR HEADER */}
      <header className="border-b border-neutral-900/60 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-4" id="hud-navigation-bar">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo image container */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 p-[1.5px] flex items-center justify-center shadow-lg shadow-teal-500/20">
              <img 
                src={logoImg} 
                alt="Android AI Arena Logo" 
                className="w-full h-full object-cover rounded-[10px]"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-sans font-black text-sm tracking-tight text-white leading-none">
                  Android AI Arena
                </h1>
                <span className="text-[9px] bg-neutral-800 text-neutral-400 font-mono px-1.5 py-0.2 rounded uppercase tracking-wider border border-neutral-700/60 font-semibold">
                  Sandbox v2.4
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 mt-1 font-mono tracking-tight leading-none">
                CHROME SPEECH SYNTHESIS ENGINE
              </p>
            </div>
          </div>

          {/* Active indicator nodes & Cloud Identity Sync HUD */}
          <div className="flex items-center gap-4 text-xs select-none">
            {authChecking ? (
              <span className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500" />
                Syncing Auth...
              </span>
            ) : currentUser ? (
              <div className="flex items-center gap-3 bg-neutral-900/65 border border-neutral-800 p-[3px] pr-2.5 rounded-full" id="auth-header-pill">
                <div className="flex items-center gap-1.5">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Google User" 
                      className="w-6 h-6 rounded-full border border-teal-500/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-[10px] font-sans">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "U"}
                    </div>
                  )}
                  <span className="hidden sm:inline-block text-xs font-bold text-neutral-300 max-w-[100px] truncate leading-none">
                    {currentUser.displayName || "Candidate"}
                  </span>
                </div>
                
                <button
                  onClick={handleSignOut}
                  title="Disconnect account sync"
                  className="p-1 rounded-full text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                  id="google-logout-header-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/30 hover:border-teal-500/60 text-teal-300 font-bold px-3 py-1.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_12px_rgba(20,184,166,0.15)] text-[11px] cursor-pointer"
                id="google-login-header-btn"
              >
                <LogIn className="w-3.5 h-3.5 text-teal-400" />
                Sync with Google Cloud
              </button>
            )}

            {session.status === "INTERVIEWING" && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-300 font-semibold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                Live Feed Active
              </div>
            )}
            {session.status === "COMPLETED" && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Audited & Ranked
              </div>
            )}
            {session.status === "SETUP" && !currentUser && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 hidden sm:inline">
                IDLE_STANDBY
              </span>
            )}
          </div>
        </div>
      </header>

      {/* CORE FRAMEWORK STAGES CONTAINER */}
      <main className="flex-1 w-full flex items-center justify-center py-6">
        <div className="w-full max-w-7xl mx-auto px-4">
          
          {activeRoomId && userRole === 'peer' ? (
            !isNameConfirmed ? (
              <div className="max-w-md mx-auto glass-panel p-6 rounded-2xl border border-teal-500/30 text-center space-y-5 bg-neutral-950">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-500/15 flex items-center justify-center text-3xl">
                  👥
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2.5 py-0.5 rounded-full font-bold">
                    JOIN CO-INTERVIEW
                  </span>
                  <h1 className="text-xl font-extrabold text-white mt-1">Enter Peer Observer Deck</h1>
                  <p className="text-xs text-neutral-400 mt-1">
                    You are joining co-interview room: <strong className="text-teal-400 font-mono">{activeRoomId}</strong>
                  </p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const nameToSave = userNameForWS.trim() || `Spectator #${Math.floor(1000 + Math.random() * 9000)}`;
                  setUserNameForWS(nameToSave);
                  localStorage.setItem("ws_nickname", nameToSave);
                  setIsNameConfirmed(true);
                }} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
                      Your Spoken Nickname
                    </label>
                    <input
                      type="text"
                      required
                      value={userNameForWS}
                      onChange={(e) => setUserNameForWS(e.target.value)}
                      placeholder="e.g. Alexis (Senior Engineer)"
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-teal-400/45 p-3 rounded-xl text-neutral-100 placeholder-neutral-600 outline-none text-xs"
                      id="nickname-ws-input"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider cursor-pointer"
                    id="nickname-ws-submit"
                  >
                    Enter Live Arena
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoomId(null);
                      setUserRole("candidate");
                      window.history.pushState({}, document.title, window.location.pathname);
                    }}
                    className="w-full text-neutral-500 hover:text-neutral-300 text-[10px] text-center uppercase font-mono cursor-pointer"
                  >
                    Cancel and go home
                  </button>
                </form>
              </div>
            ) : (
              <PeerSpectatorConsole
                roomId={activeRoomId}
                userName={userNameForWS}
                connectionStatus={connectionStatus}
                roomState={roomState}
                liveReactions={liveReactions}
                triggerReaction={triggerReaction}
                sendLiveHint={sendLiveHint}
                sendChatMessage={sendChatMessage}
                onExit={() => {
                  setActiveRoomId(null);
                  setUserRole("candidate");
                  window.history.pushState({}, document.title, window.location.pathname);
                }}
              />
            )
          ) : (
            <>
              {session.status === "SETUP" && (
                <div className="space-y-8">
                  <SetupScreen 
                    onStart={handleLaunchSession} 
                    onJoinRoom={(code) => {
                      setActiveRoomId(code);
                      setUserRole("peer");
                      const stored = localStorage.getItem("ws_nickname");
                      if (stored) {
                        setUserNameForWS(stored);
                        setIsNameConfirmed(true);
                      } else {
                        setIsNameConfirmed(false);
                      }
                    }}
                  />
                  
                  {/* Previous Practice Sessions Section */}
                  {currentUser && (
                    <div className="max-w-4xl mx-auto px-4 mt-6" id="history-sessions-outer">
                      <div className="glass-panel p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40">
                        <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-4 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-teal-400" />
                            <div>
                              <h3 className="font-bold text-sm text-white font-sans uppercase tracking-wide">
                                Your Evaluation History
                              </h3>
                              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                RETRIEVED FROM FIRESTORE DATABASE
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-[10px] text-neutral-400 bg-teal-500/10 px-2 py-0.5 rounded font-bold font-mono">
                            {userSessions.length} {userSessions.length === 1 ? "Session Record" : "Session Records"}
                          </div>
                        </div>

                        {sessionsLoading ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                            <span className="text-xs text-neutral-400 font-mono">Querying cloud documents...</span>
                          </div>
                        ) : userSessions.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="sessions-history-grid">
                            {userSessions.map((histSession) => {
                              const gradedCount = histSession.history ? histSession.history.filter(h => h.evaluation).length : 0;
                              const avgScore = gradedCount > 0 
                                ? Math.round(histSession.history.reduce((a, b) => a + (b.evaluation?.score || 0), 0) / gradedCount)
                                : 0;
                              
                              return (
                                <div
                                  key={histSession.id}
                                  onClick={() => handleSelectPreviousSession(histSession)}
                                  className="group relative p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900 hover:border-teal-500 transition-all duration-350 cursor-pointer flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                                        {histSession.difficulty} • {histSession.roundsCount} Qs
                                      </span>
                                      
                                      {gradedCount > 0 ? (
                                        <span className="text-xs font-extrabold font-mono text-teal-400">
                                          Score: {avgScore}/100
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded font-mono">
                                          Undrafted
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="text-xs font-bold text-neutral-200 group-hover:text-white transition-colors line-clamp-1">
                                      {histSession.topic}
                                    </h4>
                                    
                                    {histSession.history && histSession.history.length > 0 && (
                                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1.5 leading-snug">
                                        Last Prompt: "{histSession.history[histSession.history.length - 1].question}"
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between border-t border-neutral-900 pt-2.5 mt-3 text-[10px] text-neutral-500 font-mono">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-neutral-500" />
                                      Ready to Review
                                    </span>

                                    <button
                                      onClick={(e) => handleDeleteSession(histSession.id, e)}
                                      className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-800 transition-colors"
                                      title="Delete Session Record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-neutral-900/10 rounded-xl border border-dashed border-neutral-900">
                            <Award className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                            <h4 className="text-xs font-bold text-neutral-300">No session histories recorded yet</h4>
                            <p className="text-[11px] text-neutral-500 max-w-xs mx-auto mt-1 leading-snug">
                              Launch or complete code interactive drills above to automatically persist evaluations onto your secure storage.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {session.status === "INTERVIEWING" && (
                <InterviewConsole
                  difficulty={session.difficulty}
                  topic={session.topic}
                  interviewer={activeInterviewer}
                  roundsCount={session.roundsCount}
                  onSessionComplete={handleCompleteSession}
                  userId={currentUser ? currentUser.uid : null}
                  sessionId={session.id}
                  syncDraftText={activeRoomId && userRole === 'candidate' ? syncDraftText : undefined}
                  syncActiveQuestion={activeRoomId && userRole === 'candidate' ? syncActiveQuestion : undefined}
                  syncStatusAndHistory={activeRoomId && userRole === 'candidate' ? syncStatusAndHistory : undefined}
                  liveReactions={activeRoomId && userRole === 'candidate' ? liveReactions : []}
                  liveHint={activeRoomId && userRole === 'candidate' ? liveHint : null}
                  clearLiveHint={activeRoomId && userRole === 'candidate' ? clearLiveHint : undefined}
                />
              )}

              {session.status === "COMPLETED" && (
                <Dashboard
                  history={session.history}
                  difficulty={session.difficulty}
                  topic={session.topic}
                  onRestart={handleRestart}
                />
              )}
            </>
          )}

        </div>
      </main>

      {/* COMPACT STRICTOR SYSTEM CREDIT MARGIN */}
      <footer className="border-t border-neutral-900/60 bg-neutral-950/40 text-[10px] py-4 text-center text-neutral-600 font-mono tracking-wide" id="global-system-footer">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span>
            ACCURACY RATED TO STANDARD DECA-RULES (2026 EDITION)
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-neutral-500">
              <Terminal className="w-3.5 h-3.5" />
              Web Speech API Handlers Loaded
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
