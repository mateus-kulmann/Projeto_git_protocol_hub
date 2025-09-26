import React, { useState } from 'react';
import { X, Eye, FileText, Shield, Lock, AlertCircle, Calendar, User, Mail, Phone, Building, Clock } from 'lucide-react';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  signatureType: string;
  signatureTarget: string;
  attachments: File[];
  protocolNumber: string;
  protocolInfo?: any;
  userInfo?: any;
  messageContent?: string;
}

const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  signatureType,
  signatureTarget,
  attachments,
  protocolNumber,
  protocolInfo,
  userInfo,
  messageContent
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!password.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm(password);
      setPassword('');
    } catch (error) {
      console.error('Signature error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    onClose();
  };

  const getSignatureTypeLabel = () => {
    return signatureType === 'zeydoc' ? 'ZeyDoc' : 'ICP-BRASIL';
  };

  const getSignatureTargetLabel = () => {
    switch (signatureTarget) {
      case 'protocol':
        return 'Documento do Protocolo';
      case 'attachments':
        return `${attachments.length} Anexo${attachments.length > 1 ? 's' : ''}`;
      case 'both':
        return `Documento do Protocolo + ${attachments.length} Anexo${attachments.length > 1 ? 's' : ''}`;
      default:
        return '';
    }
  };

  const formatDateTime = () => {
    return new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#404040]">Confirmar Assinatura Digital</h2>
                <p className="text-sm text-gray-600">
                  {getSignatureTypeLabel()} - {getSignatureTargetLabel()}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Signature Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Resumo da Assinatura</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Tipo:</span>
                <p className="text-blue-600">{getSignatureTypeLabel()}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Protocolo:</span>
                <p className="text-blue-600">#{protocolNumber}</p>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-blue-700">Itens a assinar:</span>
                <p className="text-blue-600">{getSignatureTargetLabel()}</p>
              </div>
            </div>
          </div>

          {/* Document Preview Section */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <Eye className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-800 bg-gray-50 px-3 py-1 rounded">Prévia dos Documentos a Assinar</h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {/* Protocol Document Preview */}
              {(signatureTarget === 'protocol' || signatureTarget === 'both') && (
                <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-4 shadow-sm">
                  {/* Document Header */}
                  <div className="border-b-2 border-gray-200 pb-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Shield className="w-6 h-6 text-[#FF6B35]" />
                        <h2 className="text-xl font-bold text-[#404040]">ProtocolHub</h2>
                      </div>
                      <p className="text-sm text-gray-600">Sistema de Gestão de Protocolos</p>
                      <p className="text-xs text-gray-500 mt-1">Documento Oficial com Validade Jurídica</p>
                    </div>
                  </div>

                  {/* Protocol Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Protocolo:</span>
                      <p className="text-[#FF6B35] font-mono font-bold">#{protocolNumber}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Data/Hora:</span>
                      <p className="text-gray-900">{formatDateTime()}</p>
                    </div>
                  </div>

                  {/* Client Data */}
                  {protocolInfo && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        DADOS DO SOLICITANTE
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Nome:</span>
                          <p className="text-gray-900">{protocolInfo.requester_name}</p>
                        </div>
                        {protocolInfo.requester_email && (
                          <div>
                            <span className="font-medium text-gray-600">Email:</span>
                            <p className="text-gray-900">{protocolInfo.requester_email}</p>
                          </div>
                        )}
                        {protocolInfo.requester_phone && (
                          <div>
                            <span className="font-medium text-gray-600">Telefone:</span>
                            <p className="text-gray-900">{protocolInfo.requester_phone}</p>
                          </div>
                        )}
                        {protocolInfo.requester_cpf && (
                          <div>
                            <span className="font-medium text-gray-600">CPF:</span>
                            <p className="text-gray-900">{protocolInfo.requester_cpf}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="font-medium text-gray-600">Assunto:</span>
                        <p className="text-gray-900 mt-1">{protocolInfo.subject}</p>
                      </div>
                    </div>
                  )}

                  {/* Response Section */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      RESPOSTA OFICIAL
                    </h4>
                    {userInfo && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="font-medium text-blue-700">Assinado por:</span>
                          <p className="text-blue-900">{userInfo.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Cargo/Setor:</span>
                          <p className="text-blue-900">{userInfo.department_name || userInfo.role || 'Agente'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Data da resposta:</span>
                          <p className="text-blue-900">{formatDateTime()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Tipo de assinatura:</span>
                          <p className="text-blue-900">{getSignatureTypeLabel()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  {messageContent && (
                    <div className="border border-gray-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">CONTEÚDO DA MENSAGEM:</h4>
                      <div className="bg-white border-l-4 border-[#FF6B35] pl-4 py-2">
                        <div 
                          className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: messageContent }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Attachments List in Protocol */}
                  {(signatureTarget === 'both' || signatureTarget === 'attachments') && attachments.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        ANEXOS ASSINADOS DIGITALMENTE
                      </h4>
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span className="text-green-800 font-medium">{file.name}</span>
                            <span className="text-green-600">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Digital Signature Footer */}
                  <div className="mt-6 pt-4 border-t-2 border-gray-200">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-800">Assinatura Digital</span>
                      </div>
                      <div className="text-xs text-yellow-700 space-y-1">
                        <p>🔒 Este documento será assinado digitalmente com certificado {getSignatureTypeLabel()}</p>
                        <p>📅 Data/hora da assinatura: {formatDateTime()}</p>
                        <p>⚖️ Documento com validade jurídica conforme MP 2.200-2/2001</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Individual PDF Attachments Preview */}
              {(signatureTarget === 'attachments' || signatureTarget === 'both') && attachments.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-gray-50 px-3 py-2 rounded">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      ANEXOS PDF PARA ASSINATURA ({attachments.length})
                    </h4>
                  </div>
                  
                  {attachments.map((file, index) => (
                    <div key={index} className="bg-white border-2 border-red-200 rounded-lg p-4 shadow-sm">
                      {/* PDF Header */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-100">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-red-600" />
                          <div>
                            <span className="text-sm font-semibold text-gray-800">{file.name}</span>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • PDF
                            </p>
                          </div>
                        </div>
                        <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                          Anexo #{index + 1}
                        </div>
                      </div>
                      
                      {/* PDF Preview Placeholder */}
                      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 font-medium">Prévia do PDF</p>
                        <p className="text-xs text-gray-500 mt-1">{file.name}</p>
                        <div className="mt-3 bg-white rounded p-2 text-xs text-gray-600">
                          📄 Conteúdo do arquivo PDF será exibido aqui<br/>
                          🔒 Assinatura digital será aplicada neste documento<br/>
                          ⚖️ Documento terá validade jurídica após assinatura
                        </div>
                      </div>
                      
                      {/* PDF Signature Info */}
                      <div className="mt-3 bg-red-50 rounded p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-800">Informações da Assinatura</span>
                        </div>
                        <div className="text-xs text-red-700 space-y-1">
                          <p>🔐 Tipo: {getSignatureTypeLabel()}</p>
                          <p>👤 Assinante: {userInfo?.name || 'Usuário'}</p>
                          <p>📅 Data: {formatDateTime()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Confirmação de Identidade</h3>
            </div>
            
            <p className="text-sm text-yellow-700 mb-4">
              Para confirmar a assinatura digital, digite sua senha do sistema:
            </p>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha do sistema"
                className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password.trim()) {
                    handleConfirm();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Eye className={`w-5 h-5 ${showPassword ? 'text-blue-500' : ''}`} />
              </button>
            </div>

            <div className="mt-3 text-xs text-yellow-600">
              <p>⚠️ A assinatura digital é um ato jurídico com validade legal</p>
              <p>🔒 Sua identidade será registrada permanentemente no documento</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!password.trim() || loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Assinando...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Confirmar Assinatura</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalSignatureModal;
