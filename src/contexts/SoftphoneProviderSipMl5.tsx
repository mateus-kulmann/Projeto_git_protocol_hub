import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { SoftphoneContext } from "./SoftphoneContext";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

type UserStatus = "online" | "offline" | "away";

interface SipConfig {
  sip_server?: string;
  sip_port?: number;
  sip_username?: string;
  sip_password?: string;
  sip_domain?: string | null;
  ws_uri?: string | null;
  ws_path?: string | null;
  turn_server?: string | null;
  turn_username?: string | null;
  turn_password?: string | null;
  stun_servers?: string[] | null;
  enabled?: boolean;
  password?: string;
  username?: string;
  server?: string;
  port?: number;
}

declare global {
  interface Window {
    SIPml: any;
  }
}

export const SoftphoneProviderSipJs: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();

  // Refs
  const sipStackRef = useRef<any>(null);
  const registerSessionRef = useRef<any>(null);
  const callSessionRef = useRef<any>(null);
  const lastCallEndedAtRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializationRef = useRef<boolean>(false); // Previne múltiplas inicializações
  // Evita recriar stack durante janelas curtas após iniciar/receber chamada
  const suppressStackUntilRef = useRef<number | null>(null);
  // Previne múltiplos carregamentos concorrentes de configurações SIP
  const sipSettingsLoadingRef = useRef<boolean>(false);

  // Estados
  const [sipConfig, setSipConfig] = useState<SipConfig | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [connectionState, setConnectionState] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus>("offline");
  const [statusLoading, setStatusLoading] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callDirection, setCallDirection] = useState<
    "incoming" | "outgoing" | null
  >(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [remoteIdentity, setRemoteIdentity] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [sipmlInitialized, setSipmlInitialized] = useState(false);
  const [isLeader, setIsLeader] = useState(true);

  // Event Listener para sessões (registro e chamadas)
  const eventsListener = useCallback(
    (e: any) => {
      console.log("[Softphone] Event:", e.type, e.description);

      switch (e.type) {
        case "connecting":
          if (e.session === registerSessionRef.current) {
            console.log("[Softphone] Conectando registro...");
            setConnectionState("connecting");
          } else {
            console.log("[Softphone] Conectando chamada...");
            setConnectionState("calling");
          }
          break;

        case "connected":
          if (e.session === registerSessionRef.current) {
            console.log("[Softphone] ✅ REGISTRADO COM SUCESSO!");
            setIsRegistered(true);
            setConnectionState("registered");
            setConnectionError(null);
            toast.success("Softphone registrado com sucesso");
          } else {
            console.log("[Softphone] Chamada conectada!");
            setIsInCall(true);
            // Evitar recriação de stack por condições de corrida logo após conectar
            suppressStackUntilRef.current = Date.now() + 5000;
            setConnectionState("in_call");

            if (audioRef.current) {
              audioRef.current.muted = false;
            }

            // Reset duration; actual timer is gerenciado por useEffect(isInCall)
            setCallDuration(0);

            toast.success("Chamada conectada");
          }
          break;

        case "terminated":
          if (e.session === registerSessionRef.current) {
            console.log("[Softphone] Registro terminado");
            // Só resetar se foi erro ou desregistro intencional
            if (
              e.description &&
              (e.description.includes("error") ||
                e.description.includes("unregister"))
            ) {
              setIsRegistered(false);
              setConnectionState("disconnected");
              if (e.description.includes("error")) {
                setConnectionError("Registro perdido");
              }
            }
          } else {
            console.log("[Softphone] Chamada terminada");
            setIsInCall(false);
            setCallDirection(null);
            setRemoteIdentity(null);
            setIsMuted(false);
            setIsOnHold(false);
            callSessionRef.current = null;

            // Registrar o momento do término para evitar stop/re-register imediato
            lastCallEndedAtRef.current = Date.now();

            if (callTimerRef.current) {
              clearInterval(callTimerRef.current);
              callTimerRef.current = null;
            }

            // Manter o estado como registrado se ainda estamos registrados
            if (isRegistered) {
              setConnectionState("registered");
            }
          }
          break;

        case "failed":
          if (e.session === registerSessionRef.current) {
            console.error("[Softphone] Registro falhou:", e.description);
            setIsRegistered(false);
            setConnectionError("Falha no registro");
            setConnectionState("error");
            toast.error("Erro no registro SIP");
          } else {
            console.error("[Softphone] Chamada falhou:", e.description);
            toast.error("Chamada falhou");
            setIsInCall(false);
            setCallDirection(null);
            setRemoteIdentity(null);
            callSessionRef.current = null;

            // Voltar ao estado registrado após falha na chamada
            if (isRegistered) {
              setConnectionState("registered");
            }
          }
          break;

        case "i_request":
          const code = e.getSipResponseCode ? e.getSipResponseCode() : null;
          if (code === 200 && e.session === registerSessionRef.current) {
            console.log("[Softphone] Registro confirmado (200 OK)");
            setIsRegistered(true);
            setConnectionState("registered");
            setConnectionError(null);
          } else if (code === 401 || code === 403) {
            console.error("[Softphone] Erro de autenticação:", code);
            setConnectionError(`Erro de autenticação: ${code}`);
            toast.error("Erro de autenticação SIP");
          } else if (
            code &&
            code >= 400 &&
            e.session === registerSessionRef.current
          ) {
            console.error(`[Softphone] Erro SIP (${code}):`, e.description);
            setConnectionError(`Erro SIP: ${code}`);
          }
          break;

        default:
          console.debug("[Softphone] Evento não tratado:", e.type);
      }
    },
    [isRegistered]
  );

  // Ref estável para eventsListener para passar a listeners nas sessões
  const eventsListenerRef = useRef<typeof eventsListener | null>(null);
  useEffect(() => {
    eventsListenerRef.current = eventsListener;
  }, [eventsListener]);

  // Event Listener para Stack
  const onSipEventStack = useCallback(
    (e: any) => {
      console.log("[Softphone] Stack Event:", e.type, e.description);

      switch (e.type) {
        case "started":
          console.log("[Softphone] SIP Stack iniciado");
          setConnectionState("started");
          setConnectionError(null);

          // Iniciar registro
          login();
          break;

        case "stopped":
          console.log("[Softphone] SIP Stack parado");
          setIsRegistered(false);
          setConnectionState("stopped");
          break;

        case "failed_to_start":
          console.error("[Softphone] Falha ao iniciar stack:", e.description);
          setConnectionError(`Falha ao iniciar: ${e.description}`);
          setConnectionState("error");
          toast.error("Erro ao conectar softphone");
          break;

        case "i_new_call":
          console.log("[Softphone] Chamada recebida");
          // Evitar recriação do stack enquanto tratamos a nova chamada
          suppressStackUntilRef.current = Date.now() + 5000;
          callSessionRef.current = e.newSession;
          setCallDirection("incoming");

          const callerInfo =
            e.newSession.getRemoteFriendlyName() ||
            e.newSession.getRemoteUri() ||
            "Número desconhecido";
          setRemoteIdentity(callerInfo);

          e.newSession.setConfiguration({
            audio_remote: audioRef.current,
            events_listener: {
              events: "*",
              listener: (ev: any) =>
                eventsListenerRef.current && eventsListenerRef.current(ev),
            },
          });
          break;

        default:
          console.debug("[Softphone] Evento stack não tratado:", e.type);
      }
    },
    [eventsListener]
  );

  // Mantém a versão mais recente do onSipEventStack em um ref para passar
  // um listener estável para a stack e evitar recriações indesejadas.
  const onSipEventStackRef = useRef<typeof onSipEventStack | null>(null);
  useEffect(() => {
    onSipEventStackRef.current = onSipEventStack;
  }, [onSipEventStack]);

  // Função de login/registro
  const login = useCallback(() => {
    if (!sipStackRef.current) {
      console.error("[Softphone] Stack não disponível para registro");
      return;
    }

    try {
      console.log("[Softphone] Criando sessão de registro...");

      registerSessionRef.current = sipStackRef.current.newSession("register", {
        events_listener: {
          events: "*",
          listener: (ev: any) =>
            eventsListenerRef.current && eventsListenerRef.current(ev),
        },
      });

      if (registerSessionRef.current) {
        console.log("[Softphone] Iniciando registro...");
        registerSessionRef.current.register();
      } else {
        console.error("[Softphone] Falha ao criar sessão de registro");
      }
    } catch (error) {
      console.error("[Softphone] Erro no registro:", error);
      setConnectionError(`Erro no registro: ${error}`);
    }
  }, []);

  // Verificar se SipML5 está carregado
  const checkSipML5 = useCallback(() => {
    return (
      typeof window !== "undefined" &&
      window.SIPml &&
      typeof window.SIPml.isReady === "function" &&
      window.SIPml.isReady()
    );
  }, []);

  // Inicializar SipML5
  const initializeSipML5 = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (checkSipML5()) {
        console.log("[Softphone] SipML5 já inicializado");
        setSipmlInitialized(true);
        resolve();
        return;
      }

      if (!window.SIPml) {
        reject(new Error("SipML5 não está carregado"));
        return;
      }

      console.log("[Softphone] Inicializando SipML5...");

      window.SIPml.init((e: any) => {
        console.log("[Softphone] SipML5 init callback:", e);

        if (e && (e.type === "started" || e.type === "i_start")) {
          console.log("[Softphone] SipML5 inicializado com sucesso");
          setSipmlInitialized(true);
          resolve();
        } else if (e && e.type === "failed_to_start") {
          reject(new Error(`Falha na inicialização: ${e.description}`));
        } else {
          setTimeout(() => {
            if (
              window.SIPml &&
              window.SIPml.isReady &&
              window.SIPml.isReady()
            ) {
              console.log("[Softphone] SipML5 inicializado (fallback)");
              setSipmlInitialized(true);
              resolve();
            } else {
              reject(new Error("Timeout na inicialização"));
            }
          }, 1000);
        }
      });
    });
  }, [checkSipML5]);

  // Carregar configurações SIP (com cache para evitar múltiplas chamadas)
  const loadSipSettings = useCallback(async () => {
    if (!user || sipConfig) return sipConfig; // Evita recarregar se já tem config
    if (sipSettingsLoadingRef.current) return sipConfig;
    sipSettingsLoadingRef.current = true;

    try {
      const { data, error } = await supabase
        .from("sip_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.debug("[Softphone] Sem configurações SIP:", error);
        return null;
      }

      console.log("[Softphone] Configurações carregadas:", {
        server: data.sip_server || data.server,
        username: data.sip_username || data.username,
        domain: data.sip_domain,
        hasPassword: !!(data.sip_password || data.password),
      });

      setSipConfig(data);
      return data as SipConfig;
    } catch (error) {
      console.error("[Softphone] Erro ao carregar configurações:", error);
      return null;
    } finally {
      sipSettingsLoadingRef.current = false;
    }
  }, [user, sipConfig]);

  // Métodos de chamada
  const makeCall = useCallback(
    (target: string) => {
      if (!sipStackRef.current || !isRegistered) {
        toast.error("Softphone não está conectado");
        return Promise.reject(new Error("Not registered"));
      }

      // Não permitir nova chamada se já está em chamada
      if (isInCall) {
        toast.error("Já existe uma chamada em andamento");
        return Promise.reject(new Error("Call in progress"));
      }

      try {
        console.log("[Softphone] Fazendo chamada para:", target);

        const session = sipStackRef.current.newSession("call-audio", {
          audio_remote: audioRef.current,
          events_listener: {
            events: "*",
            listener: (ev: any) =>
              eventsListenerRef.current && eventsListenerRef.current(ev),
          },
        });

        if (session) {
          callSessionRef.current = session;
          setCallDirection("outgoing");
          setRemoteIdentity(target);
          session.call(target);
          return Promise.resolve();
        } else {
          throw new Error("Falha ao criar sessão");
        }
      } catch (error) {
        console.error("[Softphone] Erro ao fazer chamada:", error);
        toast.error("Erro ao iniciar chamada");
        throw error;
      }
    },
    [isRegistered, isInCall]
  );

  const answer = useCallback(() => {
    if (callSessionRef.current) {
      callSessionRef.current.accept();
    }
  }, []);

  const hangup = useCallback(() => {
    if (callSessionRef.current) {
      callSessionRef.current.hangup();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (callSessionRef.current) {
      if (isMuted) {
        callSessionRef.current.unmute("audio");
      } else {
        callSessionRef.current.mute("audio");
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleHold = useCallback(() => {
    if (callSessionRef.current) {
      if (isOnHold) {
        callSessionRef.current.resume();
      } else {
        callSessionRef.current.hold();
      }
      setIsOnHold(!isOnHold);
    }
  }, [isOnHold]);

  const sendDTMF = useCallback((digit: string) => {
    if (callSessionRef.current) {
      callSessionRef.current.dtmf(digit);
    }
  }, []);

  const forceReconnect = useCallback(() => {
    initializationRef.current = false;
    // Proteção: não forçar reconnect se houver chamada ativa
    if (callSessionRef.current) {
      console.warn("[Softphone] forceReconnect ignorado: existe chamada ativa");
      console.trace("[Softphone] forceReconnect stacktrace");
      return;
    }

    if (sipStackRef.current) {
      console.log(
        "[Softphone] forceReconnect: Parando SIP Stack (forceReconnect)"
      );
      console.trace("[Softphone] forceReconnect stacktrace");
      sipStackRef.current.stop();
      sipStackRef.current = null;
    }
    setIsRegistered(false);
    setConnectionState(null);
    setConnectionError(null);
  }, []);

  const cleanup = useCallback(
    (force = false) => {
      try {
        if (callTimerRef.current) {
          clearInterval(callTimerRef.current);
          callTimerRef.current = null;
        }

        // Se for pedido cleanup forçado durante uma chamada ativa,
        // ignoramos para evitar desregistro acidental (proteção temporária).
        if (force && callSessionRef.current) {
          console.warn("[Softphone] cleanup(force) ignorado: chamada ativa");
          console.trace("[Softphone] cleanup stacktrace (ignorado)");
          return;
        }

        // Evitar unREGISTER imediato logo após o término de uma chamada
        if (force && lastCallEndedAtRef.current) {
          const sinceEnd = Date.now() - lastCallEndedAtRef.current;
          const SUPPRESS_MS = 5000;
          if (sinceEnd >= 0 && sinceEnd < SUPPRESS_MS) {
            console.warn(
              "[Softphone] cleanup(force) suprimido: chamada finalizada há poucos segundos",
              { sinceEnd }
            );
            console.trace("[Softphone] cleanup stacktrace (suprimido)");
            return;
          }
        }

        if (!force && isInCall) {
          return;
        }

        if (sipStackRef.current) {
          console.log("[Softphone] cleanup: Parando SIP Stack", { force });
          console.trace("[Softphone] cleanup stacktrace");
          sipStackRef.current.stop();
          sipStackRef.current = null;
        }

        if (force) {
          initializationRef.current = false;
          setIsRegistered(false);
          setConnectionState(null);
          setConnectionError(null);
          setIsInCall(false);
          setCallDirection(null);
          setRemoteIdentity(null);
          setIsMuted(false);
          setIsOnHold(false);
        }
      } catch (error) {
        console.error("[Softphone] Erro no cleanup:", error);
      }
    },
    [isInCall]
  );

  const changeUserStatus = useCallback(
    async (newStatus: UserStatus) => {
      if (!user || statusLoading) return;

      setStatusLoading(true);

      try {
        await supabase.from("user_status").upsert(
          {
            user_id: user.id,
            status: newStatus,
            last_seen: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        setUserStatus(newStatus);

        if (newStatus === "online") {
          toast.success("Status: Online");
        } else if (newStatus === "offline") {
          // Se o usuário vai offline, desconectamos o softphone
          cleanup(true);
          toast.success("Status: Offline");
        } else {
          // Para 'away' (ausente) apenas atualizamos o status sem desregistrar
          toast.success("Status: Ausente");
        }
      } catch (error) {
        console.error("[Softphone] Erro ao alterar status:", error);
        toast.error("Erro ao alterar status");
      } finally {
        setStatusLoading(false);
      }
    },
    [user, statusLoading, cleanup]
  );

  const playRemoteAudio = useCallback((audioEl?: HTMLAudioElement) => {
    try {
      const element = audioEl || audioRef.current;
      if (element && element.srcObject) {
        element.muted = false;
        element.play().catch(() => {});
      }
    } catch (error) {
      console.warn("[Softphone] Erro ao reproduzir áudio:", error);
    }
  }, []);

  // Criar elemento de áudio
  useEffect(() => {
    const audio = document.createElement("audio");
    audio.autoplay = true;
    audio.muted = true;
    audio.style.display = "none";
    audio.id = "audio_remote";
    audioRef.current = audio;
    document.body.appendChild(audio);

    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          if (audioRef.current.srcObject) {
            (audioRef.current.srcObject as any) = null;
          }
          if (audioRef.current.parentNode) {
            audioRef.current.parentNode.removeChild(audioRef.current);
          }
          audioRef.current = null;
        }
      } catch (err) {
        console.warn("[Softphone] Erro no cleanup de áudio:", err);
      }

      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, []);

  // Gerenciar timer de duração da chamada separadamente para garantir
  // que o contador rode enquanto isInCall for true
  useEffect(() => {
    if (isInCall) {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      // garantir que começamos do zero quando a chamada inicia
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [isInCall]);

  // Carregar status do usuário
  useEffect(() => {
    if (!user) return;

    supabase
      .from("user_status")
      .select("status")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.status) {
          setUserStatus(data.status as UserStatus);
        }
      });
  }, [user]);

  // Carregar configurações SIP apenas uma vez
  useEffect(() => {
    if (user && !sipConfig) {
      loadSipSettings();
    }
  }, [user, sipConfig, loadSipSettings]);

  // Inicializar SipML5 apenas uma vez
  useEffect(() => {
    if (!sipmlInitialized) {
      const timer = setTimeout(() => {
        initializeSipML5().catch((error) => {
          console.error("[Softphone] Erro na inicialização:", error);
          setConnectionError(`SipML5: ${error.message}`);
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [sipmlInitialized, initializeSipML5]);

  // Criar SIP Stack apenas uma vez quando todas as condições são atendidas
  useEffect(() => {
    if (
      sipmlInitialized &&
      sipConfig &&
      userStatus === "online" &&
      !sipStackRef.current &&
      !initializationRef.current &&
      !isInCall && // Não recriar a stack enquanto houver uma chamada ativa
      !callSessionRef.current && // Também garantir que não exista sessão de chamada ativa
      (!suppressStackUntilRef.current ||
        suppressStackUntilRef.current < Date.now())
    ) {
      initializationRef.current = true;
      console.log("[Softphone] Condições atendidas - criando stack único");

      try {
        const server = sipConfig.sip_server || sipConfig.server;
        const port = sipConfig.sip_port || sipConfig.port || 7443;
        const username = sipConfig.sip_username || sipConfig.username;
        const password = sipConfig.sip_password || sipConfig.password;
        const domain = sipConfig.sip_domain || server;

        if (!server || !username || !password) {
          throw new Error("Configurações incompletas");
        }

        let wsUrl = sipConfig.ws_uri;
        if (!wsUrl) {
          const path = sipConfig.ws_path || "";
          wsUrl = `wss://${server}:${port}${path}`;
        }

        console.log("[Softphone] Criando SIP Stack único...");
        sipStackRef.current = new window.SIPml.Stack({
          realm: domain,
          impi: username,
          impu: `sip:${username}@${domain}`,
          password: password,
          display_name: (user as any)?.name || user?.email || username,
          websocket_proxy_url: wsUrl,
          outbound_proxy_url: null,
          ice_servers: sipConfig.stun_servers
            ? sipConfig.stun_servers.map((server) => ({ url: server }))
            : [{ url: "stun:stun.l.google.com:19302" }],
          enable_rtcweb_breaker: false,
          enable_early_ims: true,
          // Passamos um listener que delega para o ref para manter a
          // referência interna da stack estável enquanto usamos a
          // implementação mais recente de onSipEventStack.
          events_listener: {
            events: "*",
            listener: (ev: any) =>
              onSipEventStackRef.current && onSipEventStackRef.current(ev),
          },
        });

        console.log("[Softphone] Stack criado, iniciando...");
        sipStackRef.current.start();
      } catch (error) {
        console.error("[Softphone] Erro ao criar stack:", error);
        setConnectionError(`Erro: ${error}`);
        toast.error("Erro ao inicializar softphone");
        initializationRef.current = false;
      }
    }
  }, [sipmlInitialized, sipConfig, userStatus, user, isInCall]);

  // Cleanup geral
  useEffect(() => {
    return () => cleanup(true);
  }, [cleanup]);

  // Context value
  const value = {
    isRegistered,
    connectionState,
    connectionError,
    userStatus,
    statusLoading,
    isInCall,
    callDirection,
    callDuration,
    remoteIdentity,
    isMuted,
    isOnHold,
    isLeader,
    sipmlInitialized,
    changeUserStatus,
    makeCall,
    answer,
    hangup,
    toggleMute,
    toggleHold,
    sendDTMF,
    forceReconnect,
    cleanup: () => cleanup(false),
    playRemoteAudio,
  } as any;

  return (
    <SoftphoneContext.Provider value={value}>
      {children}
    </SoftphoneContext.Provider>
  );
};

export default SoftphoneProviderSipJs;
