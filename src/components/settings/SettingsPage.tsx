import React, { useState } from 'react';
import { Settings, Building, Users, Bell, Shield, Database, Palette, UserCheck } from 'lucide-react';
import DepartmentsModal from './DepartmentsModal';
import UsersModal from './UsersModal';
import RolesModal from './RolesModal';

const SettingsPage: React.FC = () => {
  const [showDepartmentsModal, setShowDepartmentsModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);

  const settingsOptions = [
    {
      id: 'departments',
      title: 'Setores',
      description: 'Gerenciar departamentos e estrutura organizacional',
      icon: Building,
      color: 'bg-blue-100 text-blue-600',
      onClick: () => setShowDepartmentsModal(true)
    },
    {
      id: 'users',
      title: 'Usuários',
      description: 'Gerenciar usuários e permissões do sistema',
      icon: Users,
      color: 'bg-green-100 text-green-600',
      onClick: () => setShowUsersModal(true)
    },
    {
      id: 'roles',
      title: 'Papéis e Permissões',
      description: 'Gerenciar papéis do sistema e suas permissões',
      icon: UserCheck,
      color: 'bg-purple-100 text-purple-600',
      onClick: () => setShowRolesModal(true)
    },
    {
      id: 'notifications',
      title: 'Notificações',
      description: 'Configurar alertas e notificações automáticas',
      icon: Bell,
      color: 'bg-yellow-100 text-yellow-600',
      onClick: () => console.log('Notifications clicked')
    },
    {
      id: 'security',
      title: 'Segurança',
      description: 'Configurações de segurança e autenticação',
      icon: Shield,
      color: 'bg-red-100 text-red-600',
      onClick: () => console.log('Security clicked')
    },
    {
      id: 'integrations',
      title: 'Integrações',
      description: 'Conectar com sistemas externos e APIs',
      icon: Database,
      color: 'bg-purple-100 text-purple-600',
      onClick: () => console.log('Integrations clicked')
    },
    {
      id: 'appearance',
      title: 'Aparência',
      description: 'Personalizar tema e layout do sistema',
      icon: Palette,
      color: 'bg-pink-100 text-pink-600',
      onClick: () => console.log('Appearance clicked')
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Settings className="w-8 h-8 text-[#FF6B35]" />
          <h1 className="text-3xl font-bold text-[#404040]">Configurações</h1>
        </div>
        <p className="text-gray-600">
          Gerencie as configurações do sistema e personalize sua experiência
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsOptions.map((option) => {
          const Icon = option.icon;
          return (
            <div
              key={option.id}
              onClick={option.onClick}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 hover:border-[#FF6B35]"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-12 h-12 rounded-lg ${option.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#404040] mb-1">
                    {option.title}
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                {option.description}
              </p>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-[#FF6B35] font-medium hover:text-orange-600 transition-colors">
                  Clique para configurar →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Departments Modal */}
      <DepartmentsModal
        isOpen={showDepartmentsModal}
        onClose={() => setShowDepartmentsModal(false)}
      />

      {/* Users Modal */}
      <UsersModal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
      />

      {/* Users Modal */}
      <UsersModal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
      />

      {/* Roles Modal */}
      <RolesModal
        isOpen={showRolesModal}
        onClose={() => setShowRolesModal(false)}
      />
    </div>
  );
};

export default SettingsPage;
