import React, { useState } from 'react';
import { 
  FileText, 
  Users,
  Building, 
  BarChart3, 
  Settings,
  MessageSquare,
  Clock,
  CheckCircle,
  Home,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/', badge: null },
    { icon: FileText, label: 'Protocolos', path: '/protocols', badge: '12' },
    { icon: Users, label: 'Solicitantes', path: '/solicitantes', badge: null },
    { icon: MessageSquare, label: 'Chat Ativo', path: '/chat', badge: '3' },
    { icon: Clock, label: 'Pendentes', path: '/pending', badge: '5' },
    { icon: CheckCircle, label: 'Finalizados', path: '/completed', badge: null },
    { icon: Building, label: 'Setores', path: '/departments', badge: null },
    { icon: BarChart3, label: 'Relatórios', path: '/reports', badge: null },
    { icon: Settings, label: 'Configurações', path: '/settings', badge: null },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`bg-white border-r border-gray-200 text-gray-700 min-h-screen shadow-lg transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-24' : 'w-72'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100 relative">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-[#FF8A65] rounded-xl flex items-center justify-center shadow-md">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-300">
              <h1 className="text-xl font-bold text-gray-800">ProtocolHub</h1>
              <p className="text-xs text-gray-500">Sistema de Gestão</p>
            </div>
          )}
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3 text-gray-600" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] relative ${
                isActive 
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8A65] text-white shadow-lg shadow-orange-500/20' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20' 
                    : 'bg-transparent group-hover:bg-gray-100'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                {!isCollapsed && (
                  <span className="font-medium text-sm transition-opacity duration-300">
                    {item.label}
                  </span>
                )}
              </div>
              
              {item.badge && !isCollapsed && (
                <div className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-[#FF6B35] text-white shadow-sm'
                }`}>
                  {item.badge}
                </div>
              )}
              
              {/* Badge for collapsed state */}
              {item.badge && isCollapsed && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B35] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                  {item.badge}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
    </aside>
  );
};

export default Sidebar;
