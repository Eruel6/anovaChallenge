import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Home() {
  const [health, setHealth] = useState<"loading" | "ok" | "fail">("loading");
  const [error, setError] = useState<string>("");
  const swaggerUrl = "http://localhost:8000/docs";

  useEffect(() => {
    (async () => {
      try {
        await api.health();
        setHealth("ok");
      } catch (e: any) {
        setHealth("fail");
        setError(e?.message ?? "Falha ao chamar /health");
      }
    })();
  }, []);

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="p-4 p-md-5 rounded-3 border bg-body-tertiary">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div>
              <h1 className="display-6 mb-2">Anova Challenge</h1>
              <p className="text-muted mb-0">
                Interface simples para navegar pelos <b>Títulos</b> e gerenciar <b>Clientes</b> e <b>Alocações</b>.
              </p>
            </div>

            <div className="text-md-end">
              <div className="text-muted small mb-1">Status da API</div>
              {health === "loading" ? (
                <span className="badge text-bg-secondary">carregando…</span>
              ) : health === "ok" ? (
                <span className="badge text-bg-success">online</span>
              ) : (
                <span className="badge text-bg-danger">offline</span>
              )}
            </div>
          </div>

          {health === "fail" && error && (
            <div className="alert alert-danger mt-3 mb-0">{error}</div>
          )}

          <div className="d-flex gap-2 flex-wrap mt-4">
            <Link to="/titulos" className="btn btn-primary">
              Ver Títulos
            </Link>
            <Link to="/clientes" className="btn btn-outline-primary">
              Gerenciar Clientes
            </Link>
            <a 
            className="btn btn-outline-secondary" 
            href={swaggerUrl} 
            target="_blank" 
            rel="noreferrer">
              Swagger (API)
            </a>
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-4">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h2 className="h5 mb-0">Títulos</h2>
              <span className="badge bg-body-secondary text-body border">lista</span>
            </div>
            <p className="text-muted">
              Veja os títulos carregados da planilha, filtre por tipo e copie IDs para usar em alocações.
            </p>
            <Link to="/titulos" className="btn btn-sm btn-primary">
              Abrir Títulos →
            </Link>
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-4">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h2 className="h5 mb-0">Clientes</h2>
              <span className="badge bg-body-secondary text-body border">cadastro</span>
            </div>
            <p className="text-muted">
              Crie clientes, selecione um cliente e acompanhe as alocações vinculadas.
            </p>
            <Link to="/clientes" className="btn btn-sm btn-outline-primary">
              Abrir Clientes →
            </Link>
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-4">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h2 className="h5 mb-0">API Docs</h2>
              <span className="badge bg-body-secondary text-body border">swagger</span>
            </div>
            <p className="text-muted">
              Abra a documentação interativa para testar endpoints e ver os schemas da API.
            </p>
            <a className="btn btn-sm btn-outline-secondary" href="/docs" target="_blank" rel="noreferrer">
              Abrir /docs →
            </a>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="small text-muted">
          Dica: no desenvolvimento, o Vite faz proxy das rotas <code>/titulos</code>, <code>/clientes</code> e <code>/health</code> para a API (sem CORS).
        </div>
      </div>
    </div>
  );
}
