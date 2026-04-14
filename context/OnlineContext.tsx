import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

const getWsUrl = () => {
  return "wss://siphonless-uneffectuated-tai.ngrok-free.dev/ws";
};

export interface PlayerPublicStats {
  money: number;
  reputation: number;
  fans: number;
  marketShare: number;
  year: number;
  month: number;
  gameCount: number;
  consoleCount: number;
}

export interface OnlinePlayer {
  id: string;
  name: string;
  color: string;
  connected: boolean;
  ready: boolean;
  stats: PlayerPublicStats;
  joinedAt: number;
}

export type RoomStatus = "lobby" | "playing" | "paused" | "ended";

export interface OnlineRoom {
  id: string;
  code: string;
  name: string;
  hostId: string;
  status: RoomStatus;
  players: Record<string, OnlinePlayer>;
  tick: number;
  speed: 1 | 2;
  createdAt: number;
  maxPlayers: number;
}

export interface ChatMessage {
  fromId: string;
  fromName: string;
  message: string;
  ts: number;
}

export interface AttackNotification {
  fromId: string;
  fromName: string;
  attackType: string;
  outcome: string;
  damage: number;
  ts: number;
}

export type ConnStatus = "disconnected" | "connecting" | "connected";

interface OnlineContextValue {
  status: ConnStatus;
  room: OnlineRoom | null;
  myId: string | null;
  serverTick: number;
  chatMessages: ChatMessage[];
  attackNotifications: AttackNotification[];
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  createRoom: (roomName: string, playerName: string, color: string) => void;
  joinRoom: (code: string, playerName: string, color: string) => void;
  setReady: (ready: boolean) => void;
  startGame: () => void;
  setPause: (paused: boolean) => void;
  setSpeed: (speed: 1 | 2) => void;
  sendStats: (stats: PlayerPublicStats) => void;
  sendAttack: (targetId: string, attackType: string, outcome: string, damage: number) => void;
  sendChat: (message: string) => void;
  kickPlayer: (targetId: string) => void;
  leaveRoom: () => void;
  clearError: () => void;
}

const OnlineContext = createContext<OnlineContextValue>({
  status: "disconnected",
  room: null,
  myId: null,
  serverTick: 0,
  chatMessages: [],
  attackNotifications: [],
  error: null,
  connect: () => {},
  disconnect: () => {},
  createRoom: () => {},
  joinRoom: () => {},
  setReady: () => {},
  startGame: () => {},
  setPause: () => {},
  setSpeed: () => {},
  sendStats: () => {},
  sendAttack: () => {},
  sendChat: () => {},
  kickPlayer: () => {},
  leaveRoom: () => {},
  clearError: () => {},
});

