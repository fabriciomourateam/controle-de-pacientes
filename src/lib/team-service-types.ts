// Tipos temporários para as tabelas de team management
// Estas tabelas foram criadas manualmente via SQL

export interface TeamRoleRow {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  permissions: Record<string, any>;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberRow {
  id: string;
  owner_id: string;
  user_id: string | null;
  email: string;
  name: string;
  role_id: string | null;
  permissions: Record<string, any> | null;
  is_active: boolean;
  invited_at: string;
  accepted_at: string | null;
  last_access: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamAccessLogRow {
  id: string;
  team_member_id: string;
  action: string;
  resource: string | null;
  details: Record<string, any> | null;
  created_at: string;
}
