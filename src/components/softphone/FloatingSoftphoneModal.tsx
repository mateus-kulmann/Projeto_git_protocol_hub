import React, { useEffect, useRef, useState } from "react";
import { X, Minimize2, Phone, Clock } from "lucide-react";
import { useSoftphone } from "../../hooks/useSoftphone";

interface FloatingSoftphoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABS = ["Discador", "Em chamada", "Histórico", "Configurações"] as const;

const FloatingSoftphoneModal: React.FC<FloatingSoftphoneModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { makeCall, hangup, isInCall, connectionState, callDuration } =
    useSoftphone();
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Discador");
  const containerRef = useRef<HTMLDivElement | null>(null);
  // dragRef reserved for future enhancements

  useEffect(() => {
    if (!isOpen) setIsMinimized(false);
  }, [isOpen]);

  // Draggable simple implementation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let isDragging = false;
    let startX = 0,
      startY = 0;
    let origX = 0,
      origY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-drag-handle]")) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = el.getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.style.left = `${origX + dx}px`;
      el.style.top = `${origY + dy}px`;
      el.style.right = "auto";
      el.style.bottom = "auto";
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [containerRef.current]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-80 md:w-96 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden"
      style={{ right: 24, bottom: 24 }}
      role="dialog"
      aria-modal="false"
    >
      <div
        className="flex items-center justify-between px-3 py-2 bg-zinc-100 dark:bg-zinc-900"
        data-drag-handle
      >
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-green-600" />
          <div className="text-sm font-medium">Softphone</div>
          <div className="text-xs text-zinc-500 ml-2">{connectionState}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Minimizar"
            onClick={() => setIsMinimized((v) => !v)}
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized ? (
        <div className="p-3">
          <div className="flex gap-2 mb-3">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm px-2 py-1 rounded ${
                  activeTab === tab
                    ? "bg-violet-500 text-white"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="h-56 overflow-auto">
            {activeTab === "Discador" && (
              <div>
                <input
                  placeholder="Número"
                  className="w-full p-2 border rounded mb-2 bg-white dark:bg-zinc-800"
                />
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-green-600 text-white p-2 rounded"
                    onClick={() => makeCall("0000")}
                  >
                    Ligar
                  </button>
                  <button
                    className="flex-1 bg-zinc-200 text-zinc-800 p-2 rounded"
                    onClick={() => console.log("abrir contato")}
                  >
                    Contatos
                  </button>
                </div>
              </div>
            )}

            {activeTab === "Em chamada" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold">Em chamada</div>
                    <div className="text-xs text-zinc-500">
                      {isInCall ? "Em chamada ativa" : "Sem chamada"}
                    </div>
                  </div>
                  <div className="text-sm text-zinc-500">
                    {callDuration ?? "00:00"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-red-600 text-white p-2 rounded"
                    onClick={() => hangup()}
                  >
                    Encerrar
                  </button>
                  <button
                    className="flex-1 bg-zinc-200 text-zinc-800 p-2 rounded"
                    onClick={() => console.log("mute")}
                  >
                    Mute
                  </button>
                </div>
              </div>
            )}

            {activeTab === "Histórico" && (
              <div>
                <div className="text-sm text-zinc-500">
                  Nenhum histórico disponível (placeholder)
                </div>
              </div>
            )}

            {activeTab === "Configurações" && (
              <div>
                <div className="text-sm text-zinc-500">
                  Configurações do softphone e dispositivos (placeholder)
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-600" />
            <div className="text-sm">Softphone</div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" />
            <button onClick={() => setIsMinimized(false)} className="p-1">
              Abrir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingSoftphoneModal;
