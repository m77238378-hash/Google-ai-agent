/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { RoundHistoryItem } from "../types";
import { 
  Trophy, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Award, 
  Share2, 
  ExternalLink,
  Code2,
  Sparkles
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DashboardProps {
  history: RoundHistoryItem[];
  difficulty: string;
  topic: string;
  onRestart: () => void;
}

const getCategoryBadgeStyles = (category: string) => {
  switch (category) {
    case "Behavioral":
      return { 
        bg: "bg-blue-500/10 text-blue-300 border-blue-500/20", 
        accentClass: "bg-blue-500",
        label: "Behavioral",
        desc: "Evaluates teamwork dynamics, personal conflict resolution, scope pressure, and cross-functional design discussions."
      };
    case "Technical":
      return { 
        bg: "bg-purple-500/10 text-purple-300 border-purple-500/20", 
        accentClass: "bg-purple-500",
        label: "Technical",
        desc: "Assesses thread-safety logic, memory footprint optimizations, stable compiler parameters, and API layout mechanics."
      };
    case "Situational":
      return { 
        bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", 
        accentClass: "bg-emerald-500",
        label: "Situational",
        desc: "Tests step-by-step diagnostic triage under hypotheticals, real-world regression crises, and live systems debugging."
      };
    case "Role-Specific":
      return { 
        bg: "bg-amber-500/10 text-amber-300 border-amber-500/20", 
        accentClass: "bg-amber-500",
        label: "Role-Specific",
        desc: "Gauges platform-native Android OS contracts, WorkManager job restrictions, active Jetpack state scopes, and UI touch specs."
      };
    default:
      return { 
        bg: "bg-teal-500/10 text-teal-300 border-teal-500/20", 
        accentClass: "bg-teal-500",
        label: "General Focus",
        desc: "Standard Android systems analysis focus areas."
      };
  }
};

export default function Dashboard({ history, difficulty, topic, onRestart }: DashboardProps) {
  const [expandedRound, setExpandedRound] = useState<number | null>(0);

  // Compute stats
  const gradedRounds = history.filter(item => item.evaluation);
  const totalRounds = history.length;
  const averageScore = Math.round(
    gradedRounds.reduce((acc, curr) => acc + (curr.evaluation?.score || 0), 0) / (gradedRounds.length || 1)
  );

  // Compute average categories (Clarity, Relevance, Completeness, Confidence)
  const avgClarity = Math.round(
    gradedRounds.reduce((acc, curr) => {
      const criteriaScore = curr.evaluation?.scorecard?.clarity?.score !== undefined 
        ? curr.evaluation.scorecard.clarity.score 
        : Math.round((curr.evaluation?.score || 0) * 0.96);
      return acc + criteriaScore;
    }, 0) / (gradedRounds.length || 1)
  );

  const avgRelevance = Math.round(
    gradedRounds.reduce((acc, curr) => {
      const criteriaScore = curr.evaluation?.scorecard?.relevance?.score !== undefined 
        ? curr.evaluation.scorecard.relevance.score 
        : (curr.evaluation?.score || 0);
      return acc + criteriaScore;
    }, 0) / (gradedRounds.length || 1)
  );

  const avgCompleteness = Math.round(
    gradedRounds.reduce((acc, curr) => {
      const criteriaScore = curr.evaluation?.scorecard?.completeness?.score !== undefined 
        ? curr.evaluation.scorecard.completeness.score 
        : Math.round((curr.evaluation?.score || 0) * 0.92);
      return acc + criteriaScore;
    }, 0) / (gradedRounds.length || 1)
  );

  const avgConfidence = Math.round(
    gradedRounds.reduce((acc, curr) => {
      const criteriaScore = curr.evaluation?.scorecard?.confidence?.score !== undefined 
        ? curr.evaluation.scorecard.confidence.score 
        : Math.min(100, Math.round((curr.evaluation?.score || 0) * 1.02));
      return acc + criteriaScore;
    }, 0) / (gradedRounds.length || 1)
  );

  // Determine overall rank
  const getSeniorityRank = (score: number) => {
    if (score >= 90) return { title: "Lead Architect Candidate (L5/L6)", tier: "Distinguished", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25" };
    if (score >= 75) return { title: "Senior Android Specialist (L4/L5)", tier: "Proficient", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/25" };
    if (score >= 60) return { title: "Mid-Level Professional (L3)", tier: "Moderate", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/25" };
    return { title: "Developing Specialist (L2)", tier: "Requires Revision", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/25" };
  };

  const rank = getSeniorityRank(averageScore);

  // Collect all missed concepts for custom curriculum recommendations
  const allMissedConcepts = Array.from(
    new Set(gradedRounds.flatMap(r => r.evaluation?.missedConcepts || []))
  ).slice(0, 6);

  const allStrengths = Array.from(
    new Set(gradedRounds.flatMap(r => r.evaluation?.strengths || []))
  ).slice(0, 6);

  const toggleRound = (index: number) => {
    setExpandedRound(expandedRound === index ? null : index);
  };

  // Circular gauge calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (averageScore / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 font-sans" id="assessment-dashboard-root">
      
      {/* Return Action */}
      <div className="flex justify-between items-center mb-6">
        <button
          id="exit-dashboard-btn"
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 text-xs font-semibold cursor-pointer py-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Test New Topic
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          Export Report
        </button>
      </div>

      {/* TOP SUMMARY BANNER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8" id="dashboard-hero-summary">
        
        {/* Score Radial Ring Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center relative" id="metric-gage-card">
          <div className="absolute top-3 left-3 text-[10px] uppercase font-mono tracking-wider text-neutral-500">
            CUMULATIVE METRIC
          </div>
          
          <div className="relative w-32 h-32 flex items-center justify-center mt-3">
            <svg className="w-full h-full transform -rotate-90">
              {/* Underlay tracking circle */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-neutral-800"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Rated score circle overlay */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-teal-500 glow-teal transition-all duration-1000"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-white font-mono leading-none">{averageScore}</span>
              <span className="text-[10px] uppercase text-neutral-500 font-mono tracking-wider mt-1">out of 100</span>
            </div>
          </div>
          
          <h3 className="text-neutral-300 font-bold text-sm mt-4">Average Technical Accuracy</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-[200px]">
            Based on {gradedRounds.length} detailed evaluations.
          </p>
        </div>

        {/* Cumulative Scorecard Metrics Card */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border border-neutral-900 bg-neutral-950/20" id="summary-scorecard-breakdown">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              Criteria Averages
            </div>
            <div className="space-y-2">
              {[
                { label: "Clarity & Structure", value: avgClarity, color: "bg-blue-500", text: "text-blue-400" },
                { label: "Technical Relevance", value: avgRelevance, color: "bg-teal-500", text: "text-teal-400" },
                { label: "Domain Completeness", value: avgCompleteness, color: "bg-amber-500", text: "text-amber-400" },
                { label: "Spoken Confidence", value: avgConfidence, color: "bg-purple-500", text: "text-purple-400" }
              ].map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-neutral-400">{item.label}</span>
                    <span className={`font-mono font-extrabold ${item.text}`}>{item.value}%</span>
                  </div>
                  <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[9px] text-neutral-500 mt-2 font-mono leading-none">
            AGGREGATED MULTI-ROUND FEEDBACK
          </div>
        </div>

        {/* Seniority Ranking Classification Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between" id="metric-class-card">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-3 flex items-center gap-1 flex-wrap">
              <Award className="w-3.5 h-3.5 text-neutral-400" />
              Seniority Placement
            </div>
            
            <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-semibold ${rank.bg} ${rank.color} mb-2.5`}>
              Tier: {rank.tier}
            </div>
            <h1 className="text-base font-black text-white leading-tight font-sans">
              {rank.title}
            </h1>
            <p className="text-[11px] text-neutral-400 leading-relaxed mt-2.5">
              Assessed strictly to the <span className="text-neutral-200 font-bold">{difficulty} Android Specialist</span> framework in the domain of <em className="not-italic text-neutral-200 border-b border-dashed border-neutral-700">{topic}</em>.
            </p>
          </div>
          
          <div className="border-t border-neutral-800/80 pt-3 text-[10px] text-neutral-500 flex justify-between items-center">
            <span>Interviewer: Core Leads</span>
            <span>Accredited AI</span>
          </div>
        </div>

        {/* Key Strengths & Missed Terms Summary */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between" id="metric-summary-keywords">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-3">Topic Coverage Insight</div>
            
            <div className="space-y-3">
              {/* Highlight Strengths */}
              {allStrengths.length > 0 && (
                <div>
                  <div className="text-[10px] text-teal-400 font-bold uppercase tracking-wider mb-1">Strong Core Concepts</div>
                  <div className="flex flex-wrap gap-1">
                    {allStrengths.slice(0, 3).map((v, i) => (
                      <span key={i} className="text-[10px] bg-teal-950/40 text-teal-300 border border-teal-500/10 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlight Gaps */}
              {allMissedConcepts.length > 0 && (
                <div>
                  <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-1">Suggested Review Gaps</div>
                  <div className="flex flex-wrap gap-1">
                    {allMissedConcepts.slice(0, 3).map((v, i) => (
                      <span key={i} className="text-[10px] bg-amber-950/20 text-amber-300 border border-amber-500/10 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-neutral-500 mt-4 border-t border-neutral-800/80 pt-3 leading-relaxed">
            Practice articulating the missed terms during live speech loops to boost score metric thresholds.
          </div>
        </div>

      </div>

      {/* CATEGORY SCORES BREAKDOWN ROW */}
      <div className="glass-panel p-5 rounded-2xl mb-8 border border-neutral-900 bg-neutral-950/40" id="category-metrics-section">
        <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-1.5 uppercase tracking-wide font-mono">
          <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
          Cross-Category Behavioral & Technical Performance
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {(['Behavioral', 'Technical', 'Situational', 'Role-Specific'] as const).map((cat) => {
            const roundsOfCat = gradedRounds.filter(r => r.category === cat);
            const scoreSum = roundsOfCat.reduce((acc, curr) => acc + (curr.evaluation?.score || 0), 0);
            const average = roundsOfCat.length > 0 ? Math.round(scoreSum / roundsOfCat.length) : null;
            
            // Get category styling
            const styles = getCategoryBadgeStyles(cat);
            
            return (
              <div 
                key={cat} 
                className="border border-neutral-900/60 bg-neutral-950/60 rounded-xl p-3.5 flex flex-col justify-between space-y-3 relative overflow-hidden"
              >
                {/* Visual Accent Corner Ribbon */}
                <span className={`absolute top-0 right-0 w-20 h-1 ${styles.accentClass}`} />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-mono tracking-wider font-semibold border px-1.5 py-0.5 rounded ${styles.bg}`}>
                      {styles.label}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono tracking-wider">
                      {roundsOfCat.length} {roundsOfCat.length === 1 ? 'question' : 'questions'}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-neutral-400 leading-normal pt-1.5">
                    {styles.desc}
                  </p>
                </div>

                <div className="border-t border-neutral-900 pt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 font-mono">Average Score:</span>
                  {average !== null ? (
                    <span className={`text-sm font-extrabold font-mono ${
                      average >= 85 ? "text-emerald-400" : average >= 70 ? "text-teal-400" : "text-amber-400"
                    }`}>
                      {average}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500 italic">Not tested</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAILED QUESTION BREAKDOWN SECTION */}
      <div className="space-y-6" id="dashboard-details-body">
        
        {/* SECTION TITLE */}
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-teal-400" />
            Interview Transcripts & Diagnostics
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Audit itemized transcript reviews, spoken errors, and exemplary code blocks for all completed rounds.
          </p>
        </div>

        {/* Round Accordion List */}
        <div className="space-y-4" id="rounds-accordion-list">
          {history.map((item, index) => {
            const hasGraded = !!item.evaluation;
            const score = item.evaluation?.score || 0;
            const isExpanded = expandedRound === index;

            return (
              <div 
                key={index}
                id={`transcript-round-${index}`}
                className={`glass-panel rounded-2xl overflow-hidden border transition-all ${
                  isExpanded ? "border-neutral-800 bg-neutral-950" : "border-neutral-900/60 bg-neutral-900/30 hover:bg-neutral-900/50"
                }`}
              >
                {/* Accordion header button */}
                <button
                  onClick={() => toggleRound(index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-300 font-mono text-xs flex items-center justify-center font-bold">
                      R{item.roundNumber}
                    </div>
                    
                    <div className="flex-1 min-w-0 font-sans">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-neutral-500">
                          {item.topic}
                        </span>
                        {item.category && (
                          <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${getCategoryBadgeStyles(item.category).bg}`}>
                            {getCategoryBadgeStyles(item.category).label}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-neutral-200 mt-0.5 truncate leading-snug">
                        {item.question}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-5 select-none">
                    {/* Score Tag */}
                    {hasGraded ? (
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-extrabold font-mono ${
                          score >= 85 ? "text-emerald-400" : score >= 70 ? "text-teal-400" : "text-amber-400"
                        }`}>
                          {score}/100
                        </span>
                        <span className="text-[9px] uppercase font-mono text-neutral-500 tracking-wider">
                          Score
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-amber-500 font-mono font-medium">Pending speech</span>
                    )}

                    {/* Caret icon */}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                  </div>
                </button>

                {/* Accordion content block */}
                {isExpanded && (
                  <div className="px-5 pb-6 border-t border-neutral-900 pt-5 space-y-5 text-sm leading-relaxed" id={`details-container-${index}`}>
                    
                    {/* Detailed prompt text */}
                    <div className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/40">
                      <div className="text-[10px] uppercase font-mono text-neutral-400 font-bold mb-1 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5" />
                        Prompt Question:
                      </div>
                      <p className="text-xs text-white leading-relaxed font-medium">
                        "{item.question}"
                      </p>
                    </div>

                    {/* Candidate transcript */}
                    <div className="border-l-2 border-neutral-800 pl-4 py-1">
                      <div className="text-[10px] uppercase font-mono text-neutral-400 font-bold mb-1">
                        Candidate Answer (Transcribed Spoken Text):
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed italic">
                        "{item.candidateAnswer || "(No answer registered or empty dialogue string)"}"
                      </p>
                    </div>

                    {/* Evaluation Diagnostics Panel */}
                    {hasGraded && item.evaluation && (
                      <div className="space-y-4" id={`eval-panel-${index}`}>
                        
                        {/* Granular Feedback Scorecard Visualizer */}
                        <div className="bg-neutral-900/10 border border-neutral-900 rounded-xl p-4 space-y-3" id={`round-scorecard-card-${index}`}>
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider font-mono">
                            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                            Granular Feedback Scorecard
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-neutral-950/40 p-4 rounded-xl border border-neutral-900/60">
                            {[
                              { 
                                label: "Clarity & Structure", 
                                value: item.evaluation.scorecard?.clarity?.score !== undefined ? item.evaluation.scorecard.clarity.score : Math.round(item.evaluation.score * 0.96), 
                                notes: item.evaluation.scorecard?.clarity?.notes || "Coherent logical structure and spoken flow.",
                                color: "bg-blue-500", 
                                text: "text-blue-400" 
                              },
                              { 
                                label: "Technical Relevance", 
                                value: item.evaluation.scorecard?.relevance?.score !== undefined ? item.evaluation.scorecard.relevance.score : item.evaluation.score, 
                                notes: item.evaluation.scorecard?.relevance?.notes || "Direct focus resolving main tech requirements.",
                                color: "bg-teal-500", 
                                text: "text-teal-400" 
                              },
                              { 
                                label: "Domain Completeness", 
                                value: item.evaluation.scorecard?.completeness?.score !== undefined ? item.evaluation.scorecard.completeness.score : Math.round(item.evaluation.score * 0.92), 
                                notes: item.evaluation.scorecard?.completeness?.notes || "Referenced critical lifecycle loops and states.",
                                color: "bg-amber-500", 
                                text: "text-amber-400" 
                              },
                              { 
                                label: "Confidence", 
                                value: item.evaluation.scorecard?.confidence?.score !== undefined ? item.evaluation.scorecard.confidence.score : Math.min(100, Math.round(item.evaluation.score * 1.02)), 
                                notes: item.evaluation.scorecard?.confidence?.notes || "Authoritative Claims and good terminology.",
                                color: "bg-purple-500", 
                                text: "text-purple-400" 
                              }
                            ].map((crit, cIdx) => (
                              <div key={cIdx} className="space-y-1.5" id={`accordian-crit-${index}-${cIdx}`}>
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-semibold text-neutral-300">{crit.label}</span>
                                  <span className={`font-mono font-extrabold ${crit.text}`}>{crit.value}/100</span>
                                </div>
                                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${crit.color}`} style={{ width: `${crit.value}%` }} />
                                </div>
                                <p className="text-[10px] text-neutral-400 leading-normal">
                                  {crit.notes}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Two Columns for Strengths / Model Answer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                          
                          {/* Analytical Columns */}
                          <div className="space-y-4">
                            
                            {/* Rating and Strengths */}
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-teal-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                                Technical Accomplishments
                              </span>
                              <ul className="space-y-1.5 pl-1">
                                {item.evaluation.strengths.map((str, idx) => (
                                  <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2">
                                    <span className="text-teal-400 font-extrabold mt-0.5">•</span>
                                    <span>{str}</span>
                                  </li>
                                ))}
                                {item.evaluation.strengths.length === 0 && (
                                  <div className="text-xs text-neutral-500 italic">No clear technical strong concepts identified in transcript.</div>
                                )}
                              </ul>
                            </div>

                            {/* Missed constructs */}
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-500 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-amber-500" />
                                Omitted constructs & APIs
                              </span>
                              <ul className="space-y-1.5 pl-1 font-sans">
                                {item.evaluation.missedConcepts.map((mis, idx) => (
                                  <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2">
                                    <span className="text-amber-500 font-extrabold mt-0.5">•</span>
                                    <span>{mis}</span>
                                  </li>
                                ))}
                                {item.evaluation.missedConcepts.length === 0 && (
                                  <div className="text-xs text-emerald-400 italic">Excellent coverage of standard target concepts!</div>
                                )}
                              </ul>
                            </div>

                            {/* Detailed feedback text */}
                            <div className="space-y-1 bg-neutral-900/20 border border-neutral-900/60 p-3.5 rounded-xl">
                              <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">
                                Assessor Narrative Pitch
                              </span>
                              <p className="text-xs text-neutral-300 leading-relaxed mt-1 whitespace-pre-wrap">
                                {item.evaluation.detailedFeedback}
                              </p>
                            </div>

                          </div>

                          {/* Exemplary Code Model Answer column */}
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-teal-400 flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5" />
                              Exemplary Standard Model Answer
                            </span>
                            <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-xl max-h-[350px] overflow-y-auto custom-scrollbar-thin text-xs text-neutral-300">
                              <div className="markdown-body">
                                <ReactMarkdown>{item.evaluation.exemplaryAnswer}</ReactMarkdown>
                              </div>
                            </div>
                          </div>

                        </div>

                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* INDIVIDUALIZED TRAINING CURRICULUM BLUEPRINT */}
      <div className="glass-panel p-6 rounded-3xl mt-12 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800" id="study-curriculum-panel">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal-400" />
          Individualized Android Training Curriculum
        </h3>
        <p className="text-xs text-neutral-400 max-w-xl">
          Based on gaps identified by Sia, Devon, and Rhea, we have populated targeted revisions to complete before your next tech interview.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Action List items */}
          <div className="space-y-3.5 text-xs">
            <div className="bg-neutral-900/60 border border-neutral-800/80 p-3.5 rounded-xl flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">01</span>
              <div>
                <h4 className="font-extrabold text-white">Master Explicit Recompositions</h4>
                <p className="text-neutral-400 mt-1 leading-relaxed">
                  Analyze Compose runtime triggers. Use tools like the Android Studio Layout Inspector compilation counters to trace recomposition loops on unstable compiler parameters.
                </p>
              </div>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/80 p-3.5 rounded-xl flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">02</span>
              <div>
                <h4 className="font-extrabold text-white">Enforce Unidirectional Data Flow Integrity</h4>
                <p className="text-neutral-400 mt-1 leading-relaxed">
                  Abstract state handlers inside pureViewModels. Read Kotlin Flow guidelines on handling UI subscriptions safely behind `repeatOnLifecycle` blocks.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Gaps detected to read */}
            <div className="bg-neutral-900/30 border border-neutral-800/40 p-4 rounded-xl flex flex-col justify-between h-full">
              <div>
                <h4 className="text-[10px] uppercase font-mono tracking-wider font-semibold text-neutral-400 mb-2">
                  Keywords Identified for Immediate revision:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {allMissedConcepts.length > 0 ? (
                    allMissedConcepts.map((v, i) => (
                      <span key={i} className="bg-neutral-900 text-neutral-300 border border-neutral-800 px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 hover:border-teal-500/35 transition-all">
                        <Code2 className="w-3 text-teal-400 shrink-0" />
                        {v}
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-500 italic">No critical code gaps detected. Outstanding memory recall!</span>
                  )}
                </div>
              </div>

              {/* Developer resource CTA */}
              <div className="border-t border-neutral-800/80 pt-3 mt-4 flex items-center justify-between">
                <span className="text-[10px] text-neutral-550 italic">Read official Android Developer documentation</span>
                <a 
                  href="https://developer.android.com/reference" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] font-bold text-teal-400 flex items-center gap-0.5 hover:underline"
                >
                  developer.android.com
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Restart CTA */}
      <div className="text-center mt-10">
        <button
          onClick={onRestart}
          className="bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/30 hover:border-teal-500/50 text-teal-300 font-bold px-8 py-3 rounded-xl shadow-md transition-all text-sm divide-x cursor-pointer"
        >
          Begin New Interview Session
        </button>
      </div>

    </div>
  );
}
