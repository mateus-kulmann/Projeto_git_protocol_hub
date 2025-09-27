import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Building, Mail, Phone, FileText, MapPin, Users } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface CreateSolicitanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSolicitanteCreated: () => void;
}

interface CreateSolicitanteFormData {
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  nome_completo?: string;
  razao_social?: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  pessoa_juridica_id?: string;
}

const CreateSolicitanteModal: React.FC<CreateSolicitanteModalProps> = ({
  isOpen,
  onClose,
  onSolicitanteCreated
}) => {
  const [loading, setLoading] = useState(false);
  const [pessoasJuridicas, setPessoasJuridicas] = useState<any[]>([]);
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<CreateSolicitanteFormData>({
    defaultValues: {
      tipo: 'pessoa_fisica'
    }
  });

  const tipoSelecionado = watch('tipo');

  useEffect(() => {
    if (isOpen) {
      loadPessoasJuridicas();
    }
  }, [isOpen]);

  const loadPessoasJuridicas = async () => {
    try {
      const data = await apiService.getSolicitantes({ tipo: 'pessoa_juridica' });
      setPessoasJuridicas(data);
    } catch (error) {
      console.error('Error loading pessoas jurídicas:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: CreateSolicitanteFormData) => {
    try {
      setLoading(true);
      
      // Validações específicas por tipo
      if (data.tipo === 'pessoa_fisica') {
        if (!data.nome_completo || !data.cpf) {
          toast.error('Nome completo e CPF são obrigatórios para pessoa física');
          return;
        }
        if (!data.email && !data.telefone) {
          toast.error('Email ou telefone é obrigatório');
          return;
        }
      } else {
        if (!data.razao_social || !data.cnpj) {
          toast.error('Razão social e CNPJ são obrigatórios para pessoa jurídica');
          return;
        }
        if (!data.email && !data.telefone) {
          toast.error('Email ou telefone é obrigatório');
          return;
        }
      }

      await apiService.createSolicitante(data);
      
      toast.success('Solicitante criado com sucesso!');
      handleClose();
      onSolicitanteCreated();
    } catch (error: any) {
      console.error('Error creating solicitante:', error);
      toast.error(error.message || 'Erro ao criar solicitante');
    } finally {
      setLoading(false);
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
              <Users className="w-6 h-6 text-[#FF6B35]" />
              <h2 className="text-xl font-bold text-[#404040]">Novo Solicitante</h2>
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
          <div className="space-y-6">
            {/* Tipo de Pessoa */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-[#404040] mb-4">Tipo de Solicitante</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    {...register('tipo', { required: 'Tipo é obrigatório' })}
                    value="pessoa_fisica"
                    className="w-4 h-4 text-[#FF6B35] border-gray-300 focus:ring-[#FF6B35]"
                  />
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-900">Pessoa Física</span>
                      <p className="text-xs text-gray-500">Indivíduo/cidadão</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    {...register('tipo', { required: 'Tipo é obrigatório' })}
                    value="pessoa_juridica"
                    className="w-4 h-4 text-[#FF6B35] border-gray-300 focus:ring-[#FF6B35]"
                  />
                  <div className="flex items-center space-x-2">
                    <Building className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="font-medium text-gray-900">Pessoa Jurídica</span>
                      <p className="text-xs text-gray-500">Empresa/organização</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Dados Principais */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-[#404040] mb-4">
                {tipoSelecionado === 'pessoa_fisica' ? 'Dados Pessoais' : 'Dados da Empresa'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome/Razão Social */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#404040] mb-2">
                    {tipoSelecionado === 'pessoa_fisica' ? 'Nome Completo *' : 'Razão Social *'}
                  </label>
                  <div className="relative">
                    {tipoSelecionado === 'pessoa_fisica' ? (
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    ) : (
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    )}
                    <input
                      type="text"
                      {...register(tipoSelecionado === 'pessoa_fisica' ? 'nome_completo' : 'razao_social', { 
                        required: `${tipoSelecionado === 'pessoa_fisica' ? 'Nome completo' : 'Razão social'} é obrigatório`,
                        minLength: {
                          value: 2,
                          message: 'Deve ter pelo menos 2 caracteres'
                        }
                      })}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent ${
                        (tipoSelecionado === 'pessoa_fisica' ? errors.nome_completo : errors.razao_social) ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={tipoSelecionado === 'pessoa_fisica' ? 'Nome completo da pessoa' : 'Razão social da empresa'}
                    />
                  </div>
                  {(tipoSelecionado === 'pessoa_fisica' ? errors.nome_completo : errors.razao_social) && (
                    <p className="mt-1 text-sm text-red-600">
                      {(tipoSelecionado === 'pessoa_fisica' ? errors.nome_completo : errors.razao_social)?.message}
                    </p>
                  )}
                </div>

                {/* CPF/CNPJ */}
                <div>
                  <label className="block text-sm font-medium text-[#404040] mb-2">
                    {tipoSelecionado === 'pessoa_fisica' ? 'CPF *' : 'CNPJ *'}
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      {...register(tipoSelecionado === 'pessoa_fisica' ? 'cpf' : 'cnpj', { 
                        required: `${tipoSelecionado === 'pessoa_fisica' ? 'CPF' : 'CNPJ'} é obrigatório`
                      })}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent ${
                        (tipoSelecionado === 'pessoa_fisica' ? errors.cpf : errors.cnpj) ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={tipoSelecionado === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                    />
                  </div>
                  {(tipoSelecionado === 'pessoa_fisica' ? errors.cpf : errors.cnpj) && (
                    <p className="mt-1 text-sm text-red-600">
                      {(tipoSelecionado === 'pessoa_fisica' ? errors.cpf : errors.cnpj)?.message}
                    </p>
                  )}
                </div>

                {/* Vinculação para Pessoa Física */}
                {tipoSelecionado === 'pessoa_fisica' && pessoasJuridicas.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-[#404040] mb-2">
                      Empresa Vinculada (Opcional)
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        {...register('pessoa_juridica_id')}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                      >
                        <option value="">Selecionar empresa (opcional)</option>
                        {pessoasJuridicas.map((pj) => (
                          <option key={pj.id} value={pj.id}>
                            {pj.razao_social}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dados de Contato */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-[#404040] mb-4">Dados de Contato</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#404040] mb-2">
                    Email {(!watch('telefone') || !watch('telefone')?.trim()) ? '*' : ''}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      {...register('email', {
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Email inválido'
                        }
                      })}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-[#404040] mb-2">
                    Telefone {(!watch('email') || !watch('email')?.trim()) ? '*' : ''}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      {...register('telefone')}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#404040] mb-2">
                    Endereço (Opcional)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      {...register('endereco')}
                      rows={3}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none"
                      placeholder="Endereço completo..."
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-600">
                * Pelo menos um meio de contato (email ou telefone) é obrigatório
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
                <span>Criar Solicitante</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSolicitanteModal;