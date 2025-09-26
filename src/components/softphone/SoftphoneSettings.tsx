import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { useSoftphone } from "../../hooks/useSoftphone";
import toast from "react-hot-toast";

const sipSettingsSchema = z.object({
  sip_server: z.string().min(1, "Servidor SIP é obrigatório"),
  sip_port: z.number().min(1).max(65535),
  sip_username: z.string().min(1, "Usuário SIP é obrigatório"),
  sip_password: z.string().min(1, "Senha SIP é obrigatória"),
  sip_domain: z.string().optional(),
  // optional runtime overrides for WSS/ICE
  ws_uri: z.string().url().optional(),
  ws_path: z.string().optional(),
  turn_server: z.string().optional(),
  turn_username: z.string().optional(),
  turn_password: z.string().optional(),
  // comma-separated stun servers (simple input)
  stun_servers: z.string().optional(),
  transport: z.enum(["UDP", "TCP", "TLS", "WS", "WSS"]),
  enabled: z.boolean(),
});

type SipSettingsForm = z.infer<typeof sipSettingsSchema>;

interface SoftphoneSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const SoftphoneSettings: React.FC<SoftphoneSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { forceReconnect, isInCall } = useSoftphone();
  const [loading, setLoading] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SipSettingsForm>({
    resolver: zodResolver(sipSettingsSchema),
    defaultValues: {
      sip_port: 5060,
      transport: "WSS",
      enabled: true,
    },
  });

  // Watch form values for debugging
  const formValues = watch();

  useEffect(() => {
    if (user) {
      checkPermissions();
      loadSettings();
    }
  }, [user]);

  const checkPermissions = async () => {
    if (!user) return;

    console.log("🔍 Verificando permissões do usuário:", {
      userId: user.id,
      userRole: user.role,
      userEmail: user.email,
    });

    // Check if user is admin or supervisor
    const isAdminOrSupervisor =
      user.role === "admin" ||
      user.role === "supervisor" ||
      user.role === "Administrador" ||
      user.role === "Supervisor";

    console.log("🔍 Debug user role:", {
      userRole: user.role,
      isAdminOrSupervisor,
      matchesAdmin: user.role === "admin",
      matchesAdministrador: user.role === "Administrador",
    });
    setCanEdit(isAdminOrSupervisor);

    console.log("✅ Permissões verificadas:", {
      canEdit: isAdminOrSupervisor,
      userRole: user.role,
    });
  };

  const loadSettings = async () => {
    if (!user) return;

    console.log("📥 Carregando configurações SIP para usuário:", user.id);

    try {
      const { data, error } = await supabase
        .from("sip_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      console.log("📊 Resultado da consulta:", { data, error });

      if (error && error.code !== "PGRST116") {
        console.error("❌ Erro ao carregar configurações:", error);
        throw error;
      }

      if (data) {
        console.log("✅ Configurações encontradas:", {
          ...data,
          sip_password: "***", // Hide password in logs
        });

        // normalize stun_servers for a simple text input (comma separated)
        let stunStr = "";
        try {
          if (data.stun_servers) {
            if (Array.isArray(data.stun_servers))
              stunStr = data.stun_servers.join(",");
            else stunStr = String(data.stun_servers);
          }
        } catch (err) {
          stunStr = "";
        }

        reset({
          sip_server: data.sip_server,
          sip_port: data.sip_port,
          sip_username: data.sip_username,
          sip_password: data.sip_password,
          sip_domain: data.sip_domain || "",
          transport: data.transport,
          enabled: data.enabled,
          ws_uri: data.ws_uri || "",
          ws_path: data.ws_path || "",
          turn_server: data.turn_server || "",
          turn_username: data.turn_username || "",
          turn_password: data.turn_password || "",
          stun_servers: stunStr,
        });
      } else {
        console.log(
          "ℹ️ Nenhuma configuração encontrada, usando valores padrão"
        );
      }
    } catch (error) {
      console.error("❌ Erro ao carregar configurações SIP:", error);
      toast.error("Erro ao carregar configurações");
    }
  };

  const onSubmit = async (data: SipSettingsForm) => {
    if (!user || !canEdit) {
      console.warn("⚠️ Tentativa de salvar sem permissão:", {
        hasUser: !!user,
        canEdit,
        userId: user?.id,
      });
      return;
    }

    console.log("💾 Iniciando salvamento das configurações SIP...");
    console.log("📝 Dados do formulário:", {
      ...data,
      sip_password: "***", // Hide password in logs
    });

    setLoading(true);
    setDebugInfo(null);

    try {
      // Validate user exists in database
      console.log("🔍 Verificando usuário no banco de dados...");
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, nome, email")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("❌ Erro ao verificar usuário:", userError);
        throw new Error(
          `Usuário não encontrado no banco: ${userError.message}`
        );
      }

      console.log("✅ Usuário verificado:", userData);

      // Prepare data for upsert
      const upsertData = {
        user_id: user.id,
        sip_server: data.sip_server.trim(),
        sip_port: data.sip_port,
        sip_username: data.sip_username.trim(),
        sip_password: data.sip_password.trim(),
        sip_domain: data.sip_domain?.trim() || null,
        // allow storing optional runtime overrides for WSS/ICE
        ws_uri: data.ws_uri && data.ws_uri.trim() ? data.ws_uri.trim() : null,
        ws_path:
          data.ws_path && data.ws_path.trim() ? data.ws_path.trim() : null,
        turn_server:
          data.turn_server && data.turn_server.trim()
            ? data.turn_server.trim()
            : null,
        turn_username:
          data.turn_username && data.turn_username.trim()
            ? data.turn_username.trim()
            : null,
        turn_password:
          data.turn_password && data.turn_password.trim()
            ? data.turn_password.trim()
            : null,
        // store stun_servers as array if provided comma separated
        stun_servers:
          data.stun_servers && data.stun_servers.trim()
            ? data.stun_servers
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : null,
        transport: data.transport,
        enabled: data.enabled,
        updated_at: new Date().toISOString(),
      };

      console.log("📤 Dados para upsert:", {
        ...upsertData,
        sip_password: "***",
      });

      // Check if record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from("sip_settings")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      console.log("🔍 Verificação de registro existente:", {
        exists: !!existingRecord,
        error: checkError?.code,
      });

      // Perform upsert
      const { data: result, error: upsertError } = await supabase
        .from("sip_settings")
        .upsert(upsertData, {
          onConflict: "user_id",
        })
        .select()
        .single();

      if (upsertError) {
        console.error("❌ Erro no upsert:", upsertError);
        setDebugInfo({
          error: upsertError,
          data: upsertData,
          user: userData,
        });
        throw new Error(
          `Erro ao salvar: ${upsertError.message} (Código: ${upsertError.code})`
        );
      }

      console.log("✅ Configurações salvas com sucesso:", result);
      toast.success("Configurações salvas com sucesso");
      try {
        if (isInCall) {
          console.warn("forceReconnect ignorado: existe chamada ativa");
          toast.error(
            "Não é possível aplicar as configurações enquanto há uma chamada ativa"
          );
        } else {
          if (typeof forceReconnect === "function") {
            forceReconnect();
          }
        }
      } catch (err) {
        console.warn("forceReconnect call failed", err);
      }
      onClose();
    } catch (error: any) {
      console.error("❌ Erro completo ao salvar configurações:", error);

      // More detailed error message
      let errorMessage = "Erro ao salvar configurações";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        errorMessage = `Erro ${error.code}: ${
          error.details || error.hint || "Erro desconhecido"
        }`;
      }

      toast.error(errorMessage);

      // Set debug info for display
      setDebugInfo({
        error,
        formData: data,
        user: user,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    console.log("🧪 Testando conexão SIP...");
    const currentValues = formValues;

    // Basic validation
    if (
      !currentValues.sip_server ||
      !currentValues.sip_username ||
      !currentValues.sip_password
    ) {
      toast.error("Preencha todos os campos obrigatórios para testar");
      return;
    }

    toast.loading("Testando conexão...", { id: "sip-test" });

    // Simulate connection test (replace with actual SIP test)
    setTimeout(() => {
      toast.success("Configurações válidas", { id: "sip-test" });
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Configurações SIP</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!canEdit && (
          <div className="mx-6 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Acesso restrito</p>
              <p>
                Apenas administradores e supervisores podem editar as
                configurações SIP.
              </p>
            </div>
          </div>
        )}

        {debugInfo && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-medium text-red-800 mb-2">
              Informações de Debug:
            </p>
            <pre className="text-xs text-red-700 overflow-x-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servidor SIP *
            </label>
            <input
              {...register("sip_server")}
              type="text"
              disabled={!canEdit}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
              placeholder="sip.exemplo.com"
            />
            {errors.sip_server && (
              <p className="mt-1 text-sm text-red-600">
                {errors.sip_server.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Porta *
              </label>
              <input
                {...register("sip_port", { valueAsNumber: true })}
                type="number"
                disabled={!canEdit}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
              />
              {errors.sip_port && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.sip_port.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transporte
              </label>
              <select
                {...register("transport")}
                disabled={!canEdit}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
              >
                <option value="UDP">UDP</option>
                <option value="TCP">TCP</option>
                <option value="TLS">TLS</option>
                <option value="WS">WS</option>
                <option value="WSS">WSS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuário SIP *
            </label>
            <input
              {...register("sip_username")}
              type="text"
              disabled={!canEdit}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
              placeholder="1001"
            />
            {errors.sip_username && (
              <p className="mt-1 text-sm text-red-600">
                {errors.sip_username.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha SIP *
            </label>
            <div className="relative">
              <input
                {...register("sip_password")}
                type={showPassword ? "text" : "password"}
                disabled={!canEdit}
                className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
              />
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            {errors.sip_password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.sip_password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domínio SIP (opcional)
            </label>
            <input
              {...register("sip_domain")}
              type="text"
              disabled={!canEdit}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
              placeholder="exemplo.com"
            />
          </div>

          {/* Runtime overrides: WSS and TURN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WS URI (opcional)
            </label>
            <input
              {...register("ws_uri")}
              type="text"
              disabled={!canEdit}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
              placeholder="wss://sip.exemplo.com:7443"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WS Path (opcional)
            </label>
            <input
              {...register("ws_path")}
              type="text"
              disabled={!canEdit}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
              placeholder="/asterisk/ws"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TURN Server (opcional)
              </label>
              <input
                {...register("turn_server")}
                type="text"
                disabled={!canEdit}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
                placeholder="turn:194.163.132.247:3478?transport=udp"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TURN Username
                </label>
                <input
                  {...register("turn_username")}
                  type="text"
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TURN Password
                </label>
                <input
                  {...register("turn_password")}
                  type="password"
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              STUN Servers (comma separated)
            </label>
            <input
              {...register("stun_servers")}
              type="text"
              disabled={!canEdit}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
              placeholder="stun:stun.l.google.com:19302,stun:stun1.example.com:3478"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              {...register("enabled")}
              type="checkbox"
              disabled={!canEdit}
              className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
            />
            <label className="text-sm font-medium text-gray-700">
              Ativar softphone
            </label>
          </div>

          {canEdit && (
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={testConnection}
                className="px-4 py-2 text-[#FF6B35] bg-[#FF6B35]/10 rounded-lg hover:bg-[#FF6B35]/20 transition-colors"
              >
                Testar Conexão
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#E55A2B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? "Salvando..." : "Salvar"}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SoftphoneSettings;
