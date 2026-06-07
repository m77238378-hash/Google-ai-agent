import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// --- WEBSOCKET SERVICES PORTION ---
interface RoomParticipant {
  role: 'candidate' | 'peer';
  userName: string;
  profilePic?: string;
  id: string;
}

interface RoomState {
  roomId: string;
  topic: string;
  difficulty: string;
  currentRound: number;
  status: string;
  activeDraft: string;
  activeQuestion: any;
  history: any[];
  participants: { ws: WebSocket; info: RoomParticipant }[];
  chats: { id: string; sender: string; text: string; role: string; timestamp: string }[];
}

const rooms = new Map<string, RoomState>();

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI interview features will not work until set.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Endpoint to generate a technical interview question
app.post("/api/generate-question", async (req, res) => {
  try {
    const { topic, difficulty, interviewerName, interviewerPersona, history, currentRound, roundsCount } = req.body;

    if (!topic || !difficulty) {
      return res.status(400).json({ error: "Missing required parameters: topic and difficulty" });
    }

    const computedRound = currentRound || (history && history.length ? history.length + 1 : 1);
    
    // Distribute categories cleanly: 'Technical', 'Behavioral', 'Situational', 'Role-Specific'
    const categories: ('Behavioral' | 'Technical' | 'Situational' | 'Role-Specific')[] = [
      'Technical',    // Round 1
      'Behavioral',   // Round 2
      'Situational',  // Round 3
      'Role-Specific',// Round 4
      'Technical'     // Round 5 / fallback
    ];
    const targetCategory = categories[(computedRound - 1) % categories.length];

    const historyPrompt = history && history.length > 0 
      ? `\nTo avoid repetition, please review the previous technical conversation, and ask a different question in the same field:\n${JSON.stringify(history)}`
      : "";

    const isDataAnalysis = topic && topic.toLowerCase().includes("data analysis");

    let systemPrompt = "";
    if (isDataAnalysis) {
      systemPrompt = `You are a simulated Data Science Instructor and Coach named ${interviewerName || 'Sia'}, playing the role of a ${interviewerPersona || 'Technical Specialist'} but specialized in Data Analysis for students and beginners.
Your objective is to ask the student a realistic, pedagogical, hands-on Data Analysis & Python question suitable for a ${difficulty} level student/learner focusing on: ${topic}.
The question MUST target the specific category: "${targetCategory}".

Category-specific instructions:
- 'Technical': Python syntax constructs, core data science libraries (such as Pandas DataFrame manipulations, NumPy vectorized calculations, Matplotlib chart structures), sorting, grouping, or cleaning null/nan cells.
- 'Behavioral': Ask about collaborating on student data analysis group tasks, making decisions on messy surveys, resolving analysis disputes with teammates, or presenting analytical dashboards clearly to professors.
- 'Situational': Present a realistic diagnostic scenario (e.g. tracking down missing values or corrupted dates in a CSV spreadsheet, shape mismatches in Numpy dimensions, csv memory limits, or identifying data distributions).
- 'Role-Specific': Focus on academic, school project, or exploratory Jupyter notebook patterns. Ask about Jupyter notebook execution states, Google Colab setup, or proper visualization choices (e.g., boxplot vs scatter vs histogram).

Tailor the question, complexity, and expected technical depth precisely to the selected student target level:
- For 'Junior': Approachable beginner level. Basic syntax, lists, standard dictionary manipulation, basic pandas.read_csv(), and plotting simple line charts or bar charts. Keep it highly supportive and foundation-focused.
- For 'Mid-Level': Practical exploration level. Pandas .groupby(), .agg(), joining/merging datasets, filtering techniques, simple imputation of missing data, and statistical correlation basics.
- For 'Senior': Advanced pipeline and optimization level. Optimizing slow looping Pandas code via vectorization, handling out-of-memory large dataframes, custom model transformations, and statistical regression modeling or predictive basics.
The question should focus on realistic scenario-based problems suitable for a ${difficulty} student.`;
    } else {
      systemPrompt = `You are simulated Android technical interviewer named ${interviewerName || 'Sia'}, playing the role of a ${interviewerPersona || 'Technical Specialist'}.
Your objective is to grill a candidate with a realistic, scenario-based Android interview question suitable for a ${difficulty} level Android Developer on the topic: ${topic}.
The question MUST target the specific question category: "${targetCategory}".

Category-specific instructions:
- 'Technical': Deep technical concepts, core algorithms, runtime bounds, API mechanics, compiler rules, memory, or thread-safety mechanics (e.g., memory overhead, Jetpack Compose recomposition indices, Mutex, StateFlow, Coroutines under pressure).
- 'Behavioral': Talk about communication, leadership, and collaboration pitfalls or past experiences inside an Android agile team. Ask the candidate to explain conflicts (e.g., custom layouts vs standard Compose widgets, code reviews, timelines), still relating cleanly to realistic Android developer roles.
- 'Situational': Present a challenging real-world hypothetical situation or a sudden production issue. E.g., play store regression crashes you cannot replicate locally, retrofitting offline database synchronizations, or tracking sudden rendering freezes under old SDKs.
- 'Role-Specific': Tailored purely to daily standard Android platform patterns, WorkManager configurations, activity process-death saveable handles, deep lifecycle states, or particular Google Play billing / core features.

The question, complexity, and expected technical depth MUST be tailored precisely to the selected difficulty level:
- For 'Junior': Focus on basic fundamentals, core API usage, simple layouts, lifecycle awareness, and everyday UI/logical tasks (e.g., standard State variables, remember, local Activity states, standard ViewModel, basic XML or declarative layouts). Keep it approachable and check for good general coding foundations.
- For 'Mid-Level': Focus on integration scenarios, state lifecycle, flow-streams, testing, asynchronous fundamentals, and best practices (e.g., state hoisting vs remember, ViewModel sharing, Coroutines cancellation, Flow streams, basic DI setups via Hilt).
- For 'Senior': Focus on deep mechanics, complex optimizations, compiler rules, advanced concurrency, memory leak diagnostic, core OS mechanics, multi-team modularity, and custom view configurations (e.g., SlotTable, recomposition indices, custom Layout modifiers, Mutex, SharedFlow, dynamic features, state holders, LeakCanary triage, Dispatchers profiling).
The question should focus on realistic scenario-based problems suitable for a ${difficulty} developer.`;
    }

    const userPrompt = `Generate one interview question. Keep it concise, engaging, and in character. Include a subtle guidance hint and a list of expected key concepts the perfect candidate should ideally mention in their answer. ${historyPrompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { 
              type: Type.STRING, 
              description: "The interview question spoken by the AI interviewer, in natural, conversational, yet highly technical style." 
            },
            hint: { 
              type: Type.STRING, 
              description: "A subtle coaching hint assisting the candidate's approach." 
            },
            expectedKeywords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: `4 to 6 technical terms, APIs, or core classes that a student or developer of the selected difficulty level (${difficulty}) would likely use to answer this question.` 
            },
            category: {
              type: Type.STRING,
              enum: ["Behavioral", "Technical", "Situational", "Role-Specific"],
              description: "The category of the question, which must be precisely: " + targetCategory
            }
          },
          required: ["question", "hint", "expectedKeywords", "category"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini");
    }

    const questionData = JSON.parse(resultText);
    res.json(questionData);
  } catch (error: any) {
    console.error("Error generating question:", error);
    res.status(500).json({ 
      error: "Failed to generate interview question.", 
      details: error.message 
    });
  }
});

// Endpoint to evaluate candidate response
app.post("/api/evaluate", async (req, res) => {
  try {
    const { question, answer, topic, difficulty, expectedKeywords, interviewerName } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "Missing required parameters: question and answer" });
    }

    const isDataAnalysis = topic && topic.toLowerCase().includes("data analysis");

    let systemPrompt = "";
    if (isDataAnalysis) {
      systemPrompt = `You are an expert Data Science and Student Analytics Assessor. Your job is to constructively evaluate a student's transcribed spoken or written response for a Data Analysis and Python question.
Target level: ${difficulty || 'Mid-Level'} Student/Learner
Course / stream Focus: ${topic || 'Data Analysis'}
Interviewer: ${interviewerName || 'Sia'}

Evaluate the response on:
1. Technical accuracy (Are Python statements, Pandas aggregates, NumPy vectorizations, or Matplotlib/Seaborn claims correct?)
2. Depth & Concept mastery (Does the vocabulary and reasoning match a ${difficulty} level student?)
3. Structure and clarity.
4. Coverage of expected keywords or core data analysis concepts: ${JSON.stringify(expectedKeywords || [])}

Adjust your grading strictness based on the student level:
- For 'Junior': Look for understanding of basic Python constructs, list/dict operations, reading CSV datasets, and basic plot instructions. Score warmly and focus on foundational logical reasoning.
- For 'Mid-Level': Look for real-world exploration. Combining datasets, handling null/NaN entries, data aggregation (.groupby, .describe), and practical data visualizations.
- For 'Senior': Look for absolute performance optimizations, vectorization patterns to avoid slow loops, handling huge files in chunks to avoid memory errors, advanced plotting, and statistical mathematical modeling/regression analysis.
Be very realistic. If a student's answer is extremely short, generic, vague, or mentions incorrect concepts, score it low (e.g. 20-50). If they hit the key terms correctly and explain them with concrete details and code philosophy, score it high (85-100).`;
    } else {
      systemPrompt = `You are an expert Android Engineering Assessor. Your job is to strictly yet constructively evaluate a candidate's transcribed spoken response for an interview question.
Target level: ${difficulty || 'Mid-Level'}
Topic: ${topic || 'Android Development'}
Interviewer: ${interviewerName || 'Sia'}

Evaluate the response on:
1. Technical accuracy (Are Kotlin, Compose, or lifecycle claims correct?)
2. Depth & Seniority (Does the vocabulary and reasoning match a ${difficulty} developer?)
3. Structure and clarity.
4. Coverage of expected keywords or general Android concepts: ${JSON.stringify(expectedKeywords || [])}

Adjust your grading strictness based on the developer level:
- For 'Junior': Look for understanding of basic concepts, clean coding patterns, and an ability to describe standard structures. Score generously if they show solid fundamental logical reasoning even if they miss deep optimization internals.
- For 'Mid-Level': Look for real-world integration, testing, handling side effects, performance awareness, and typical modern architecture templates. They should know how to use Kotlin Coroutines and Jetpack APIs effectively.
- For 'Senior': Look for absolute mastery. They must demonstrate deep technical maturity, address concurrency pitfalls, reference Android SDK internals, outline performance profiling, and write highly efficient code architecture.
Be very realistic. If a candidate's answer is extremely short, generic, vague, or mentions incorrect concepts, score it low (e.g. 20-50). If they hit the key terms correctly and explain them with concrete details and code philosophy, score it high (85-100).`;
    }

    const codeSnippetRequirement = isDataAnalysis 
      ? "containing elegant, well-commented Python/Pandas/NumPy code snippets where appropriate. Ensure code snippets use the best data science practices (e.g., vectorized operations, clean plotting with Matplotlib/Seaborn, proper type conversions)"
      : "containing elegant Kotlin/Android code snippets where appropriate. Ensure code snippets use the latest practices (e.g. Jetpack Compose, official Coroutine guidelines, state holders)";

    const userPrompt = `
Question Asked: "${question}"
Candidate's Answer: "${answer}"

Analyze the answer. Return a rating, score, list of technical strengths, critical concepts they missed, a detailed coaching narrative, and an exemplary response ${codeSnippetRequirement}.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.INTEGER, 
              description: "A realistic test score between 0 and 100 based on the evaluation." 
            },
            rating: { 
              type: Type.STRING, 
              description: "One of: 'Outstanding' (90-100), 'Proficient' (75-89), 'Good' (60-74), 'Needs Improvement' (<60)." 
            },
            strengths: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "2 to 4 notable technical things they said correctly." 
            },
            missedConcepts: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Crucial concepts, keywords, annotations, or APIs that were expected but omitted." 
            },
            detailedFeedback: { 
              type: Type.STRING, 
              description: "Detailed, constructive feedback on technical accuracy and delivery. Explain why the score was given." 
            },
            exemplaryAnswer: { 
              type: Type.STRING, 
              description: "An incredibly elegant, complete answer to the question, using Markdown. Include best-practice Kotlin or Compose code chunks showing how a pro writes it." 
            },
            scorecard: {
              type: Type.OBJECT,
              properties: {
                clarity: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Score 0-100 evaluating language fluency, structure, and structural coherence." },
                    notes: { type: Type.STRING, description: "Specific detailed notes regarding expression and structural clarity." }
                  },
                  required: ["score", "notes"]
                },
                relevance: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Score 0-100 assessing how directly the answer targets the specific Android core issue requested." },
                    notes: { type: Type.STRING, description: "Specific detailed notes regarding domain relevance and problem focus." }
                  },
                  required: ["score", "notes"]
                },
                completeness: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Score 0-100 assessing coverage of necessary concepts, systems, and APIs." },
                    notes: { type: Type.STRING, description: "Specific detailed notes outlining missing APIs, systems, or lifecycle events." }
                  },
                  required: ["score", "notes"]
                },
                confidence: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Score 0-100 assessing terminology precision, authoritative style, and phrasing certainty." },
                    notes: { type: Type.STRING, description: "Specific detailed notes regarding professional posture and technical vocabulary assurance." }
                  },
                  required: ["score", "notes"]
                }
              },
              required: ["clarity", "relevance", "completeness", "confidence"]
            }
          },
          required: ["score", "rating", "strengths", "missedConcepts", "detailedFeedback", "exemplaryAnswer", "scorecard"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini");
    }

    const evaluationData = JSON.parse(resultText);
    res.json(evaluationData);
  } catch (error: any) {
    console.error("Error evaluating answer:", error);
    res.status(500).json({ 
      error: "Failed to evaluate candidate response.", 
      details: error.message 
    });
  }
});

// GET room info
app.get("/api/peer-room/:roomId", (req, res) => {
  const { roomId } = req.params;
  const roomObj = rooms.get(roomId);
  if (roomObj) {
    res.json({
      exists: true,
      topic: roomObj.topic,
      difficulty: roomObj.difficulty,
      status: roomObj.status,
      participantsCount: roomObj.participants.length
    });
  } else {
    res.json({ exists: false });
  }
});

// WebSocket Server Handlers
function broadcastToRoom(roomId: string, message: any, excludeParticipantId?: string) {
  const roomObj = rooms.get(roomId);
  if (!roomObj) return;

  const msgString = JSON.stringify(message);
  for (const p of roomObj.participants) {
    if (excludeParticipantId && p.info.id === excludeParticipantId) {
      continue;
    }
    try {
      if (p.ws.readyState === 1) { // WebSocket.OPEN is 1
        p.ws.send(msgString);
      }
    } catch (err) {
      console.error("WS error during broadcast:", err);
    }
  }
}

function initWebsockets(server: http.Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let participantId = Math.random().toString(36).substring(7);

    ws.on("message", (rawMessage: string) => {
      try {
        const data = JSON.parse(rawMessage);
        const { type, payload } = data;

        if (type === "join-room") {
          const { roomId, role, userName, profilePic, topic, difficulty, status, currentRound, activeQuestion, activeDraft, history } = payload;
          currentRoomId = roomId;

          let roomObj = rooms.get(roomId);
          if (!roomObj) {
            roomObj = {
              roomId,
              topic: topic || "",
              difficulty: difficulty || "Mid-Level",
              currentRound: currentRound || 1,
              status: status || "SETUP",
              activeDraft: activeDraft || "",
              activeQuestion: activeQuestion || null,
              history: history || [],
              participants: [],
              chats: []
            };
            rooms.set(roomId, roomObj);
          }

          // Merge if candidate is rejoining/connected
          if (role === 'candidate') {
            if (topic) roomObj.topic = topic;
            if (difficulty) roomObj.difficulty = difficulty;
            if (status) roomObj.status = status;
            if (currentRound) roomObj.currentRound = currentRound;
            if (activeQuestion) roomObj.activeQuestion = activeQuestion;
            if (activeDraft) roomObj.activeDraft = activeDraft;
            if (history) roomObj.history = history;
          }

          // Save participant
          const participantInfo: RoomParticipant = {
            id: participantId,
            role: role || 'peer',
            userName: userName || "Silent Peer",
            profilePic
          };

          roomObj.participants.push({ ws, info: participantInfo });
          console.log(`[WS] ${userName} [${role}] joined room ${roomId}`);

          // Send current room state to individual joining client
          ws.send(JSON.stringify({
            type: "room-state",
            payload: {
              roomId: roomObj.roomId,
              topic: roomObj.topic,
              difficulty: roomObj.difficulty,
              currentRound: roomObj.currentRound,
              status: roomObj.status,
              activeDraft: roomObj.activeDraft,
              activeQuestion: roomObj.activeQuestion,
              history: roomObj.history,
              chats: roomObj.chats,
              participants: roomObj.participants.map(p => p.info)
            }
          }));

          // Notify other folks in this room
          broadcastToRoom(roomId, {
            type: "presence-update",
            payload: {
              participants: roomObj.participants.map(p => p.info)
            }
          });

        } else if (type === "sync-draft") {
          if (!currentRoomId) return;
          const { draftText } = payload;
          const roomObj = rooms.get(currentRoomId);
          if (roomObj) {
            roomObj.activeDraft = draftText;
            broadcastToRoom(currentRoomId, {
              type: "draft-update",
              payload: { draftText }
            }, participantId);
          }

        } else if (type === "sync-question") {
          if (!currentRoomId) return;
          const { questionData, currentRound, status } = payload;
          const roomObj = rooms.get(currentRoomId);
          if (roomObj) {
            roomObj.activeQuestion = questionData;
            roomObj.currentRound = currentRound || roomObj.currentRound;
            if (status) roomObj.status = status;
            broadcastToRoom(currentRoomId, {
              type: "question-update",
              payload: { questionData, currentRound: roomObj.currentRound, status: roomObj.status }
            }, participantId);
          }

        } else if (type === "sync-status") {
          if (!currentRoomId) return;
          const { status, history } = payload;
          const roomObj = rooms.get(currentRoomId);
          if (roomObj) {
            roomObj.status = status;
            if (history) roomObj.history = history;
            broadcastToRoom(currentRoomId, {
              type: "status-update",
              payload: { status, history }
            }, participantId);
          }

        } else if (type === "peer-reaction") {
          if (!currentRoomId) return;
          const { symbol, userName } = payload;
          broadcastToRoom(currentRoomId, {
            type: "reaction-triggered",
            payload: { symbol, userName }
          });

        } else if (type === "peer-hint") {
          if (!currentRoomId) return;
          const { hintText, userName } = payload;
          broadcastToRoom(currentRoomId, {
            type: "hint-triggered",
            payload: { hintText, userName }
          });

        } else if (type === "send-chat") {
          if (!currentRoomId) return;
          const { text, userName, role } = payload;
          const roomObj = rooms.get(currentRoomId);
          if (roomObj) {
            const chatObj = {
              id: Math.random().toString(36).substring(7),
              sender: userName || "Peer Guest",
              text,
              role: role || "peer",
              timestamp: new Date().toISOString()
            };
            roomObj.chats.push(chatObj);
            if (roomObj.chats.length > 50) {
              roomObj.chats.shift();
            }
            broadcastToRoom(currentRoomId, {
              type: "chat-update",
              payload: { chats: roomObj.chats }
            });
          }
        }

      } catch (err) {
        console.error("WebSocket message parsing error:", err);
      }
    });

    ws.on("close", () => {
      if (currentRoomId) {
        const roomObj = rooms.get(currentRoomId);
        if (roomObj) {
          roomObj.participants = roomObj.participants.filter(p => p.info.id !== participantId);
          console.log(`[WS] Participant left room ${currentRoomId}. Left: ${roomObj.participants.length}`);

          if (roomObj.participants.length === 0) {
            rooms.delete(currentRoomId);
            console.log(`[WS] Cleaned empty room ${currentRoomId}`);
          } else {
            broadcastToRoom(currentRoomId, {
              type: "presence-update",
              payload: {
                participants: roomObj.participants.map(p => p.info)
              }
            });
          }
        }
      }
    });

    ws.on("error", (err) => {
      console.error("[WS] client socket error:", err);
    });
  });
}

// Fallback to serving Vite SPA
async function startServer() {
  const server = http.createServer(app);
  initWebsockets(server);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

