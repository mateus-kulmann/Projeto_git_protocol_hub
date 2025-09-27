import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Building, CreditCard as Edit, Trash2, Eye, User, Mail, Phone, FileText, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import CreateSolicitanteModal from './CreateSolicitanteModal';
import EditSolicitanteModal from './EditSolicitanteModal';
import ViewSolicitanteModal from './ViewSolicitanteModal';

interface Solicitante {
  id: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  nome_completo?: string;
  razao_social?: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  pessoa_juridica_id?: string;
  pessoa_juridica?: {
    razao_social: string;
  };
  pessoas_vinculadas?: Array<{
    id: string;
    nome_completo: string;
    email?: string;
    telefone?: string;
  }>;
  ativo: boolean;
  created_at: string;
}

const SolicitantesPage: React.FC = () => {
  const [solicitantes, setSolicitantes] = useState<Solicitante[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSolicitante, setSelectedSolicitante] = useState<Solicitante | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadSolicitantes();
  }, []);

  const loadSolicitantes = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSolicitantes();
      setSolicitantes(data);
    } catch (error) {
      console.error('Error loading solicitantes:', error);
      toast.error('Erro ao carregar solicitantes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSolicitante = () => {
    setShowCreateModal(true);
  };

  const handleSolicitanteCreated = () => {
    loadSolicitantes();
    setShowCreateModal(false);
  };

  const handleEditSolicitante = (solicitante: Solicitante) => {
    setSelectedSolicitante(solicitante);
    setShowEditModal(true);
  };

  const handleViewSolicitante = (solicitante: Solicitante) => {
    setSelectedSolicitante(solicitante);
    setShowViewModal(true);
  };

  const handleDeleteSolicitante = (solicitanteId: string) => {
    setShowDeleteConfirm(solicitanteId);
  };

  const confirmDelete = async (solicitanteId: string) => {
    try {
      await apiService.deleteSolicitante(solicitanteId);
      toast.success('Solicitante excluído com sucesso!');
      loadSolicitantes();
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir solicitante');
    }
  };

  const handleSolicitanteUpdated = () => {
    loadSolicitantes();
    setShowEditModal(false);
    setSelectedSolicitante(null);
  };

  const getDisplayName = (solicitante: Solicitante) => {
    return solicitante.tipo === 'pessoa_fisica' 
      ? solicitante.nome_completo 
      : solicitante.razao_social;
  };

  const getDocument = (solicitante: Solicitante) => {
    return solicitante.tipo === 'pessoa_fisica' 
      ? solicitante.cpf 
      : solicitante.cnpj;
  };

  const formatDocument = (doc: string | undefined, tipo: string) => {
    if (!doc) return '';
    
    if (tipo === 'pessoa_fisica') {
      // Format CPF: 000.000.000-00
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      // Format CNPJ: 00.000.000/0000-00
      return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const filteredSolicitantes = solicitantes.filter(solicitante => {
    const matchesSearch = 
      getDisplayName(solicitante)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitante.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitante.telefone?.includes(searchTerm) ||
      getDocument(solicitante)?.includes(searchTerm.replace(/\D/g, ''));
    
    const matchesType = !typeFilter || solicitante.tipo === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#404040]">Solicitantes</h1>
          <p className="text-gray-600 mt-1">
            Gerencie o cadastro de pessoas físicas e jurídicas
          </p>
        </div>
        
        <button 
          onClick={handleCreateSolicitante}
          className="bg-[#FF6B35] hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Solicitante</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nome, email, telefone ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              />
            </div>
          </div>

          <div className="w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            >
              <option value="">Todos os tipos</option>
              <option value="pessoa_fisica">Pessoa Física</option>
              <option value="pessoa_juridica">Pessoa Jurídica</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
          <span className="ml-3 text-gray-600">Carregando solicitantes...</span>
        </div>
      ) : filteredSolicitantes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || typeFilter ? 'Nenhum solicitante encontrado' : 'Nenhum solicitante cadastrado'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || typeFilter 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando o primeiro solicitante'
            }
          </p>
          {!searchTerm && !typeFilter && (
            <button
              onClick={handleCreateSolicitante}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeiro Solicitante</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vinculação
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSolicitantes.map((solicitante) => (
                  <tr key={solicitante.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          solicitante.tipo === 'pessoa_fisica' 
                            ? 'bg-blue-100' 
                            : 'bg-green-100'
                        }`}>
                          {solicitante.tipo === 'pessoa_fisica' ? (
                            <User className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Building className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getDisplayName(solicitante)}
                          </div>
                          {solicitante.endereco && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {solicitante.endereco}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        solicitante.tipo === 'pessoa_fisica'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {solicitante.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {formatDocument(getDocument(solicitante), solicitante.tipo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {solicitante.email && (
                          <div className="flex items-center space-x-1 mb-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-xs">{solicitante.email}</span>
                          </div>
                        )}
                        {solicitante.telefone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{solicitante.telefone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {solicitante.pessoa_juridica ? (
                        <div className="flex items-center space-x-1">
                          <Building className="w-3 h-3 text-green-500" />
                          <span className="truncate max-w-xs">{solicitante.pessoa_juridica.razao_social}</span>
                        </div>
                      ) : solicitante.pessoas_vinculadas && solicitante.pessoas_vinculadas.length > 0 ? (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-blue-500" />
                          <span>{solicitante.pessoas_vinculadas.length} pessoa{solicitante.pessoas_vinculadas.length > 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewSolicitante(solicitante)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Visualizar detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditSolicitante(solicitante)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar solicitante"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSolicitante(solicitante.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Excluir solicitante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateSolicitanteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSolicitanteCreated={handleSolicitanteCreated}
      />

      {/* Edit Modal */}
      {selectedSolicitante && (
        <EditSolicitanteModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSolicitante(null);
          }}
          onSolicitanteUpdated={handleSolicitanteUpdated}
          solicitante={selectedSolicitante}
        />
      )}

      {/* View Modal */}
      {selectedSolicitante && (
        <ViewSolicitanteModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedSolicitante(null);
          }}
          solicitante={selectedSolicitante}
          onEdit={() => {
            setShowViewModal(false);
            setShowEditModal(true);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                Tem certeza que deseja excluir este solicitante? Todos os protocolos relacionados manterão os dados, mas não será possível criar novos protocolos para este solicitante.
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
                  Excluir Solicitante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolicitantesPage;