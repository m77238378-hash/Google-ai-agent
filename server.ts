import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

    const systemPrompt = `You are simulated Android technical interviewer named ${interviewerName || 'Sia'}, playing the role of a ${interviewerPersona || 'Technical Specialist'}.
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
              description: "4 to 6 technical terms, APIs, or core classes that a developer of the selected difficulty level (${difficulty}) would likely use to answer this question." 
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

    const systemPrompt = `You are an expert Android Engineering Assessor. Your job is to strictly yet constructively evaluate a candidate's transcribed spoken response for an interview question.
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

    const userPrompt = `
Question Asked: "${question}"
Candidate's Answer: "${answer}"

Analyze the answer. Return a rating, score, list of technical strengths, critical concepts they missed, a detailed coaching narrative, and an exemplary response containing elegant Kotlin/Android code snippets where appropriate. Ensure code snippets use the latest practices (e.g. Jetpack Compose, official Coroutine guidelines, state holders).
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

// Fallback to serving Vite SPA
async function startServer() {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
