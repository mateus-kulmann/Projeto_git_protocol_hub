import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Building, User, FileText } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepartmentCreated: () => void;
}

interface CreateDepartmentFormData {
  name: string;
  description: string;
  parent_id?: string;
  responsible_user_id?: string;
}

const CreateDepartmentModal: React.FC<CreateDepartmentModalProps> = ({
  isOpen,
  onClose,
  onDepartmentCreated
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateDepartmentFormData>();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadDepartments();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await apiService.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: CreateDepartmentFormData) => {
    try {
      setLoading(true);
      
      await apiService.createDepartment({
        name: data.name,
        description: data.description,
        parent_id: data.parent_id || null,
        responsible_user_id: data.responsible_user_id || null
      });
      
      toast.success('Setor criado com sucesso!');
      handleClose();
      onDepartmentCreated();
    } catch (error: any) {
      console.error('Error creating department:', error);
      toast.error(error.message || 'Erro ao criar setor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Building className="w-6 h-6 text-[#FF6B35]" />
              <h2 className="text-xl font-bold text-[#404040]">Novo Setor</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            {/* Department Name */}
            <div>
              <label className="block text-sm font-medium text-[#404040] mb-2">
                Nome do Setor *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  {...register('name', { 
                    required: 'Nome do setor é obrigatório',
                    minLength: {
                      value: 2,
                      message: 'Nome deve ter pelo menos 2 caracteres'
                    }
                  })}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Tecnologia da Informação"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#404040] mb-2">
                Descrição
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none"
                  placeholder="Descreva as responsabilidades do setor..."
                />
              </div>
            </div>

            {/* Parent Department (Future feature) */}
            <div>
              <label className="block text-sm font-medium text-[#404040] mb-2">
                Setor Superior (Opcional)
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  {...register('parent_id')}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                >
                  <option value="">Nenhum (setor principal)</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Responsible User (Future feature) */}
            <div>
              <label className="block text-sm font-medium text-[#404040] mb-2">
                Responsável (Opcional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  {...register('responsible_user_id')}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                >
                  <option value="">Selecionar usuário responsável</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#FF6B35] hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Criando...</span>
                </>
              ) : (
                <span>Criar Setor</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDepartmentModal;
