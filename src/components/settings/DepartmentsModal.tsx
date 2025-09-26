import React, { useState, useEffect } from 'react';
import { X, Plus, Building, Edit, Trash2, Users, Search, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import CreateDepartmentModal from './CreateDepartmentModal';
import EditDepartmentModal from './EditDepartmentModal';

interface Department {
  id: string;
  name: string;
  description?: string;
  responsible_name?: string;
  responsible_user_id?: string;
  parent_id?: string;
  active_protocols: number;
  created_at: string;
}

interface DepartmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DepartmentsModal: React.FC<DepartmentsModalProps> = ({ isOpen, onClose }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Erro ao carregar setores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = () => {
    setShowCreateModal(true);
  };

  const handleDepartmentCreated = () => {
    loadDepartments();
    setShowCreateModal(false);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setShowEditModal(true);
  };

  const handleDeleteDepartment = (departmentId: string) => {
    setShowDeleteConfirm(departmentId);
  };

  const confirmDelete = async (departmentId: string) => {
    try {
      await apiService.deleteDepartment(departmentId);
      toast.success('Setor excluído com sucesso!');
      loadDepartments();
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir setor');
    }
  };

  const handleDepartmentUpdated = () => {
    loadDepartments();
    setShowEditModal(false);
    setSelectedDepartment(null);
  };
  
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Building className="w-6 h-6 text-[#FF6B35]" />
              <h2 className="text-xl font-bold text-[#404040]">Gerenciar Setores</h2>
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
                    placeholder="Buscar setores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateDepartment}
                className="flex items-center space-x-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Setor</span>
              </button>
            </div>
          </div>

          {/* Departments List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
                <span className="ml-3 text-gray-600">Carregando setores...</span>
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="text-center py-12">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Nenhum setor encontrado' : 'Nenhum setor cadastrado'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca'
                    : 'Comece criando o primeiro setor da organização'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreateDepartment}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Primeiro Setor</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDepartments.map((department) => (
                  <div
                    key={department.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{department.name}</h3>
                          {department.description && (
                            <p className="text-sm text-gray-600 mt-1">{department.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditDepartment(department)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar setor"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(department.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Excluir setor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {department.responsible_name && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{department.responsible_name}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {department.active_protocols} protocolos ativos
                        </span>
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
              {filteredDepartments.length} setor{filteredDepartments.length !== 1 ? 'es' : ''} 
              {searchTerm && ` encontrado${filteredDepartments.length !== 1 ? 's' : ''}`}
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

      {/* Create Department Modal */}
      <CreateDepartmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onDepartmentCreated={handleDepartmentCreated}
      />

      {/* Edit Department Modal */}
      {selectedDepartment && (
        <EditDepartmentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDepartment(null);
          }}
          onDepartmentUpdated={handleDepartmentUpdated}
          department={selectedDepartment}
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
                Tem certeza que deseja excluir este setor? Ele será desativado e não aparecerá mais nas listas.
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
                  Excluir Setor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsModal;
