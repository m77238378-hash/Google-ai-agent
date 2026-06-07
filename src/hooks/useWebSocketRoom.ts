import { useEffect, useRef, useState, useCallback } from "react";

export interface WSParticipant {
  id: string;
  role: 'candidate' | 'peer';
  userName: string;
  profilePic?: string;
}

export interface WSChatMessage {
  id: string;
  sender: string;
  text: string;
  role: string;
  timestamp: string;
}

export interface WSState {
  roomId: string;
  topic: string;
  difficulty: string;
  status: string;
  currentRound: number;
  activeDraft: string;
  activeQuestion: any;
  history: any[];
  chats: WSChatMessage[];
  participants: WSParticipant[];
}

export function useWebSocketRoom(
  roomId: string | null,
  role: 'candidate' | 'peer',
  userName: string,
  profilePic?: string,
  initialConfig?: {
    topic?: string;
    difficulty?: string;
    status?: string;
    currentRound?: number;
    activeQuestion?: any;
    activeDraft?: string;
    history?: any[];
  }
) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [roomState, setRoomState] = useState<WSState | null>(null);
  const [liveReactions, setLiveReactions] = useState<{ id: string; symbol: string; sender: string }[]>([]);
  const [liveHint, setLiveHint] = useState<{ text: string; sender: string; timestamp: Date } | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const keepAliveIntervalRef = useRef<any>(null);

  // Buffer messages if ws is not fully connected
  const messageQueueRef = useRef<string[]>([]);

  const sendWSMessage = useCallback((type: string, payload: any) => {
    const rawMsg = JSON.stringify({ type, payload });
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(rawMsg);
    } else {
      // Buffer the message
      messageQueueRef.current.push(rawMsg);
    }
  }, []);

  const triggerReaction = useCallback((symbol: string) => {
    if (!roomId) return;
    sendWSMessage("peer-reaction", { symbol, userName });
  }, [roomId, userName, sendWSMessage]);

  const sendLiveHint = useCallback((hintText: string) => {
    if (!roomId) return;
    sendWSMessage("peer-hint", { hintText, userName });
  }, [roomId, userName, sendWSMessage]);

  const sendChatMessage = useCallback((text: string) => {
    if (!roomId) return;
    sendWSMessage("send-chat", { text, userName, role });
  }, [roomId, userName, role, sendWSMessage]);

  const syncDraftText = useCallback((draftText: string) => {
    if (!roomId || role !== 'candidate') return;
    sendWSMessage("sync-draft", { draftText });
  }, [roomId, role, sendWSMessage]);

  const syncActiveQuestion = useCallback((questionData: any, currentRound: number, status: string) => {
    if (!roomId || role !== 'candidate') return;
    sendWSMessage("sync-question", { questionData, currentRound, status });
  }, [roomId, role, sendWSMessage]);

  const syncStatusAndHistory = useCallback((status: string, history: any[]) => {
    if (!roomId || role !== 'candidate') return;
    sendWSMessage("sync-status", { status, history });
  }, [roomId, role, sendWSMessage]);

  useEffect(() => {
    if (!roomId) {
      setConnectionStatus('disconnected');
      setRoomState(null);
      return;
    }

    const connect = () => {
      setConnectionStatus('connecting');

      // Resolve dynamic address
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}`;

      console.log(`[WS] Attempting join in room ${roomId} at url: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log(`[WS] Connected successfully to server`);
        setConnectionStatus('connected');

        // Clear any reconnection trigger
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Send Join payload
        ws.send(JSON.stringify({
          type: "join-room",
          payload: {
            roomId,
            role,
            userName,
            profilePic,
            ...initialConfig
          }
        }));

        // Send out buffered frames
        while (messageQueueRef.current.length > 0) {
          const buffered = messageQueueRef.current.shift();
          if (buffered) ws.send(buffered);
        }

        // Keepalive pinginterval
        keepAliveIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          if (type === "pong") {
            // Heartbeat proof
            return;
          }

          console.log(`[WS] Received operation: ${type}`, payload);

          switch (type) {
            case "room-state":
              setRoomState(payload);
              break;

            case "presence-update":
              setRoomState(prev => prev ? {
                ...prev,
                participants: payload.participants
              } : null);
              break;

            case "draft-update":
              setRoomState(prev => prev ? {
                ...prev,
                activeDraft: payload.draftText
              } : null);
              break;

            case "question-update":
              setRoomState(prev => prev ? {
                ...prev,
                activeQuestion: payload.questionData,
                currentRound: payload.currentRound,
                status: payload.status || prev.status
              } : null);
              break;

            case "status-update":
              setRoomState(prev => prev ? {
                ...prev,
                status: payload.status,
                history: payload.history || prev.history
              } : null);
              break;

            case "chat-update":
              setRoomState(prev => prev ? {
                ...prev,
                chats: payload.chats
              } : null);
              break;

            case "reaction-triggered":
              const item = {
                id: Math.random().toString(36).substring(7),
                symbol: payload.symbol,
                sender: payload.userName
              };
              setLiveReactions(prev => [...prev, item]);
              // Clear reaction automatically
              setTimeout(() => {
                setLiveReactions(prev => prev.filter(r => r.id !== item.id));
              }, 4000);
              break;

            case "hint-triggered":
              setLiveHint({
                text: payload.hintText,
                sender: payload.userName,
                timestamp: new Date()
              });
              break;

            default:
              break;
          }

        } catch (err) {
          console.error("[WS] client parsing fail:", err);
        }
      };

      ws.onclose = (event) => {
        console.warn(`[WS] Socket disconnected`, event);
        setConnectionStatus('disconnected');
        clearInterval(keepAliveIntervalRef.current);

        // Auto retry with exponent
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 4000);
      };

      ws.onerror = (err) => {
        console.error("[WS] Socket client error recorded:", err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(keepAliveIntervalRef.current);
    };
  }, [roomId, role, userName, profilePic]);

  return {
    connectionStatus,
    roomState,
    liveReactions,
    liveHint,
    clearLiveHint: () => setLiveHint(null),
    triggerReaction,
    sendLiveHint,
    sendChatMessage,
    syncDraftText,
    syncActiveQuestion,
    syncStatusAndHistory
  };
}
