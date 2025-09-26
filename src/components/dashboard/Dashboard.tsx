import React, { useState, useEffect } from 'react';
import { Plus, Grid3X3, List, FileText, Clock, User, CheckCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import ProtocolCard from '../protocol/ProtocolCard';
import ProtocolListItem from '../protocol/ProtocolListItem';
import ProtocolDetails from '../protocol/ProtocolDetails';
import CreateProtocolModal from '../protocol/CreateProtocolModal';
import ProtocolFilters from './ProtocolFilters';
import { apiService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import SettingsPage from '../settings/SettingsPage';

const Dashboard: React.FC = () => {
  const location = useLocation();
  const isProtocolsPage = location.pathname === '/protocols';
  const isDashboardPage = location.pathname === '/';
  const isSettingsPage = location.pathname === '/settings';
  
  const { logout } = useAuth();
  const { user } = useAuth();
  const [protocols, setProtocols] = useState<any[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<any>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState('open');
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    channel: '',
    search: ''
  });
  
  const { joinProtocol, leaveProtocol } = useSocket();

  // Initial load when component mounts and user is available
  useEffect(() => {
    if (isProtocolsPage && user && protocols.length === 0) {
      console.log('Initial protocol load triggered');
      loadProtocols();
    }
  }, [isProtocolsPage, user]);

  // Load when filters change
  useEffect(() => {
    if (isProtocolsPage && user && (filters.status || filters.department || filters.channel || filters.search)) {
      console.log('Filter-based protocol load triggered');
      loadProtocols();
    }
  }, [filters]);

  const loadProtocols = async () => {
    try {
      setLoading(true);
      
      // Ensure user is authenticated before loading
      if (!user) {
        console.log('User not authenticated yet, skipping protocol load');
        setLoading(false);
        return;
      }
      
      const data = await apiService.getProtocols(filters);
      setProtocols(data.protocols);
      setPagination(data.pagination);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Error loading protocols:', errorMessage);
      
      if (errorMessage === 'Usuário não encontrado') {
        toast.error('Sua sessão expirou. Faça login novamente.');
        logout();
      } else {
        // Retry loading after a short delay if it's an authentication issue
        setTimeout(() => {
          if (user && isProtocolsPage) {
            console.log('Retrying protocol load...');
            loadProtocols();
          }
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  // Filter protocols based on active tab and user context
  const getFilteredProtocols = () => {
    if (hasActiveFilters) {
      // When filters are active, show all matching protocols regardless of tab
      return protocols;
    }

    if (!user) return [];

    switch (activeTab) {
      case 'open':
        // Protocols in my department or assigned to me, not finalized
        return protocols.filter(protocol => 
          (protocol.current_department_id === user.department_id || 
           protocol.assigned_user_id === user.id) &&
          protocol.status !== 'closed'
        );
      
      case 'outbox':
        // Protocols forwarded by me/my department to other departments and finalized in my department
        return protocols.filter(protocol => {
          // This would need audit trail data to determine if it was forwarded by current user/department
          // For now, using a simple logic: protocols not in my department but were assigned to me before
          return protocol.current_department_id !== user.department_id && 
                 protocol.status !== 'closed';
        });
      
      case 'favorites':
        // TODO: Implement favorites functionality later
        return protocols.filter(protocol => protocol.is_favorite === true);
      
      case 'closed':
        return protocols.filter(protocol => protocol.status === 'closed');
      
      default:
        return protocols;
    }
  };

  const filteredProtocols = getFilteredProtocols();

  // Get tab counts
  const getTabCounts = () => {
    if (!user) return { open: 0, outbox: 0, favorites: 0, closed: 0 };

    return {
      open: protocols.filter(protocol => 
        (protocol.current_department_id === user.department_id || 
         protocol.assigned_user_id === user.id) &&
        protocol.status !== 'closed'
      ).length,
      outbox: protocols.filter(protocol => 
        protocol.current_department_id !== user.department_id && 
        protocol.status !== 'closed'
      ).length,
      favorites: protocols.filter(protocol => protocol.is_favorite === true).length,
      closed: protocols.filter(protocol => protocol.status === 'closed').length
    };
  };

  const tabCounts = getTabCounts();

  const handleProtocolSelect = (protocolId: string) => {
    setSelectedProtocol(protocolId);
    joinProtocol(protocolId);
  };

  const handleCloseProtocol = () => {
    setSelectedProtocol(null);
    leaveProtocol();
  };

  const handleCreateProtocol = () => {
    setShowCreateModal(true);
  };

  const handleProtocolCreated = () => {
    loadProtocols(); // Reload the protocols list
    setCurrentPage(1); // Reset to first page
  };

  // Calculate pagination for list view
  const totalPages = Math.ceil(filteredProtocols.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProtocols = viewMode === 'list' ? filteredProtocols.slice(startIndex, endIndex) : filteredProtocols;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  // Reset page when switching to list view
  const handleViewModeChange = (mode: 'cards' | 'list') => {
    setViewMode(mode);
    if (mode === 'list') {
      setCurrentPage(1);
    }
  };
  // If this is the dashboard page, show dashboard content
  if (isDashboardPage) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#404040]">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visão geral do sistema
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Protocolos</p>
                <p className="text-2xl font-bold text-[#404040]">156</p>
              </div>
              <FileText className="w-8 h-8 text-[#FF6B35]" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abertos</p>
                <p className="text-2xl font-bold text-blue-600">42</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-yellow-600">28</p>
              </div>
              <User className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Finalizados Hoje</p>
                <p className="text-2xl font-bold text-green-600">15</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart placeholder */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-[#404040] mb-4">Protocolos por Status</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Gráfico será implementado aqui</p>
            </div>
          </div>
          
          {/* Activity placeholder */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-[#404040] mb-4">Atividade Recente</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Lista de atividades será implementada aqui</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If this is the settings page, show settings content
  if (isSettingsPage) {
    return <SettingsPage />;
  }

  // If not protocols page, return null or redirect
  if (!isProtocolsPage) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-[#404040] mb-4">Página em Desenvolvimento</h2>
          <p className="text-gray-600">Esta funcionalidade será implementada em breve.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#404040]">Protocolos</h1>
          <p className="text-gray-600 mt-1">
            {hasActiveFilters ? 
              `${filteredProtocols.length} protocolos encontrados` :
              `${filteredProtocols.length} protocolos nesta caixa`
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('cards')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-[#FF6B35] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="text-sm font-medium">Cards</span>
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-[#FF6B35] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">Lista</span>
            </button>
          </div>

          <button 
            onClick={handleCreateProtocol}
            className="bg-[#FF6B35] hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Documento</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      {!hasActiveFilters && (
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => {
                  setActiveTab('open');
                  setCurrentPage(1);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'open'
                    ? 'border-[#FF6B35] text-[#FF6B35]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Em Aberto
                {tabCounts.open > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === 'open' 
                      ? 'bg-[#FF6B35] text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tabCounts.open}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('outbox');
                  setCurrentPage(1);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'outbox'
                    ? 'border-[#FF6B35] text-[#FF6B35]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Caixa de Saída
                {tabCounts.outbox > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === 'outbox' 
                      ? 'bg-[#FF6B35] text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tabCounts.outbox}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('favorites');
                  setCurrentPage(1);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'favorites'
                    ? 'border-[#FF6B35] text-[#FF6B35]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Favoritos
                {tabCounts.favorites > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === 'favorites' 
                      ? 'bg-[#FF6B35] text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tabCounts.favorites}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('closed');
                  setCurrentPage(1);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'closed'
                    ? 'border-[#FF6B35] text-[#FF6B35]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Finalizados
                {tabCounts.closed > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === 'closed' 
                      ? 'bg-[#FF6B35] text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tabCounts.closed}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Filters - Show when filters are active */}
      {hasActiveFilters && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-yellow-800">
                Filtros ativos - Mostrando resultados de todas as caixas
              </span>
            </div>
            <button
              onClick={() => {
                setFilters({ status: '', department: '', channel: '', search: '' });
                setCurrentPage(1);
              }}
              className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      <ProtocolFilters 
        filters={filters} 
        onFilterChange={handleFilterChange}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProtocols.map((protocol) => (
                <ProtocolCard
                  key={protocol.id}
                  protocol={protocol}
                  onClick={() => handleProtocolSelect(protocol.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Protocolo
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assunto
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Solicitante
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Setor
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Atualizado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedProtocols.map((protocol) => (
                      <ProtocolListItem
                        key={protocol.id}
                        protocol={protocol}
                        onClick={() => handleProtocolSelect(protocol.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination for list view */}
              {viewMode === 'list' && totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próximo
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando{' '}
                          <span className="font-medium">{startIndex + 1}</span>
                          {' '}até{' '}
                          <span className="font-medium">{Math.min(endIndex, filteredProtocols.length)}</span>
                          {' '}de{' '}
                          <span className="font-medium">{filteredProtocols.length}</span>
                          {' '}resultados
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Anterior</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? 'z-10 bg-[#FF6B35] border-[#FF6B35] text-white'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          
                          <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Próximo</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {filteredProtocols.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasActiveFilters ? 'Nenhum protocolo encontrado' : 'Nenhum protocolo nesta caixa'}
          </h3>
          <p className="text-gray-500">
            {hasActiveFilters 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando um novo protocolo'
            }
          </p>
        </div>
      )}

      {selectedProtocol && (
        <ProtocolDetails
          protocolId={selectedProtocol}
          onClose={handleCloseProtocol}
        />
      )}

      <CreateProtocolModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProtocolCreated={handleProtocolCreated}
      />
    </div>
  );
};

export default Dashboard;
