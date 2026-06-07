/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Interviewer } from "../types";
import { Video, Sparkles, MessageSquareCode } from "lucide-react";

interface InterviewerWelcomeProps {
  interviewer: Interviewer;
  topic: string;
  difficulty: string;
  roundsCount: number;
  onContinue: () => void;
}

export default function InterviewerWelcome({
  interviewer,
  topic,
  difficulty,
  roundsCount,
  onContinue,
}: InterviewerWelcomeProps) {
  return (
    <div className="max-w-xl mx-auto py-10 px-4 flex flex-col items-center justify-center min-h-[500px]" id="interviewer-welcome-container">
      <motion.div
        className="glass-panel w-full p-6 text-center rounded-3xl relative overflow-hidden"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-40 bg-teal-500/10 blur-[80px] rounded-full -z-10" />

        {/* Video simulation badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-full text-[11px] font-semibold tracking-wide uppercase">
            <Video className="w-3.5 h-3.5 animate-pulse text-teal-400" />
            Interview Room Ready
          </div>
        </div>

        {/* Big Avatar Bubble */}
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full border-2 border-neutral-800 flex items-center justify-center bg-neutral-900 shadow-xl text-5xl leading-none">
            {interviewer.avatar}
          </div>
          {/* Active status pulse */}
          <div className="absolute bottom-1 right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border-4 border-neutral-950 animate-pulse" />
        </div>

        {/* Interviewer identity */}
        <h2 className="text-xl font-bold text-white mb-0.5">{interviewer.name}</h2>
        <p className="text-xs text-teal-400 font-semibold mb-4">{interviewer.title}</p>

        {/* Greeting quote bubble */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-2xl mb-6 relative text-left">
          <div className="absolute -top-2.5 left-6 text-xs text-neutral-500 bg-neutral-950 px-2 font-mono flex items-center gap-1">
            <MessageSquareCode className="w-3.5 h-3.5" />
            LIVE MESSAGE
          </div>
          <p className="text-neutral-300 text-sm leading-relaxed italic">
            "{interviewer.welcomeMessage}"
          </p>
        </div>

        {/* Configuration Summary pills */}
        <div className="grid grid-cols-3 gap-2.5 mb-8 text-left text-[11px]" id="welcome-summary-pills">
          <div className="bg-neutral-900/40 border border-neutral-800/50 p-2.5 rounded-xl">
            <div className="text-neutral-500 font-medium mb-0.5">Topic</div>
            <div className="text-neutral-300 font-bold truncate">{topic}</div>
          </div>
          <div className="bg-neutral-900/40 border border-neutral-800/50 p-2.5 rounded-xl">
            <div className="text-neutral-500 font-medium mb-0.5">Target Level</div>
            <div className="text-neutral-300 font-bold">{difficulty}</div>
          </div>
          <div className="bg-neutral-900/40 border border-neutral-800/50 p-2.5 rounded-xl">
            <div className="text-neutral-500 font-medium mb-0.5 font-sans">Rounds</div>
            <div className="text-neutral-300 font-bold">{roundsCount} Questions</div>
          </div>
        </div>

        {/* Action */}
        <button
          id="enter-studio-btn"
          onClick={onContinue}
          className="w-full bg-slate-100 hover:bg-white text-neutral-950 border border-slate-350 hover:border-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-teal-600" />
          Enter Interview Room
        </button>
      </motion.div>
    </div>
  );
}
