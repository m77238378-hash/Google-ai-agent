/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { INTERVIEWERS, INTERVIEW_TOPICS } from "../data";
import { Difficulty, Interviewer, InterviewTopic } from "../types";
import { Layout, GitBranch, Zap, Cpu, Activity, Trophy, HelpCircle, Sparkles, ShieldAlert, FileText, Lock, X, BarChart, Users, Youtube } from "lucide-react";
// @ts-ignore
import logoImg from "../assets/images/ai_arena_logo_1780838673031.png";

interface SetupScreenProps {
  onStart: (config: {
    topic: string;
    difficulty: Difficulty;
    interviewerId: string;
    roundsCount: number;
    enableWSSync: boolean;
  }) => void;
  onJoinRoom?: (roomId: string) => void;
}

export default function SetupScreen({ onStart, onJoinRoom }: SetupScreenProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>(INTERVIEW_TOPICS[0].id);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("Senior");
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>(INTERVIEWERS[0].id);
  const [roundsCount, setRoundsCount] = useState<number>(3);
  const [hostWSSync, setHostWSSync] = useState<boolean>(false);
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");

  const activeInterviewerObj = INTERVIEWERS.find(it => it.id === selectedInterviewer);

  // Helper to map topic icon safe from dynamic string resolution issues
  const renderTopicIcon = (iconName: string) => {
    const props = { className: "w-5 h-5 text-teal-400" };
    switch (iconName) {
      case "Layout": return <Layout {...props} />;
      case "GitBranch": return <GitBranch {...props} />;
      case "Zap": return <Zap {...props} />;
      case "Cpu": return <Cpu {...props} />;
      case "Activity": return <Activity {...props} />;
      case "BarChart": return <BarChart {...props} />;
      default: return <HelpCircle {...props} />;
    }
  };

  const difficulties: Difficulty[] = ["Junior", "Mid-Level", "Senior"];
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [modalActiveTab, setModalActiveTab] = useState<'terms' | 'privacy'>('terms');
  const [showTermsError, setShowTermsError] = useState<boolean>(false);

  const handleStart = () => {
    if (!agreedToTerms) {
      setShowTermsError(true);
      return;
    }
    setShowTermsError(false);
    onStart({
      topic: INTERVIEW_TOPICS.find(t => t.id === selectedTopic)?.title || "Android Development",
      difficulty: selectedDifficulty,
      interviewerId: selectedInterviewer,
      roundsCount,
      enableWSSync: hostWSSync
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4" id="setup-screen-container">
      {/* Header Info */}
      <div className="text-center mb-10">
        {/* Generated Big Branding Logo */}
        <div className="flex justify-center mb-6 animate-fade-in" id="brand-logo-container">
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-r from-teal-500 to-emerald-500 p-[2.5px] shadow-2xl shadow-teal-500/20">
            <img 
              src={logoImg} 
              alt="Android AI Arena Logo" 
              className="w-full h-full object-cover rounded-[22px]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20 mb-3" id="badge-top-setup">
          <Sparkles className="w-3.5 h-3.5" />
          {selectedTopic === "data_analysis" ? "Real-Time Student Analytics Coach" : "Real-Time Speech Interview Coach"}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 font-sans" id="setup-title">
          {selectedTopic === "data_analysis" ? "AI Data Analysis Academy" : "Android AI Interview Arena"}
        </h1>
        <p className="text-neutral-400 max-w-xl mx-auto text-sm" id="setup-subtitle">
          {selectedTopic === "data_analysis"
            ? "Practice Python variables, Pandas aggregates, Jupyter workflows, statistical plotting, and messy data cleaning with interactive speech feedback."
            : "Test your memory bounds, Jetpack coding expertise, and architectural limits with instant speech processing and AI diagnostics."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="setup-grid-main">
        {/* Left Column: Topics and Configs */}
        <div className="md:col-span-2 space-y-6" id="setup-control-panel">
          {/* Topic Section */}
          <div className="glass-panel p-5 rounded-2xl" id="topic-selector-section">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-neutral-400" />
              {selectedTopic === "data_analysis" ? "1. Choose Your Learning Stream" : "1. Choose Android Domain Focus"}
            </h3>
            <div className="space-y-2.5" id="topics-list-layout">
              {INTERVIEW_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  id={`topic-btn-${topic.id}`}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                    selectedTopic === topic.id
                      ? "bg-teal-500/10 border-teal-500/50 hover:bg-teal-500/15"
                      : "bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-900"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedTopic === topic.id ? "bg-teal-500/15" : "bg-neutral-800/40"}`}>
                    {renderTopicIcon(topic.icon)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-neutral-200">{topic.title}</h4>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{topic.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty and Round Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="difficulty-and-rounds-section">
            {/* Seniority target */}
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-neutral-400" />
                2. Seniority Target
              </h3>
              <div className="grid grid-cols-3 gap-1.5" id="difficulty-grid">
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    id={`diff-btn-${diff}`}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      selectedDifficulty === diff
                        ? "bg-teal-500/10 border-teal-500/50 text-teal-300"
                        : "bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-900 text-neutral-400"
                    }`}
                  >
                    {diff} Developer
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-neutral-500 mt-2.5 leading-relaxed">
                Higher targets enforce rigorous grading criteria, requiring references to internals & concurrency models.
              </p>
            </div>

            {/* Rounds count */}
            <div className="glass-panel p-5 rounded-2xl" id="rounds-counter-section">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-neutral-400" />
                3. Interview Rounds
              </h3>
              <div className="grid grid-cols-2 gap-2" id="rounds-grid">
                {[3, 5].map((count) => (
                  <button
                    key={count}
                    id={`round-btn-${count}`}
                    onClick={() => setRoundsCount(count)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      roundsCount === count
                        ? "bg-teal-500/10 border-teal-500/50 text-teal-300"
                        : "bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-900 text-neutral-400"
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-neutral-500 mt-2.5 leading-relaxed">
                A shorter drill (3 questions) takes roughly ~5 mins, while complete rounds (5 questions) provide full diagnostics.
              </p>
            </div>

            {/* WebSocket Collaboration / Peer Room Container */}
            <div className="glass-panel p-5 rounded-2xl border border-neutral-900 bg-neutral-950/40" id="ws-co-interview-container">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5 font-mono">
                <Users className="w-4 h-4 text-teal-400" />
                Live Co-Interview & Spectating Hub [WebSockets]
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-neutral-900/40 border border-neutral-800/80 p-3.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-neutral-200">Spectate Another Candidate</h4>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                      Enter an invitation code to enter Spectator Mode, see typewriter strokes, and push co-hints or reactions.
                    </p>
                  </div>
                  
                  <div className="mt-3 flex gap-1.5">
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase().trim())}
                      placeholder="CO-INTERVIEW-CODE"
                      className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-teal-500/40 rounded-lg text-[10px] px-2.5 py-1.5 outline-none text-neutral-100 font-mono"
                    />
                    <button
                      onClick={() => {
                        if (joinCodeInput.trim() && onJoinRoom) {
                          onJoinRoom(joinCodeInput.trim());
                        }
                      }}
                      disabled={!joinCodeInput.trim()}
                      className="bg-teal-500 hover:bg-teal-400 text-neutral-950 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Join
                    </button>
                  </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 p-3.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-neutral-200">Host with Live Peer Sync</h4>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                      Generate an instant websocket-synced co-assessment. Your colleagues can join and review your code exercises live.
                    </p>
                  </div>

                  <div className="mt-3">
                    <label className="flex items-center gap-2 cursor-pointer text-[10px] text-neutral-300 font-mono select-none">
                      <input
                        type="checkbox"
                        checked={hostWSSync}
                        onChange={(e) => setHostWSSync(e.target.checked)}
                        className="rounded border-neutral-800 text-teal-500 bg-neutral-950 focus:ring-0 accent-teal-500 cursor-pointer"
                      />
                      Enable WebSocket Peer Sync
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* YouTube Creator Hub & Official Channel Connection */}
            <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-neutral-950/40" id="youtube-integration-hub">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5 font-mono">
                <Youtube className="w-4 h-4 text-rose-500" />
                @OnlineYou-z3i1n YouTube Integration Hub
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-neutral-900/40 border border-neutral-800/80 p-3.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-rose-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" /> Live Connected Channel
                    </h4>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                      This AI Arena agent is officially configured with your YouTube Channel <strong className="text-neutral-200">@OnlineYou-z3i1n</strong>. Recording overlay compatibility and automated metadata generation are active.
                    </p>
                  </div>
                  
                  <div className="mt-3">
                    <a
                      href="https://youtube.com/@OnlineYou-z3i1n"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider transition-all shadow-lg hover:shadow-rose-600/10"
                      id="youtube-channel-link"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      Visit Channel
                    </a>
                  </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 p-3.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-neutral-200">YouTube Creator Live Kit</h4>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                      Enables fully automated metadata generation. We automatically construct structured video titles, chapter markers, video lists, and description copy based on active scoring metrics.
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-mono font-bold">
                      Metadata Active
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Stream layout sync</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Colab Integration Hub */}
            <div className="glass-panel p-5 rounded-2xl border border-orange-500/30 bg-neutral-950/40" id="colab-integration-hub">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5 font-mono">
                <span className="w-2.5 h-2.5 bg-orange-500 rounded-full inline-block animate-pulse mr-0.5" />
                Google Colab Academic Sandbox
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-neutral-900/40 border border-neutral-800/80 p-3.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-orange-400 flex items-center gap-1">
                      Python & Data Science Companion
                    </h4>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                      Instantly connect this session with a live, server-hosted Jupyter Notebook. Perfect for running dynamic Python scripts, plotting Seaborn charts, or compiling Pandas dataframes.
                    </p>
                  </div>
                  
                  <div className="mt-3">
                    <a
                      href="https://colab.research.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider transition-all shadow-lg hover:shadow-orange-600/15"
                      id="colab-external-link"
                    >
                      Launch Colab Workspace
                    </a>
                  </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800/80 p-3.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-neutral-200">Session Jupyter Template (.ipynb)</h4>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                      Once you complete your Data Analysis rounds, the system will auto-generate an interactive, runnable notebook file containing your exact interview questions and customized Python practice setups.
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-mono font-bold">
                      Colab Active
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Notebook Auto-Sync</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Interviewer Selection */}
        <div className="space-y-4" id="setup-interviewer-panel">
          <div className="glass-panel p-5 rounded-2xl flex flex-col h-full justify-between" id="interviewer-selection-card">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-neutral-400" />
                4. Select Interviewer
              </h3>

              {/* Selector List */}
              <div className="flex gap-2.5 mb-5" id="interviewer-avatar-tabs">
                {INTERVIEWERS.map((interviewer) => (
                  <button
                    key={interviewer.id}
                    id={`avatar-btn-${interviewer.id}`}
                    onClick={() => setSelectedInterviewer(interviewer.id)}
                    className={`flex-1 p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      selectedInterviewer === interviewer.id
                        ? "bg-teal-500/10 border-teal-500/50"
                        : "bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-900"
                    }`}
                  >
                    <span className="text-2.5xl leading-none">{interviewer.avatar}</span>
                    <span className="text-[10px] font-bold text-neutral-300 mt-1 truncate max-w-full">
                      {interviewer.name.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Interviewer details */}
              {activeInterviewerObj && (
                <div className="bg-neutral-900/50 border border-neutral-800/60 p-4 rounded-xl space-y-3 animate-fade-in" id="interviewer-details-info">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeInterviewerObj.avatar}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{activeInterviewerObj.name}</h4>
                      <p className="text-[10px] text-teal-400 font-medium">{activeInterviewerObj.title}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-neutral-400 leading-relaxed border-t border-neutral-800/80 pt-2">
                    <p><strong className="text-neutral-300">Persona:</strong> {activeInterviewerObj.persona}</p>
                    <p><strong className="text-neutral-300">Focus:</strong> {activeInterviewerObj.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Terms and Conditions Consent Box */}
            <div className="mt-4 pt-4 border-t border-neutral-800/60" id="terms-consent-wrapper">
              <label 
                className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  showTermsError && !agreedToTerms 
                    ? "bg-red-500/10 border-red-500/40" 
                    : "bg-neutral-900/30 border-neutral-800/40 hover:bg-neutral-900/50"
                }`}
                id="terms-label-input"
              >
                <input
                  type="checkbox"
                  id="agree-to-terms-checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    if (e.target.checked) setShowTermsError(false);
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-neutral-800 text-teal-500 bg-neutral-950 focus:ring-0 focus:ring-offset-0 accent-teal-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-xs text-neutral-300 leading-tight">
                    I agree to the{" "}
                    <button 
                      type="button" 
                      onClick={() => {
                        setModalActiveTab('terms');
                        setShowTermsModal(true);
                      }} 
                      className="text-teal-400 hover:underline font-bold font-mono"
                    >
                      Platform Guidelines
                    </button>{" "}
                    &{" "}
                    <button 
                      type="button" 
                      onClick={() => {
                        setModalActiveTab('privacy');
                        setShowTermsModal(true);
                      }} 
                      className="text-teal-400 hover:underline font-bold font-mono"
                    >
                      Privacy Policy
                    </button>
                  </span>
                  {showTermsError && !agreedToTerms && (
                    <span className="block text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1 animate-pulse">
                      <ShieldAlert className="w-3 h-3" />
                      Consent required to initiate evaluation.
                    </span>
                  )}
                </div>
              </label>
            </div>

            {/* Launch Action */}
            <div className="pt-4 border-t border-neutral-800/80 mt-3">
              <button
                id="launch-interview-btn"
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-neutral-950 font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-teal-500/10 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                Launch Live Session
              </button>
              <div className="text-[10px] text-neutral-500 text-center mt-2 flex items-center justify-center gap-1">
                <span>Mic permission required for speech transcription.</span>
              </div>
            </div>

            {/* Terms and Privacy Policy Interactive Overlap Modal */}
            {showTermsModal && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in"
                onClick={() => setShowTermsModal(false)}
                id="terms-modal-overlay"
              >
                <div 
                  className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-slide-up"
                  onClick={(e) => e.stopPropagation()}
                  id="terms-modal-container"
                >
                  {/* Modal Header */}
                  <div className="border-b border-neutral-900 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {modalActiveTab === 'terms' ? (
                        <FileText className="w-4 h-4 text-teal-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-emerald-400" />
                      )}
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        {modalActiveTab === 'terms' ? "Platform Guidelines & AI Terms" : "Data Privacy Policy"}
                      </h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowTermsModal(false)}
                      className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-900/50 rounded-lg transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal Tabs switcher */}
                  <div className="flex border-b border-neutral-900 px-4 bg-neutral-950/20">
                    <button
                      type="button"
                      onClick={() => setModalActiveTab('terms')}
                      className={`flex-1 py-2.5 text-[11px] font-mono uppercase tracking-wider border-b-2 font-bold transition-all transition-colors ${
                        modalActiveTab === 'terms' 
                          ? "border-teal-500 text-teal-400" 
                          : "border-transparent text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      Guidelines & Terms
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalActiveTab('privacy')}
                      className={`flex-1 py-2.5 text-[11px] font-mono uppercase tracking-wider border-b-2 font-bold transition-all transition-colors ${
                        modalActiveTab === 'privacy' 
                          ? "border-emerald-500 text-emerald-400" 
                          : "border-transparent text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      Privacy Policy
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-5 overflow-y-auto space-y-4 text-xs text-neutral-400 leading-relaxed custom-scrollbar-thin flex-1">
                    {modalActiveTab === 'terms' ? (
                      <>
                        <div className="bg-teal-950/10 border border-teal-900/30 p-3 rounded-lg text-teal-300">
                          Please review the rules, safety guidelines, and audio processing agreements below before launching the live Android coding sandbox simulations.
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-bold text-neutral-200">1. AI-Generated Appraisals & Scorecards</h4>
                          <p>
                            All metrics, performance evaluations, comprehensive scoring points, sample answers, and general coaching critiques are delivered dynamically via Generative Intelligence Models. Results are for mock training and instructional purposes; they are subjective and do not guarantee official business recruitment decisions inside Google or other systems.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-bold text-neutral-200">2. Active Microphone & Audio Processing</h4>
                          <p>
                            The platform processes your vocal audio feed exclusively to execute real-time speech transcription. Evaluator interfaces do not persist raw recording blocks or voice telemetry files permanently onto host database instances; voice parsing is done in memory.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-bold text-neutral-200">3. Android Technical Scope Certification</h4>
                          <p>
                            The curriculum adheres strictly to official Android SDK specifications, Jetpack architectures, declarative layout frameworks, state-management constructs, Kotlin Flow protocols, and performance metrics. Candidates are graded relative to standard best-practice criteria.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-bold text-neutral-200">4. Responsible and Ethical Utilization</h4>
                          <p>
                            Users agree not to input malicious scripts, inject prompts designed to break LLM instructions, or abuse local microphone stream buffers. Evaluations and data outputs reset automatically on reloading.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-emerald-950/10 border border-emerald-900/30 p-3 rounded-lg text-emerald-300">
                          Your physical and digital privacy are paramount. We restrict diagnostic telemetry and never sell personal metadata to monetization brokers.
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-bold text-neutral-200">1. Ephemeral In-Memory Audio Capture</h4>
                          <p>
                            Local audio waveform and vocal captures streamed through your device microphone are converted to string tokens via stateful system Web Speech APIs directly inside the browser sandbox. The raw WAV/MP3 acoustic tracks are discarded immediately after transcription and never saved on permanent disk storage.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-bold text-neutral-200">2. Secure Server-Side LLM Proxying</h4>
                          <p>
                            To prevent browser exposure of development keys, prompt engineering structures and transcription tokens are dispatched through encrypted server API routers. They are shared with AI model endpoints solely to compute interactive questions and scoring metrics, protected by Google Cloud infrastructure.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-bold text-neutral-200">3. Transient Session Lifecycle</h4>
                          <p>
                            Your evaluation scores, dialogue logs, answer logs, and response transcripts reside in memory state. Resetting or clear-restarting the simulator erases your localized progress instantly.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-bold text-neutral-200">4. Third-Party Integrations</h4>
                          <p>
                            We do not load third-party ad networks, social tracking cookies, or commercial user-mapping trackers. Data interaction is fully focused on delivering the responsive simulation dashboard.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="border-t border-neutral-900 p-4 flex gap-3 justify-end bg-neutral-950">
                    <button
                      type="button"
                      onClick={() => {
                        setAgreedToTerms(true);
                        setShowTermsError(false);
                        setShowTermsModal(false);
                      }}
                      className="bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                      id="accept-terms-modal-btn"
                    >
                      I Accept Terms & Policy
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(false)}
                      className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Close Description
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
