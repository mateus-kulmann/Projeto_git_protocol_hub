import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Building, Plus, Mail, Phone, FileText } from 'lucide-react';
import { apiService } from '../../services/api';
import CreateSolicitanteModal from './CreateSolicitanteModal';

interface Solicitante {
  id: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  nome_completo?: string;
  razao_social?: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
}

interface SolicitanteSelectorProps {
  value?: string;
  onChange: (solicitante: Solicitante | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SolicitanteSelector: React.FC<SolicitanteSelectorProps> = ({
  value,
  onChange,
  placeholder = "Digite para buscar solicitante...",
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [solicitantes, setSolicitantes] = useState<Solicitante[]>([]);
  const [filteredSolicitantes, setFilteredSolicitantes] = useState<Solicitante[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSolicitante, setSelectedSolicitante] = useState<Solicitante | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSolicitantes();
  }, []);

  useEffect(() => {
    // Filter solicitantes based on search term
    if (searchTerm.trim()) {
      const filtered = solicitantes.filter(solicitante => {
        const displayName = getDisplayName(solicitante);
        const document = getDocument(solicitante);
        
        return (
          displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          solicitante.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          solicitante.telefone?.includes(searchTerm) ||
          document?.includes(searchTerm.replace(/\D/g, ''))
        );
      }).slice(0, 5); // Show only top 5 matches
      
      setFilteredSolicitantes(filtered);
      setShowDropdown(filtered.length > 0 || searchTerm.length > 2);
    } else {
      setFilteredSolicitantes([]);
      setShowDropdown(false);
    }
  }, [searchTerm, solicitantes]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSolicitantes = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSolicitantes();
      setSolicitantes(data);
    } catch (error) {
      console.error('Error loading solicitantes:', error);
    } finally {
      setLoading(false);
    }
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
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const handleSelectSolicitante = (solicitante: Solicitante) => {
    setSelectedSolicitante(solicitante);
    setSearchTerm(getDisplayName(solicitante) || '');
    setShowDropdown(false);
    onChange(solicitante);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    if (!newValue.trim()) {
      setSelectedSolicitante(null);
      onChange(null);
    }
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
    setShowDropdown(false);
  };

  const handleSolicitanteCreated = () => {
    loadSolicitantes();
    setShowCreateModal(false);
  };

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchTerm.trim() && filteredSolicitantes.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-100"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF6B35] mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Carregando...</p>
            </div>
          ) : filteredSolicitantes.length > 0 ? (
            <>
              {filteredSolicitantes.map((solicitante) => (
                <button
                  key={solicitante.id}
                  type="button"
                  onClick={() => handleSelectSolicitante(solicitante)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    solicitante.tipo === 'pessoa_fisica' 
                      ? 'bg-blue-100' 
                      : 'bg-green-100'
                  }`}>
                    {solicitante.tipo === 'pessoa_fisica' ? (
                      <User className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Building className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {getDisplayName(solicitante)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        solicitante.tipo === 'pessoa_fisica'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {solicitante.tipo === 'pessoa_fisica' ? 'PF' : 'PJ'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                      <span className="font-mono">
                        {formatDocument(getDocument(solicitante), solicitante.tipo)}
                      </span>
                      {solicitante.email && (
                        <span className="flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-32">{solicitante.email}</span>
                        </span>
                      )}
                      {solicitante.telefone && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{solicitante.telefone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Create new option */}
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center space-x-3 border-t border-gray-200 bg-blue-25"
              >
                <div className="w-8 h-8 bg-[#FF6B35] rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-medium text-[#FF6B35]">
                    Criar novo solicitante
                  </span>
                  <p className="text-xs text-gray-500">
                    Cadastrar "{searchTerm}" como novo solicitante
                  </p>
                </div>
              </button>
            </>
          ) : searchTerm.length > 2 ? (
            <div className="p-4">
              <div className="text-center mb-3">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Nenhum solicitante encontrado</p>
                <p className="text-xs text-gray-500">para "{searchTerm}"</p>
              </div>
              
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Criar novo solicitante</span>
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Create Modal */}
      <CreateSolicitanteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSolicitanteCreated={handleSolicitanteCreated}
      />
    </div>
  );
};

export default SolicitanteSelector;