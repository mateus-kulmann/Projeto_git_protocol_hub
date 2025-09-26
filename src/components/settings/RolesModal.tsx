import React, { useState, useEffect } from 'react';
import { X, Plus, Shield, Edit, Trash2, Search, AlertTriangle, Users, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import CreateRoleModal from './CreateRoleModal';
import EditRoleModal from './EditRoleModal';

interface Role {
  id: string;
  nome: string;
  descricao?: string;
  is_system: boolean;
  ativo: boolean;
  created_at: string;
  permission_count?: number;
  user_count?: number;
}

interface RolesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RolesModal: React.FC<RolesModalProps> = ({ isOpen, onClose }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await apiService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Erro ao carregar papéis');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setShowCreateModal(true);
  };

  const handleRoleCreated = () => {
    loadRoles();
    setShowCreateModal(false);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleToggleRoleStatus = async (roleId: string, currentStatus: boolean) => {
    try {
      await apiService.toggleRoleStatus(roleId, !currentStatus);
      toast.success(`Papel ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      loadRoles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status do papel');
    }
  };

  const handleDeleteRole = (roleId: string) => {
    setShowDeleteConfirm(roleId);
  };

  const confirmDelete = async (roleId: string) => {
    try {
      await apiService.deleteRole(roleId);
      toast.success('Papel excluído com sucesso!');
      loadRoles();
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir papel');
    }
  };

  const handleRoleUpdated = () => {
    loadRoles();
    setShowEditModal(false);
    setSelectedRole(null);
  };

  const getRoleIcon = (isSystem: boolean) => {
    return isSystem ? <Shield className="w-5 h-5 text-purple-600" /> : <Users className="w-5 h-5 text-blue-600" />;
  };

  const getRoleColor = (isSystem: boolean) => {
    return isSystem ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };
  
  const filteredRoles = roles.filter(role =>
    role.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-[#FF6B35]" />
              <h2 className="text-xl font-bold text-[#404040]">Gerenciar Papéis e Permissões</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center space-x-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar papéis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateRole}
                className="flex items-center space-x-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Papel</span>
              </button>
            </div>
          </div>

          {/* Roles List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
                <span className="ml-3 text-gray-600">Carregando papéis...</span>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Nenhum papel encontrado' : 'Nenhum papel cadastrado'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando papéis para organizar permissões'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreateRole}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Primeiro Papel</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRoles.map((role) => (
                  <div
                    key={role.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoleColor(role.is_system)}`}>
                          {getRoleIcon(role.is_system)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{role.nome}</h3>
                          {role.descricao && (
                            <p className="text-sm text-gray-600 mt-1">{role.descricao}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {!role.is_system && (
                          <>
                            <button
                              onClick={() => handleToggleRoleStatus(role.id, role.ativo)}
                              className={`p-2 rounded transition-colors ${
                                role.ativo 
                                  ? 'text-orange-600 hover:text-orange-800' 
                                  : 'text-green-600 hover:text-green-800'
                              }`}
                              title={role.ativo ? 'Desativar papel' : 'Ativar papel'}
                            >
                              {role.ativo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleEditRole(role)}
                              className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Editar papel"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors"
                              title="Excluir papel"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Shield className="w-4 h-4" />
                          <span>{role.permission_count || 0} permissões</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{role.user_count || 0} usuários</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${
                          role.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {role.ativo ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{role.ativo ? 'Ativo' : 'Inativo'}</span>
                        </span>
                        
                        {role.is_system && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                            Sistema
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {filteredRoles.length} papel{filteredRoles.length !== 1 ? 'éis' : ''} 
              {searchTerm && ` encontrado${filteredRoles.length !== 1 ? 's' : ''}`}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      <CreateRoleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoleCreated={handleRoleCreated}
      />

      {/* Edit Role Modal */}
      {selectedRole && (
        <EditRoleModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
          onRoleUpdated={handleRoleUpdated}
          role={selectedRole}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                  <p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Tem certeza que deseja excluir este papel? Todos os usuários com este papel perderão suas permissões.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Excluir Papel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesModal;
