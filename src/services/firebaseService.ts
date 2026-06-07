import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { db, auth, googleProvider, handleFirestoreError, OperationType } from "../firebase";
import { InterviewSession, RoundHistoryItem } from "../types";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: any;
  updatedAt: any;
}

/**
 * Handle user registration or update post-social auth.
 */
export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid);
  const path = `users/${user.uid}`;
  
  try {
    const docSnap = await getDoc(userRef);
    const now = new Date().toISOString();
    
    let profileData: UserProfile;

    if (docSnap.exists()) {
      const existingData = docSnap.data();
      profileData = {
        uid: user.uid,
        displayName: user.displayName || "Candidate User",
        email: user.email || "",
        photoURL: user.photoURL,
        createdAt: existingData.createdAt || now,
        updatedAt: now,
      };
    } else {
      profileData = {
        uid: user.uid,
        displayName: user.displayName || "Candidate User",
        email: user.email || "",
        photoURL: user.photoURL,
        createdAt: now,
        updatedAt: now,
      };
    }

    // Save profile to database
    await setDoc(userRef, {
      ...profileData,
      createdAt: docSnap.exists() ? docSnap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return profileData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Executes login flow with Google Provider via Popup.
 */
export async function loginWithGoogle(): Promise<UserProfile | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      return await syncUserProfile(result.user);
    }
    return null;
  } catch (error: any) {
    console.error("Popup Auth failed:", error);
    throw error;
  }
}

/**
 * Signs out active session.
 */
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

/**
 * Saves or updates an active/completed session into Firestore.
 */
export async function persistInterviewSession(
  session: InterviewSession, 
  userId: string
): Promise<void> {
  if (!session.id) return;
  const sessionRef = doc(db, "sessions", session.id);
  const path = `sessions/${session.id}`;

  try {
    const docSnap = await getDoc(sessionRef);

    const payload = {
      id: session.id,
      userId: userId,
      topic: session.topic || "Android Development Focus",
      difficulty: session.difficulty,
      interviewerId: session.interviewerId,
      roundsCount: Number(session.roundsCount),
      status: session.status,
      history: session.history.map(item => ({
        roundNumber: Number(item.roundNumber),
        topic: item.topic,
        difficulty: item.difficulty,
        category: item.category,
        interviewerName: item.interviewerName,
        question: item.question,
        candidateAnswer: item.candidateAnswer || "",
        evaluation: item.evaluation ? {
          score: Number(item.evaluation.score),
          rating: item.evaluation.rating,
          strengths: item.evaluation.strengths || [],
          missedConcepts: item.evaluation.missedConcepts || [],
          detailedFeedback: item.evaluation.detailedFeedback || "",
          exemplaryAnswer: item.evaluation.exemplaryAnswer || "",
          scorecard: item.evaluation.scorecard ? {
            clarity: {
              score: Number(item.evaluation.scorecard.clarity.score),
              notes: item.evaluation.scorecard.clarity.notes || ""
            },
            relevance: {
              score: Number(item.evaluation.scorecard.relevance.score),
              notes: item.evaluation.scorecard.relevance.notes || ""
            },
            completeness: {
              score: Number(item.evaluation.scorecard.completeness.score),
              notes: item.evaluation.scorecard.completeness.notes || ""
            },
            confidence: {
              score: Number(item.evaluation.scorecard.confidence.score),
              notes: item.evaluation.scorecard.confidence.notes || ""
            }
          } : null
        } : null,
        timestamp: item.timestamp || new Date().toISOString()
      })),
      createdAt: docSnap.exists() ? docSnap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(sessionRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Retrieves past interview sessions for a specified user.
 */
export async function fetchUserSessions(userId: string): Promise<InterviewSession[]> {
  const sessionsRef = collection(db, "sessions");
  const path = "sessions";

  try {
    const q = query(
      sessionsRef, 
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const list: InterviewSession[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: data.id,
        difficulty: data.difficulty,
        topic: data.topic,
        interviewerId: data.interviewerId,
        roundsCount: data.roundsCount,
        status: data.status,
        currentRoundIndex: data.history ? data.history.length + 1 : 1,
        history: data.history || []
      });
    });
    
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
