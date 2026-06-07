/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { InterviewSession, Difficulty, RoundHistoryItem } from "./types";
import { INTERVIEWERS } from "./data";
import SetupScreen from "./components/SetupScreen";
import InterviewerWelcome from "./components/InterviewerWelcome";
import InterviewConsole from "./components/InterviewConsole";
import Dashboard from "./components/Dashboard";
import { Cpu, Terminal, ShieldCheck, Sparkles, MessageSquareCode } from "lucide-react";

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

  const activeInterviewer = INTERVIEWERS.find(it => it.id === session.interviewerId) || INTERVIEWERS[0];

  // Callback: Launch parameter configurations
  const handleLaunchSession = (config: {
    topic: string;
    difficulty: Difficulty;
    interviewerId: string;
    roundsCount: number;
  }) => {
    setSession({
      id: Math.random().toString(36).substring(7),
      difficulty: config.difficulty,
      topic: config.topic,
      interviewerId: config.interviewerId,
      roundsCount: config.roundsCount,
      status: "INTERVIEWING", // Go straight into active interview sequence
      currentRoundIndex: 1,
      history: []
    });
  };

  // Callback: Evaluation completed for all rounds
  const handleCompleteSession = (finalHistory: RoundHistoryItem[]) => {
    setSession(prev => ({
      ...prev,
      history: finalHistory,
      status: "COMPLETED"
    }));
  };

  // Callback: Reset assessment back to custom configs
  const handleRestart = () => {
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
      <header className="border-b border-neutral-905/60 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-4" id="hud-navigation-bar">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo animation circle */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 p-[1.5px] flex items-center justify-center shadow-lg shadow-teal-500/10">
              <div className="w-full h-full rounded-[10px] bg-neutral-950 flex items-center justify-center font-mono font-black text-teal-400 text-sm">
                AI
              </div>
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

          {/* Active indicator nodes */}
          <div className="flex items-center gap-3 text-xs select-none">
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
            {session.status === "SETUP" && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 hidden sm:inline">
                STATUS: IDLE_STANDBY
              </span>
            )}
          </div>
        </div>
      </header>

      {/* CORE FRAMEWORK STAGES CONTAINER */}
      <main className="flex-1 w-full flex items-center justify-center py-6">
        <div className="w-full max-w-7xl mx-auto px-4">
          
          {session.status === "SETUP" && (
            <SetupScreen onStart={handleLaunchSession} />
          )}

          {session.status === "INTERVIEWING" && (
            <InterviewConsole
              difficulty={session.difficulty}
              topic={session.topic}
              interviewer={activeInterviewer}
              roundsCount={session.roundsCount}
              onSessionComplete={handleCompleteSession}
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
