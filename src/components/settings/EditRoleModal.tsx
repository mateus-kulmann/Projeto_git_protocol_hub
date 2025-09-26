import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Shield, FileText, Search, Check, Users, Settings, Database, Bell } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleUpdated: () => void;
  role: {
    id: string;
    nome: string;
    descricao?: string;
    is_system: boolean;
  };
}

interface EditRoleFormData {
  nome: string;
  descricao: string;
}

interface Permission {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  categoria: string;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  isOpen,
  onClose,
  onRoleUpdated,
  role
}) => {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditRoleFormData>({
    defaultValues: {
      nome: role.nome,
      descricao: role.descricao || ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
      loadRolePermissions();
      reset({
        nome: role.nome,
        descricao: role.descricao || ''
      });
    }
  }, [isOpen, role, reset]);

  const loadPermissions = async () => {
    try {
      const data = await apiService.getPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Erro ao carregar permissões');
    }
  };

  const loadRolePermissions = async () => {
    try {
      const data = await apiService.getRolePermissions(role.id);
      setSelectedPermissions(data.map((p: any) => p.permission_id));
    } catch (error) {
      console.error('Error loading role permissions:', error);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedPermissions([]);
    setPermissionSearch('');
    setSelectedCategory('all');
    onClose();
  };

  const onSubmit = async (data: EditRoleFormData) => {
    try {
      setLoading(true);
      
      if (selectedPermissions.length === 0) {
        toast.error('Selecione pelo menos uma permissão');
        return;
      }

      await apiService.updateRole(role.id, {
        nome: data.nome,
        descricao: data.descricao,
        permissions: selectedPermissions
      });
      
      toast.success('Papel atualizado com sucesso!');
      handleClose();
      onRoleUpdated();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Erro ao atualizar papel');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleCategoryPermissions = (category: string) => {
    const categoryPermissions = permissions.filter(p => p.categoria === category).map(p => p.id);
    const allSelected = categoryPermissions.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !categoryPermissions.includes(id)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryPermissions])]);
    }
  };

  const getPermissionIcon = (categoria: string) => {
    switch (categoria) {
      case 'protocols':
        return <FileText className="w-4 h-4" />;
      case 'users':
        return <Users className="w-4 h-4" />;
      case 'settings':
        return <Settings className="w-4 h-4" />;
      case 'reports':
        return <Database className="w-4 h-4" />;
      case 'notifications':
        return <Bell className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'protocols':
        return 'bg-blue-100 text-blue-800';
      case 'users':
        return 'bg-green-100 text-green-800';
      case 'settings':
        return 'bg-purple-100 text-purple-800';
      case 'reports':
        return 'bg-yellow-100 text-yellow-800';
      case 'notifications':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = [...new Set(permissions.map(p => p.categoria))];
  
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.nome.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                         permission.codigo.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                         permission.descricao?.toLowerCase().includes(permissionSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || permission.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedPermissions = categories.reduce((acc, category) => {
    acc[category] = filteredPermissions.filter(p => p.categoria === category);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-[#FF6B35]" />
              <h2 className="text-xl font-bold text-[#404040]">Editar Papel</h2>
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-[#404040] mb-4">Informações Básicas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Role Name */}
                  <div>
                    <label className="block text-sm font-medium text-[#404040] mb-2">
                      Nome do Papel *
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        {...register('nome', { 
                          required: 'Nome é obrigatório',
                          minLength: {
                            value: 2,
                            message: 'Nome deve ter pelo menos 2 caracteres'
                          }
                        })}
                        className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent ${
                          errors.nome ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ex: Atendente Nível 1"
                        disabled={role.is_system}
                      />
                    </div>
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                    )}
                    {role.is_system && (
                      <p className="mt-1 text-xs text-purple-600">
                        ⚠️ Papel do sistema - nome não pode ser alterado
                      </p>
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
                        {...register('descricao')}
                        rows={3}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none"
                        placeholder="Descreva as responsabilidades deste papel..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Selection */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#404040]">Permissões</h3>
                  <div className="text-sm text-gray-600">
                    {selectedPermissions.length} de {permissions.length} selecionadas
                  </div>
                </div>

                {/* Permission Search and Filter */}
                <div className="flex space-x-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar permissões..."
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="w-48">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    >
                      <option value="all">Todas as categorias</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Permissions by Category */}
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                    if (categoryPermissions.length === 0) return null;
                    
                    const allCategorySelected = categoryPermissions.every(p => selectedPermissions.includes(p.id));
                    
                    return (
                      <div key={category} className="border border-gray-200 rounded-lg p-3">
                        {/* Category Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(category)}`}>
                              {getPermissionIcon(category)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 capitalize">{category}</h4>
                              <p className="text-xs text-gray-500">
                                {categoryPermissions.length} permissão{categoryPermissions.length > 1 ? 'ões' : ''}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => toggleCategoryPermissions(category)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              allCategorySelected 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {allCategorySelected ? 'Desmarcar todas' : 'Marcar todas'}
                          </button>
                        </div>

                        {/* Permissions List */}
                        <div className="space-y-2">
                          {categoryPermissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                                className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900">{permission.nome}</span>
                                  <code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                                    {permission.codigo}
                                  </code>
                                </div>
                                {permission.descricao && (
                                  <p className="text-xs text-gray-500 mt-1">{permission.descricao}</p>
                                )}
                              </div>
                              {selectedPermissions.includes(permission.id) && (
                                <Check className="w-4 h-4 text-green-600" />
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredPermissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma permissão encontrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedPermissions.length > 0 && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    {selectedPermissions.length} permissão{selectedPermissions.length > 1 ? 'ões' : ''} selecionada{selectedPermissions.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedPermissions.length === 0}
                  className="px-4 py-2 bg-[#FF6B35] hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoleModal;
