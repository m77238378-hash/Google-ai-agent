/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { INTERVIEWERS, INTERVIEW_TOPICS } from "../data";
import { Difficulty, Interviewer, InterviewTopic } from "../types";
import { Layout, GitBranch, Zap, Cpu, Activity, Trophy, HelpCircle, Sparkles } from "lucide-react";

interface SetupScreenProps {
  onStart: (config: {
    topic: string;
    difficulty: Difficulty;
    interviewerId: string;
    roundsCount: number;
  }) => void;
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>(INTERVIEW_TOPICS[0].id);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("Senior");
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>(INTERVIEWERS[0].id);
  const [roundsCount, setRoundsCount] = useState<number>(3);

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
      default: return <HelpCircle {...props} />;
    }
  };

  const difficulties: Difficulty[] = ["Junior", "Mid-Level", "Senior"];

  const handleStart = () => {
    onStart({
      topic: INTERVIEW_TOPICS.find(t => t.id === selectedTopic)?.title || "Android Development",
      difficulty: selectedDifficulty,
      interviewerId: selectedInterviewer,
      roundsCount
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4" id="setup-screen-container">
      {/* Header Info */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20 mb-3" id="badge-top-setup">
          <Sparkles className="w-3.5 h-3.5" />
          Real-Time Speech Interview Coach
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 font-sans" id="setup-title">
          Android AI Interview Arena
        </h1>
        <p className="text-neutral-400 max-w-xl mx-auto text-sm" id="setup-subtitle">
          Test your memory bounds, Jetpack coding expertise, and architectural limits with instant speech processing and AI diagnostics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="setup-grid-main">
        {/* Left Column: Topics and Configs */}
        <div className="md:col-span-2 space-y-6" id="setup-control-panel">
          {/* Topic Section */}
          <div className="glass-panel p-5 rounded-2xl" id="topic-selector-section">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-neutral-400" />
              1. Choose Android Domain Focus
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

            {/* Launch Action */}
            <div className="pt-6 border-t border-neutral-800/80 mt-5">
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
          </div>
        </div>
      </div>
    </div>
  );
}
