import { supabase } from '../lib/supabase';

class ApiService {
  // Auth
  async login(email: string, password: string) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password,
      });

      if (authError) {
        throw new Error('Credenciais inválidas');
      }

      if (!authData.user) {
        throw new Error('Erro na autenticação');
      }

      // Get user details from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, tenant_id, nome, email, funcao, department_id, role_id, ativo, created_at, auth_user_id, telefone')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Usuário não encontrado na tabela pública');
      }

      // Get department name separately if department_id exists
      let departmentName = null;
      if (userData.department_id) {
        const { data: deptData } = await supabase
          .from('departments')
          .select('nome')
          .eq('id', userData.department_id)
          .single();
        departmentName = deptData?.nome;
      }

      // Get tenant info separately
      let tenantName = null;
      let tenantConfig = null;
      if (userData.tenant_id) {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('nome, configuracao')
          .eq('id', userData.tenant_id)
          .single();
        tenantName = tenantData?.nome;
        tenantConfig = tenantData?.configuracao;
      }

      const user = {
        id: userData.id,
        name: userData.nome,
        email: userData.email,
        role: userData.funcao,
        tenant_id: userData.tenant_id,
        department_id: userData.department_id,
        department_name: departmentName,
        tenant_name: tenantName,
        tenant_config: tenantConfig
      };

      return { user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Protocols
  async getProtocols(params: any = {}) {
    try {
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      let query = supabase
        .from('protocols')
        .select(`
          *,
          departments!protocols_current_department_id_fkey(nome),
          users!protocols_assigned_user_id_fkey(nome),
          categories!protocols_category_id_fkey(nome),
          chat_sessions!chat_sessions_protocol_id_fkey(client_online, agent_online, status)
        `)
        .order('updated_at', { ascending: false });

      // Apply filters
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.department) {
        query = query.eq('current_department_id', params.department);
      }
      if (params.channel) {
        query = query.eq('canal', params.channel);
      }
      if (params.search) {
        query = query.or(`numero.ilike.%${params.search}%,requester_name.ilike.%${params.search}%,assunto.ilike.%${params.search}%`);
      }

      const { data: protocols, error } = await query;

      if (error) throw error;

      // Transform data to match expected format
      const transformedProtocols = protocols?.map(protocol => ({
        ...protocol,
        number: protocol.numero?.toString(),
        subject: protocol.assunto,
        channel: protocol.canal,
        department_name: protocol.departments?.nome,
        assigned_user_name: protocol.users?.nome,
        category_name: protocol.categories?.nome,
        client_online: protocol.chat_sessions?.[0]?.client_online ? 1 : 0,
        agent_online: protocol.chat_sessions?.[0]?.agent_online ? 1 : 0,
        chat_status: protocol.chat_sessions?.[0]?.status,
        unread_count: 0 // TODO: Calculate unread messages
      })) || [];

      return {
        protocols: transformedProtocols,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_count: transformedProtocols.length
        }
      };
    } catch (error) {
      console.error('Error fetching protocols:', error);
      throw error;
    }
  }

  async getProtocol(id: string) {
    try {
      // Get protocol details
      const { data: protocol, error: protocolError } = await supabase
        .from('protocols')
        .select(`
          *,
          departments!protocols_current_department_id_fkey(nome),
          users!protocols_assigned_user_id_fkey(nome),
          categories!protocols_category_id_fkey(nome),
          chat_sessions!chat_sessions_protocol_id_fkey(client_online, agent_online, status)
        `)
        .eq('id', id)
        .single();

      if (protocolError || !protocol) {
        throw new Error('Protocolo não encontrado');
      }

      // Get messages
      const { data: messages, error: messagesError } = await supabase
        .from('protocol_messages')
        .select(`
          *,
          users!protocol_messages_user_id_fkey(nome)
        `)
        .eq('protocol_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw new Error('Erro ao carregar mensagens');
      }

      // Get attachments
      const { data: attachments, error: attachmentsError } = await supabase
        .from('protocol_attachments')
        .select(`
          *,
          users!protocol_attachments_uploaded_by_fkey(nome)
        `)
        .eq('protocol_id', id);

      if (attachmentsError) {
        console.error('Error loading attachments:', attachmentsError);
      }

      // Transform data
      const transformedProtocol = {
        id: protocol.id,
        number: protocol.numero?.toString(),
        subject: protocol.assunto,
        status: protocol.status,
        priority: protocol.prioridade,
        channel: protocol.canal,
        requester_name: protocol.requester_name,
        requester_email: protocol.requester_email,
        requester_phone: protocol.requester_phone,
        requester_cpf: protocol.requester_cpf,
        department_name: protocol.departments?.nome,
        assigned_user_name: protocol.users?.nome,
        category_name: protocol.categories?.nome,
        chat_active: protocol.chat_active ? 1 : 0,
        client_online: protocol.chat_sessions?.[0]?.client_online ? 1 : 0,
        agent_online: protocol.chat_sessions?.[0]?.agent_online ? 1 : 0,
        chat_status: protocol.chat_sessions?.[0]?.status,
        created_at: protocol.created_at,
        updated_at: protocol.updated_at
      };

      const transformedMessages = messages?.map(msg => ({
        id: msg.id,
        content: msg.conteudo, // Log para debug
        sender_type: msg.sender_type,
        type: msg.tipo,
        user_name: msg.users?.nome,
        attachments: msg.anexos || [],
        is_internal: msg.is_internal ? 1 : 0,
        read_at: msg.read_at,
        created_at: msg.created_at
      })) || [];

      // Debug: verificar se as mensagens estão completas
      console.log('🔍 Mensagens do banco:', transformedMessages.map(m => ({
        id: m.id,
        content_length: m.content?.length,
        content_preview: m.content?.substring(0, 100) + '...',
        full_content: m.content
      })));

      const transformedAttachments = attachments?.map(att => ({
        id: att.id,
        file_path: att.nome_do_arquivo,
        original_name: att.original_name,
        size: att.tamanho,
        type: att.tipo,
        uploaded_by_name: att.users?.nome,
        created_at: att.created_at
      })) || [];

      return {
        protocol: transformedProtocol,
        messages: transformedMessages,
        attachments: transformedAttachments
      };
    } catch (error) {
      console.error('Error fetching protocol:', error);
      throw error;
    }
  }

  async createProtocol(data: any) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Get user details from users table to get tenant_id
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('email', user.email)
        .single();

      if (userDataError || !userData) {
        throw new Error('Dados do usuário não encontrados');
      }

      const { data: protocol, error } = await supabase
        .from('protocols')
        .insert({
          tenant_id: userData.tenant_id,
          assunto: data.subject,
          status: 'open',
          prioridade: data.priority,
          canal: data.channel || 'web',
          document_type: data.document_type,
          requester_name: data.requester_name,
          requester_email: data.requester_email,
          requester_phone: data.requester_phone,
          requester_cpf: data.requester_cpf,
          numero: null // Will be set by trigger
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Create initial system message
      if (protocol) {
        // Get user name from users table  
        const { data: userNameData } = await supabase
          .from('users')
          .select('nome')
          .eq('email', user.email)
          .single();

        await supabase
          .from('protocol_messages')
          .insert({
            protocol_id: protocol.id,
            user_id: userData.id,
            sender_type: 'system',
            conteudo: `Protocolo criado por ${userNameData?.nome || 'Usuário'}`,
            tipo: 'system'
          });

        // Add description if provided
        if (data.description?.trim()) {
          await supabase
            .from('protocol_messages')
            .insert({
              protocol_id: protocol.id,
              user_id: userData.id,
              sender_type: 'system',
              conteudo: data.description.trim(),
              tipo: 'message'
            });
        }
      }

      return {
        id: protocol?.id,
        number: protocol?.numero?.toString(),
        message: 'Protocolo criado com sucesso'
      };
    } catch (error) {
      console.error('Error creating protocol:', error);
      throw error;
    }
  }

  async updateProtocolStatus(id: string, status: string, comment?: string) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Get user details from users table
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('id, nome')
        .eq('auth_user_id', user.id)
        .single();

      if (userDataError || !userData) {
        throw new Error('Dados do usuário não encontrados');
      }

      // Get current protocol status for audit
      const { data: currentProtocol } = await supabase
        .from('protocols')
        .select('status')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('protocols')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Log the action in audit trail
      const statusLabels = {
        'open': 'Aberto',
        'in_progress': 'Em Andamento', 
        'pending': 'Pendente',
        'closed': 'Finalizado'
      };

      // Log action using the helper function
      const { error: auditError } = await supabase
        .rpc('log_protocol_action', {
          p_protocol_id: id,
          p_user_id: userData.id,
          p_action_type: 'status_change',
          p_action_description: `Status alterado de "${statusLabels[currentProtocol?.status] || currentProtocol?.status}" para "${statusLabels[status] || status}"`,
          p_old_value: currentProtocol?.status,
          p_new_value: status,
          p_comment: comment || null
        });

      if (auditError) {
        console.error('Error logging audit action:', auditError);
      }

      return { message: 'Status atualizado com sucesso' };
    } catch (error) {
      console.error('Error updating protocol status:', error);
      throw error;
    }
  }

  async assignProtocol(id: string, userId: string, currentUserId: string) {
    try {
      // Get current and assigned user details
      const { data: currentUser } = await supabase
        .from('users')
        .select('nome')
        .eq('id', currentUserId)
        .single();

      const assignedUserId = userId === 'me' ? currentUserId : userId;
      
      // Get assigned user details
      const { data: assignedUser } = await supabase
        .from('users')
        .select('nome')
        .eq('id', assignedUserId)
        .single();

      // Get current assignment for audit
      const { data: currentProtocol } = await supabase
        .from('protocols')
        .select(`
          assigned_user_id,
          users!protocols_assigned_user_id_fkey(nome)
        `)
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('protocols')
        .update({ 
          assigned_user_id: assignedUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Log the action in audit trail
      const oldAssignee = currentProtocol?.users?.nome || 'Não atribuído';
      const newAssignee = assignedUser?.nome || 'Usuário';
      
      // Log action using the helper function
      const { error: auditError } = await supabase
        .rpc('log_protocol_action', {
          p_protocol_id: id,
          p_user_id: currentUserId,
          p_action_type: 'assignment',
          p_action_description: `Protocolo atribuído de "${oldAssignee}" para "${newAssignee}"`,
          p_old_value: currentProtocol?.assigned_user_id,
          p_new_value: assignedUserId,
          p_comment: null
        });

      if (auditError) {
        console.error('Error logging audit action:', auditError);
      }

      return { message: 'Protocolo atribuído com sucesso' };
    } catch (error) {
      console.error('Error assigning protocol:', error);
      throw error;
    }
  }

  async forwardProtocol(id: string, data: any, currentUserId: string) {
    try {
      // Process mentions for notifications
      if (data.mentions && data.mentions.length > 0) {
        // TODO: Send notifications to mentioned users/departments
        console.log('Forward mentions to notify:', data.mentions);
      }
      
      // Get current department for audit
      const { data: currentProtocol } = await supabase
        .from('protocols')
        .select(`
          current_department_id,
          departments!protocols_current_department_id_fkey(nome)
        `)
        .eq('id', id)
        .single();

      // Get new department name
      const { data: newDepartment } = await supabase
        .from('departments')
        .select('nome')
        .eq('id', data.department_id)
        .single();

      const { error } = await supabase
        .from('protocols')
        .update({ 
          current_department_id: data.department_id,
          assigned_user_id: data.assigned_user_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Log the action in audit trail
      const oldDepartment = currentProtocol?.departments?.nome || 'Não definido';
      const newDepartmentName = newDepartment?.nome || 'Setor desconhecido';
      
      // Log action using the helper function
      const { error: auditError } = await supabase
        .rpc('log_protocol_action', {
          p_protocol_id: id,
          p_user_id: currentUserId,
          p_action_type: 'forward',
          p_action_description: `Protocolo encaminhado de "${oldDepartment}" para "${newDepartmentName}"`,
          p_old_value: currentProtocol?.current_department_id,
          p_new_value: data.department_id,
          p_comment: data.comment
        });

      if (auditError) {
        console.error('Error logging audit action:', auditError);
      }

      return { message: 'Protocolo encaminhado com sucesso' };
    } catch (error) {
      console.error('Error forwarding protocol:', error);
      throw error;
    }
  }

  // Messages
  async sendMessage(data: any, userId: string) {
    try {
      // Process mentions for notifications
      if (data.mentions && data.mentions.length > 0) {
        // TODO: Send notifications to mentioned users/departments
        console.log('Mentions to notify:', data.mentions);
      }
      
      const { data: message, error } = await supabase
        .from('protocol_messages')
        .insert({
          protocol_id: data.protocol_id,
          user_id: userId,
          sender_type: data.sender_type || 'agent',
          conteudo: data.content,
          tipo: data.type || 'message',
          anexos: data.attachments || [],
          is_internal: data.is_internal || false
        })
        .select(`
          *,
          users!protocol_messages_user_id_fkey(nome)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update protocol timestamp
      await supabase
        .from('protocols')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.protocol_id);

      // Log message action in audit trail
      if (data.type !== 'system') {
        // Create mock notification log entry for delivery tracking
        if (!data.is_internal) {
          // Create notification log entry for external messages
          await supabase
            .from('notifications_log')
            .insert({
              protocol_id: data.protocol_id,
              tipo: 'email',
              destinatario: 'cliente@exemplo.com', // This should come from protocol requester_email
              conteudo: data.content,
              status: 'sent',
              sent_at: new Date().toISOString(),
              channel: 'email'
            });
        }

        // Log action using the helper function
        const { error: auditError } = await supabase
          .rpc('log_protocol_action', {
            p_protocol_id: data.protocol_id,
            p_user_id: userId,
            p_action_type: data.is_internal ? 'internal_message' : 'message',
            p_action_description: `${data.is_internal ? 'Mensagem interna' : 'Mensagem'} enviada`,
            p_old_value: null,
            p_new_value: data.content,
            p_comment: null
          });

        if (auditError) {
          console.error('Error logging audit action:', auditError);
        }
      }

      return {
        message: {
          id: message?.id,
          content: message?.conteudo,
          sender_type: message?.sender_type,
          type: message?.tipo,
          user_name: message?.users?.nome,
          attachments: message?.anexos || [],
          is_internal: message?.is_internal ? 1 : 0,
          created_at: message?.created_at
        }
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // New method to get audit trail
  async getProtocolAuditTrail(protocolId: string) {
    try {
      console.log('Fetching audit trail for protocol:', protocolId);
      
      const { data: auditTrail, error } = await supabase
        .from('protocol_audit_log')
        .select(`
          *,
          users!protocol_audit_log_user_id_fkey(nome, email),
          protocol_audit_views(
            id,
            user_id,
            users!protocol_audit_views_user_id_fkey(nome, email),
            user_type,
            department_name,
            access_channel,
            viewed_at,
            user_ip,
            user_agent
          )
        `)
        .eq('protocol_id', protocolId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching audit trail:', error);
        throw new Error(error.message);
      }

      console.log('Audit trail data:', auditTrail);
      return auditTrail || [];
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      return [];
    }
  }

  // Mark audit entry as viewed
  async markAuditEntryAsViewed(auditLogId: string, userId: string, userType: 'internal' | 'external' = 'internal', accessChannel: string = 'web') {
    try {
      console.log('Marking audit entry as viewed:', { auditLogId, userId, userType, accessChannel });
      
      // Get user department for internal users
      let departmentName = null;
      if (userType === 'internal') {
        const { data: userData } = await supabase
          .from('users')
          .select(`
            departments!users_department_id_fkey(nome)
          `)
          .eq('id', userId)
          .single();
        
        departmentName = userData?.departments?.nome;
        console.log('User department:', departmentName);
      }

      // Create new view record
      const { data, error } = await supabase
        .from('protocol_audit_views')
        .upsert({
          audit_log_id: auditLogId,
          user_id: userId,
          user_type: userType,
          department_name: departmentName,
          access_channel: accessChannel,
          viewed_at: new Date().toISOString()
        }, { 
          onConflict: 'audit_log_id,user_id',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('Error marking audit entry as viewed:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error marking audit entry as viewed:', error);
      throw error;
    }
  }

  // Add attachment to protocol
  async addAttachment(protocolId: string, attachmentData: {
    filePath: string;
    original_name: string;
    size: number;
    type: string;
    uploaded_by: string;
  }) {
    try {
      const { data: attachment, error } = await supabase
        .from('protocol_attachments')
        .insert({
          protocol_id: protocolId,
          nome_do_arquivo: attachmentData.filePath,
          original_name: attachmentData.original_name,
          tamanho: attachmentData.size,
          tipo: attachmentData.type,
          uploaded_by: attachmentData.uploaded_by
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return attachment;
    } catch (error) {
      console.error('Error adding attachment:', error);
      throw error;
    }
  }

  // Categories
  async getCategories() {
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select(`
          *,
          departments!categories_department_id_fkey(nome)
        `)
        .order('nome');

      if (error) {
        throw new Error(error.message);
      }

      return categories?.map(cat => ({
        id: cat.id,
        name: cat.nome,
        department_name: cat.departments?.nome
      })) || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Departments
  async getDepartments() {
    try {
      const { data: departments, error } = await supabase
        .from('departments')
        .select(`
          *,
          users(nome),
          protocols(id)
        `)
        .eq('ativo', true)
        .order('nome');

      if (error) {
        throw new Error(error.message);
      }

      return departments?.map(dept => ({
        id: dept.id,
        name: dept.nome,
        description: dept.descricao,
        responsible_name: dept.users?.nome || null,
        responsible_user_id: dept.responsible_user_id,
        parent_id: dept.parent_id,
        active_protocols: dept.protocols?.length || 0,
        created_at: dept.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async createDepartment(data: any) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Get user details from users table to get tenant_id
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, funcao')
        .eq('auth_user_id', user.id)
        .single();
        
      if (!userData) {
        throw new Error('Dados do usuário não encontrados');
      }

      const { data: department, error } = await supabase
        .from('departments')
        .insert({
          tenant_id: userData.tenant_id,
          nome: data.name,
          descricao: data.description,
          parent_id: data.parent_id,
          responsible_user_id: data.responsible_user_id,
          ativo: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        id: department?.id,
        message: 'Departamento criado com sucesso'
      };
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  async updateDepartment(id: string, data: any) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('departments')
        .update({
          nome: data.name,
          descricao: data.description,
          parent_id: data.parent_id,
          responsible_user_id: data.responsible_user_id
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return {
        message: 'Departamento atualizado com sucesso'
      };
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  async deleteDepartment(id: string) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Check if department has active protocols
      const { data: protocols, error: protocolsError } = await supabase
        .from('protocols')
        .select('id')
        .eq('current_department_id', id)
        .neq('status', 'closed');

      if (protocolsError) {
        throw new Error('Erro ao verificar protocolos do departamento');
      }

      if (protocols && protocols.length > 0) {
        throw new Error(`Não é possível excluir o departamento. Existem ${protocols.length} protocolos ativos vinculados a ele.`);
      }

      // Check if department has users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('department_id', id)
        .eq('ativo', true);

      if (usersError) {
        throw new Error('Erro ao verificar usuários do departamento');
      }

      if (users && users.length > 0) {
        throw new Error(`Não é possível excluir o departamento. Existem ${users.length} usuários vinculados a ele.`);
      }

      // Soft delete - mark as inactive instead of hard delete
      const { error } = await supabase
        .from('departments')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return {
        message: 'Departamento excluído com sucesso'
      };
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  // Get users for department assignment
  async getUsers() {
    try {
      // Simplified query to avoid RLS recursion
      const { data: users, error } = await supabase
        .from('users')
        .select('*');

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      return users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Create user
  async createUser(userData: {
    nome: string;
    email: string;
    senha: string;
    role_id: string;
    department_id?: string | null;
    telefone?: string;
  }) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Get user details from users table to get tenant_id
      const { data: currentUserData } = await supabase
        .from('users')
        .select('tenant_id, funcao')
        .eq('auth_user_id', user.id)
        .single();
        
      if (!currentUserData) {
        throw new Error('Dados do usuário não encontrados');
      }

      // Check if current user is admin
      const hasPermission = await this.checkUserPermission('users.create');
      if (!hasPermission) {
        throw new Error('Você não tem permissão para criar usuários');
      }

      // First create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.senha,
        email_confirm: true
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Then create user in users table
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUser.user.id,
          tenant_id: currentUserData.tenant_id,
          nome: userData.nome,
          email: userData.email,
          senha: userData.senha, // This will be hashed by trigger
          role_id: userData.role_id,
          department_id: userData.department_id,
          telefone: userData.telefone,
          ativo: true
        })
        .select()
        .single();

      if (error) {
        // If user creation fails, clean up auth user
        await supabase.auth.admin.deleteUser(authUser.user.id);
        throw new Error(error.message);
      }

      return {
        id: newUser?.id,
        message: 'Usuário criado com sucesso'
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(userId: string, userData: {
    nome?: string;
    email?: string;
    senha?: string;
    role_id?: string;
    department_id?: string | null;
    telefone?: string;
  }) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Get user details from users table
      const { data: currentUserData } = await supabase
        .from('users')
        .select('funcao')
        .eq('auth_user_id', user.id)
        .single();
        
      if (!currentUserData) {
        throw new Error('Dados do usuário não encontrados');
      }

      // Check if current user is admin
      const hasPermission = await this.checkUserPermission('users.edit');
      if (!hasPermission) {
        throw new Error('Você não tem permissão para editar usuários');
      }

      const { error } = await supabase
        .from('users')
        .update({
          nome: userData.nome,
          email: userData.email,
          senha: userData.senha, // Will be hashed by trigger if provided
          role_id: userData.role_id,
          department_id: userData.department_id,
          telefone: userData.telefone
        })
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        message: 'Usuário atualizado com sucesso'
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Toggle user status
  async toggleUserStatus(userId: string, active: boolean) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Get user details from users table
      const { data: currentUserData } = await supabase
        .from('users')
        .select('funcao')
        .eq('auth_user_id', user.id)
        .single();
        
      if (!currentUserData) {
        throw new Error('Dados do usuário não encontrados');
      }

      // Check if current user is admin
      const hasPermission = await this.checkUserPermission('users.deactivate');
      if (!hasPermission) {
        throw new Error('Você não tem permissão para alterar status de usuários');
      }

      const { error } = await supabase
        .from('users')
        .update({ ativo: active })
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        message: `Usuário ${active ? 'ativado' : 'desativado'} com sucesso`
      };
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(userId: string) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Get user details from users table
      const { data: currentUserData } = await supabase
        .from('users')
        .select('funcao')
        .eq('auth_user_id', user.id)
        .single();
        
      if (!currentUserData) {
        throw new Error('Dados do usuário não encontrados');
      }

      // Check if current user is admin
      const hasPermission = await this.checkUserPermission('users.delete');
      if (!hasPermission) {
        throw new Error('Você não tem permissão para excluir usuários');
      }

      // Get user to delete
      const { data: userToDelete } = await supabase
        .from('users')
        .select('auth_user_id')
        .eq('id', userId)
        .single();

      if (!userToDelete) {
        throw new Error('Usuário não encontrado');
      }

      // Delete from users table first
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      // Delete auth user if exists
      if (userToDelete.auth_user_id) {
        await supabase.auth.admin.deleteUser(userToDelete.auth_user_id);
      }

      return {
        message: 'Usuário excluído com sucesso'
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Roles and Permissions
  async getRoles() {
    try {
      // Simple query without joins to avoid RLS issues
      const { data: roles, error } = await supabase
        .from('roles')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        throw new Error(error.message);
      }

      // Get permission counts and user counts separately
      const rolesWithCounts = await Promise.all((roles || []).map(async (role) => {
        // Get permission count
        const { count: permissionCount } = await supabase
          .from('role_permissions')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', role.id);

        // Get user count
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', role.id);

        return {
          ...role,
          permission_count: permissionCount || 0,
          user_count: userCount || 0
        };
      }));

      return rolesWithCounts;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  async getRolePermissions(roleId: string) {
    try {
      const { data: rolePermissions, error } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

      if (error) {
        throw new Error(error.message);
      }

      return rolePermissions || [];
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      throw error;
    }
  }

  async updateRole(roleId: string, roleData: {
    nome: string;
    descricao: string;
    permissions: string[];
  }) {
    try {
      // Check permission
      const hasPermission = await this.checkUserPermission('settings.roles');
      if (!hasPermission) {
        throw new Error('Você não tem permissão para editar papéis');
      }

      // Update role
      const { error: roleError } = await supabase
        .from('roles')
        .update({
          nome: roleData.nome,
          descricao: roleData.descricao
        })
        .eq('id', roleId);

      if (roleError) {
        throw new Error(roleError.message);
      }

      // Remove existing permissions
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Add new permissions
      if (roleData.permissions.length > 0) {
        const rolePermissions = roleData.permissions.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permError) {
          throw new Error(permError.message);
        }
      }

      return {
        message: 'Papel atualizado com sucesso'
      };
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  async toggleRoleStatus(roleId: string, active: boolean) {
    try {
      // Check permission
      const hasPermission = await this.checkUserPermission('settings.roles');
      if (!hasPermission) {
        throw new Error('Você não tem permissão para alterar status de papéis');
      }

      const { error } = await supabase
        .from('roles')
        .update({ ativo: active })
        .eq('id', roleId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        message: `Papel ${active ? 'ativado' : 'desativado'} com sucesso`
      };
    } catch (error) {
      console.error('Error toggling role status:', error);
      throw error;
    }
  }

  async deleteRole(roleId: string) {
    try {
      // Check permission
      const hasPermission = await this.checkUserPermission('settings.roles');
      if (!hasPermission) {
        throw new Error('Você não tem permissão para excluir papéis');
      }

      // Check if role has users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('role_id', roleId)
        .eq('ativo', true);

      if (usersError) {
        throw new Error('Erro ao verificar usuários do papel');
      }

      if (users && users.length > 0) {
        throw new Error(`Não é possível excluir o papel. Existem ${users.length} usuários vinculados a ele.`);
      }

      // Delete role permissions first
      const { error: permError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      if (permError) {
        throw new Error(permError.message);
      }

      // Delete role
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        message: 'Papel excluído com sucesso'
      };
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  async getPermissions() {
    try {
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('*')
        .order('categoria', { ascending: true })
        .order('nome', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return permissions || [];
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  }

  async createRole(roleData: {
    nome: string;
    descricao: string;
    permissions: string[];
  }) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Get user details from users table to get tenant_id
      const { data: currentUserData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();
        
      if (!currentUserData) {
        throw new Error('Dados do usuário não encontrados');
      }

      // Check permission
      const hasPermission = await this.checkUserPermission('settings.roles');
      if (!hasPermission) {
        throw new Error('Você não tem permissão para criar papéis');
      }

      // Create role
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .insert({
          tenant_id: currentUserData.tenant_id,
          nome: roleData.nome,
          descricao: roleData.descricao,
          is_system: false,
          ativo: true
        })
        .select()
        .single();

      if (roleError) {
        throw new Error(roleError.message);
      }

      // Assign permissions to role
      if (roleData.permissions.length > 0) {
        const rolePermissions = roleData.permissions.map(permissionId => ({
          role_id: role.id,
          permission_id: permissionId
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permError) {
          throw new Error(permError.message);
        }
      }

      return {
        id: role.id,
        message: 'Papel criado com sucesso'
      };
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  // Check if current user has specific permission
  async checkUserPermission(permissionCode: string): Promise<boolean> {
    try {
      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return false;
      }
      
      // Get user data to check if admin (fallback)
      const { data: userData } = await supabase
        .from('users')
        .select('funcao')
        .eq('auth_user_id', user.id)
        .single();
      
      // If user is admin, grant all permissions
      if (userData?.funcao === 'admin') {
        return true;
      }
      
      const { data, error } = await supabase
        .rpc('user_has_permission', { permission_code: permissionCode });

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Get current user permissions
  async getUserPermissions() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return [];
      }

      const { data: permissions, error } = await supabase
        .from('users')
        .select(`
          roles!users_role_id_fkey(
            role_permissions(
              permissions(codigo, nome, categoria)
            )
          )
        `)
        .eq('auth_user_id', user.id)
        .single();

      if (error || !permissions) {
        return [];
      }

      const userPermissions = permissions.roles?.role_permissions?.map(rp => rp.permissions) || [];
      return userPermissions.flat();
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  }
}

export const apiService = new ApiService();
