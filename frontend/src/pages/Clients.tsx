import { Fragment, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Alocacao, Cliente, Titulo } from "../api/types";

const TITULOS_SELECT_LIMIT = 2000;

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [titulos, setTitulos] = useState<Titulo[]>([]);

  const [clienteId, setClienteId] = useState<string>("");
  const [novoClienteNome, setNovoClienteNome] = useState<string>("");

  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [tituloId, setTituloId] = useState<string>("");
  const [quantidade, setQuantidade] = useState<number>(1);

  const [busca, setBusca] = useState<string>("");
  const [expandedTituloId, setExpandedTituloId] = useState<string | null>(null);

  const [tituloIdBusca, setTituloIdBusca] = useState<string>("");
  const [tituloEncontrado, setTituloEncontrado] = useState<Titulo | null>(null);
  const [loadingTituloById, setLoadingTituloById] = useState<boolean>(false);

  const [loadingClientes, setLoadingClientes] = useState<boolean>(true);
  const [loadingTitulos, setLoadingTitulos] = useState<boolean>(true);
  const [loadingAlocacoes, setLoadingAlocacoes] = useState<boolean>(false);

  const [msg, setMsg] = useState<{
    kind: "success" | "danger" | "warning" | "info";
    text: string;
  } | null>(null);

  const titulosById = useMemo(() => {
    const m = new Map<string, Titulo>();
    for (const t of titulos) m.set(t.id, t);
    return m;
  }, [titulos]);

  const clienteSelecionado = useMemo(() => {
    return clientes.find((c) => c.id === clienteId) || null;
  }, [clientes, clienteId]);

  const clientesFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) => c.nome.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [clientes, busca]);

  const grupos = useMemo(() => {
    const map = new Map<
      string,
      {
        tituloId: string;
        titulo?: Titulo;
        qtdAlocacoes: number;
        quantidadeTotal: number;
        alocacoes: Alocacao[];
      }
    >();

    for (const a of alocacoes) {
      const key = a.titulo_id;
      const current = map.get(key);
      if (!current) {
        map.set(key, {
          tituloId: key,
          titulo: titulosById.get(key),
          qtdAlocacoes: 1,
          quantidadeTotal: a.quantidade,
          alocacoes: [a],
        });
      } else {
        current.qtdAlocacoes += 1;
        current.quantidadeTotal += a.quantidade;
        current.alocacoes.push(a);
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const at = a.titulo?.tipo ?? "";
      const bt = b.titulo?.tipo ?? "";
      if (at !== bt) return at.localeCompare(bt);
      const av = a.titulo?.vencimento?.toString() ?? "";
      const bv = b.titulo?.vencimento?.toString() ?? "";
      return av.localeCompare(bv);
    });
  }, [alocacoes, titulosById]);

  const totalQuantidade = useMemo(() => {
    return alocacoes.reduce((acc, a) => acc + (a.quantidade || 0), 0);
  }, [alocacoes]);

  async function loadClientes() {
    setLoadingClientes(true);
    try {
      const data = await api.listClientes();
      setClientes(data);
    } catch (e: any) {
      setMsg({ kind: "danger", text: `Erro ao carregar clientes: ${e.message}` });
    } finally {
      setLoadingClientes(false);
    }
  }

  async function loadTitulos() {
    setLoadingTitulos(true);
    try {
      const data = await api.listTitulos({
        limit: TITULOS_SELECT_LIMIT,
        offset: 0,
        sort: "vencimento",
        order: "asc",
      });

      setTitulos(data);
      if (!tituloId && data.length) setTituloId(data[0].id);
    } catch (e: any) {
      setMsg({ kind: "danger", text: `Erro ao carregar títulos: ${e.message}` });
    } finally {
      setLoadingTitulos(false);
    }
  }

  async function loadAlocacoes(id: string) {
    if (!id) {
      setAlocacoes([]);
      setExpandedTituloId(null);
      return;
    }
    setLoadingAlocacoes(true);
    try {
      const data = await api.getAlocacoes(id);
      setAlocacoes(data.alocacoes);
      setExpandedTituloId(null);
    } catch (e: any) {
      setMsg({ kind: "danger", text: `Erro ao carregar alocações: ${e.message}` });
    } finally {
      setLoadingAlocacoes(false);
    }
  }

  useEffect(() => {
    (async () => {
      await Promise.all([loadClientes(), loadTitulos()]);
    })();

  }, []);

  useEffect(() => {
    loadAlocacoes(clienteId);

  }, [clienteId]);

  async function onCreateCliente(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const nome = novoClienteNome.trim();
    if (nome.length < 2) {
      setMsg({ kind: "warning", text: "Nome do cliente muito curto." });
      return;
    }

    try {
      const created = await api.createCliente({ nome });
      setMsg({ kind: "success", text: `Cliente criado: ${created.nome}` });
      setNovoClienteNome("");
      await loadClientes();
      setClienteId(created.id);
    } catch (e: any) {
      setMsg({ kind: "danger", text: `Erro ao criar cliente: ${e.message}` });
    }
  }

  async function onCreateAlocacao(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!clienteId) return setMsg({ kind: "warning", text: "Selecione um cliente primeiro." });
    if (!tituloId) return setMsg({ kind: "warning", text: "Selecione um título." });
    if (!Number.isFinite(quantidade) || quantidade < 1)
      return setMsg({ kind: "warning", text: "Quantidade inválida." });

    try {
      await api.createAlocacao(clienteId, { titulo_id: tituloId, quantidade });
      setMsg({ kind: "success", text: "Alocação criada com sucesso." });
      await loadAlocacoes(clienteId);
    } catch (e: any) {
      setMsg({ kind: "danger", text: `Erro ao criar alocação: ${e.message}` });
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg({ kind: "success", text: "Copiado!" });
      setTimeout(() => setMsg(null), 900);
    } catch {
      setMsg({ kind: "danger", text: "Não foi possível copiar." });
    }
  }

  async function buscarTituloPorId() {
    setMsg(null);
    const id = tituloIdBusca.trim();
    if (!id) {
      setTituloEncontrado(null);
      return;
    }

    setLoadingTituloById(true);
    try {
      const t = await api.getTituloById(id);
      setTituloEncontrado(t);
      setTituloId(t.id);

      setTitulos((prev) => {
        if (prev.some((x) => x.id === t.id)) return prev;
        return [t, ...prev];
      });

      setMsg({ kind: "success", text: "Título encontrado e selecionado." });
    } catch (e: any) {
      setTituloEncontrado(null);
      setMsg({ kind: "warning", text: `Título não encontrado: ${e.message}` });
    } finally {
      setLoadingTituloById(false);
    }
  }

  return (
    <div className="row g-3">

      <div className="col-12 col-lg-5 col-xl-4">
        <div className="card shadow-sm mb-3">
          <div className="card-header d-flex justify-content-between align-items-center">
            <strong>Clientes</strong>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={loadClientes}
              disabled={loadingClientes}
              title="Recarregar clientes"
            >
              {loadingClientes ? "..." : "Recarregar"}
            </button>
          </div>

          <div className="card-body">
            {msg && <div className={`alert alert-${msg.kind} py-2`}>{msg.text}</div>}

            <form className="d-flex gap-2 mb-3" onSubmit={onCreateCliente}>
              <input
                className="form-control"
                placeholder="Novo cliente (nome)"
                value={novoClienteNome}
                onChange={(e) => setNovoClienteNome(e.target.value)}
                minLength={2}
                required
              />
              <button className="btn btn-primary">Criar</button>
            </form>

            <input
              className="form-control mb-3"
              placeholder="Buscar cliente por nome ou ID…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th className="text-muted">ID</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingClientes ? (
                    <tr>
                      <td colSpan={3} className="text-muted">
                        Carregando…
                      </td>
                    </tr>
                  ) : clientesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-muted">
                        Nenhum cliente encontrado.
                      </td>
                    </tr>
                  ) : (
                    clientesFiltrados.map((c) => {
                      const isSel = c.id === clienteId;
                      return (
                        <tr key={c.id} className={isSel ? "table-active" : ""}>
                          <td className="fw-semibold">{c.nome}</td>
                          <td className="text-muted small">
                            <code>{c.id.slice(0, 8)}…</code>
                          </td>
                          <td className="text-end">
                            <button
                              className={isSel ? "btn btn-sm btn-primary" : "btn btn-sm btn-outline-primary"}
                              onClick={() => setClienteId(c.id)}
                            >
                              {isSel ? "Selecionado" : "Selecionar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {clienteSelecionado && (
              <div className="small text-muted mt-3">
                Selecionado: <b>{clienteSelecionado.nome}</b>{" "}
                <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => copy(clienteSelecionado.id)}>
                  copiar ID
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <strong>Criar alocação</strong>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={loadTitulos}
              disabled={loadingTitulos}
              title="Recarregar títulos para o select"
            >
              {loadingTitulos ? "..." : "Recarregar títulos"}
            </button>
          </div>

          <div className="card-body">
            <form onSubmit={onCreateAlocacao}>

              <div className="mb-2">
                <label className="form-label form-label-sm">Título ID (colar)</label>
                <div className="d-flex gap-2">
                  <input
                    className="form-control form-control-sm"
                    placeholder="cole o UUID do título aqui…"
                    value={tituloIdBusca}
                    onChange={(e) => setTituloIdBusca(e.target.value)}
                    onBlur={buscarTituloPorId}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={buscarTituloPorId}
                    disabled={loadingTituloById || !tituloIdBusca.trim()}
                  >
                    {loadingTituloById ? "..." : "Buscar"}
                  </button>
                </div>

                {tituloEncontrado && (
                  <div className="small text-muted mt-2">
                    Encontrado:{" "}
                    <b>
                      {tituloEncontrado.tipo} • {tituloEncontrado.vencimento} • {tituloEncontrado.emissor}
                    </b>{" "}
                    • taxa {tituloEncontrado.taxa}
                  </div>
                )}
              </div>

              <div className="mb-2">
                <label className="form-label form-label-sm">Título (lista)</label>
                <select
                  className="form-select form-select-sm"
                  value={tituloId}
                  onChange={(e) => {
                    setTituloId(e.target.value);
                    setTituloEncontrado(null);
                    setTituloIdBusca("");
                  }}
                  required
                  disabled={loadingTitulos}
                >
                  <option value="">(selecione um título)</option>
                  {titulos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tipo} • {t.vencimento} • {t.emissor} • taxa {t.taxa}
                    </option>
                  ))}
                </select>
                <div className="small text-muted mt-1">
                  Carregado no select: <b>{titulos.length}</b> (limit={TITULOS_SELECT_LIMIT})
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label form-label-sm">Quantidade</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  required
                />
              </div>

              <button className="btn btn-success w-100" disabled={!clienteId || loadingTitulos}>
                Criar alocação
              </button>

              {!clienteId && (
                <div className="small text-muted mt-2">Selecione um cliente para habilitar.</div>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-7 col-xl-8">
        <div className="card shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <strong>Alocações</strong>
              {clienteSelecionado && (
                <span className="text-muted ms-2 small">
                  • {clienteSelecionado.nome} • {alocacoes.length} aloc.
                </span>
              )}
            </div>

            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => loadAlocacoes(clienteId)}
              disabled={!clienteId || loadingAlocacoes}
            >
              {loadingAlocacoes ? "..." : "Atualizar"}
            </button>
          </div>

          <div className="card-body">
            {!clienteId ? (
              <div className="text-muted">Selecione um cliente para ver as alocações.</div>
            ) : loadingAlocacoes ? (
              <div className="text-muted">Carregando…</div>
            ) : (
              <>
                <div className="row g-2 mb-3">
                  <div className="col-12 col-md-4">
                    <div className="p-3 border rounded bg-body-tertiary">
                      <div className="small text-muted">Total de alocações</div>
                      <div className="fs-4 fw-bold">{alocacoes.length}</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="p-3 border rounded bg-body-tertiary">
                      <div className="small text-muted">Quantidade total</div>
                      <div className="fs-4 fw-bold">{totalQuantidade}</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="p-3 border rounded bg-body-tertiary">
                      <div className="small text-muted">Cliente</div>
                      <div className="fw-semibold">{clienteSelecionado?.nome ?? "-"}</div>
                    </div>
                  </div>
                </div>

                {grupos.length === 0 ? (
                  <div className="text-muted">Sem alocações.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Título</th>
                          <th>Taxa</th>
                          <th className="text-end">Qtd total</th>
                          <th className="text-end">Nº alocações</th>
                          <th className="text-muted">ID</th>
                        </tr>
                      </thead>

                      <tbody>
                        {grupos.map((g) => {
                          const t = g.titulo;
                          const isOpen = expandedTituloId === g.tituloId;

                          return (
                            <Fragment key={g.tituloId}>
                              <tr
                                role="button"
                                style={{ cursor: "pointer" }}
                                className={isOpen ? "table-active" : ""}
                                onClick={() => setExpandedTituloId(isOpen ? null : g.tituloId)}
                                title="Clique para ver detalhes"
                              >
                                <td className="fw-semibold">
                                  {t ? `${t.tipo} • ${t.vencimento} • ${t.emissor}` : "Título não encontrado"}
                                </td>
                                <td>{t?.taxa ?? "-"}</td>
                                <td className="text-end fw-bold">{g.quantidadeTotal}</td>
                                <td className="text-end">{g.qtdAlocacoes}</td>
                                <td className="text-muted small">
                                  <code>{g.tituloId.slice(0, 8)}…</code>
                                </td>
                              </tr>

                              {isOpen && (
                                <tr>
                                  <td colSpan={5}>
                                    <div className="p-3 border rounded bg-body-tertiary">
                                      <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="small text-muted">Alocações detalhadas deste título</div>
                                        <div className="d-flex gap-2">
                                          <button
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              copy(g.tituloId);
                                            }}
                                          >
                                            Copiar título ID
                                          </button>
                                          <button
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExpandedTituloId(null);
                                            }}
                                          >
                                            Fechar
                                          </button>
                                        </div>
                                      </div>

                                      <div className="table-responsive">
                                        <table className="table table-sm mb-0">
                                          <thead>
                                            <tr>
                                              <th className="text-end">Quantidade</th>
                                              <th className="text-muted">Alocação ID</th>
                                              <th></th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {g.alocacoes.map((a) => (
                                              <tr key={a.id}>
                                                <td className="text-end fw-bold">{a.quantidade}</td>
                                                <td className="text-muted small">
                                                  <code>{a.id}</code>
                                                </td>
                                                <td className="text-end">
                                                  <button
                                                    className="btn btn-sm btn-link"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      copy(a.id);
                                                    }}
                                                  >
                                                    copiar
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
