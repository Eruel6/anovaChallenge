import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Titulo } from "../api/types";

export default function Titulos() {
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [optionsTitulos, setOptionsTitulos] = useState<Titulo[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(true);

  const [msg, setMsg] = useState<{ kind: "success" | "danger" | "info"; text: string } | null>(
    null
  );

  const [tipo, setTipo] = useState("");
  const [emissor, setEmissor] = useState("");
  const [busca, setBusca] = useState("");

  const [vencDe, setVencDe] = useState("");
  const [vencAte, setVencAte] = useState("");

  const [taxaMin, setTaxaMin] = useState("");
  const [taxaMax, setTaxaMax] = useState("");

  const [sort, setSort] = useState<"vencimento" | "taxa" | "tipo" | "emissor">("vencimento");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [limit, setLimit] = useState<number>(50);
  const [offset, setOffset] = useState<number>(0);

  const page = Math.floor(offset / limit) + 1;

  const tipos = useMemo(() => {
    return Array.from(new Set(optionsTitulos.map((t) => t.tipo))).sort();
  }, [optionsTitulos]);

  const emissores = useMemo(() => {
    return Array.from(new Set(optionsTitulos.map((t) => t.emissor))).sort();
  }, [optionsTitulos]);

  async function loadOptions() {
    setLoadingOptions(true);
    try {
      const data = await api.listTitulos({
        limit: 1000,
        offset: 0,
        sort: "vencimento",
        order: "asc",
      });
      setOptionsTitulos(data);
    } catch (e: any) {
      setMsg({ kind: "danger", text: `Erro ao carregar opções: ${e.message}` });
    } finally {
      setLoadingOptions(false);
    }
  }

  async function loadTitulos(nextOffset?: number) {
    setMsg(null);
    setLoading(true);
    try {
      const useOffset = nextOffset ?? offset;

      const data = await api.listTitulos({
        tipo: tipo || undefined,
        emissor: emissor || undefined,
        q: busca || undefined,
        venc_de: vencDe || undefined,
        venc_ate: vencAte || undefined,
        taxa_min: taxaMin || undefined,
        taxa_max: taxaMax || undefined,
        sort,
        order,
        limit,
        offset: useOffset,
      });

      setTitulos(data);
      if (nextOffset !== undefined) setOffset(nextOffset);
    } catch (e: any) {
      setMsg({ kind: "danger", text: `Erro ao carregar títulos: ${e.message}` });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await loadOptions();
      await loadTitulos(0);
    })();

  }, []);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg({ kind: "success", text: "ID copiado!" });
      setTimeout(() => setMsg(null), 1000);
    } catch {
      setMsg({ kind: "danger", text: "Não foi possível copiar." });
    }
  }

  function limparFiltros() {
    setTipo("");
    setEmissor("");
    setBusca("");
    setVencDe("");
    setVencAte("");
    setTaxaMin("");
    setTaxaMax("");
    setSort("vencimento");
    setOrder("asc");
    setLimit(50);
    setOffset(0);
  }

  const canPrev = offset > 0 && !loading;
  const canNext = titulos.length === limit && !loading;

  return (
    <div className="row g-3">
      <div className="col-12 col-lg-4 col-xl-3">
        <div className="card shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <strong>Filtros</strong>
            <button className="btn btn-sm btn-outline-secondary" onClick={limparFiltros}>
              Limpar
            </button>
          </div>

          <div className="card-body">
            {msg && <div className={`alert alert-${msg.kind} py-2`}>{msg.text}</div>}

            <div className="mb-2">
              <label className="form-label form-label-sm">Busca</label>
              <input
                className="form-control form-control-sm"
                placeholder="tipo, emissor, id…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="form-label form-label-sm">Tipo</label>
              <select
                className="form-select form-select-sm"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                disabled={loadingOptions}
              >
                <option value="">(todos)</option>
                {tipos.map((tp) => (
                  <option key={tp} value={tp}>
                    {tp}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label className="form-label form-label-sm">Emissor (Banco)</label>
              <select
                className="form-select form-select-sm"
                value={emissor}
                onChange={(e) => setEmissor(e.target.value)}
                disabled={loadingOptions}
              >
                <option value="">(todos)</option>
                {emissores.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </div>

            <hr />

            <div className="mb-2">
              <label className="form-label form-label-sm">Vencimento (de)</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={vencDe}
                onChange={(e) => setVencDe(e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="form-label form-label-sm">Vencimento (até)</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={vencAte}
                onChange={(e) => setVencAte(e.target.value)}
              />
            </div>

            <hr />

            <div className="row g-2">
              <div className="col-6">
                <label className="form-label form-label-sm">Taxa mín</label>
                <input
                  className="form-control form-control-sm"
                  placeholder="ex: 10"
                  value={taxaMin}
                  onChange={(e) => setTaxaMin(e.target.value)}
                />
              </div>
              <div className="col-6">
                <label className="form-label form-label-sm">Taxa máx</label>
                <input
                  className="form-control form-control-sm"
                  placeholder="ex: 20"
                  value={taxaMax}
                  onChange={(e) => setTaxaMax(e.target.value)}
                />
              </div>
            </div>

            <hr />

            <div className="row g-2">
              <div className="col-7">
                <label className="form-label form-label-sm">Ordenar por</label>
                <select
                  className="form-select form-select-sm"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                >
                  <option value="vencimento">Vencimento</option>
                  <option value="taxa">Taxa</option>
                  <option value="tipo">Tipo</option>
                  <option value="emissor">Emissor</option>
                </select>
              </div>
              <div className="col-5">
                <label className="form-label form-label-sm">Ordem</label>
                <select
                  className="form-select form-select-sm"
                  value={order}
                  onChange={(e) => setOrder(e.target.value as any)}
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label form-label-sm">Itens por página</label>
                <select
                  className="form-select form-select-sm"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setOffset(0);
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>

            <div className="d-grid mt-3">
              <button className="btn btn-primary" onClick={() => loadTitulos(0)} disabled={loading}>
                {loading ? "Carregando..." : "Aplicar filtros"}
              </button>
            </div>

            <div className="small text-muted mt-3">
              Página: <b>{page}</b> • Itens nesta página: <b>{titulos.length}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-8 col-xl-9">
        <div className="card shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <strong>Títulos</strong>
            <span className="text-muted small">{loading ? "Carregando…" : `${titulos.length} item(s)`}</span>
          </div>

          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="small text-muted">
                Página <b>{page}</b>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={!canPrev}
                  onClick={() => loadTitulos(Math.max(0, offset - limit))}
                >
                  Anterior
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={!canNext}
                  onClick={() => loadTitulos(offset + limit)}
                  title={titulos.length < limit ? "Sem mais itens" : "Próxima página"}
                >
                  Próximo
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Vencimento</th>
                    <th>Taxa</th>
                    <th>Emissor</th>
                    <th className="text-muted">ID</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-muted">
                        Carregando…
                      </td>
                    </tr>
                  ) : titulos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-muted">
                        Nenhum título encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    titulos.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <span className="badge bg-body-secondary text-body border">{t.tipo}</span>
                        </td>
                        <td>{t.vencimento}</td>
                        <td>{t.taxa}</td>
                        <td>{t.emissor}</td>
                        <td className="text-muted small">
                          <code>{t.id}</code>
                        </td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => copy(t.id)}>
                            Copiar ID
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="small text-muted mt-2">
              Dica: use o <b>ID do título</b> ao criar uma alocação na tela de Clientes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
