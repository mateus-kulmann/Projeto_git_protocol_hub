import React from "react";
import { Clock, Coffee, LogOut, Loader2 } from "lucide-react";
import { useSoftphone } from "../../hooks/useSoftphone";

const UserStatusControl: React.FC = () => {
  const {
    userStatus,
    statusLoading,
    changeUserStatus,
    isRegistered,
    connectionError,
  } = useSoftphone();

  const statusOptions = [
    {
      value: "online",
      label: "Online",
      icon: Clock,
      color: "bg-green-500 text-white",
      hoverColor: "hover:bg-green-600",
      description: "Disponível para atendimento",
    },
    {
      value: "away",
      label: "Ausente",
      icon: Coffee,
      color: "bg-yellow-500 text-white",
      hoverColor: "hover:bg-yellow-600",
      description: "Ausente temporariamente",
    },
    {
      value: "offline",
      label: "Offline",
      icon: LogOut,
      color: "bg-gray-500 text-white",
      hoverColor: "hover:bg-gray-600",
      description: "Não disponível",
    },
  ];

  const getStatusIndicator = () => {
    switch (userStatus) {
      case "online":
        return (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-medium">Online</span>
            {isRegistered && (
              <span className="text-xs text-green-600">(Softphone ativo)</span>
            )}
          </div>
        );
      case "away":
        return (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-700 font-medium">Ausente</span>
            {isRegistered && (
              <span className="text-xs text-yellow-600">(Softphone ativo)</span>
            )}
          </div>
        );
      case "offline":
        return (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-gray-700 font-medium">Offline</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Status de Presença
        </h3>
        {getStatusIndicator()}
      </div>

      {connectionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{connectionError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isActive = userStatus === option.value;

          return (
            <button
              key={option.value}
              onClick={() => changeUserStatus(option.value)}
              disabled={statusLoading || isActive}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                ${
                  isActive
                    ? `${option.color} border-transparent shadow-md`
                    : `bg-gray-50 border-gray-200 text-gray-700 ${option.hoverColor} hover:border-gray-300`
                }
                ${
                  statusLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }
                disabled:cursor-not-allowed
              `}
            >
              <div className="flex flex-col items-center space-y-2">
                {statusLoading && isActive ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
                <span className="font-medium">{option.label}</span>
                <span className="text-xs opacity-80 text-center">
                  {option.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Seu status de presença é registrado para controle de jornada de trabalho
      </div>
    </div>
  );
};

export default UserStatusControl;
