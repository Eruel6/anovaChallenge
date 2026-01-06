export type Titulo = {
  id: string;
  tipo: string;
  vencimento: string;
  taxa: string;
  emissor: string;
};

export type Cliente = {
  id: string;
  nome: string;
};

export type Alocacao = {
  id: string;
  cliente_id: string;
  titulo_id: string;
  quantidade: number;
};

export type ClienteComAlocacoes = {
  cliente: Cliente;
  alocacoes: Alocacao[];
};

export type CreateClienteRequest = { nome: string };
export type CreateAlocacaoRequest = { titulo_id: string; quantidade: number };