export function OnlineProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnStatus>("disconnected");
  const [room, setRoom] = useState<OnlineRoom | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [serverTick, setServerTick] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [attackNotifications, setAttackNotifications] = useState<AttackNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingMessages = useRef<object[]>([]);

  const send = useCallback((msg: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      pendingMessages.current.push(msg);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState < 2) return;
    setStatus("connecting");
    setError(null);

    const url = getWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      const pending = pendingMessages.current.splice(0);
      for (const m of pending) ws.send(JSON.stringify(m));
    };

    ws.onmessage = (ev) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(ev.data as string) as Record<string, unknown>;
      } catch {
        return;
      }

      switch (msg.type) {
        case "ROOM_STATE":
          setRoom(msg.room as OnlineRoom);
          setMyId(msg.yourId as string);
          break;
        case "TICK":
          setServerTick((prev) => prev + 1);
          setRoom((prev) => prev ? { ...prev, tick: msg.tick as number } : prev);
          break;
        case "PLAYER_UPDATE":
          setRoom((prev) => {
            if (!prev) return prev;
            const players = { ...prev.players };
            if (players[msg.playerId as string]) {
              players[msg.playerId as string] = {
                ...players[msg.playerId as string],
                stats: msg.stats as PlayerPublicStats,
              };
            }
            return { ...prev, players };
          });
          break;
        case "PLAYER_JOIN":
          setRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              players: {
                ...prev.players,
                [(msg.player as OnlinePlayer).id]: msg.player as OnlinePlayer,
              },
            };
          });
          break;
        case "PLAYER_LEAVE":
          setRoom((prev) => {
            if (!prev) return prev;
            const players = { ...prev.players };
            delete players[msg.playerId as string];
            return { ...prev, players };
          });
          break;
        case "PLAYER_READY":
          setRoom((prev) => {
            if (!prev) return prev;
            const players = { ...prev.players };
            if (players[msg.playerId as string]) {
              players[msg.playerId as string] = {
                ...players[msg.playerId as string],
                ready: msg.ready as boolean,
              };
            }
            return { ...prev, players };
          });
          break;
        case "GAME_STARTED":
          setRoom((prev) => prev ? { ...prev, status: "playing" } : prev);
          break;
        case "GAME_PAUSED":
          setRoom((prev) => prev ? { ...prev, status: msg.paused ? "paused" : "playing" } : prev);
          break;
        case "GAME_OVER":
          setRoom((prev) => prev ? { ...prev, status: "ended" } : prev);
          break;
        case "ATTACK_RECEIVED":
          setAttackNotifications((prev) => [
            ...prev.slice(-19),
            {
              fromId: msg.fromId as string,
              fromName: msg.fromName as string,
              attackType: msg.attackType as string,
              outcome: msg.outcome as string,
              damage: msg.damage as number,
              ts: Date.now(),
            },
          ]);
          break;
        case "CHAT":
          setChatMessages((prev) => [
            ...prev.slice(-99),
            {
              fromId: msg.fromId as string,
              fromName: msg.fromName as string,
              message: msg.message as string,
              ts: msg.ts as number,
            },
          ]);
          break;
        case "KICKED":
          setError(msg.reason as string);
          setRoom(null);
          setMyId(null);
          break;
        case "ERROR":
          setError(msg.message as string);
          break;
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
    };

    ws.onerror = () => {
      setError("Connection failed. Check your network and try again.");
      setStatus("disconnected");
    };
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setRoom(null);
    setMyId(null);
    setStatus("disconnected");
    setServerTick(0);
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const createRoom = useCallback((roomName: string, playerName: string, color: string) => {
    send({ type: "CREATE_ROOM", roomName, playerName, color, maxPlayers: 4 });
  }, [send]);

  const joinRoom = useCallback((code: string, playerName: string, color: string) => {
    send({ type: "JOIN_ROOM", code, playerName, color });
  }, [send]);

  const setReady = useCallback((ready: boolean) => {
    send({ type: "READY", ready });
  }, [send]);

  const startGame = useCallback(() => {
    send({ type: "START_GAME" });
  }, [send]);

  const setPause = useCallback((paused: boolean) => {
    send({ type: "PAUSE", paused });
  }, [send]);

  const setSpeed = useCallback((speed: 1 | 2) => {
    send({ type: "SET_SPEED", speed });
  }, [send]);

  const sendStats = useCallback((stats: PlayerPublicStats) => {
    send({ type: "PLAYER_STATS", stats });
  }, [send]);

  const sendAttack = useCallback((targetId: string, attackType: string, outcome: string, damage: number) => {
    send({ type: "ATTACK", targetId, attackType, outcome, damage });
  }, [send]);

  const sendChat = useCallback((message: string) => {
    send({ type: "CHAT", message });
  }, [send]);

  const kickPlayer = useCallback((targetId: string) => {
    send({ type: "KICK", targetId });
  }, [send]);

  const leaveRoom = useCallback(() => {
    send({ type: "LEAVE" });
    setRoom(null);
    setMyId(null);
    setServerTick(0);
  }, [send]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <OnlineContext.Provider
      value={{
        status,
        room,
        myId,
        serverTick,
        chatMessages,
        attackNotifications,
        error,
        connect,
        disconnect,
        createRoom,
        joinRoom,
        setReady,
        startGame,
        setPause,
        setSpeed,
        sendStats,
        sendAttack,
        sendChat,
        kickPlayer,
        leaveRoom,
        clearError,
      }}
    >
      {children}
    </OnlineContext.Provider>
  );
}

export function useOnline() {
  return useContext(OnlineContext);
}
