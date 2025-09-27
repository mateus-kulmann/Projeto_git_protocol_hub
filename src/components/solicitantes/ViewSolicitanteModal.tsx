import React from 'react';
import { X, User, Building, Mail, Phone, MapPin, Users, Edit, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ViewSolicitanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  solicitante: {
    id: string;
    tipo: 'pessoa_fisica' | 'pessoa_juridica';
    nome_completo?: string;
    razao_social?: string;
    cpf?: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    pessoa_juridica?: {
      razao_social: string;
    };
    pessoas_vinculadas?: Array<{
      id: string;
      nome_completo: string;
      email?: string;
      telefone?: string;
    }>;
    created_at: string;
  };
}

const ViewSolicitanteModal: React.FC<ViewSolicitanteModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  solicitante
}) => {
  const getDisplayName = () => {
    return solicitante.tipo === 'pessoa_fisica' 
      ? solicitante.nome_completo 
      : solicitante.razao_social;
  };

  const getDocument = () => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
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
              <div>
                <h2 className="text-xl font-bold text-[#404040]">{getDisplayName()}</h2>
                <p className="text-sm text-gray-600">
                  {solicitante.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações Principais */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-[#404040] mb-4">
              {solicitante.tipo === 'pessoa_fisica' ? 'Dados Pessoais' : 'Dados da Empresa'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {solicitante.tipo === 'pessoa_fisica' ? 'Nome Completo' : 'Razão Social'}
                </label>
                <p className="text-sm text-gray-900 font-medium">{getDisplayName()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {solicitante.tipo === 'pessoa_fisica' ? 'CPF' : 'CNPJ'}
                </label>
                <p className="text-sm text-gray-900 font-mono">
                  {formatDocument(getDocument(), solicitante.tipo)}
                </p>
              </div>
            </div>
          </div>

          {/* Dados de Contato */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-[#404040] mb-4">Dados de Contato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solicitante.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{solicitante.email}</p>
                  </div>
                </div>
              )}

              {solicitante.telefone && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{solicitante.telefone}</p>
                  </div>
                </div>
              )}

              {solicitante.endereco && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Endereço</label>
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-900">{solicitante.endereco}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vinculações */}
          {(solicitante.pessoa_juridica || (solicitante.pessoas_vinculadas && solicitante.pessoas_vinculadas.length > 0)) && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-[#404040] mb-4">Vinculações</h3>
              
              {solicitante.pessoa_juridica && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Empresa Vinculada</label>
                  <div className="flex items-center space-x-2 p-3 bg-white rounded border border-green-200">
                    <Building className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {solicitante.pessoa_juridica.razao_social}
                    </span>
                  </div>
                </div>
              )}

              {solicitante.pessoas_vinculadas && solicitante.pessoas_vinculadas.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Pessoas Vinculadas ({solicitante.pessoas_vinculadas.length})
                  </label>
                  <div className="space-y-2">
                    {solicitante.pessoas_vinculadas.map((pessoa) => (
                      <div key={pessoa.id} className="flex items-center space-x-2 p-3 bg-white rounded border border-green-200">
                        <User className="w-4 h-4 text-blue-600" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{pessoa.nome_completo}</span>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            {pessoa.email && (
                              <span className="flex items-center space-x-1">
                                <Mail className="w-3 h-3" />
                                <span>{pessoa.email}</span>
                              </span>
                            )}
                            {pessoa.telefone && (
                              <span className="flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>{pessoa.telefone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Informações do Sistema */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-[#404040] mb-4">Informações do Sistema</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data de Cadastro</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">
                    {format(new Date(solicitante.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ID do Sistema</label>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900 font-mono">{solicitante.id.substring(0, 8)}...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Editar Solicitante</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSolicitanteModal;