import React, { useState } from "react";
import { Bell, User, Search, MessageCircle, Phone } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import UserStatusIndicator from "../common/UserStatusIndicator";
import FloatingSoftphoneModal from "../softphone/FloatingSoftphoneModal";
import Softphone from "../softphone/Softphone";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showSoftphone, setShowSoftphone] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#FF6B35] rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-[#404040]">ProtocolHub</h1>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar protocolos..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent w-80"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Controle de Status do Usuário */}
            <UserStatusIndicator />

            <button
              onClick={() => setShowSoftphone(true)}
              className="relative p-2 text-gray-600 hover:text-[#FF6B35] transition-colors"
              title="Softphone"
            >
              <Phone className="w-5 h-5" />
            </button>

            <button className="relative p-2 text-gray-600 hover:text-[#FF6B35] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#FF6B35] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-[#404040]">{user?.name}</p>
                <p className="text-gray-500">
                  {user?.department_name || user?.role}
                </p>
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors ml-2"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Softphone Modal (restored original) */}
      <Softphone
        isOpen={showSoftphone}
        onClose={() => setShowSoftphone(false)}
      />
    </>
  );
};

export default Header;
