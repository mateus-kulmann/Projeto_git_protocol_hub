import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Database types based on the schema
export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          nome: string;
          dominio: string | null;
          configuracao: any | null;
          ativo: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          dominio?: string | null;
          configuracao?: any | null;
          ativo?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          dominio?: string | null;
          configuracao?: any | null;
          ativo?: boolean | null;
          created_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          tenant_id: string | null;
          nome: string;
          email: string;
          senha: string;
          funcao: string | null;
          department_id: string | null;
          ativo: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          nome: string;
          email: string;
          senha: string;
          funcao?: string | null;
          department_id?: string | null;
          ativo?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          nome?: string;
          email?: string;
          senha?: string;
          funcao?: string | null;
          department_id?: string | null;
          ativo?: boolean | null;
          created_at?: string | null;
        };
      };
      departments: {
        Row: {
          id: string;
          tenant_id: string | null;
          nome: string;
          descricao: string | null;
          parent_id: string | null;
          responsible_user_id: string | null;
          ativo: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          nome: string;
          descricao?: string | null;
          parent_id?: string | null;
          responsible_user_id?: string | null;
          ativo?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          nome?: string;
          descricao?: string | null;
          parent_id?: string | null;
          responsible_user_id?: string | null;
          ativo?: boolean | null;
          created_at?: string | null;
        };
      };
      protocols: {
        Row: {
          id: string;
          tenant_id: string | null;
          numero: number;
          assunto: string | null;
          status: string | null;
          prioridade: string | null;
          canal: string | null;
          requester_name: string | null;
          requester_email: string | null;
          requester_phone: string | null;
          requester_cpf: string | null;
          current_department_id: string | null;
          assigned_user_id: string | null;
          category_id: string | null;
          chat_active: boolean | null;
          client_online: boolean | null;
          agent_online: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          numero?: number;
          assunto?: string | null;
          status?: string | null;
          prioridade?: string | null;
          canal?: string | null;
          requester_name?: string | null;
          requester_email?: string | null;
          requester_phone?: string | null;
          requester_cpf?: string | null;
          current_department_id?: string | null;
          assigned_user_id?: string | null;
          category_id?: string | null;
          chat_active?: boolean | null;
          client_online?: boolean | null;
          agent_online?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          numero?: number;
          assunto?: string | null;
          status?: string | null;
          prioridade?: string | null;
          canal?: string | null;
          requester_name?: string | null;
          requester_email?: string | null;
          requester_phone?: string | null;
          requester_cpf?: string | null;
          current_department_id?: string | null;
          assigned_user_id?: string | null;
          category_id?: string | null;
          chat_active?: boolean | null;
          client_online?: boolean | null;
          agent_online?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          tenant_id: string | null;
          nome: string;
          department_id: string | null;
          auto_assign: boolean | null;
          prioridade: string | null;
          sla_hours: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          nome: string;
          department_id?: string | null;
          auto_assign?: boolean | null;
          prioridade?: string | null;
          sla_hours?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          nome?: string;
          department_id?: string | null;
          auto_assign?: boolean | null;
          prioridade?: string | null;
          sla_hours?: number | null;
          created_at?: string | null;
        };
      };
      protocol_messages: {
        Row: {
          id: string;
          protocol_id: string | null;
          user_id: string | null;
          sender_type: string | null;
          conteudo: string | null;
          tipo: string | null;
          anexos: any | null;
          is_internal: boolean | null;
          read_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          protocol_id?: string | null;
          user_id?: string | null;
          sender_type?: string | null;
          conteudo?: string | null;
          tipo?: string | null;
          anexos?: any | null;
          is_internal?: boolean | null;
          read_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          protocol_id?: string | null;
          user_id?: string | null;
          sender_type?: string | null;
          conteudo?: string | null;
          tipo?: string | null;
          anexos?: any | null;
          is_internal?: boolean | null;
          read_at?: string | null;
          created_at?: string | null;
        };
      };
      solicitantes: {
        Row: {
          id: string;
          tenant_id: string | null;
          tipo: string;
          nome_completo: string | null;
          razao_social: string | null;
          cpf: string | null;
          cnpj: string | null;
          email: string | null;
          telefone: string | null;
          endereco: string | null;
          pessoa_juridica_id: string | null;
          ativo: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          tipo: string;
          nome_completo?: string | null;
          razao_social?: string | null;
          cpf?: string | null;
          cnpj?: string | null;
          email?: string | null;
          telefone?: string | null;
          endereco?: string | null;
          pessoa_juridica_id?: string | null;
          ativo?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          tipo?: string;
          nome_completo?: string | null;
          razao_social?: string | null;
          cpf?: string | null;
          cnpj?: string | null;
          email?: string | null;
          telefone?: string | null;
          endereco?: string | null;
          pessoa_juridica_id?: string | null;
          ativo?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
}

// Upload file to Supabase Storage
export const uploadFile = async (file: File, folder: string = 'documentos') => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('documentos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documentos')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: publicUrl,
      originalName: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Delete file from Supabase Storage
export const deleteFile = async (filePath: string) => {
  try {
    const { error } = await supabase.storage
      .from('documentos')
      .remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
