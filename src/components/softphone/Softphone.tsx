import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  X,
  Minimize2,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  // User,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useSoftphone } from "../../hooks/useSoftphone";
import { formatPhoneNumber } from "../../utils/phoneUtils";
import SoftphoneSettings from "./SoftphoneSettings";
import CallHistory from "./CallHistory";
import Dialpad from "./Dialpad";

interface SoftphoneProps {
  isOpen: boolean;
  onClose: () => void;
}

const Softphone: React.FC<SoftphoneProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    isRegistered,
    isInCall,
    callDirection,
    callDuration,
    remoteIdentity,
    isMuted,
    isOnHold,
    makeCall,
    hangup,
    toggleMute,
    toggleHold,
    sendDTMF,
    playRemoteAudio,
  } = useSoftphone();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"dialpad" | "history">("dialpad");
  const [isMinimized, setIsMinimized] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 });

  const handleCall = () => {
    if (phoneNumber && !isInCall) {
      makeCall(phoneNumber);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (isInCall) {
      sendDTMF(digit);
    } else {
      setPhoneNumber((prev) => prev + digit);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    // Set default position to bottom-right on first open
    if (isOpen && !pos) {
      const w = typeof window !== "undefined" ? window.innerWidth : 1200;
      const h = typeof window !== "undefined" ? window.innerHeight : 800;
      const width = 320; // menor largura para softphone flutuante
      const left = Math.max(12, w - width - 20);
      const top = Math.max(60, h - 420);
      setPos({ left, top });
    }
  }, [isOpen, pos]);

  useEffect(() => {
    const onPointerMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      const { x, y, left, top } = dragStartRef.current;
      const dx = ev.clientX - x;
      const dy = ev.clientY - y;
      setPos({ left: Math.max(8, left + dx), top: Math.max(8, top + dy) });
    };
    const onPointerUp = () => {
      draggingRef.current = false;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  if (!isOpen) return null;

  // Render minimized floating button
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50"
        style={{ pointerEvents: "auto" }}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 rounded-full bg-[#FF6B35] shadow-lg flex items-center justify-center text-white"
          title="Abrir softphone"
        >
          <Phone className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50"
      style={{ left: pos?.left ?? 100, top: pos?.top ?? 100 }}
    >
      <div
        ref={dragRef}
        className="bg-white rounded-2xl shadow-2xl w-80 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div
          className="bg-gradient-to-r from-[#FF6B35] to-[#FF8A65] p-4 text-white cursor-grab"
          onPointerDown={(ev) => {
            // start dragging
            (ev.target as Element).setPointerCapture?.(ev.pointerId);
            draggingRef.current = true;
            dragStartRef.current = {
              x: ev.clientX,
              y: ev.clientY,
              left: pos?.left ?? 100,
              top: pos?.top ?? 100,
            };
            const onPointerMove = (e: PointerEvent) => {
              if (!draggingRef.current) return;
              const { x, y, left, top } = dragStartRef.current;
              const dx = e.clientX - x;
              const dy = e.clientY - y;
              setPos({
                left: Math.max(8, left + dx),
                top: Math.max(8, top + dy),
              });
            };
            const onPointerUp = () => {
              draggingRef.current = false;
              document.removeEventListener("pointermove", onPointerMove);
              document.removeEventListener("pointerup", onPointerUp);
            };
            document.addEventListener("pointermove", onPointerMove);
            document.addEventListener("pointerup", onPointerUp);
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Softphone</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => playRemoteAudio()}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Ativar áudio"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Configurações"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Minimizar"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setIsMinimized(false);
                  onClose();
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${
                isRegistered ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span>{isRegistered ? "Conectado" : "Desconectado"}</span>
            {user && <span className="opacity-75">• {user.name}</span>}
          </div>
        </div>

        {/* Call Status: mostra também durante discagem de saída */}
        {(isInCall || callDirection === "outgoing") && (
          <div className="bg-gray-50 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {callDirection === "incoming" ? (
                  <PhoneIncoming className="w-5 h-5 text-green-600" />
                ) : (
                  <PhoneOutgoing className="w-5 h-5 text-blue-600" />
                )}
                <div>
                  <p className="font-medium">
                    {formatPhoneNumber(remoteIdentity || "")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isInCall
                      ? callDirection === "incoming"
                        ? "Chamada recebida"
                        : "Em chamada"
                      : "Ligando..."}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                {isInCall ? (
                  <>
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">
                      {formatDuration(callDuration)}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-500 italic">
                    Aguardando atendimento
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("dialpad")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "dialpad"
                ? "text-[#FF6B35] border-b-2 border-[#FF6B35]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Teclado
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "text-[#FF6B35] border-b-2 border-[#FF6B35]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Histórico
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === "dialpad" ? (
            <>
              {/* Phone Number Input */}
              <div className="mb-4">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!isInCall) handleCall();
                    }
                  }}
                  placeholder="Digite o número..."
                  className="w-full px-4 py-3 text-lg text-center border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  disabled={isInCall}
                />
              </div>

              {/* Dialpad */}
              <Dialpad onKeyPress={handleKeyPress} disabled={!isRegistered} />

              {/* Call Controls */}
              <div className="mt-4 flex items-center justify-center space-x-4">
                {isInCall ? (
                  <>
                    <button
                      onClick={toggleMute}
                      className={`p-4 rounded-full transition-all ${
                        isMuted
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      title={isMuted ? "Ativar microfone" : "Silenciar"}
                    >
                      {isMuted ? (
                        <MicOff className="w-6 h-6" />
                      ) : (
                        <Mic className="w-6 h-6" />
                      )}
                    </button>

                    <button
                      onClick={hangup}
                      className="p-5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Encerrar chamada"
                    >
                      <PhoneOff className="w-7 h-7" />
                    </button>

                    <button
                      onClick={toggleHold}
                      className={`p-4 rounded-full transition-all ${
                        isOnHold
                          ? "bg-orange-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      title={isOnHold ? "Retomar chamada" : "Colocar em espera"}
                    >
                      {isOnHold ? (
                        <VolumeX className="w-6 h-6" />
                      ) : (
                        <Volume2 className="w-6 h-6" />
                      )}
                    </button>
                  </>
                ) : callDirection === "outgoing" ? (
                  // Durante discagem de saída, mostrar botão para cancelar (hangup/terminate)
                  <button
                    onClick={hangup}
                    className="p-5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Cancelar chamada"
                  >
                    <PhoneOff className="w-7 h-7" />
                  </button>
                ) : (
                  <button
                    onClick={handleCall}
                    disabled={!phoneNumber || !isRegistered}
                    className="p-5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    title="Realizar chamada"
                  >
                    <Phone className="w-7 h-7" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <CallHistory onSelectNumber={setPhoneNumber} />
          )}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <SoftphoneSettings
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Softphone;
