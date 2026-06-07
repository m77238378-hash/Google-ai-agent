/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Interviewer, Difficulty, GeneratedQuestion, EvaluationResult, RoundHistoryItem } from "../types";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  Cpu, 
  RefreshCw, 
  Loader2, 
  Keyboard, 
  Settings, 
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import AudioVisualizer from "./AudioVisualizer";
import ReactMarkdown from "react-markdown";

const getCategoryBadgeStyles = (category: string) => {
  switch (category) {
    case "Behavioral":
      return { bg: "bg-blue-500/10 text-blue-300 border-blue-500/20", label: "Behavioral" };
    case "Technical":
      return { bg: "bg-purple-500/10 text-purple-300 border-purple-500/20", label: "Technical" };
    case "Situational":
      return { bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", label: "Situational" };
    case "Role-Specific":
      return { bg: "bg-amber-500/10 text-amber-300 border-amber-500/20", label: "Role-Specific" };
    default:
      return { bg: "bg-teal-500/10 text-teal-300 border-teal-500/20", label: "Android Specific" };
  }
};

interface InterviewConsoleProps {
  difficulty: Difficulty;
  topic: string;
  interviewer: Interviewer;
  roundsCount: number;
  onSessionComplete: (finalHistory: RoundHistoryItem[]) => void;
}

export default function InterviewConsole({
  difficulty,
  topic,
  interviewer,
  roundsCount,
  onSessionComplete,
}: InterviewConsoleProps) {
  // Session round state
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [sessionHistory, setSessionHistory] = useState<RoundHistoryItem[]>([]);

  // API Call states
  const [questionLoading, setQuestionLoading] = useState<boolean>(true);
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestion | null>(null);
  const [errorPayload, setErrorPayload] = useState<string | null>(null);

  // Transcription states
  const [candidateResponseText, setCandidateResponseText] = useState<string>("");
  const [interimText, setInterimText] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [useTextInput, setUseTextInput] = useState<boolean>(false);

  // Instat Feedback / Evaluation states
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Speech Recognition Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Loading encouraging messages
  const [encouragingMsg, setEncouragingMsg] = useState<string>("Interviewer is thinking...");

  // Setup Browser TTS Support
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Set up Speech Recognition on mount
  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const isSpeechSupported = !!SpeechRecognitionAPI;

  // Read question out loud on load
  const triggerTTS = (textToSpeak: string) => {
    if (synthRef.current) {
      synthRef.current.cancel(); // cancel current playing sounds
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voices = synthRef.current.getVoices();
      // Search for a suitable English voice
      const englishVoice = voices.find(v => v.lang.startsWith("en"));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      utterance.rate = 0.95; // Slightly slower for crisp articulation
      synthRef.current.speak(utterance);
    }
  };

  // Generate a question on component load or round increase
  const generateNextQuestion = async () => {
    setQuestionLoading(true);
    setErrorPayload(null);
    setCurrentEvaluation(null);
    setCandidateResponseText("");
    setInterimText("");
    setShowHint(false);

    const simpleHistory = sessionHistory.map(h => ({
      question: h.question,
      answer: h.candidateAnswer
    }));

    try {
      const response = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          interviewerName: interviewer.name,
          interviewerPersona: interviewer.persona,
          history: simpleHistory,
          currentRound,
          roundsCount
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize question prompt. Status code: ${response.status}`);
      }

      const data = await response.json();
      setCurrentQuestion(data);
      
      // Speak out loud!
      triggerTTS(data.question);
    } catch (err: any) {
      console.error(err);
      setErrorPayload(err.message || "Network issue during question retrieval. Please retry.");
    } finally {
      setQuestionLoading(false);
    }
  };

  // Trigger question loop on mount and round transition
  useEffect(() => {
    generateNextQuestion();
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [currentRound]);

  // Handle Speech Recognition triggers
  const executeToggleRecording = () => {
    if (!isSpeechSupported) return;

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
        setErrorPayload(null);
      };

      recognition.onresult = (event: any) => {
        let textResult = "";
        let finalSegment = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalSegment += event.results[i][0].transcript;
          } else {
            textResult += event.results[i][0].transcript;
          }
        }

        setInterimText(textResult);
        if (finalSegment) {
          setCandidateResponseText(prev => {
            const separator = prev.endsWith(" ") || prev === "" ? "" : " ";
            return prev + separator + finalSegment;
          });
          setInterimText("");
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error Event:", event.error);
        if (event.error !== "no-speech") {
          setErrorPayload(`Speech engine status: ${event.error}. You can fallback to terminal typing.`);
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error("Recording start error:", e);
      setErrorPayload("Microphone setup failed. Confirm browser permissions.");
      setIsRecording(false);
    }
  };

  // Change encouragement messages on evaluator startup
  useEffect(() => {
    let timer: any;
    if (isEvaluating) {
      const phrases = [
        "Sia is compiling your semantic response...",
        "Analyzing Android API alignment parameters...",
        "Evaluating Kotlin Flow and Thread context correctness...",
        "Grating performance benchmarks for memory safety...",
        "Synthesizing constructive architectural coaching feedback..."
      ];
      let i = 0;
      timer = setInterval(() => {
        setEncouragingMsg(phrases[i % phrases.length]);
        i++;
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isEvaluating]);

  // Submit response for immediate feedback
  const submitAnswerForEvaluation = async () => {
    const finalAnswer = candidateResponseText + (interimText ? " " + interimText : "");
    if (!finalAnswer.trim()) {
      setErrorPayload("Answer is blank. Please speak or type in a response first.");
      return;
    }

    // Stop any active transcriptions
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsEvaluating(true);
    setErrorPayload(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion?.question,
          answer: finalAnswer,
          topic,
          difficulty,
          expectedKeywords: currentQuestion?.expectedKeywords || [],
          interviewerName: interviewer.name
        }),
      });

      if (!response.ok) {
        throw new Error(`Evaluation network issue. Status: ${response.status}`);
      }

      const evalData = await response.json();
      setCurrentEvaluation(evalData);

      // Append to local session state
      const newRoundHistory: RoundHistoryItem = {
        roundNumber: currentRound,
        topic,
        difficulty,
        category: currentQuestion?.category || "Technical",
        interviewerName: interviewer.name,
        question: currentQuestion?.question || "",
        candidateAnswer: finalAnswer,
        evaluation: evalData,
        timestamp: new Date().toISOString()
      };

      setSessionHistory(prev => [...prev, newRoundHistory]);

    } catch (err: any) {
      console.error(err);
      setErrorPayload(err.message || "Failed to receive answer evaluation. Retry submission.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Check if session completed on click Next
  const handleNextRound = () => {
    if (currentRound < roundsCount) {
      setCurrentRound(prev => prev + 1);
    } else {
      onSessionComplete(sessionHistory);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 grid grid-cols-1 md:grid-cols-3 gap-6" id="interview-console-root">
      
      {/* LEFT COLUMN: INTERVIEWER CONTEXT & PORTRAIT */}
      <div className="md:col-span-1 space-y-4" id="interviewer-portrait-section">
        <div className="glass-panel p-5 rounded-2xl flex flex-col items-center text-center relative overflow-hidden" id="interviewer-video-feed">
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 roundedbg-neutral-900 border border-neutral-800 text-[10px] text-teal-400 font-mono tracking-wider">
            REC 1080P
          </div>
          
          {/* Mock Video Canvas */}
          <div className="w-28 h-28 rounded-full border-2 border-neutral-800 bg-neutral-900/80 flex items-center justify-center text-5xl leading-none mt-6 shadow-xl relative select-none">
            {interviewer.avatar}
            {isRecording && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-neutral-950 animate-ping" />
            )}
          </div>

          <h3 className="font-bold text-white text-base mt-4">{interviewer.name}</h3>
          <p className="text-[10px] text-teal-400 font-mono tracking-wide">{interviewer.title}</p>
          <p className="text-[11px] text-neutral-400 leading-relaxed mt-2 p-1.5 border-t border-neutral-800/65 w-full">
            {interviewer.persona.split(".")[0]}.
          </p>

          {/* Voice Speech Control */}
          {currentQuestion && (
            <button
              id="tts-repeat-btn"
              onClick={() => triggerTTS(currentQuestion.question)}
              className="mt-4 inline-flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Repeat Question Voice
            </button>
          )}
        </div>

        {/* TOPIC & TIMELINE STATUS PANEL */}
        <div className="glass-panel p-5 rounded-2xl space-y-3.5 text-xs text-neutral-400">
          <div>
            <div className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase">Interactive Domain</div>
            <div className="font-bold text-white text-sm truncate mt-0.5">{topic}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-neutral-900 pt-3">
            <div>
              <div className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase">Target Tier</div>
              <div className="font-semibold text-neutral-200 mt-0.5">{difficulty}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase font-sans">Session Progress</div>
              <div className="font-semibold text-neutral-200 mt-0.5">Round {currentRound} of {roundsCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: QUESTION & CANDIDATE ACTION PANEL */}
      <div className="md:col-span-2 space-y-5" id="assessment-response-panel">
        
        {/* INTERVIEW QUESTION CONTAINER */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl relative overflow-hidden" id="prompt-question-layout">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-teal-400 to-emerald-500" />
          
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <span className="bg-teal-500/10 text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-md font-mono border border-teal-500/10 block">
              Question {currentRound} of {roundsCount}
            </span>
            {currentQuestion?.category && (
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${getCategoryBadgeStyles(currentQuestion.category).bg}`}>
                {getCategoryBadgeStyles(currentQuestion.category).label} Question
              </span>
            )}
          </div>

          {questionLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2.5" id="question-spinner">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              <span className="text-xs text-neutral-400">Consulting Core Lead...</span>
            </div>
          ) : errorPayload && !currentQuestion ? (
            <div className="py-6 border border-red-500/25 bg-red-500/10 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" />
                Error loading interview context
              </div>
              <p className="text-xs text-neutral-300">{errorPayload}</p>
              <button
                onClick={generateNextQuestion}
                className="bg-neutral-900 border border-neutral-800 text-xs px-3 py-1.5 rounded-lg text-white font-medium flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Question Generation
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-base sm:text-lg font-black text-white leading-relaxed" id="spoken-question-text">
                "{currentQuestion?.question}"
              </h2>

              {/* Sub-hint disclosure expander */}
              <div className="border-t border-neutral-900 pt-3">
                {showHint ? (
                  <div className="bg-neutral-900/30 p-3 rounded-lg border border-neutral-800/40 text-xs text-neutral-300 flex items-start gap-2.5 animate-fade-in">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong className="text-neutral-200">Tip:</strong> {currentQuestion?.hint}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-300 text-xs font-semibold cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Reveal Interview Guidance Hint
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CANDIDATE SPEECH INPUT ZONE */}
        {currentQuestion && !questionLoading && (
          <div className="space-y-4">
            
            {/* SPEECH AND TEXT TOGGLE SWITCH */}
            <div className="flex justify-between items-center bg-neutral-900/40 border border-neutral-900 p-1 rounded-xl" id="input-mode-switcher">
              <button
                onClick={() => setUseTextInput(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !useTextInput ? "bg-neutral-800 text-teal-300" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                Live Speech Recorder
              </button>
              <button
                onClick={() => setUseTextInput(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  useTextInput ? "bg-neutral-800 text-teal-300" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                Keyboard Console Fallback
              </button>
            </div>

            {/* SPEECH AUDIO CONTROLS PANEL */}
            {!useTextInput ? (
              <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center min-h-[160px] text-center space-y-4 relative overflow-hidden" id="speech-waveform-monitor">
                {/* Visual equalizer lines */}
                <AudioVisualizer isRecording={isRecording} color={interviewer.id === "sia" ? "teal" : interviewer.id === "devon" ? "blue" : "amber"} />

                {!isSpeechSupported ? (
                  <div className="p-3 border border-amber-500/25 bg-amber-500/10 rounded-xl space-y-1.5 text-xs text-amber-300 text-left">
                    <span className="font-extrabold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Speech API not supported</span>
                    <p className="text-neutral-300 leading-normal">
                      Your browser does not fully support live speech-to-text. Please select the <strong className="text-white">Keyboard Console Fallback</strong> mode above to answer questions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    <div className="flex justify-center">
                      <button
                        id="recording-switch-btn"
                        onClick={executeToggleRecording}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                          isRecording 
                            ? "bg-red-500/20 border-2 border-red-500 text-red-500 animate-pulse outline outline-4 outline-red-500/10" 
                            : "bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold hover:shadow-[0_0_15px_rgba(20,184,166,0.3)] shadow-lg"
                        } cursor-pointer`}
                      >
                        {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </button>
                    </div>
                    <div className="text-xs">
                      {isRecording ? (
                        <span className="text-red-400 font-bold animate-pulse">Speak now. Listening to your details...</span>
                      ) : (
                        <span className="text-neutral-400">Click the microphone button to start speaking. Click again to pause.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* KEYBOARD TERMINAL INPUT BOX */
              <div className="space-y-2" id="text-editor-container">
                <textarea
                  id="text-answers-input"
                  className="w-full h-32 bg-neutral-900 border border-neutral-800 focus:border-teal-500/50 rounded-xl p-4 text-xs text-neutral-200 placeholder-neutral-600 focus:ring-1 focus:ring-teal-500/30 font-sans leading-relaxed resize-none transition-all outline-none"
                  placeholder="Type your complete, highly detailed Android solution here. Use technical terms..."
                  value={candidateResponseText}
                  onChange={(e) => setCandidateResponseText(e.target.value)}
                />
              </div>
            )}

            {/* REAL-TIME ACCUMULATING SPEECH TRANSCRIPTION BIND */}
            {!useTextInput && (candidateResponseText || interimText) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider font-semibold">
                    Real-Time Transcription Draft:
                  </span>
                  <button
                    onClick={() => {
                      setCandidateResponseText("");
                      setInterimText("");
                    }}
                    className="text-[10px] text-neutral-500 hover:text-neutral-300 font-bold"
                  >
                    Clear Text
                  </button>
                </div>
                <div 
                  id="live-transcription-draft"
                  className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 min-h-[80px] max-h-[140px] overflow-y-auto custom-scrollbar-thin text-xs leading-relaxed text-neutral-300 whitespace-pre-wrap font-sans"
                >
                  <span>{candidateResponseText}</span>
                  {interimText && <span className="text-teal-400/80 italic bg-teal-950/20 px-0.5">{interimText}</span>}
                </div>
              </div>
            )}

            {/* EXPLICIT SUBMIT TO AI DIAGNOSIS INTERFACE */}
            {!currentEvaluation && (
              <div className="pt-3 flex justify-end">
                <button
                  id="evaluate-submission-btn"
                  onClick={submitAnswerForEvaluation}
                  disabled={isEvaluating || (!candidateResponseText.trim() && !interimText.trim())}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:from-neutral-800 disabled:to-neutral-800 text-neutral-950 disabled:text-neutral-500 font-extrabold py-3 px-5 rounded-xl cursor-pointer shadow-lg hover:shadow-teal-500/10 transition-all text-xs flex items-center gap-1.5"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{encouragingMsg}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Submit Answer for Instant AI Feedback
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ERRROR CALLOUT IN INTERACTION BAR */}
            {errorPayload && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-xl mt-3 flex items-start gap-2 animate-fade-in">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{errorPayload}</span>
              </div>
            )}

            {/* INSTANT DIAGNOSTIC FEEDBACK REPORT PANEL */}
            {currentEvaluation && (
              <div className="glass-panel rounded-2xl border border-neutral-800 mt-6 overflow-hidden animate-fade-in" id="instant-feedback-report">
                {/* Header header metrics */}
                <div className="bg-neutral-900/60 p-4 border-b border-neutral-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping shrink-0" />
                    <span className="text-xs text-neutral-300 font-bold font-sans">
                      Instant Feedback Completed
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="bg-teal-500/15 border border-teal-500/20 text-teal-300 px-2.5 py-1 rounded text-[11px] font-bold">
                      {currentEvaluation.rating}
                    </span>
                    <span className="text-sm font-black font-mono text-white">
                      Score: {currentEvaluation.score}/100
                    </span>
                  </div>
                </div>

                {/* Main appraisal report details */}
                <div className="p-5 space-y-5 text-xs sm:text-sm">
                  
                  {/* Granular Criteria Scorecard Section */}
                  <div className="border-b border-neutral-900 pb-5" id="criteria-scorecard-layout">
                    <h4 className="text-[10px] uppercase font-mono text-neutral-400 font-bold tracking-wider mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                      Candidate Core Scorecard Metric Evaluation
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { 
                          label: "Clarity & Articulation", 
                          value: (currentEvaluation.scorecard?.clarity?.score !== undefined) ? currentEvaluation.scorecard.clarity.score : Math.round(currentEvaluation.score * 0.96), 
                          notes: currentEvaluation.scorecard?.clarity?.notes || "Explanations were articulated with clean formatting and minimal hesitation.",
                          color: "bg-blue-500", 
                          text: "text-blue-400",
                          bg: "bg-blue-950/10 border-blue-900/30"
                        },
                        { 
                          label: "Technical Relevance", 
                          value: (currentEvaluation.scorecard?.relevance?.score !== undefined) ? currentEvaluation.scorecard.relevance.score : currentEvaluation.score, 
                          notes: currentEvaluation.scorecard?.relevance?.notes || "Demonstrated excellent direct focus resolving the main technical requirements.",
                          color: "bg-teal-500", 
                          text: "text-teal-400",
                          bg: "bg-teal-950/10 border-teal-900/30"
                        },
                        { 
                          label: "Domain Completeness", 
                          value: (currentEvaluation.scorecard?.completeness?.score !== undefined) ? currentEvaluation.scorecard.completeness.score : Math.round(currentEvaluation.score * 0.92), 
                          notes: currentEvaluation.scorecard?.completeness?.notes || "Referenced critical lifecycle loops, states, and APIs cleanly.",
                          color: "bg-amber-500", 
                          text: "text-amber-400",
                          bg: "bg-amber-950/10 border-amber-900/30"
                        },
                        { 
                          label: "Professional Confidence", 
                          value: (currentEvaluation.scorecard?.confidence?.score !== undefined) ? currentEvaluation.scorecard.confidence.score : Math.min(100, Math.round(currentEvaluation.score * 1.02)), 
                          notes: currentEvaluation.scorecard?.confidence?.notes || "Delivered authoritative claims with precise architectural vocabulary.",
                          color: "bg-purple-500", 
                          text: "text-purple-400",
                          bg: "bg-purple-950/10 border-purple-900/30"
                        }
                      ].map((item, index) => (
                        <div 
                          key={index} 
                          className={`border rounded-xl p-3 space-y-1.5 bg-neutral-900/40 ${item.bg}`}
                          id={`scorecard-card-${index}`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-neutral-200">{item.label}</span>
                            <span className={`font-mono font-bold ${item.text}`}>{item.value}/100</span>
                          </div>
                          
                          {/* Progress Line */}
                          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.value}%` }} />
                          </div>
                          
                          <p className="text-[11px] text-neutral-400 leading-normal pt-0.5">
                            {item.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lists metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-1">
                    <div>
                      <h4 className="text-[10px] uppercase font-mono text-teal-400 font-bold tracking-wider mb-1.5">
                        Technical Strengths Highlighted
                      </h4>
                      <ul className="space-y-1 pl-0.5">
                        {currentEvaluation.strengths.map((str, i) => (
                          <li key={i} className="text-xs text-neutral-300 flex items-start gap-1.5 leading-snug">
                            <span className="text-teal-400 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-[10px] uppercase font-mono text-amber-500 font-bold tracking-wider mb-1.5 font-sans">
                        Omitted / Suggested Concepts
                      </h4>
                      <ul className="space-y-1 pl-0.5 font-sans">
                        {currentEvaluation.missedConcepts.map((mis, i) => (
                          <li key={i} className="text-xs text-neutral-300 flex items-start gap-1.5 leading-snug">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{mis}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Feedback Narrative paragraph */}
                  <div className="bg-neutral-900/30 border border-neutral-800/40 p-4 rounded-xl space-y-1 text-xs">
                    <h5 className="text-[10px] uppercase font-mono font-bold text-neutral-400 mb-1">
                      Coaching Insights:
                    </h5>
                    <p className="text-neutral-300 leading-relaxed font-sans">
                      {currentEvaluation.detailedFeedback}
                    </p>
                  </div>

                  {/* Model Solutions panel */}
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] uppercase font-mono font-bold text-teal-400 tracking-wider">
                      Exemplary Android Solution Reference:
                    </h5>
                    <div className="bg-neutral-900/90 border border-neutral-800/85 p-4 rounded-xl max-h-[220px] overflow-y-auto custom-scrollbar-thin text-xs font-mono text-neutral-300 leading-relaxed">
                      <div className="markdown-body">
                        <ReactMarkdown>{currentEvaluation.exemplaryAnswer}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer advances action */}
                <div className="bg-neutral-900/40 border-t border-neutral-900 p-4 flex justify-end">
                  <button
                    id="advance-round-btn"
                    onClick={handleNextRound}
                    className="bg-white hover:bg-neutral-100 text-neutral-950 font-extrabold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>{currentRound < roundsCount ? "Ask Next Question" : "Compile Final Score Report"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
