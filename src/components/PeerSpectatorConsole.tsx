import { useState, useEffect, useRef } from "react";
import { 
  Users, 
  MessageSquare, 
  Send, 
  Sparkles, 
  HelpCircle, 
  Flame, 
  ThumbsUp, 
  Lightbulb, 
  AlertTriangle, 
  Radio, 
  Compass, 
  Brain,
  History,
  Terminal,
  Clock,
  Loader2,
  X,
  FileText
} from "lucide-react";
import { WSState, WSChatMessage, WSParticipant } from "../hooks/useWebSocketRoom";
import ReactMarkdown from "react-markdown";

interface PeerSpectatorConsoleProps {
  roomId: string;
  userName: string;
  connectionStatus: "connecting" | "connected" | "disconnected";
  roomState: WSState | null;
  liveReactions: { id: string; symbol: string; sender: string }[];
  triggerReaction: (symbol: string) => void;
  sendLiveHint: (text: string) => void;
  sendChatMessage: (text: string) => void;
  onExit: () => void;
}

export default function PeerSpectatorConsole({
  roomId,
  userName,
  connectionStatus,
  roomState,
  liveReactions,
  triggerReaction,
  sendLiveHint,
  sendChatMessage,
  onExit,
}: PeerSpectatorConsoleProps) {
  const [chatInput, setChatInput] = useState("");
  const [hintInput, setHintInput] = useState("");
  const [activeTab, setActiveTab] = useState<"history" | "chat">("chat");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [roomState?.chats]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  const handleSendHint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hintInput.trim()) return;
    sendLiveHint(hintInput.trim());
    setHintInput("");
    // Show quick feedback
    const originalBtn = document.getElementById("submit-hint-btn");
    if (originalBtn) {
      originalBtn.innerText = "Hint Pushed!";
      setTimeout(() => {
        if (originalBtn) originalBtn.innerText = "Push Glowing Hint";
      }, 2000);
    }
  };

  const candidateParticipant = roomState?.participants.find(p => p.role === "candidate");
  const otherPeers = roomState?.participants.filter(p => p.role === "peer") || [];

  return (
    <div className="max-w-6xl mx-auto py-4 px-4 space-y-6" id="spectator-console-viewport">
      {/* Dynamic HUD Header Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-teal-500/20 bg-neutral-950/60 shadow-[0_0_20px_rgba(20,184,166,0.05)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md font-bold">
                LIVE SPECTATING
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Room: <strong className="text-teal-400 font-bold">{roomId}</strong>
              </span>
            </div>
            <h2 className="text-sm font-extrabold text-white mt-1">
              {candidateParticipant ? `${candidateParticipant.userName}'s Arena Sandbox` : "Waiting for Candidate..."}
            </h2>
          </div>
        </div>

        {/* Sync Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus === "connected" ? "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.7)]" : 
              connectionStatus === "connecting" ? "bg-amber-500 animate-pulse" : "bg-red-500"
            }`} />
            <span className="text-neutral-400">
              {connectionStatus === "connected" ? "Sync Connected" : 
               connectionStatus === "connecting" ? "Establishing sync..." : "Offline"}
            </span>
          </div>

          <button
            onClick={onExit}
            className="text-xs bg-neutral-900 border border-neutral-800 hover:border-red-500/30 font-semibold px-3 py-1.5 rounded-xl hover:bg-neutral-800 transition-colors uppercase font-mono tracking-wider text-neutral-400 hover:text-red-400 cursor-pointer"
          >
            Leave Room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="spectator-layout-grids">
        {/* Left Column: Client Workspace View (Candidate active screen replica) */}
        <div className="md:col-span-2 space-y-6" id="spectate-candidate-side">
          {/* Active Question Display */}
          <div className="glass-panel p-5 rounded-3xl border border-neutral-900/60 bg-neutral-950/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-500/5 to-transparent rounded-full blur-2xl po-none pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-neutral-200">AI Active Question Panel</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400">
                <span className="bg-teal-500/10 border border-teal-500/20 text-teal-300 px-2 py-0.5 rounded">
                  {roomState?.difficulty || "Mid-Level"}
                </span>
                <span className="text-neutral-500">•</span>
                <span>Round {roomState?.currentRound || 1}</span>
              </div>
            </div>

            {roomState?.activeQuestion ? (
              <div className="space-y-4">
                <div className="bg-neutral-900/40 border border-neutral-800/80 p-4 rounded-xl text-neutral-200 leading-relaxed text-sm">
                  {roomState.activeQuestion.question}
                </div>
                
                {/* Hints / Keywords for Peers to see */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-teal-950/10 border border-teal-900/20 rounded-lg">
                    <span className="text-[10px] uppercase font-semibold text-teal-400 block mb-1">Expected Key Phrases</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {roomState.activeQuestion.expectedKeywords?.map((kw: string, i: number) => (
                        <span key={i} className="bg-neutral-950 text-neutral-400 border border-neutral-900 px-1.5 py-0.5 rounded font-mono text-[10px]">
                          {kw}
                        </span>
                      )) || <span className="text-neutral-500">None defined</span>}
                    </div>
                  </div>
                  <div className="p-3 bg-purple-950/10 border border-purple-900/20 rounded-lg">
                    <span className="text-[10px] uppercase font-semibold text-purple-400 block mb-1">System Subtle Hint</span>
                    <p className="text-neutral-400 leading-relaxed mt-1 text-[11px] font-sans">
                      {roomState.activeQuestion.hint || "Review core architectural constructs."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <Loader2 className="w-6 h-6 text-neutral-600 animate-spin mx-auto mb-2" />
                <h4 className="text-xs font-bold text-neutral-400 font-mono">WAITING FOR NEXT GENERATION...</h4>
                <p className="text-[11px] text-neutral-500 max-w-sm mx-auto mt-1 leading-normal">
                  The candidate is currently setting up the session variables or waiting on their AI interviewer to compile.
                </p>
              </div>
            )}
          </div>

          {/* Real-time Answer Live Typewriter Draft Monitor */}
          <div className="glass-panel p-5 rounded-3xl border border-neutral-900/80 bg-neutral-950" id="spectate-live-terminal">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-3">
              <span className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                CANDIDATE_RESPONSE_STREAM [LIVE]
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Broadcasting keystrokes...
              </span>
            </div>

            <div className="p-4 bg-black border border-neutral-900/60 rounded-xl leading-relaxed text-xs font-mono text-neutral-300 min-h-[140px] whitespace-pre-wrap max-h-[250px] overflow-y-auto">
              {roomState?.activeDraft ? (
                <div className="relative">
                  {roomState.activeDraft}
                  <span className="inline-block w-1.5 h-4 bg-emerald-400 ml-1 select-none animate-blink" />
                </div>
              ) : (
                <span className="text-neutral-600 italic">Candidate has not started typing their response draft...</span>
              )}
            </div>

            <p className="text-[10px] text-neutral-500 mt-2 font-sans leading-normal">
              This terminal receives and synchronizes raw draft strokes via continuous WebSockets. Use the co-evaluation panel on the right to send encouragement or prompt corrections.
            </p>
          </div>

          {/* Past Rounds Historical Evaluation Log */}
          <div className="glass-panel p-5 rounded-3xl border border-neutral-900/60 bg-neutral-950/40">
            <div className="flex items-center gap-2 border-b border-neutral-900 pb-3 mb-4">
              <History className="w-4 h-4 text-neutral-500" />
              <h3 className="text-xs font-bold font-mono uppercase text-neutral-300 tracking-wide">
                Drill History & Graded Appraisals
              </h3>
            </div>

            {roomState?.history && roomState.history.length > 0 ? (
              <div className="space-y-4" id="spectator-history-list">
                {roomState.history.map((hist, index) => (
                  <div key={index} className="p-4 border border-neutral-900 rounded-xl bg-neutral-950/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                      <span className="text-[11px] font-bold text-neutral-300">
                        Round {hist.roundNumber}: {hist.category} Analysis
                      </span>
                      {hist.evaluation ? (
                        <span className="text-xs font-extrabold text-teal-400 font-mono">
                          Score: {hist.evaluation.score}/100
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-500">Evaluating...</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-mono mb-1">Question:</p>
                      <p className="text-xs text-neutral-400 line-clamp-1 italic">"{hist.question}"</p>
                    </div>
                    {hist.candidateAnswer && (
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase font-mono mb-1">Answer Transcribed:</p>
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">"{hist.candidateAnswer}"</p>
                      </div>
                    )}
                    {hist.evaluation && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-900/30 text-[11px]">
                        <div>
                          <strong className="text-[9px] uppercase font-bold text-teal-400 block">Notable Strengths:</strong>
                          <ul className="list-disc list-inside text-neutral-400 space-y-0.5 mt-1">
                            {hist.evaluation.strengths.slice(0, 2).map((str, i) => (
                              <li key={i} className="line-clamp-1">{str}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong className="text-[9px] uppercase font-bold text-red-400 block">Crucial Misses:</strong>
                          <ul className="list-disc list-inside text-neutral-400 space-y-0.5 mt-1">
                            {hist.evaluation.missedConcepts.slice(0, 2).map((ms, i) => (
                              <li key={i} className="line-clamp-1">{ms}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-neutral-900 rounded-2xl">
                <HelpCircle className="w-6 h-6 text-neutral-600 mx-auto mb-1.5" />
                <h4 className="text-xs text-neutral-400 font-bold">No evaluation record yet</h4>
                <p className="text-[10px] text-neutral-500 mt-1">Evaluations will automatically synchronize here post generation.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interaction, Reactions, Hints, & Chats */}
        <div className="space-y-6" id="spectator-collaboration-side">
          
          {/* Reaction Console Pad */}
          <div className="glass-panel p-5 rounded-2xl border border-neutral-900 bg-neutral-950/40">
            <h3 className="text-xs font-bold font-mono uppercase text-neutral-300 tracking-wide mb-3 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              Live Reaction Trigger Grid
            </h3>
            <p className="text-[10px] text-neutral-500 mb-4 font-sans leading-normal">
              Clicking triggers visual particle flares and audio indicators on the candidate's screen in real-time.
            </p>

            <div className="grid grid-cols-2 gap-2" id="reaction-grid-pad">
              <button
                onClick={() => triggerReaction("🔥")}
                className="flex items-center gap-2 justify-center py-2.5 rounded-xl border border-amber-500/20 hover:border-amber-500 bg-amber-500/10 text-amber-300 text-xs font-bold transition-all cursor-pointer hover:scale-[1.03]"
              >
                <span>🔥</span> Core Hit!
              </button>
              <button
                onClick={() => triggerReaction("👏")}
                className="flex items-center gap-2 justify-center py-2.5 rounded-xl border border-teal-500/20 hover:border-teal-500 bg-teal-500/10 text-teal-300 text-xs font-bold transition-all cursor-pointer hover:scale-[1.03]"
              >
                <span>👏</span> Perfect Logic
              </button>
              <button
                onClick={() => triggerReaction("💡")}
                className="flex items-center gap-2 justify-center py-2.5 rounded-xl border border-purple-500/20 hover:border-purple-500 bg-purple-500/10 text-purple-300 text-xs font-bold transition-all cursor-pointer hover:scale-[1.03]"
              >
                <span>💡</span> Suggest Hint
              </button>
              <button
                onClick={() => triggerReaction("⚡")}
                className="flex items-center gap-2 justify-center py-2.5 rounded-xl border border-cyan-500/20 hover:border-cyan-500 bg-cyan-500/10 text-cyan-300 text-xs font-bold transition-all cursor-pointer hover:scale-[1.03]"
              >
                <span>⚡</span> Watch Big O!
              </button>
            </div>

            {/* Quick particle display in helper bar */}
            {liveReactions.length > 0 && (
              <div className="mt-3 p-2 bg-neutral-900/60 border border-neutral-800 rounded-lg flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-mono uppercase text-teal-500 block">Sent:</span>
                {liveReactions.map(r => (
                  <span key={r.id} className="text-xs animate-bounce">
                    {r.symbol}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Live Hint Bubble Pusher */}
          <div className="glass-panel p-5 rounded-2xl border border-neutral-900 bg-neutral-950">
            <h3 className="text-xs font-bold font-mono uppercase text-neutral-300 tracking-wide mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-purple-400 animate-pulse" />
              Immediate Custom Co-Hint
            </h3>
            <p className="text-[10px] text-neutral-500 mb-3 leading-normal">
              Type advice or standard reminders (e.g. Kotlin Jetpack lifecycle states) to display instantly inside the Candidate's prompt panel.
            </p>

            <form onSubmit={handleSendHint} className="space-y-2">
              <textarea
                value={hintInput}
                onChange={(e) => setHintInput(e.target.value)}
                placeholder="e.g. Try to reference rememberUpdatedState thread mechanics!"
                rows={2}
                className="w-full text-xs bg-neutral-900 border border-neutral-800 focus:border-purple-500/50 p-2.5 rounded-xl outline-none text-neutral-200 resize-none font-sans"
              />
              <button
                type="submit"
                id="submit-hint-btn"
                disabled={!hintInput.trim()}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold py-2 rounded-xl text-[11px] transition-all cursor-pointer"
              >
                Push Glowing Hint
              </button>
            </form>
          </div>

          {/* Interactive Live Dialogue and Collaboration Panel */}
          <div className="glass-panel p-5 rounded-2xl border border-neutral-900 bg-neutral-950/40 flex flex-col h-[350px]">
            <div className="flex border-b border-neutral-900/40 pb-3 mb-3 justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs font-bold font-mono uppercase text-neutral-300 tracking-wide select-none">
                  Live Sync Chat Box
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-500">
                <Users className="w-3 h-3 text-neutral-500" />
                <span>{roomState?.participants.length || 1} Active</span>
              </div>
            </div>

            {/* Chats Container */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs custom-scrollbar-thin">
              {roomState?.chats && roomState.chats.length > 0 ? (
                roomState.chats.map((chat) => (
                  <div key={chat.id} className="speech-message p-2 rounded-xl bg-neutral-900 border border-neutral-900 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <strong className={`font-bold ${chat.role === "candidate" ? "text-teal-400" : "text-purple-400"}`}>
                        {chat.sender} ({chat.role === "candidate" ? "Candidate" : "Peer Observer"})
                      </strong>
                      <span className="text-neutral-500">
                        {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-neutral-300 leading-normal font-sans break-words">{chat.text}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center opacity-40 py-10">
                  <MessageSquare className="w-6 h-6 text-neutral-600 mb-1" />
                  <span className="text-[10px] font-mono uppercase text-neutral-500 leading-normal">
                    No conversation records.
                  </span>
                  <span className="text-[9px] text-neutral-600 max-w-[140px] mt-0.5 leading-snug">
                    Type inside the console below to sync messages instantly.
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Form Input */}
            <form onSubmit={handleSendChat} className="mt-3 flex gap-2 border-t border-neutral-900 pt-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type real-time message..."
                className="flex-1 bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-xl text-neutral-100 outline-none focus:border-teal-500/40"
              />
              <button
                type="submit"
                className="bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
