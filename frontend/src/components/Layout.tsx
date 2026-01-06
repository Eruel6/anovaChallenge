import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

export function Layout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-vh-100 bg-body text-body">
      <nav className="navbar navbar-expand-lg border-bottom sticky-top bg-body">
        <div className="container">
          <span className="navbar-brand fw-semibold">Anova Challenge</span>

          <div className="d-flex gap-2 align-items-center">
            <div className="navbar-nav flex-row gap-2">
              <NavLink className="nav-link" to="/" end>
                Home
              </NavLink>
              <NavLink className="nav-link" to="/titulos">
                Títulos
              </NavLink>
              <NavLink className="nav-link" to="/clientes">
                Clientes
              </NavLink>
            </div>

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={toggleTheme}
              title="Alternar tema"
            >
              {theme === "dark" ? "☀️ Claro" : "🌙 Escuro"}
            </button>
          </div>
        </div>
      </nav>

      <main className="container-xxl py-4">
        <Outlet />
      </main>
    </div>
  );
}
