import React from 'react';
import { Search, Filter } from 'lucide-react';

interface ProtocolFiltersProps {
  filters: {
    status: string;
    department: string;
    channel: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

const ProtocolFilters: React.FC<ProtocolFiltersProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-3 mb-3">
      <div className="flex items-center space-x-3 mb-3">
        <Filter className="w-5 h-5 text-gray-400" />
        <h3 className="text-sm font-semibold text-[#404040]">Filtros</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="open">Aberto</option>
            <option value="in_progress">Em Andamento</option>
            <option value="pending">Pendente</option>
            <option value="closed">Finalizado</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Canal
          </label>
          <select
            value={filters.channel}
            onChange={(e) => onFilterChange('channel', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="web">Portal Web</option>
            <option value="chat">Chat</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Setor
          </label>
          <select
            value={filters.department}
            onChange={(e) => onFilterChange('department', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="dept1">TI</option>
            <option value="dept2">RH</option>
            <option value="dept3">Financeiro</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Busca
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Número, nome, CPF..."
              className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolFilters;
