import React, { useState, useEffect } from 'react';
import { Search, X, User, Building, ChevronDown, ChevronUp, GripVertical, Plus, Trash2, Shield, FileText, Users, Mail } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface SignatureRequest {
  id: string;
  type: 'user' | 'client';
  name: string;
  email: string;
  department?: string;
  order: number;
}

interface SignatureConfig {
  signatureType: string;
  signatureTarget: string;
  includeMyself: boolean;
  includeClient: boolean;
  requestSignatures: boolean;
  signatureRequests: SignatureRequest[];
  orderedSignatures: boolean;
  mySignatureOrder: number;
}

interface SignatureRequestSectionProps {
  protocolInfo: any;
  attachments: File[];
  onSignatureConfigChange: (config: SignatureConfig) => void;
}

const SignatureRequestSection: React.FC<SignatureRequestSectionProps> = ({
  protocolInfo,
  attachments,
  onSignatureConfigChange
}) => {
  const { user } = useAuth();
  const [signatureType, setSignatureType] = useState('');
  const [signatureTarget, setSignatureTarget] = useState('');
  const [includeMyself, setIncludeMyself] = useState(true);
  const [includeClient, setIncludeClient] = useState(false);
  const [requestSignatures, setRequestSignatures] = useState(false);
  const [orderedSignatures, setOrderedSignatures] = useState(false);
  const [mySignatureOrder, setMySignatureOrder] = useState(1);
  
  // User search and selection
  const [userSearch, setUserSearch] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Filter PDF attachments
  const pdfAttachments = attachments.filter(file => 
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search
    if (userSearch.trim()) {
      const filtered = availableUsers
        .filter(u => 
          u.nome.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase())
        )
        .slice(0, 5); // Show only top 5 matches
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [userSearch, availableUsers]);

  useEffect(() => {
    // Update parent component with current config
    const config: SignatureConfig = {
      signatureType,
      signatureTarget,
      includeMyself,
      includeClient,
      requestSignatures,
      signatureRequests,
      orderedSignatures,
      mySignatureOrder
    };
    onSignatureConfigChange(config);
  }, [signatureType, signatureTarget, includeMyself, includeClient, requestSignatures, signatureRequests, orderedSignatures, mySignatureOrder]);

  const loadUsers = async () => {
    try {
      const users = await apiService.getUsers();
      // Filter out current user from available users
      setAvailableUsers(users.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const addUserToSignatureList = (selectedUser: any) => {
    // Check if user is already in the list
    if (signatureRequests.find(req => req.id === selectedUser.id)) {
      return;
    }

    const newRequest: SignatureRequest = {
      id: selectedUser.id,
      type: 'user',
      name: selectedUser.nome,
      email: selectedUser.email,
      department: selectedUser.department_name,
      order: signatureRequests.length + 1
    };

    setSignatureRequests(prev => [...prev, newRequest]);
    setUserSearch('');
  };

  const removeSignatureRequest = (id: string) => {
    setSignatureRequests(prev => {
      const filtered = prev.filter(req => req.id !== id);
      // Reorder remaining items
      return filtered.map((req, index) => ({ ...req, order: index + 1 }));
    });
  };

  const moveSignatureRequest = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setSignatureRequests(prev => {
      const newList = [...prev];
      const [movedItem] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, movedItem);
      
      // Update order numbers
      return newList.map((req, index) => ({ ...req, order: index + 1 }));
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveSignatureRequest(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getTotalSigners = () => {
    let total = 0;
    if (includeMyself) total++;
    if (includeClient) total++;
    total += signatureRequests.length;
    return total;
  };

  const getMyOrderPosition = () => {
    if (!includeMyself) return null;
    
    let position = mySignatureOrder;
    if (includeClient && mySignatureOrder > 1) position++;
    
    return position;
  };

  return (
    <div className="space-y-4 ml-7">
      {/* Signature Type Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Tipo de Assinatura
        </label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="signature_type"
              value="zeydoc"
              checked={signatureType === 'zeydoc'}
              onChange={(e) => setSignatureType(e.target.value)}
              className="w-3 h-3 text-[#FF6B35] border-gray-300 focus:ring-[#FF6B35]"
            />
            <span className="text-xs text-gray-700">Assinatura ZeyDoc</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="signature_type"
              value="icp_brasil"
              checked={signatureType === 'icp_brasil'}
              onChange={(e) => setSignatureType(e.target.value)}
              className="w-3 h-3 text-[#FF6B35] border-gray-300 focus:ring-[#FF6B35]"
            />
            <span className="text-xs text-gray-700">Assinatura ICP-BRASIL</span>
          </label>
        </div>
      </div>

      {/* Signature Target Selection */}
      {signatureType && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            O que assinar
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="signature_target"
                value="protocol"
                checked={signatureTarget === 'protocol'}
                onChange={(e) => setSignatureTarget(e.target.value)}
                className="w-3 h-3 text-[#FF6B35] border-gray-300 focus:ring-[#FF6B35]"
              />
              <span className="text-xs text-gray-700">Assinar Protocolo</span>
            </label>
            
            {pdfAttachments.length > 0 && (
              <>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="signature_target"
                    value="attachments"
                    checked={signatureTarget === 'attachments'}
                    onChange={(e) => setSignatureTarget(e.target.value)}
                    className="w-3 h-3 text-[#FF6B35] border-gray-300 focus:ring-[#FF6B35]"
                  />
                  <span className="text-xs text-gray-700">
                    Assinar Anexos ({pdfAttachments.length} PDF{pdfAttachments.length > 1 ? 's' : ''})
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="signature_target"
                    value="both"
                    checked={signatureTarget === 'both'}
                    onChange={(e) => setSignatureTarget(e.target.value)}
                    className="w-3 h-3 text-[#FF6B35] border-gray-300 focus:ring-[#FF6B35]"
                  />
                  <span className="text-xs text-gray-700">Assinar Protocolo + Anexos</span>
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {/* My Signature Options */}
      {signatureType && signatureTarget && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-blue-800 mb-3 flex items-center">
            <User className="w-3 h-3 mr-1" />
            Minha Assinatura
          </h4>
          
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeMyself}
                onChange={(e) => setIncludeMyself(e.target.checked)}
                className="w-3 h-3 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
              />
              <span className="text-xs text-gray-700">Eu também vou assinar</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={requestSignatures}
                onChange={(e) => setRequestSignatures(e.target.checked)}
                className="w-3 h-3 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
              />
              <span className="text-xs text-gray-700">Solicitar assinaturas de outras pessoas</span>
            </label>
          </div>
        </div>
      )}

      {/* Request Signatures Section */}
      {requestSignatures && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-green-800 mb-3 flex items-center">
            <Users className="w-3 h-3 mr-1" />
            Solicitar Assinaturas
          </h4>

          {/* Client Signature Option */}
          {protocolInfo?.requester_email && (
            <div className="mb-3 p-2 bg-white rounded border border-green-200">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeClient}
                  onChange={(e) => setIncludeClient(e.target.checked)}
                  className="w-3 h-3 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                />
                <div className="flex items-center space-x-2">
                  <Mail className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-gray-700">
                    Solicitar assinatura do cliente: <span className="font-medium">{protocolInfo.requester_name}</span>
                  </span>
                </div>
              </label>
              <p className="text-xs text-green-600 ml-5 mt-1">
                📧 Será enviado por email para: {protocolInfo.requester_email}
              </p>
            </div>
          )}

          {/* User Search */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Buscar usuários internos
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Digite o nome do usuário..."
                className="w-full pl-7 pr-3 py-2 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              />
            </div>

            {/* User Search Results */}
            {filteredUsers.length > 0 && (
              <div className="mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-32 overflow-y-auto">
                {filteredUsers.map((searchUser) => (
                  <button
                    key={searchUser.id}
                    type="button"
                    onClick={() => addUserToSignatureList(searchUser)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-xs"
                  >
                    <User className="w-3 h-3 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{searchUser.nome}</div>
                      <div className="text-gray-500">{searchUser.email}</div>
                      {searchUser.department_name && (
                        <div className="text-gray-400">{searchUser.department_name}</div>
                      )}
                    </div>
                    <Plus className="w-3 h-3 text-green-600" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Users List */}
          {signatureRequests.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">
                  Usuários selecionados ({signatureRequests.length})
                </label>
                {signatureRequests.length > 1 && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={orderedSignatures}
                      onChange={(e) => setOrderedSignatures(e.target.checked)}
                      className="w-3 h-3 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                    />
                    <span className="text-xs text-gray-700">Assinaturas ordenadas</span>
                  </label>
                )}
              </div>

              <div className="space-y-1 max-h-32 overflow-y-auto">
                {signatureRequests.map((request, index) => (
                  <div
                    key={request.id}
                    draggable={orderedSignatures}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center space-x-2 p-2 bg-white rounded border border-gray-200 ${
                      orderedSignatures ? 'cursor-move' : ''
                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                  >
                    {orderedSignatures && (
                      <div className="flex items-center space-x-1">
                        <GripVertical className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                          {request.order}
                        </span>
                      </div>
                    )}
                    
                    <User className="w-3 h-3 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">{request.name}</div>
                      <div className="text-xs text-gray-500 truncate">{request.email}</div>
                      {request.department && (
                        <div className="text-xs text-gray-400">{request.department}</div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeSignatureRequest(request.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {orderedSignatures && (
                <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  💡 Arraste os itens para reordenar. As assinaturas seguirão esta ordem sequencial.
                </div>
              )}
            </div>
          )}

          {/* My Signature Order (when ordered signatures is enabled) */}
          {includeMyself && orderedSignatures && getTotalSigners() > 1 && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <label className="block text-xs font-medium text-yellow-700 mb-2">
                Minha posição na ordem de assinatura
              </label>
              <select
                value={mySignatureOrder}
                onChange={(e) => setMySignatureOrder(parseInt(e.target.value))}
                className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              >
                {Array.from({ length: getTotalSigners() }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>
                    {num}º - {num === 1 ? 'Assinar primeiro' : 
                              num === getTotalSigners() ? 'Assinar por último' : 
                              `Assinar em ${num}º lugar`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Validation Messages */}
          {requestSignatures && !includeMyself && signatureRequests.length === 0 && !includeClient && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-700">
                ⚠️ Selecione pelo menos uma pessoa para solicitar assinatura
              </p>
            </div>
          )}
        </div>
      )}

      {/* Signature Summary */}
      {signatureType && signatureTarget && (includeMyself || requestSignatures) && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-3 h-3 text-blue-600" />
            <span className="text-xs text-blue-800 font-medium">
              📋 Resumo da Assinatura Digital
            </span>
          </div>
          
          <div className="text-xs text-blue-700 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Tipo:</span>
              <span>{signatureType === 'zeydoc' ? 'ZeyDoc' : 'ICP-BRASIL'}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium">Assinar:</span>
              <span>
                {signatureTarget === 'protocol' ? 'Protocolo' :
                 signatureTarget === 'attachments' ? `${pdfAttachments.length} Anexo${pdfAttachments.length > 1 ? 's' : ''}` :
                 `Protocolo + ${pdfAttachments.length} Anexo${pdfAttachments.length > 1 ? 's' : ''}`}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-medium">Total de assinantes:</span>
              <span className="bg-blue-100 px-2 py-0.5 rounded font-bold">
                {getTotalSigners()}
              </span>
            </div>

            {orderedSignatures && getTotalSigners() > 1 && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <span className="font-medium">Ordem das assinaturas:</span>
                <div className="mt-1 space-y-1">
                  {includeMyself && mySignatureOrder === 1 && (
                    <div className="flex items-center space-x-1">
                      <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs font-bold">1º</span>
                      <span>Eu ({user?.name})</span>
                    </div>
                  )}
                  
                  {includeClient && (
                    <div className="flex items-center space-x-1">
                      <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs font-bold">
                        {includeMyself && mySignatureOrder === 1 ? '2º' : '1º'}
                      </span>
                      <span>Cliente ({protocolInfo?.requester_name})</span>
                    </div>
                  )}
                  
                  {signatureRequests.map((request, index) => {
                    let order = request.order;
                    if (includeClient) order++;
                    if (includeMyself && mySignatureOrder <= request.order) order++;
                    
                    return (
                      <div key={request.id} className="flex items-center space-x-1">
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-bold">
                          {order}º
                        </span>
                        <span>{request.name}</span>
                      </div>
                    );
                  })}
                  
                  {includeMyself && mySignatureOrder > 1 && (
                    <div className="flex items-center space-x-1">
                      <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs font-bold">
                        {getMyOrderPosition()}º
                      </span>
                      <span>Eu ({user?.name})</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!orderedSignatures && getTotalSigners() > 1 && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  ℹ️ Assinaturas simultâneas - todos podem assinar a qualquer momento
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureRequestSection;
