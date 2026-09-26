import React, { Suspense, lazy, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowUpRight, Github, Menu, X } from "lucide-react";
import "@fontsource-variable/manrope";
import "./styles.css";
import "./pages.css";
const Home = lazy(() => import("./Home.jsx"));
const ProductPages = lazy(() => import("./ProductPages.jsx"));
const Ontology = lazy(() => import("./Ontology.jsx"));
const DeveloperPages = lazy(() => import("./DeveloperPages.jsx"));
export const base = import.meta.env.BASE_URL;
export const repository = "https://github.com/pli-poc/charge-weave";
export function Mark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 8h14L7 32h14M19 8h14L19 32h14"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const route = window.location.pathname
    .slice(base.length)
    .replace(/(?:index\.html)?\/?$/, "")
    .replace(/^\//, "");
  const nav = [
    ["", "Overview"],
    ["capabilities", "Capabilities"],
    ["ontology", "Ontology explorer"],
    ["architecture", "Architecture"],
    ["roadmap", "Roadmap"],
    ["developer", "Developer guide"],
  ];
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header">
        <div className="container nav-wrap">
          <a className="brand" href={base} aria-label="ChargeWeave home">
            <Mark />
            <span>ChargeWeave</span>
          </a>
          <button
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
          <nav
            id="main-nav"
            className={menuOpen ? "nav open" : "nav"}
            aria-label="Main navigation"
          >
            {nav.map(([path, label]) => (
              <a
                key={path}
                href={base + (path ? path + "/" : "")}
                aria-current={
                  path === "developer"
                    ? route === "developer" || route.startsWith("developer/")
                      ? "page"
                      : undefined
                    : route === path
                      ? "page"
                      : undefined
                }
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            className="nav-source"
            href={repository}
            target="_blank"
            rel="noreferrer"
          >
            Follow the build <ArrowUpRight size={16} />
          </a>
        </div>
      </header>
      <Suspense
        fallback={
          <main id="main" className="container page-loading" aria-live="polite">
            Loading ChargeWeave…
          </main>
        }
      >
        {route === "ontology" ? (
          <Ontology />
        ) : route === "developer" || route.startsWith("developer/") ? (
          <DeveloperPages route={route} />
        ) : route ? (
          <ProductPages route={route} />
        ) : (
          <Home />
        )}
      </Suspense>
      <footer className="footer">
        <div className="container footer-inner">
          <a className="brand" href={base}>
            <Mark />
            <span>ChargeWeave</span>
          </a>
          <span>A connected foundation for the charging business.</span>
          <a href={repository} target="_blank" rel="noreferrer">
            <Github size={17} /> GitHub <ArrowUpRight size={15} />
          </a>
          <span className="footer-status">In development</span>
        </div>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
