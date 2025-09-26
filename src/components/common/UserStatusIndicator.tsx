import React, { useState } from "react";
import { Clock, Coffee, LogOut, ChevronDown } from "lucide-react";
import { useSoftphone } from "../../hooks/useSoftphone";
import toast from "react-hot-toast";

const UserStatusIndicator: React.FC = () => {
  const {
    userStatus,
    statusLoading,
    changeUserStatus,
    isRegistered,
    isInCall,
  } = useSoftphone();
  const [showDropdown, setShowDropdown] = useState(false);

  const statusConfig: Record<
    string,
    { color: string; label: string; icon: any }
  > = {
    online: { color: "bg-green-500", label: "Online", icon: Clock },
    away: { color: "bg-yellow-500", label: "Ausente", icon: Coffee },
    offline: { color: "bg-gray-500", label: "Offline", icon: LogOut },
  };

  const currentStatus = statusConfig[userStatus] || statusConfig.online;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        disabled={statusLoading}
      >
        <div
          className={`w-3 h-3 rounded-full ${currentStatus.color} ${
            userStatus === "online" ? "animate-pulse" : ""
          }`}
        ></div>
        <span className="text-sm font-medium text-gray-700">
          {currentStatus.label}
        </span>
        {isRegistered && userStatus !== "offline" && (
          <div
            className="w-2 h-2 bg-blue-500 rounded-full"
            title="Softphone ativo"
          ></div>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 px-2">
              Alterar status:
            </div>
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon;
              const isActive = userStatus === status;

              return (
                <button
                  key={status}
                  onClick={() => {
                    if (isInCall) {
                      console.warn(
                        "changeUserStatus ignorado: existe chamada ativa"
                      );
                      setShowDropdown(false);
                      toast.error(
                        "Não é possível alterar o status durante uma chamada."
                      );
                      return;
                    }

                    changeUserStatus(status as any);
                    setShowDropdown(false);
                  }}
                  disabled={statusLoading || isActive}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                  <Icon className="w-4 h-4" />
                  <span>{config.label}</span>
                  {isActive && <span className="text-xs">(atual)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default UserStatusIndicator;
