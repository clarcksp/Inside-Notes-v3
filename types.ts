export type UserRole = 'ADM' | 'Padrão';

export interface UsuarioTecnico {
  id: number;
  nome: string;
  email: string;
  role: UserRole;
  setor?: string;
}

export interface Cliente {
  id: number;
  nome_fantasia: string;
  razao_social?: string;
  cnpj?: string;
}

export enum VisitStatus {
  Agendada = 'Agendada',
  Aberta = 'Aberta',
  EmAndamento = 'Em Andamento',
  Concluida = 'Concluída',
}

export enum AnnotationType {
  Diagnostico = 'diagnostico',
  Acao = 'acao',
  Teste = 'teste',
  Observacao = 'observacao',
}

export interface VisitaTecnica {
  id: number;
  usuario_id: number;
  cliente_id: number;
  cliente: string;
  descricao_extra: string | null;
  data_inicio: string;
  data_encerramento?: string | null;
  status: VisitStatus;
  laudo_final: string | null;
  criado_em: string;
  tecnico?: UsuarioTecnico;
}

export interface AnotacaoTecnica {
  id: number;
  visita_id: number;
  tipo: AnnotationType;
  descricao: string;
  data_hora: string;
  fragments?: string[];
}

export interface AIPrompt {
  name: string;
  content: string;
}
