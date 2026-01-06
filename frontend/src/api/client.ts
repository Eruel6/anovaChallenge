import type {
  Cliente,
  ClienteComAlocacoes,
  CreateAlocacaoRequest,
  CreateClienteRequest,
  Titulo,
} from "./types";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const detail = data?.detail ?? data ?? res.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  return data as T;
}

function buildQuery(params: Record<string, any> = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (!s) continue;
    qs.set(k, s);
  }
  const out = qs.toString();
  return out ? `?${out}` : "";
}

export type ListTitulosParams = {
  tipo?: string;
  emissor?: string;
  q?: string;
  venc_de?: string;
  venc_ate?: string;
  taxa_min?: string | number;
  taxa_max?: string | number;
  sort?: "vencimento" | "taxa" | "tipo" | "emissor";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export const api = {
  health: () => request<{ status?: string }>("/health"),

  listTitulos: (params?: ListTitulosParams) =>
    request<Titulo[]>(`/titulos${buildQuery(params ?? {})}`),

  getTituloById: (id: string) => request<Titulo>(`/titulos/id/${id}`),

  listClientes: () => request<Cliente[]>("/clientes"),
  createCliente: (payload: CreateClienteRequest) =>
    request<Cliente>("/clientes", { method: "POST", body: JSON.stringify(payload) }),

  getAlocacoes: (clienteId: string) =>
    request<ClienteComAlocacoes>(`/clientes/${clienteId}/alocacoes`),

  createAlocacao: (clienteId: string, payload: CreateAlocacaoRequest) =>
    request(`/clientes/${clienteId}/alocacoes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
