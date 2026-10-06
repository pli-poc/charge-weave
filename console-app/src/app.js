import { createPlatformProvider } from "./provider.js";
import { filterByCountry, findSite, formatEuro, formatNumber, getSiteMetrics } from "./data.js";
import { meterCorrectionModel, makeMeterCorrectionRun, rateCorrectedReading } from "./work-model.js";
import { renderGeneratedTaskForm } from "./task-form-renderer.js";
import { defaultAnalyticsState, overviewDescriptors, analyticsControls, normalizeAnalyticsState, renderOverviewAnalytics, renderPanePreferences, renderAnalyticsPage, resolveResult } from "./analytics/dashboard.js";
import { renderChart } from "./components/analytics-panes.js";
import "./analytics/analytics.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const provider = createPlatformProvider();
const DEMO_SOURCE = provider.source;
const dataEntities = provider.getEntities();
const financialLines = provider.getFinanceLines();
const liveSessions = provider.getLiveSessions();
const ownSites = provider.getSites();
const recentActivity = provider.getActivity();
const roamingSessions = provider.getRoamingSessions();

const root = document.querySelector("#app");
const views = ["overview", "work", "journey", "operations", "sites", "geography", "sessions", "roaming", "energy", "finance", "analytics", "data"];
const nav = [
  { id: "overview", label: "Overview", icon: "overview", group: "Workspace" },
  { id: "work", label: "My work", icon: "work", group: "Workspace" },
  { id: "journey", label: "Site to revenue", icon: "journey", group: "Workspace" },
  { id: "operations", label: "Live operations", icon: "pulse", group: "Workspace" },
  { id: "sites", label: "Sites & parking", icon: "pin", group: "Assets" },
  { id: "geography", label: "Network map", icon: "map", group: "Assets" },
  { id: "sessions", label: "Sessions", icon: "plug", group: "Assets" },
  { id: "roaming", label: "Chargecard roaming", icon: "roaming", group: "Commercial" },
  { id: "energy", label: "Energy & capacity", icon: "energy", group: "Commercial" },
  { id: "finance", label: "Finance", icon: "finance", group: "Commercial" },
  { id: "analytics", label: "Analytics", icon: "pulse", group: "Platform" },
  { id: "data", label: "Data explorer", icon: "data", group: "Platform" },
];
const iconPaths = {
  overview: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  work: '<path d="M8 4h8m-9 4h10m-10 4h7m-9 8h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="m15 16 2 2 4-4"/>',
  journey: '<path d="M4 6h6v5H4zM14 13h6v5h-6zM10 8.5h4a2 2 0 0 1 2 2v2.5"/><path d="m14 11 2 2 2-2"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  plug: '<path d="M9 7V3m6 4V3M7 7h10v4a5 5 0 0 1-5 5v5m-5-14v4a5 5 0 0 0 5 5"/>',
  roaming: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  energy: '<path d="m13 2-3 8h7l-6 12 1-9H6l7-11Z"/>',
  finance: '<path d="M4 5h16M4 19h16M6 5v14m12-14v14M9 9h6m-6 3h6m-6 3h6"/>',
  data: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15m6-12v15"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.8 13A8.8 8.8 0 0 1 11 3.2 8.8 8.8 0 1 0 20.8 13Z"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  grip: '<circle cx="8" cy="5" r="1"/><circle cx="16" cy="5" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="8" cy="19" r="1"/><circle cx="16" cy="19" r="1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  alert: '<path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v3h16v-3"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
};
const metrics = getSiteMetrics();
let currentView = viewFromHash();
let theme = stored("chargeweave-console-theme") || "dark";
let arrange = stored("chargeweave-console-arrange") === "true";
let panelOrder = stored("chargeweave-console-panel-order");
let analyticsState = { ...defaultAnalyticsState };
let hiddenPanes = stored("chargeweave-console-hidden-panes");
if (!Array.isArray(hiddenPanes)) hiddenPanes = [];
let country = "all";
let search = "";
let selectedSession = liveSessions[0]?.id;
let mapScope = "owned";
let selectedMapSite = ownSites[0]?.id;
let selectedRoamingLocation = roamingSessions[0]?.id;
let networkMap = null;
let networkMapScope = null;
let networkMapViewport = null;
let networkMapFocus = null;
let selectedEntity = "Session";
let dataTab = "Graph";
let sidebarOpen = false;
let selectedWorkItem = false;
let workRun = makeMeterCorrectionRun();
const cpoDemo = {
  screen: 0,
  site: { name: "Arena parking P2", host: "Arena Parking Services", address: "Burgemeester Stramanweg 130", city: "Amsterdam", country: "NL", spaces: 480, capacityKw: 900, agreement: "SA-ARENA-2026-014" },
  installation: { partner: "Northline Charge Installations", workOrder: "WO-AMS-2048", pointCount: 12, hardware: "Alfen Twin 5 Plus", meterId: "NL-MTR-AMS-4481" },
  commissioning: false,
  session: null,
  invoiceCreated: false,
};
const paneIds = overviewDescriptors.map((pane) => pane.id);
if (!Array.isArray(panelOrder)) panelOrder = paneIds;
panelOrder = [...new Set([...panelOrder.filter((id) => paneIds.includes(id)), ...paneIds])];
hiddenPanes = hiddenPanes.filter((id) => paneIds.includes(id));

function stored(key) {
  try {
    const value = localStorage.getItem(key);
    return /panel-order|hidden-panes/.test(key) && value ? JSON.parse(value) : value;
  } catch { return null; }
}
function save(key, value) {
  try { localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value)); } catch { /* storage is optional */ }
}
function viewFromHash() {
  const value = location.hash.replace(/^#\/?/, "");
  return views.includes(value) ? value : "overview";
}
function icon(name, extra = "") {
  return `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] ?? ""}</svg>`;
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function siteName(id) { return findSite(id)?.name ?? "Unknown site"; }
function siteCity(id) { return findSite(id)?.city ?? "—"; }
function countryLabel(code) { return code === "NL" ? "Netherlands" : code === "BE" ? "Belgium" : code; }
function time(value) {
  return new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(new Date(value));
}
function dateTime(value) {
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Amsterdam" }).format(new Date(value));
}
function mark() {
  return '<svg class="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M7 8h14L7 32h14M19 8h14L19 32h14" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function navHtml() {
  let group = "";
  return nav.map((item) => {
    const heading = item.group !== group ? `<p class="nav-heading">${item.group}</p>` : "";
    group = item.group;
    return `${heading}<button class="nav-item${currentView === item.id ? " is-active" : ""}" type="button" data-view="${item.id}"${currentView === item.id ? ' aria-current="page"' : ""}>${icon(item.icon)}<span>${item.label}</span>${item.id === "operations" ? '<span class="nav-count">10</span>' : item.id === "work" && workRun.status !== "completed" ? '<span class="nav-count">1</span>' : ""}</button>`;
  }).join("");
}
function shell() {
  const themeName = theme === "dark" ? "Dark" : "Light";
  const themeLabel = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return `<header class="topbar">
      <div class="topbar-brand"><button class="mobile-menu" type="button" data-action="toggle-sidebar" aria-label="Open navigation" aria-expanded="${sidebarOpen}">${icon("overview")}</button><a class="brand" href="../" aria-label="ChargeWeave corporate website">${mark()}<span>ChargeWeave</span><span class="brand-divider"></span><span class="brand-product">Operations</span></a></div>
      <div class="topbar-context"><span class="status-dot"></span><span>European operations</span><span class="context-divider"></span><span class="country-pair"><b>NL</b><b>BE</b></span></div>
      <label class="global-search">${icon("search")}<span class="sr-only">Search the workspace</span><input id="global-search" type="search" placeholder="Search sites, sessions, charge points…" value="${esc(search)}" autocomplete="off" /><kbd>⌘ K</kbd></label>
      <div class="topbar-actions">${currentView === "overview" ? `<button class="quiet-button arrange-button${arrange ? " is-selected" : ""}" type="button" data-action="arrange" aria-label="${arrange ? "Done arranging panels" : "Arrange panels"}" aria-pressed="${arrange}">${icon("grip")}<span>${arrange ? "Done arranging" : "Arrange panels"}</span></button>` : ""}<button class="theme-toggle" type="button" data-action="theme" aria-label="${themeLabel}" aria-pressed="${theme === "light"}">${icon(theme === "dark" ? "sun" : "moon")}<span>${themeName}</span></button><button class="help-button" type="button" data-action="source-info" aria-label="About the demonstration data">i</button><div class="profile-chip"><span class="profile-avatar">CW</span><span class="profile-name">Operations</span>${icon("chevron")}</div></div>
    </header>
    <div class="app-frame${sidebarOpen ? " sidebar-open" : ""}"><button class="sidebar-backdrop" type="button" data-action="toggle-sidebar" aria-label="Close navigation"></button><aside class="sidebar" id="sidebar" aria-label="Application navigation"><div class="sidebar-workspace"><span class="workspace-mark">${icon("roaming")}</span><span><strong>Network workspace</strong><small>Owned network · NL + BE</small></span>${icon("chevron", "workspace-chevron")}</div><nav class="side-nav" aria-label="Platform workspace">${navHtml()}</nav><div class="sidebar-bottom"><div class="source-chip"><span class="source-pulse"></span><span><strong>Demo environment</strong><small>${DEMO_SOURCE.seed}</small></span><button type="button" data-action="source-info" aria-label="Demo data details">i</button></div><a class="corporate-link" href="../">${icon("arrow")}<span>Corporate website</span></a></div></aside><main id="workspace" class="workspace" tabindex="-1"></main></div><div id="dialog-root"></div>`;
}
function heading(title, subtitle, right = "") {
  return `<div class="page-heading"><div><div class="eyebrow-row"><span class="eyebrow">${title === "Network overview" ? "WORKSPACE" : "CHARGEWEAVE PLATFORM"}</span><span class="eyebrow-separator">/</span><span class="eyebrow-detail">${esc(title)}</span></div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="page-actions">${right}</div></div>`;
}
function countryTabs() {
  return `<div class="segmented-control" role="group" aria-label="Filter by country"><button type="button" data-country="all" class="${country === "all" ? "is-active" : ""}">All sites</button><button type="button" data-country="NL" class="${country === "NL" ? "is-active" : ""}"><span class="country-code">NL</span> Netherlands</button><button type="button" data-country="BE" class="${country === "BE" ? "is-active" : ""}"><span class="country-code">BE</span> Belgium</button></div>`;
}
function panelControls(id, label) {
  return arrange
    ? `<span class="move-controls"><button type="button" data-action="move-panel" data-panel="${id}" data-direction="up" aria-label="Move ${esc(label)} up">↑</button><button type="button" data-action="move-panel" data-panel="${id}" data-direction="down" aria-label="Move ${esc(label)} down">↓</button></span><span class="panel-grip is-draggable" title="Drag to move">${icon("grip")}</span>`
    : `<span class="panel-grip" title="Turn on Arrange panels to move this pane">${icon("grip")}</span>`;
}
function kpi(label, value, caption, symbol, tone = "mint") {
  return `<article class="kpi-card"><div class="kpi-top"><span>${label}</span><span class="kpi-icon tone-${tone}">${icon(symbol)}</span></div><strong class="kpi-value">${value}</strong><div class="kpi-caption">${caption}</div></article>`;
}
function table(headers, rows, label, empty = "No matching records") {
  return `<div class="table-wrap"><table aria-label="${esc(label)}"><thead><tr>${headers.map((item) => `<th>${item}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="empty-cell">${empty}</td></tr>`}</tbody></table></div>`;
}
function siteRows(sites) {
  return sites.map((site) => `<tr data-search-row data-search="${esc(`${site.name} ${site.city} ${site.country} ${site.setting} ${site.id}`.toLowerCase())}"><td><button class="table-primary" type="button" data-view="sites">${esc(site.name)}<small>${site.id}</small></button></td><td><span class="country-badge">${site.country}</span> ${esc(site.city)}</td><td>${esc(site.setting)}</td><td class="numeric">${formatNumber(site.parkingSpaces)}</td><td><span class="health-pair"><span class="health-dot${site.online < site.chargePoints ? " is-warn" : ""}"></span>${site.online}<span class="quiet">/ ${site.chargePoints}</span></span></td><td class="numeric">${site.liveSessions}</td><td><div class="utilisation"><span>${site.utilisation}%</span><span class="progress"><i style="width:${site.utilisation}%"></i></span></div></td></tr>`).join("");
}
function sessionRows(sessions, selected = selectedSession) {
  return sessions.map((session) => `<tr data-search-row data-search="${esc(`${session.id} ${session.vehicle} ${session.access} ${session.chargePoint} ${siteName(session.siteId)} ${siteCity(session.siteId)}`.toLowerCase())}" class="${session.id === selected ? "is-selected" : ""}"><td><button class="table-primary" type="button" data-session="${session.id}">${session.id}<small>${time(session.startedAt)} start</small></button></td><td><span class="table-primary-text">${esc(siteName(session.siteId))}</span><small class="table-subtext">${esc(siteCity(session.siteId))} · ${findSite(session.siteId)?.country}</small></td><td>${esc(session.chargePoint)}<small class="table-subtext">${esc(session.connector)}</small></td><td><span class="access-pill ${session.access === "Chargecard" ? "is-card" : ""}">${esc(session.access)}</span></td><td class="numeric">${formatNumber(session.energyKwh)} kWh</td><td>${session.durationMin} min</td><td class="numeric">${formatEuro(session.amount)}</td><td><span class="status-pill is-live"><i></i>${esc(session.status)}</span></td></tr>`).join("");
}
function roamingRows(rows) {
  return rows.map((session) => `<tr data-search-row data-search="${esc(`${session.id} ${session.country} ${session.partner} ${session.location} ${session.cdrStatus} ${session.settlement}`.toLowerCase())}"><td><strong class="table-primary-text">${esc(session.location)}</strong><small class="table-subtext">${esc(session.partner)}</small></td><td><span class="country-badge">${session.countryCode}</span> ${esc(session.country)}</td><td>${esc(session.token)}</td><td>${esc(session.id)}</td><td class="numeric">${formatNumber(session.energyKwh)} kWh</td><td class="numeric">${formatEuro(session.amount)}</td><td><span class="status-pill ${session.cdrStatus === "Accepted" ? "is-live" : "is-review"}"><i></i>${esc(session.cdrStatus)}</span></td><td>${esc(session.settlement)}</td></tr>`).join("");
}
function overviewSites() {
  const rows = ownSites.slice(0, 5).map((site) => `<tr data-search-row data-search="${esc(`${site.name} ${site.city} ${site.country} ${site.setting}`.toLowerCase())}"><td><button class="table-primary" type="button" data-view="sites">${esc(site.name)}</button></td><td><span class="country-badge">${site.country}</span> ${esc(site.city)}</td><td>${esc(site.setting)}</td><td><span class="health-pair"><span class="health-dot${site.online < site.chargePoints ? " is-warn" : ""}"></span>${site.online}<span class="quiet">/${site.chargePoints}</span></span></td><td class="numeric">${site.liveSessions}</td></tr>`).join("");
  return `<div class="panel-intro"><span class="subtle-tag"><span class="health-dot"></span> ${metrics.sites} owned sites</span><button class="inline-link" type="button" data-view="sites">View all ${icon("arrow")}</button></div>${table(["Site", "Location", "Setting", "Points", "Live"], rows, "Owned sites")}`;
}
function roamingPanel() {
  return `<div class="roaming-headline"><span class="roaming-orbit">${icon("roaming")}</span><div><strong>Chargecards travel across Europe</strong><p>Partner sessions stay separate from your owned-site operations.</p></div></div><div class="roaming-stats"><div><strong>486</strong><span>sessions this month</span></div><div><strong>14</strong><span>partner countries</span></div><div><strong>${formatEuro(7892.4)}</strong><span>settlement due</span></div></div><div class="country-strip"><span>Latest roaming</span><b>DE</b><b>FR</b><b>BE</b><b>NL</b><b>DK</b><button class="inline-link" type="button" data-view="roaming">Open roaming ledger ${icon("arrow")}</button></div>`;
}
function activityPanel() {
  return `<div class="activity-list">${recentActivity.map((item) => `<div class="activity-item"><span class="activity-mark tone-${item.tone}">${item.tone === "warn" ? icon("alert") : item.tone === "good" ? icon("check") : icon("plug")}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></div><time>${esc(item.time)}</time></div>`).join("")}</div><button class="panel-footer-link" type="button" data-view="operations">Open event timeline ${icon("arrow")}</button>`;
}
function overviewPage() {
  let analytics;
  try {
    analytics = renderOverviewAnalytics(provider, analyticsState, { order: panelOrder, hidden: hiddenPanes, controls: panelControls, arrange,
      custom: { sites: overviewSites, roaming: roamingPanel, activity: activityPanel } });
  } catch (error) { analytics = `<div class="analytics-empty" role="status">${esc(error.message)}</div>`; }
  return `${heading("Network overview", "Owned charging operations in the Netherlands and Belgium, with Chargecard roaming across Europe.", '<button class="secondary-button" type="button" data-view="analytics">Explore analytics</button>')}
    <div class="overview-scope"><span class="scope-icon">${icon("pin")}</span><span><strong>Owned network</strong><small>${metrics.sites} sites · ${metrics.chargePoints} charge points · ${formatNumber(metrics.parkingSpaces)} parking spaces</small></span><div class="owned-country-summary"><span><b>NL</b> 4 sites</span><span><b>BE</b> 4 sites</span></div><span class="scope-meta">Snapshot: ${metrics.online}/${metrics.chargePoints} online</span></div>
    ${analyticsControls(analyticsState, ownSites, { compact: true })}${analytics}${renderPanePreferences(hiddenPanes)}
    <div class="workspace-footnote">${icon("check")} Deterministic synthetic year · historical analytics use the selected period; site inventory and live operations show the separate demo snapshot.</div>`;
}
function journeyPage() {
  const steps = ["Site & agreement", "Installation order", "Commissioning", "Operations", "Billing"];
  const screen = Math.min(cpoDemo.screen, steps.length - 1);
  const progress = steps.map((label, index) => `<button class="cpo-screen-tab${screen === index ? " is-current" : ""}${screen > index ? " is-complete" : ""}" type="button" data-cpo-screen="${index}" ${index > screen ? "disabled" : ""}><span>${index < screen ? icon("check") : `0${index + 1}`}</span><strong>${label}</strong></button>`).join("");
  const site = cpoDemo.site;
  const install = cpoDemo.installation;
  const meterDelta = cpoDemo.session ? Math.max(0, Number(cpoDemo.session.meterEnd) - Number(cpoDemo.session.meterStart)) : 0;
  const billedAmount = cpoDemo.session ? meterDelta * Number(cpoDemo.session.tariff) : 0;
  const screenMarkup = [
    `<form class="cpo-product-form" data-cpo-submit="site"><div class="form-section-heading"><span class="eyebrow">SITE HOST · COMMERCIAL ONBOARDING</span><h2>Register the parking location</h2><p>Capture who provides the site and the conditions the CPO must operate under.</p></div><div class="form-field-grid"><label>Site name<input name="name" required value="${esc(site.name)}" /></label><label>Site host / legal party<input name="host" required value="${esc(site.host)}" /></label><label>Street address<input name="address" required value="${esc(site.address)}" /></label><label>City<input name="city" required value="${esc(site.city)}" /></label><label>Country<select name="country"><option value="NL" ${site.country === "NL" ? "selected" : ""}>Netherlands</option><option value="BE" ${site.country === "BE" ? "selected" : ""}>Belgium</option></select></label><label>Parking spaces<input name="spaces" type="number" min="1" required value="${esc(site.spaces)}" /></label><label>Agreed site capacity<input name="capacityKw" type="number" min="1" step="1" required value="${esc(site.capacityKw)}" /><small>kW · subject to the connection agreement</small></label><label>Agreement reference<input name="agreement" required value="${esc(site.agreement)}" /></label></div><div class="form-submit-row"><span class="form-data-note">Creates a draft site and records the site agreement reference.</span><button class="primary-button" type="submit">Save site & continue ${icon("arrow")}</button></div></form>`,
    `<form class="cpo-product-form" data-cpo-submit="installation"><div class="form-section-heading"><span class="eyebrow">CPO ASSET TEAM · PARTNER WORK ORDER</span><h2>Assign installation and handover</h2><p>Create a scoped installation order tied to the agreed site and contracted capacity.</p></div><div class="form-context-card"><span>${icon("pin")}</span><div><strong>${esc(site.name)}</strong><small>${esc(site.address)}, ${esc(site.city)} · ${formatNumber(Number(site.capacityKw))} kW · Agreement ${esc(site.agreement)}</small></div><span class="state-badge">Agreement recorded</span></div><div class="form-field-grid"><label>Installation partner<input name="partner" required value="${esc(install.partner)}" /></label><label>Work order reference<input name="workOrder" required value="${esc(install.workOrder)}" /></label><label>Number of charge points<input name="pointCount" type="number" min="1" max="100" required value="${esc(install.pointCount)}" /></label><label>Charger model<input name="hardware" required value="${esc(install.hardware)}" /></label><label>Meter identity<input name="meterId" required value="${esc(install.meterId)}" /></label><label>Handover due<input name="dueDate" type="date" value="2026-10-15" /></label></div><div class="form-submit-row"><span class="form-data-note">Partner handover remains attached to this work order.</span><button class="primary-button" type="submit">Issue installation order ${icon("arrow")}</button></div></form>`,
    `<form class="cpo-product-form" data-cpo-submit="commissioning"><div class="form-section-heading"><span class="eyebrow">CPO OPERATIONS · ASSET ACCEPTANCE</span><h2>Review the commissioning evidence</h2><p>Accept the installation only after the required safety, connectivity and meter checks are complete.</p></div><div class="form-context-card"><span>${icon("plug")}</span><div><strong>${esc(install.workOrder)} · ${esc(install.partner)}</strong><small>${esc(install.pointCount)} ${Number(install.pointCount) === 1 ? "charge point" : "charge points"} · ${esc(install.hardware)} · Meter ${esc(install.meterId)}</small></div><span class="state-badge">Handover received</span></div><fieldset class="commissioning-checks"><legend>Acceptance checks</legend><label><input name="safe" type="checkbox" required /><span><strong>Electrical and site safety evidence reviewed</strong><small>Partner test result is recorded against the work order.</small></span></label><label><input name="connected" type="checkbox" required /><span><strong>Charge point communications verified</strong><small>Device identity and connector inventory match the handover.</small></span></label><label><input name="meter" type="checkbox" required /><span><strong>Meter identity and register baseline captured</strong><small>Meter ${esc(install.meterId)} is linked to the asset.</small></span></label><label><input name="hostAccess" type="checkbox" required /><span><strong>Site host access conditions confirmed</strong><small>${esc(site.host)} confirms operating access for the CPO.</small></span></label></fieldset><div class="form-submit-row"><span class="form-data-note">Acceptance opens the site for simulated operation.</span><button class="primary-button" type="submit">Accept commissioning ${icon("arrow")}</button></div></form>`,
    `<form class="cpo-product-form" data-cpo-submit="session"><div class="form-section-heading"><span class="eyebrow">CPO OPERATIONS · SESSION CLOSE</span><h2>Record completed charging and meter evidence</h2><p>Enter the measured register values. The billable energy is derived from the difference, not typed independently.</p></div><div class="form-context-card"><span>${icon("pulse")}</span><div><strong>${esc(site.name)} · ${esc(install.workOrder)}</strong><small>${esc(install.pointCount)} commissioned points · ${esc(install.meterId)}</small></div><span class="status-pill is-live"><i></i>Site operating</span></div><div class="form-field-grid"><label>Session reference<input name="sessionId" required value="CW-AMS-2048" /></label><label>Charge point<input name="chargePoint" required value="AMS-P2-07" /></label><label>Access method<select name="access"><option>Chargecard</option><option>Ad hoc payment</option><option>Fleet agreement</option></select></label><label>Meter start reading<input name="meterStart" type="number" min="0" step="0.001" required value="12840.500" /><small>kWh</small></label><label>Meter end reading<input name="meterEnd" type="number" min="0.001" step="0.001" required value="12883.100" /><small>kWh · must exceed start</small></label><label>Applied tariff<input name="tariff" type="number" min="0.01" step="0.01" required value="0.55" /><small>EUR / kWh · synthetic tariff</small></label></div><div class="form-submit-row"><span class="form-data-note">Meter difference and provisional session value will be calculated.</span><button class="primary-button" type="submit">Close session & rate ${icon("arrow")}</button></div></form>`,
    `<div class="cpo-product-form"><div class="form-section-heading"><span class="eyebrow">CPO FINANCE · BILLING</span><h2>${cpoDemo.invoiceCreated ? "Invoice issued" : "Review the rated charge and issue an invoice"}</h2><p>Trace the amount from the accepted meter evidence and tariff into the customer billing record.</p></div>${cpoDemo.session ? `<div class="billing-source-card"><div><span class="eyebrow">SOURCE SESSION</span><strong>${esc(cpoDemo.session.sessionId)} · ${esc(site.name)}</strong><small>${esc(cpoDemo.session.chargePoint)} · ${esc(cpoDemo.session.access)} · Meter ${esc(install.meterId)}</small></div><span class="state-badge">Meter evidence accepted</span></div><div class="billing-calculation"><div><span>Meter start</span><strong>${formatNumber(Number(cpoDemo.session.meterStart))} kWh</strong></div><span class="calculation-operator">→</span><div><span>Meter end</span><strong>${formatNumber(Number(cpoDemo.session.meterEnd))} kWh</strong></div><span class="calculation-operator">×</span><div><span>Usage</span><strong>${formatNumber(meterDelta)} kWh</strong></div><span class="calculation-operator">×</span><div><span>Tariff</span><strong>${formatEuro(Number(cpoDemo.session.tariff))} / kWh</strong></div><div class="calculation-total"><span>Charge amount</span><strong>${formatEuro(billedAmount)}</strong></div></div><div class="billing-invoice-row"><div><span class="eyebrow">CUSTOMER BILLING</span><strong>${cpoDemo.invoiceCreated ? "Invoice INV-2026-10482 · Issued" : "Invoice draft · Ready for review"}</strong><small>${cpoDemo.invoiceCreated ? "Billing event recorded in this demo session." : "Invoice line is linked to the rated session and source meter evidence."}</small></div>${cpoDemo.invoiceCreated ? '<span class="status-pill is-live"><i></i>Issued</span>' : '<button class="primary-button" type="button" data-action="issue-demo-invoice">Issue demo invoice ' + icon("arrow") + '</button>'}</div>` : `<div class="empty-billing-state"><span class="dialog-icon">${icon("finance")}</span><h3>Billing is waiting for a completed session</h3><p>Complete the operations screen first. The invoice amount will then be calculated from the meter readings and applied tariff.</p><button class="secondary-button" type="button" data-cpo-screen="3">Return to operations ${icon("arrow")}</button></div>`}<div class="billing-demo-link"><div><span class="eyebrow">BILLING EXCEPTION · HUMAN REVIEW</span><strong>Need to handle a late or corrected reading?</strong><small>Open the work item to inspect evidence, update the reading and record a traceable decision.</small></div><button class="secondary-button" type="button" data-action="open-work-item">Review in My work ${icon("arrow")}</button></div></div>`,
  ];
  const titles = ["Site & agreement", "Installation order", "Commissioning", "Operations", "Billing"];
  const description = ["Create a site record and agree the host conditions.", "Assign the installation partner and capture asset handover details.", "Verify required evidence and accept the installed charge points.", "Record a completed session and its meter readings.", "Rate the session, issue the invoice and follow exceptions." ];
}

function workInboxPage() {
  const caseData = meterCorrectionModel.case;
  const completed = workRun.status === "completed";
  const status = completed ? "Completed" : caseData.status === "open" ? "Needs review" : caseData.status;
  const amount = completed
    ? rateCorrectedReading(workRun.values.meterEnd).amountEur
    : rateCorrectedReading(caseData.proposedMeterEnd).amountEur;
  return `${heading("My work", "Review the decisions and data updates that need a person in the process.", '<span class="work-fixture-tag"><i></i> 1 task to review</span>')}
    <div class="work-summary-grid" aria-label="Work summary">
      <article><span>Needs your attention</span><strong>${completed ? "0" : "1"}</strong><small>Human task waiting on your decision</small></article>
      <article><span>Completed today</span><strong>${completed ? "1" : "0"}</strong><small>Decisions recorded in this session</small></article>
      <article><span>Team queue</span><strong>Billing operations</strong><small>CPO · Netherlands and Belgium</small></article>
    </div>
    <div class="work-inbox-toolbar"><div><span class="eyebrow">TASK INBOX</span><h2>Open work</h2><p>Tasks appear here when a process needs an authorized person to review evidence or update business data.</p></div><span class="subtle-tag">${completed ? "1 completed" : "1 task"}</span></div>
    <section class="work-item-list" aria-label="Work items">
      <button class="work-item-row${completed ? " is-complete" : ""}" type="button" data-action="open-work-item">
        <span class="work-item-icon">${icon(completed ? "check" : "alert")}</span>
        <span class="work-item-copy"><span class="work-item-kicker">${esc(caseData.category)} · ${esc(caseData.id)}</span><strong>${esc(caseData.title)}</strong><small>${esc(caseData.site)} · ${esc(caseData.sessionId)}</small></span>
        <span class="work-item-value"><strong>${formatEuro(amount)}</strong><small>${completed ? "Re-rated amount" : "Proposed amount"}</small></span>
        <span class="work-item-meta"><span class="work-state ${completed ? "is-complete" : ""}"><i></i>${status}</span><small>${completed ? "Completed just now" : esc(caseData.dueLabel)}</small></span>
        ${icon("arrow", "work-item-arrow")}
      </button>
    </section>
    <div class="work-inbox-footnote">The task list and status are generated from a synthetic work-item contract. Process engine state and technical transition names are kept out of the operator workspace.</div>`;
}

function workProgress() {
  const stages = meterCorrectionModel.process.stages;
  const completedThrough = workRun.status === "completed" ? stages.length - 1 : stages.findIndex((stage) => stage.id === workRun.currentStage);
  return `<ol class="work-progress" aria-label="Case progress">${stages.map((stage, index) => {
    const done = index < completedThrough || (workRun.status === "completed" && index <= completedThrough);
    const current = workRun.status !== "completed" && index === completedThrough;
    return `<li class="${done ? "is-done" : current ? "is-current" : ""}" aria-current="${current ? "step" : "false"}"><span>${done ? icon("check") : String(index + 1).padStart(2, "0")}</span><strong>${esc(stage.label)}</strong></li>`;
  }).join("")}</ol>`;
}

function workCasePage() {
  const caseData = meterCorrectionModel.case;
  const completed = workRun.status === "completed";
  const currentEnd = completed ? Number(workRun.values.meterEnd) : Number(caseData.proposedMeterEnd);
  const currentRating = rateCorrectedReading(currentEnd, caseData);
  const originalRating = rateCorrectedReading(caseData.originalMeterEnd, caseData);
  const form = meterCorrectionModel.task.form;
  const task = meterCorrectionModel.task;
  const taskPanel = completed
    ? `<section class="work-decision-complete" role="status"><span class="complete-mark">${icon("check")}</span><div><span class="eyebrow">DECISION RECORDED</span><h2>Billing adjustment prepared</h2><p>${esc(workRun.values.operatorNote)}</p><dl><div><dt>New usage</dt><dd>${formatNumber(currentRating.energyKwh)} kWh</dd></div><div><dt>Re-rated amount</dt><dd>${formatEuro(currentRating.amountEur)}</dd></div><div><dt>Correction record</dt><dd>ADJ-2026-00471</dd></div><div><dt>Evidence</dt><dd>${esc(workRun.values.evidenceReference)}</dd></div></dl></div></section>`
    : `<section class="work-task-card"><div class="work-task-heading"><div><span class="eyebrow">${esc(caseData.assignedRole)} · HUMAN REVIEW</span><h2>${esc(task.title)}</h2><p>${esc(task.instructions)}</p></div><span class="work-task-open"><i></i> Action required</span></div>
      <form class="work-task-form" data-work-task="${esc(task.id)}"><div class="work-task-fields">${renderGeneratedTaskForm(form, workRun.values)}</div><div class="work-form-error" id="work-form-error" role="alert" hidden></div><div class="work-form-actions"><span>Submitting records the decision and recalculates the billing amount.</span><button class="primary-button" type="submit">${esc(task.submitLabel)} ${icon("arrow")}</button></div></form>
      <p class="work-form-boundary">Allowed fields come from this task's versioned presentation profile. The task host applies identity, permission, revision and business validation before the workflow resumes.</p></section>`;

  return `${heading("Work item", "Review the evidence, record your decision, and keep the correction linked to its original charge.", `<button type="button" class="secondary-button" data-action="back-to-work">${icon("arrow")} Back to work</button>`)}
    <div class="work-case-header"><div><span class="eyebrow">${esc(caseData.category.toUpperCase())} · ${esc(caseData.id)}</span><h2>${esc(caseData.title)}</h2><p>${esc(caseData.description)}</p></div><span class="work-state large ${completed ? "is-complete" : ""}"><i></i>${completed ? "Completed" : "Needs your review"}</span></div>
    <section class="work-progress-card"><div class="work-progress-top"><div><span class="eyebrow">PROCESS PROGRESS</span><strong>${completed ? "Decision recorded" : "Waiting for CPO review"}</strong></div><span>${completed ? "4 of 4 stages" : "2 of 4 stages complete"}</span></div>${workProgress()}</section>
    <div class="work-case-layout"><div class="work-case-main">${taskPanel}<section class="work-financial-impact"><div><span class="eyebrow">CALCULATED FROM METER EVIDENCE</span><h2>Billing impact</h2><p>Rate is € ${formatNumber(caseData.tariffEurPerKwh)} per kWh. The amount is recalculated from the register difference.</p></div><div class="work-impact-values"><div><span>Original</span><strong>${formatNumber(originalRating.energyKwh)} kWh · ${formatEuro(originalRating.amountEur)}</strong></div><div><span>${completed ? "Corrected" : "Proposed"}</span><strong>${formatNumber(currentRating.energyKwh)} kWh · ${formatEuro(currentRating.amountEur)}</strong></div><div class="work-impact-delta"><span>Adjustment</span><strong>${formatEuro(currentRating.amountEur - originalRating.amountEur)}</strong></div></div></section></div>
      <aside class="work-case-aside"><section class="work-context-card"><div class="work-aside-title">${icon("plug")}<h3>Charging record</h3></div><dl><div><dt>Session</dt><dd>${esc(caseData.sessionId)}</dd></div><div><dt>Original CDR</dt><dd>${esc(caseData.cdrId)}</dd></div><div><dt>Site</dt><dd>${esc(caseData.site)}</dd></div><div><dt>Meter</dt><dd>${esc(caseData.meterId)}</dd></div><div><dt>Start reading</dt><dd>${formatNumber(caseData.meterStart)} kWh</dd></div><div><dt>Original end</dt><dd>${formatNumber(caseData.originalMeterEnd)} kWh</dd></div><div><dt>Partner proposal</dt><dd>${formatNumber(caseData.proposedMeterEnd)} kWh</dd></div><div><dt>Evidence ref</dt><dd>${esc(caseData.evidenceReference)}</dd></div></dl></section>
      <section class="work-people-card"><div class="work-aside-title">${icon("overview")}<h3>People and responsibilities</h3></div><div class="work-person"><span class="profile-avatar">BO</span><span><strong>${esc(caseData.assignedRole)}</strong><small>${completed ? "Decision recorded by you" : "Responsible for reviewing the evidence"}</small></span></div><div class="work-person"><span class="profile-avatar partner-avatar">NP</span><span><strong>${esc(caseData.partner)}</strong><small>Submitted the revised meter evidence</small></span></div><div class="work-person"><span class="profile-avatar system-avatar">CW</span><span><strong>Billing service</strong><small>Re-rates after an accepted correction</small></span></div></section>
      <section class="work-history-card"><div class="work-aside-title">${icon("clock")}<h3>Recent activity</h3></div><ol><li><i class="is-done"></i><span><strong>Mismatch detected</strong><small>${esc(caseData.openedAt)} · Reconciliation</small></span></li><li><i class="is-done"></i><span><strong>Partner evidence received</strong><small>Signed meter reading · ${esc(caseData.evidenceReference)}</small></span></li><li><i class="${completed ? "is-done" : "is-current"}"></i><span><strong>${completed ? "Decision recorded" : "Awaiting your review"}</strong><small>${completed ? "Correction linked to the original record" : esc(caseData.dueLabel)}</small></span></li></ol></section></aside></div>
    <div class="workspace-footnote">Synthetic task and records. This interaction updates browser demo state only; it does not issue a real credit, invoice change, or payment.</div>`;
}

function workPage() {
  return selectedWorkItem ? workCasePage() : workInboxPage();
}

function inspector(session) {
  if (!session) return '<aside class="inspector empty-inspector"><h2>Select a session</h2><p>Session context and process evidence will appear here.</p></aside>';
  const site = findSite(session.siteId);
  return `<aside class="inspector"><div class="inspector-header"><div><span class="eyebrow">LIVE SESSION</span><h2>${session.id}</h2></div><span class="status-pill is-live"><i></i>Charging</span></div><div class="inspector-site"><span class="site-avatar">${icon("pin")}</span><div><strong>${esc(site.name)}</strong><small>${esc(site.city)}, ${countryLabel(site.country)}</small></div></div><dl class="detail-list"><div><dt>Charge point</dt><dd>${esc(session.chargePoint)} · ${esc(session.connector)}</dd></div><div><dt>Access method</dt><dd>${esc(session.access)}</dd></div><div><dt>Vehicle</dt><dd>${esc(session.vehicle)}</dd></div><div><dt>Started</dt><dd>${dateTime(session.startedAt)}</dd></div><div><dt>Duration</dt><dd>${session.durationMin} min</dd></div><div><dt>Energy delivered</dt><dd>${formatNumber(session.energyKwh)} kWh</dd></div><div><dt>Session value</dt><dd>${formatEuro(session.amount)}</dd></div></dl><div class="inspector-note">Value is provisional while the session is active. Final rating follows the tariff version and applicable agreement.</div><div class="inspector-actions"><button class="primary-button" type="button" data-action="source-info">Add operator note</button><button class="secondary-button" type="button" data-action="source-info">View event history</button></div></aside>`;
}
function operationsPage() {
  const source = liveSessions.map((session) => ({ ...session, country: findSite(session.siteId).country }));
  const sessions = filterByCountry(source, country).map((row) => liveSessions.find((session) => session.id === row.id));
  return `${heading("Live operations", "Monitor active charge point sessions across your owned sites.", `<button class="secondary-button" type="button" data-action="export-sessions">${icon("download")} Export</button>`)}<div class="toolbar-row">${countryTabs()}<span class="toolbar-spacer"></span><span class="result-count">${sessions.length} active sessions</span><span class="live-indicator"><i></i> Demo fixture</span></div><div class="workbench-grid"><section class="panel operations-table"><header class="panel-heading"><h2>Active sessions</h2><span class="subtle-tag">${sessions.length} live</span></header>${table(["Session", "Site", "Charge point", "Access", "Energy", "Duration", "Value", "Status"], sessionRows(sessions), "Active charging sessions")}</section>${inspector(liveSessions.find((session) => session.id === selectedSession))}</div><div class="workspace-footnote">Charge point and process records are synthetic. OCPP, payment, and grid-control endpoints are not connected.</div>`;
}
function sitesPage() {
  const sites = filterByCountry(ownSites, country);
  const siteMetrics = getSiteMetrics(sites);
  return `${heading("Sites & parking", "Manage owned charge points in public hubs, workplace campuses, and car parks.", '<button class="primary-button" type="button" data-action="new-site">＋ Add site</button>')}<div class="site-summary-grid"><article><span>Owned sites</span><strong>${sites.length}</strong><small>NL and BE footprint</small></article><article><span>Charge points</span><strong>${siteMetrics.chargePoints}</strong><small>${siteMetrics.online} online</small></article><article><span>Parking spaces served</span><strong>${formatNumber(siteMetrics.parkingSpaces)}</strong><small>Across owned locations</small></article><article><span>Average utilisation</span><strong>55,3%</strong><small>Current day</small></article></div><div class="list-toolbar">${countryTabs()}<span class="toolbar-spacer"></span><span class="result-count">${sites.length} locations</span></div>${table(["Site", "Country / city", "Setting", "Parking spaces", "Charge points", "Live sessions", "Utilisation", "Capacity"], siteRows(sites), "Owned charging sites")}<div class="workspace-footnote">Owned-site inventory is separate from the European partner locations used by Chargecard roaming.</div>`;
}
function sessionsPage() {
  const rows = liveSessions.map((session) => ({ ...session, country: findSite(session.siteId).country }));
  const sessions = filterByCountry(rows, country).map((row) => liveSessions.find((session) => session.id === row.id));
  return `${heading("Sessions", "Review active records, access methods, and provisional euro values.", `<button class="secondary-button" type="button" data-action="export-sessions">${icon("download")} Export CSV</button>`)}<div class="session-summary"><div><span>Active now</span><strong>10</strong></div><div><span>Chargecard access</span><strong>4</strong></div><div><span>Fleet agreements</span><strong>2</strong></div><div><span>Mean session age</span><strong>29 <small>min</small></strong></div></div><div class="list-toolbar">${countryTabs()}<span class="toolbar-spacer"></span><span class="result-count">Live session ledger</span></div>${table(["Session", "Site", "Charge point", "Access method", "Energy", "Duration", "Value", "Status"], sessionRows(sessions, ""), "Charging sessions")}<div class="workspace-footnote">Active values are provisional; the final charge record is created after the session completes.</div>`;
}
function roamingPage() {
  const values = [["Sessions this month", "486", "roaming", "blue"], ["Countries represented", "14", "pin", "mint"], ["Settlement to partners", formatEuro(7892.4), "finance", "violet"], ["Records to review", "3", "alert", "amber"]];
  return `${heading("Chargecard roaming", "Follow cardholder sessions at partner networks across Europe, separately from your owned sites.", `<button class="secondary-button" type="button" data-action="export-roaming">${icon("download")} Export ledger</button>`)}<div class="roaming-hero"><div class="roaming-hero-copy"><span class="roaming-orbit large">${icon("roaming")}</span><div><span class="eyebrow">EUROPEAN PARTNER NETWORK</span><h2>Chargecard, wherever the journey goes.</h2><p>Roaming records carry partner, country, tariff, CDR status, and settlement responsibility through one traceable process.</p></div></div><div class="roaming-hero-meta"><span>Coverage in fixture</span><strong>14 countries</strong><small>Illustrative partner data</small></div></div><div class="kpi-grid four-cards">${values.map(([label, value, symbol, tone], index) => kpi(label, value, ["Across the partner footprint", "Partner sessions in fixture", "Pending partner settlement", '<span class="delta-warn">2 corrections</span> · 1 partner response'][index], symbol, tone)).join("")}</div><div class="list-toolbar"><div class="ledger-key"><span class="key-dot own"></span>Chargecard partner session <span class="key-dot pending"></span>Needs review</div><span class="toolbar-spacer"></span><span class="result-count">${roamingSessions.length} sample records</span></div>${table(["Partner location", "Country", "Card token", "CDR reference", "Energy", "Amount", "CDR status", "Settlement"], roamingRows(roamingSessions), "European Chargecard roaming ledger")}<div class="process-strip"><div class="process-step is-done"><span>1</span><strong>Session at partner</strong><small>Chargecard token</small></div><span class="process-connector"></span><div class="process-step is-done"><span>2</span><strong>CDR received</strong><small>Original record retained</small></div><span class="process-connector"></span><div class="process-step is-current"><span>3</span><strong>Validate & rate</strong><small>Country and agreement context</small></div><span class="process-connector"></span><div class="process-step"><span>4</span><strong>Settle partner</strong><small>Exceptions stay traceable</small></div></div><div class="workspace-footnote">Partner names and transaction records are synthetic examples. No Chargecard, OCPI, payment, or settlement service is connected.</div>`;
}
const NETWORK_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const NETWORK_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
function rememberNetworkMapViewport() {
  if (!networkMap) return;
  const center = networkMap.getCenter();
  const zoom = networkMap.getZoom();
  networkMapViewport = { scope: networkMapScope, center: [center.lat, center.lng], zoom };
  const container = networkMap.getContainer();
  container.dataset.mapCenterLat = center.lat.toFixed(6);
  container.dataset.mapCenterLon = center.lng.toFixed(6);
  container.dataset.mapZoom = String(zoom);
}
function destroyNetworkMap() {
  if (!networkMap) return;
  rememberNetworkMapViewport();
  networkMap.remove();
  networkMap = null;
  networkMapScope = null;
}
function networkMapPopup(record, owned) {
  const name = owned ? record.name : record.location;
  const location = owned ? `${record.city} · ${record.country}` : `${record.city ?? record.country} · ${record.partner}`;
  const activity = owned
    ? `${record.online} / ${record.chargePoints} charge points online`
    : `${formatNumber(record.energyKwh)} kWh · ${formatEuro(record.amount)}`;
  return `<div class="network-map-popup"><strong>${esc(name)}</strong><span>${esc(record.address)}</span><small>${esc(location)} · ${esc(activity)}</small><a href="${esc(record.coordinateRef)}" target="_blank" rel="noopener noreferrer">OpenStreetMap source</a></div>`;
}
function initializeNetworkMap(sites, roaming) {
  const container = root.querySelector("#network-map");
  if (!container) return;
  const owned = mapScope === "owned";
  const records = owned ? sites : roaming;
  if (!records.length) return;
  const selected = owned ? selectedMapSite : selectedRoamingLocation;
  const map = L.map(container, { scrollWheelZoom: true, zoomControl: true, attributionControl: true });
  networkMap = map;
  networkMapScope = mapScope;
  L.tileLayer(NETWORK_TILE_URL, { maxZoom: 19, attribution: NETWORK_TILE_ATTRIBUTION }).addTo(map);
  if (networkMapViewport?.scope === mapScope) {
    map.setView(networkMapViewport.center, networkMapViewport.zoom, { animate: false });
  } else {
    const bounds = L.latLngBounds(records.map((record) => [record.coordinates.lat, record.coordinates.lon]));
    map.fitBounds(bounds.pad(0.32), { maxZoom: owned ? 8 : 5, animate: false });
  }
  map.on("moveend zoomend", rememberNetworkMapViewport);
  records.forEach((record) => {
    const id = record.id;
    const isSelected = id === selected;
    const warning = owned && record.online < record.chargePoints;
    const color = warning ? "#f1aa4e" : owned ? "#26c28c" : "#70a8ff";
    const marker = L.circleMarker([record.coordinates.lat, record.coordinates.lon], {
      radius: isSelected ? 9 : 6,
      color: isSelected ? "#ffffff" : "#10202b",
      weight: isSelected ? 2.5 : 1.5,
      opacity: 0.95,
      fillColor: color,
      fillOpacity: 0.95,
    }).addTo(map);
    marker.bindPopup(networkMapPopup(record, owned), { closeButton: false, maxWidth: 240 });
    marker.bindTooltip(esc(owned ? `${record.name} · ${record.city}` : `${record.location} · ${record.country}`), {
      direction: "top",
      opacity: 0.96,
      className: "network-map-tooltip",
    });
    const element = marker.getElement();
    if (element) {
      element.classList.add("map-marker", `map-marker-${owned ? "owned" : "roaming"}`);
      if (isSelected) element.classList.add("is-selected");
      if (warning) element.classList.add("is-warning");
      element.dataset[owned ? "mapSite" : "mapRoaming"] = id;
      element.setAttribute("role", "button");
      element.setAttribute("aria-label", owned ? `${record.name}, ${record.city}` : `${record.location}, ${record.country}`);
      element.setAttribute("aria-pressed", String(isSelected));
      element.setAttribute("tabindex", "0");
    }
  });
  if (networkMapFocus?.scope === mapScope) {
    const focused = records.find((record) => record.id === networkMapFocus.id);
    if (focused) map.setView([focused.coordinates.lat, focused.coordinates.lon], Math.max(map.getZoom(), 14), { animate: false });
  }
  networkMapFocus = null;
  rememberNetworkMapViewport();
  requestAnimationFrame(() => { if (networkMap === map) map.invalidateSize({ pan: false }); });
}
function geographyList(sites, roaming, selected) {
  if (mapScope === "owned") {
    return sites.map((site) => `<button type="button" class="geo-location-row${site.id === selected ? " is-selected" : ""}" data-map-site="${esc(site.id)}" aria-pressed="${site.id === selected}"><span class="geo-location-pin${site.online < site.chargePoints ? " is-warning" : ""}">${icon("pin")}</span><span class="geo-location-main"><strong>${esc(site.name)}</strong><small>${esc(site.city)} · ${site.country}</small></span><span class="geo-location-stat"><b>${site.online}<i>/${site.chargePoints}</i></b><small>online</small></span></button>`).join("");
  }
  return roaming.map((session) => `<button type="button" class="geo-location-row${session.id === selected ? " is-selected" : ""}" data-map-roaming="${esc(session.id)}" aria-pressed="${session.id === selected}"><span class="geo-location-pin is-roaming">${icon("roaming")}</span><span class="geo-location-main"><strong>${esc(session.location)}</strong><small>${esc(session.partner)} · ${session.countryCode}</small></span><span class="geo-location-stat"><b>${formatEuro(session.amount)}</b><small>${formatNumber(session.energyKwh)} kWh</small></span></button>`).join("");
}
function geographyLocationReference(record) {
  const coordinates = `${record.coordinates.lat.toFixed(5)}, ${record.coordinates.lon.toFixed(5)}`;
  return `<div class="geo-location-reference"><div><span>Venue address</span><strong>${esc(record.address)}</strong></div><div><span>Reference coordinates</span><strong>${coordinates}</strong></div><a href="${esc(record.coordinateRef)}" target="_blank" rel="noopener noreferrer">OpenStreetMap source ${icon("arrow")}</a></div><p class="geo-location-caveat">Sample venue reference for synthetic data; it does not confirm ChargeWeave ownership or charger positions.</p>`;
}
function geographyDetails(site, roaming) {
  if (mapScope === "owned" && site) {
    const events = recentActivity.filter((item) => item.detail.toLowerCase().includes(site.city.toLowerCase()) || item.detail.toLowerCase().includes(site.name.toLowerCase()));
    const timeline = events.length
      ? events.map((item) => `<div class="geo-timeline-item tone-${item.tone}"><i></i><div><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></div><time>${esc(item.time)}</time></div>`).join("")
      : '<p class="geo-empty-timeline">No recent event for this location in the current fixture.</p>';
    return `<div class="geo-detail-eyebrow">OWNED SITE · ${site.country}</div><h2>${esc(site.name)}</h2><p class="geo-detail-location">${esc(site.city)} · ${esc(site.setting)}</p>${geographyLocationReference(site)}<dl class="geo-detail-facts"><div><dt>Charge points online</dt><dd>${site.online} / ${site.chargePoints}</dd></div><div><dt>Live sessions</dt><dd>${site.liveSessions}</dd></div><div><dt>Parking spaces</dt><dd>${formatNumber(site.parkingSpaces)}</dd></div><div><dt>Utilisation today</dt><dd>${site.utilisation}%</dd></div></dl><div class="geo-detail-section"><div class="geo-section-title"><h3>Recent activity</h3><span>${events.length} events</span></div><div class="geo-timeline">${timeline}</div></div><button type="button" class="secondary-button full-button" data-view="sites">Open site inventory ${icon("arrow")}</button>`;
  }
  if (!roaming) return `<div class="geo-detail-empty"><span class="geo-detail-icon">${icon("pin")}</span><strong>Select a location</strong><small>Location details and recent events will appear here.</small></div>`;
  const tone = roaming.cdrStatus === "Accepted" ? "good" : "warn";
  return `<div class="geo-detail-eyebrow">CHARGECARD ROAMING · ${roaming.countryCode}</div><h2>${esc(roaming.location)}</h2><p class="geo-detail-location">${esc(roaming.partner)} · ${esc(roaming.country)}</p>${geographyLocationReference(roaming)}<dl class="geo-detail-facts"><div><dt>Charge detail record</dt><dd>${esc(roaming.id)}</dd></div><div><dt>Energy</dt><dd>${formatNumber(roaming.energyKwh)} kWh</dd></div><div><dt>Session value</dt><dd>${formatEuro(roaming.amount)}</dd></div><div><dt>Settlement</dt><dd>${esc(roaming.settlement)}</dd></div></dl><div class="geo-detail-section"><div class="geo-section-title"><h3>Record timeline</h3><span>Partner session</span></div><div class="geo-timeline"><div class="geo-timeline-item tone-${tone}"><i></i><div><strong>${esc(roaming.cdrStatus)}</strong><small>${esc(roaming.location)} · ${esc(roaming.settlement)}</small></div><time>${dateTime(roaming.recordedAt)}</time></div></div></div><button type="button" class="secondary-button full-button" data-view="roaming">Open roaming ledger ${icon("arrow")}</button>`;
}
function geographyPage() {
  const sites = filterByCountry(ownSites, country);
  const roaming = roamingSessions;
  const selectedSite = sites.find((site) => site.id === selectedMapSite) ?? sites[0];
  const selectedRoaming = roaming.find((session) => session.id === selectedRoamingLocation) ?? roaming[0];
  const selectedId = mapScope === "owned" ? selectedSite?.id : selectedRoaming?.id;
  const scopeControls = `<div class="map-scope-switch" role="group" aria-label="Geographic scope"><button type="button" data-map-scope="owned" aria-pressed="${mapScope === "owned"}" class="${mapScope === "owned" ? "is-active" : ""}"><span>Owned network</span><b>NL · BE</b></button><button type="button" data-map-scope="roaming" aria-pressed="${mapScope === "roaming"}" class="${mapScope === "roaming" ? "is-active" : ""}"><span>Chargecard roaming</span><b>Europe</b></button></div>`;
  const scopeStats = mapScope === "owned"
    ? `<span><b>${sites.length}</b> locations</span><span><b>${formatNumber(getSiteMetrics(sites).chargePoints)}</b> charge points</span><span><b>${formatNumber(getSiteMetrics(sites).parkingSpaces)}</b> parking spaces</span>`
    : `<span><b>${roaming.length}</b> sample sessions</span><span><b>${new Set(roaming.map((session) => session.countryCode)).size}</b> countries</span><span><b>${formatEuro(roaming.reduce((sum, session) => sum + session.amount, 0))}</b> sample value</span>`;
  return `${heading("Geographic network", "Explore your owned charging and parking locations in Belgium and the Netherlands, alongside Chargecard roaming across Europe.")}
    <div class="geo-toolbar">${scopeControls}<div class="geo-scope-stats">${scopeStats}</div>${mapScope === "owned" ? countryTabs() : ""}</div>
    <div class="geo-workbench">
      <section class="geo-pane geo-map-pane"><header class="geo-pane-heading"><div><span class="eyebrow">${mapScope === "owned" ? "OWNED LOCATIONS" : "EUROPEAN PARTNER NETWORK"}</span><h2>${mapScope === "owned" ? "Belgium & the Netherlands" : "Chargecard roaming"}</h2></div><span class="geo-map-count"><i></i>${mapScope === "owned" ? `${sites.length} sites` : `${roaming.length} sample locations`}</span></header><div class="geo-map-surface"><div id="network-map" class="network-map" role="region" aria-label="Interactive map of ${mapScope === "owned" ? "Belgium and the Netherlands" : "European partner locations"}"></div></div><footer class="geo-map-footer"><span><i class="geo-legend-dot${mapScope === "roaming" ? " is-roaming" : ""}"></i>${mapScope === "owned" ? "Owned site" : "Partner session"}</span>${mapScope === "owned" ? '<span><i class="geo-legend-dot is-warning"></i>Availability watch</span>' : '<span><i class="geo-legend-dot is-warning"></i>Needs review</span>'}<small>Online map tiles · sample venue markers</small></footer></section>
      <section class="geo-pane geo-list-pane"><header class="geo-pane-heading"><div><span class="eyebrow">${mapScope === "owned" ? "SITE DIRECTORY" : "PARTNER SESSIONS"}</span><h2>${mapScope === "owned" ? "Locations" : "Recent roaming"}</h2></div><span class="geo-list-count">${mapScope === "owned" ? sites.length : roaming.length}</span></header><div class="geo-location-list">${geographyList(sites, roaming, selectedId)}</div><p class="geo-list-footnote">${mapScope === "owned" ? "Owned sites include their parking setting and charge point availability." : "Roaming records are partner locations, separate from owned assets."}</p></section>
      <aside class="geo-pane geo-details-pane">${geographyDetails(selectedSite, selectedRoaming)}</aside>
    </div><div class="workspace-footnote">Map tiles load from OpenStreetMap and need an internet connection. Addresses and coordinates point to public venues for illustration; they do not verify ChargeWeave sites or charger locations.</div>`;
}
function measuredEnergyTrend() {
  try { return renderChart(resolveResult(provider, analyticsState, { measure: "energy", dimension: "month", operator: "Value", comparison: "None", limit: 0 }), { kind: "line", id: "network-energy" }); }
  catch (error) { return `<p class="analytics-empty" role="status">${esc(error.message)}</p>`; }
}
function energyPage() {
  const rows = ownSites.map((site) => {
    const percent = Math.round((site.currentKw / site.capacityKw) * 100);
    return `<tr><td><strong class="table-primary-text">${esc(site.name)}</strong><small class="table-subtext">${esc(site.city)} · ${site.country}</small></td><td class="numeric">${site.currentKw} kW</td><td class="numeric">${site.capacityKw} kW</td><td><div class="utilisation"><span>${percent}%</span><span class="progress"><i style="width:${percent}%"></i></span></div></td><td class="numeric">${formatEuro(site.tariff)} / kWh</td><td><span class="status-pill ${percent > 72 ? "is-review" : "is-live"}"><i></i>${percent > 72 ? "Watch" : "Within limit"}</span></td></tr>`;
  }).join("");
  return `${heading("Energy & capacity", "See charging demand against site limits before local constraints become an operational surprise.", `<button class="secondary-button" type="button" data-action="export-sites">${icon("download")} Export</button>`)}<div class="energy-hero"><div><span class="eyebrow">OWNED NETWORK · TODAY</span><h2>Demand remains within site limits.</h2><p>Aggregate view for your Netherlands and Belgium locations. Local protection and charger controls remain authoritative.</p></div><div class="capacity-meter"><span>Current demand</span><strong>${formatNumber(metrics.currentKw / 1000)} <small>MW</small></strong><div class="progress"><i style="width:${Math.round(metrics.currentKw / metrics.capacityKw * 100)}%"></i></div><small>${formatNumber(metrics.currentKw)} kW of ${formatNumber(metrics.capacityKw)} kW contracted capacity</small></div></div><div class="energy-chart-panel panel"><div class="panel-heading"><div><h2>Delivered energy through the period</h2><p>Calculated daily facts · ${esc(analyticsState.period)} · UTC</p></div></div>${measuredEnergyTrend()}</div>${table(["Owned site", "Current demand", "Site limit", "Utilisation", "Indicative tariff", "Status"], rows, "Site energy and capacity")}<div class="workspace-footnote">Demand values and tariffs are illustrative. The console does not issue real-time power setpoints.</div>`;
}
function financePage() {
  const net = financialLines.reduce((total, line) => total + line.amount, 0);
  const revenue = financialLines.find((line) => line.treatment === "Revenue").amount;
  const energy = Math.abs(financialLines.find((line) => line.category === "Energy procurement").amount);
  const settlement = Math.abs(financialLines.find((line) => line.category === "Roaming partner settlement").amount);
  return `${heading("Finance", "Connect session value, energy costs, roaming settlement, and site contribution.", `<button class="secondary-button" type="button" data-action="export-finance">${icon("download")} Export CSV</button>`)}<div class="finance-period"><span class="period-tag">MONTH TO DATE</span><span>Illustrative European commercial view · EUR</span><span class="toolbar-spacer"></span><span class="small-note">VAT treatment follows the transaction and responsible party.</span></div><div class="finance-metrics"><article class="finance-total is-income"><span>Charging revenue</span><strong>${formatEuro(revenue)}</strong><small>Owned network · NL + BE</small></article><article class="finance-total is-cost"><span>Energy procurement</span><strong>${formatEuro(energy)}</strong><small>Allocated by site</small></article><article class="finance-total is-cost"><span>Roaming settlement</span><strong>${formatEuro(settlement)}</strong><small>Payable to partners</small></article><article class="finance-total is-net"><span>Indicative contribution</span><strong>${formatEuro(net)}</strong><small>Before fixed site costs and VAT adjustments</small></article></div><div class="section-title-row"><div><h2>Commercial ledger</h2><p>Values stay linked to their session or settlement evidence.</p></div><button class="text-button" type="button" data-view="sessions">Review sessions ${icon("arrow")}</button></div>${table(["Category", "Basis", "Amount", "Scope", "Treatment"], financialLines.map((line) => `<tr data-search-row data-search="${esc(`${line.category} ${line.basis} ${line.scope} ${line.treatment}`.toLowerCase())}"><td><strong class="table-primary-text">${esc(line.category)}</strong></td><td>${esc(line.basis)}</td><td class="numeric ${line.treatment === "Revenue" ? "money-positive" : "money-negative"}">${formatEuro(line.amount)}</td><td>${esc(line.scope)}</td><td><span class="state-badge">${esc(line.treatment)}</span></td></tr>`).join(""), "European commercial ledger")}<div class="finance-note"><span class="note-icon">${icon("alert")}</span><p><strong>Corrections preserve the trail.</strong> A corrected charge record links to its original and reversal, so reports can show what was known at each point in time.</p><button class="inline-link" type="button" data-view="data">Inspect data model ${icon("arrow")}</button></div><div class="workspace-footnote">All amounts are synthetic EUR examples. This is not an invoice, tax calculation, accounting ledger, or settlement instruction.</div>`;
}
function graphHtml() {
  return `<div class="graph-stage"><div class="graph-node node-site"><span>${icon("pin")}</span><div><strong>ChargingSite</strong><small>owned asset · NL / BE</small></div></div><span class="graph-edge edge-site">hasChargePoint</span><div class="graph-node node-point"><span>${icon("plug")}</span><div><strong>ChargePoint</strong><small>protocol identity</small></div></div><span class="graph-edge edge-session">hasSession</span><div class="graph-node node-session"><span>${icon("clock")}</span><div><strong>Session</strong><small>valid time · recorded time</small></div></div><span class="graph-edge edge-cdr">producesRecord</span><div class="graph-node node-cdr"><span>${icon("finance")}</span><div><strong>ChargingDetailRecord</strong><small>tariff version · amount</small></div></div><span class="graph-edge edge-settlement">settlesWith</span><div class="graph-node node-settlement"><span>${icon("roaming")}</span><div><strong>RoamingSettlement</strong><small>partner · currency EUR</small></div></div></div><div class="graph-legend"><span><i class="legend-asset"></i>Owned asset</span><span><i class="legend-process"></i>Operation</span><span><i class="legend-commercial"></i>Commercial record</span></div>`;
}
function dataRows() {
  return liveSessions.slice(0, 5).map((session) => `<tr><td>${session.id}</td><td>${esc(siteName(session.siteId))}</td><td>${findSite(session.siteId).country}</td><td>${formatNumber(session.energyKwh)} kWh</td><td>${formatEuro(session.amount)}</td><td>2026-09-26T${time(session.startedAt)}+02:00</td><td>fixture</td></tr>`).join("");
}
function dataTable() { return table(["Session ID", "Site", "Country", "Energy", "Amount (EUR)", "Valid from", "Source"], dataRows(), "Semantic session data"); }
function queryHtml() {
  const query = '<span class="code-keyword">SELECT</span> ?session ?site ?validFrom ?recordedAt ?amount\n<span class="code-keyword">WHERE</span> {\n  ?session a cw:Session ;\n           cw:atSite ?site ;\n           cw:validFrom ?validFrom ;\n           cw:recordedAt ?recordedAt ;\n           cw:amount ?amount .\n  ?site cw:countryCode ?country .\n  <span class="code-keyword">FILTER</span> (?country <span class="code-keyword">IN</span> ("NL", "BE"))\n}\n<span class="code-keyword">ORDER BY</span> <span class="code-keyword">DESC</span>(?recordedAt)';
  return `<div class="query-workbench"><div class="query-editor"><div class="query-toolbar"><span class="editor-language"><i></i> SPARQL-T · read-only example</span><button type="button" class="small-button" data-action="run-query">Run sample</button></div><pre><code>${query}</code></pre><div class="query-hint">Sample query · valid time + recorded time · no live endpoint</div></div><div class="query-result"><div class="result-heading"><strong>Preview rows</strong><span>10 synthetic records</span></div>${dataTable()}</div></div>`;
}
function entityInspector() {
  const details = selectedEntity === "Session" ? [["Type", "Operation record"], ["Identity", "Session ID"], ["Site relation", "atSite → ChargingSite"], ["Energy field", "energyKWh · decimal"], ["Commercial relation", "produces → ChargingDetailRecord"], ["Valid time", "When the session happened"], ["Recorded time", "When ChargeWeave knew the record"]] : [["Type", selectedEntity === "ChargingSite" ? "Owned asset" : "Domain entity"], ["Identity", "Stable domain ID"], ["Country", selectedEntity === "ChargingSite" ? "NL or BE" : "Scoped by relationship"], ["Relations", "Declared ontology contract"], ["History", "Immutable correction trail"]];
  return `<aside class="data-inspector"><div class="inspector-header"><div><span class="eyebrow">SELECTED ENTITY</span><h2>${esc(selectedEntity)}</h2></div><button class="more-button" type="button" data-action="source-info" aria-label="Entity options">···</button></div><div class="entity-type"><span class="entity-icon">${icon(selectedEntity === "Session" ? "clock" : "data")}</span><span><strong>${selectedEntity === "Session" ? "Operational record" : "Semantic contract"}</strong><small>ChargeWeave ontology</small></span></div><dl class="detail-list">${details.map(([name, value]) => `<div><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl><div class="inspector-callout"><strong>History stays explicit</strong><p>Corrections append a linked record. Valid time and recorded time remain queryable.</p></div><button class="secondary-button full-button" type="button" data-action="source-info">View synthetic source details</button></aside>`;
}
function dataPage() {
  const entities = dataEntities.map((entity) => `<button class="entity-row${selectedEntity === entity.name ? " is-selected" : ""}" type="button" data-entity="${entity.name}"><span class="entity-dot type-${entity.type.toLowerCase()}"></span><span><strong>${entity.name}</strong><small>${entity.type} · ${entity.fields} fields</small></span>${icon("arrow", "entity-arrow")}</button>`).join("");
  const body = dataTab === "Graph" ? graphHtml() : dataTab === "Table" ? dataTable() : queryHtml();
  return `${heading("Data explorer", "Inspect domain records, semantic relationships, and temporal context together.", `<button class="secondary-button" type="button" data-action="export-data">${icon("download")} Export view</button>`)}<div class="data-workspace"><aside class="entity-browser"><div class="entity-browser-heading"><div><span class="eyebrow">MODEL</span><h2>ChargeWeave</h2></div><span class="model-version">v1.2</span></div><label class="entity-search">${icon("search")}<input id="entity-search" type="search" placeholder="Find an entity" /></label><div class="entity-tree">${entities}</div><div class="entity-browser-foot">Ontology-backed · source contracts</div></aside><section class="data-canvas"><div class="data-canvas-toolbar"><div class="view-tabs" role="tablist" aria-label="Data views">${["Graph", "Table", "Query"].map((item) => `<button type="button" role="tab" data-data-view="${item}" aria-selected="${dataTab === item}">${item}</button>`).join("")}</div><div class="temporal-filter"><span>Time context</span><strong>Valid & recorded</strong>${icon("chevron")}</div></div><div class="data-canvas-content">${body}</div><div class="data-canvas-footer"><span>${icon("check")} Model relationships from declared contracts</span><span>Fixture · ${DEMO_SOURCE.seed}</span></div></section>${entityInspector()}</div><div class="workspace-footnote">The explorer displays illustrative records alongside domain contracts. It does not query a live store.</div>`;
}
function page() {
  switch (currentView) {
    case "work": return workPage();
    case "journey": return journeyPage();
    case "operations": return operationsPage();
    case "sites": return sitesPage();
    case "geography": return geographyPage();
    case "sessions": return sessionsPage();
    case "roaming": return roamingPage();
    case "energy": return energyPage();
    case "finance": return financePage();
    case "analytics": return `${heading("Analytics", "Compare owned-network performance using consistent measures, historical facts and reusable views.")}${renderAnalyticsPage(provider, analyticsState)}`;
    case "data": return dataPage();
    default: return overviewPage();
  }
}
function render() {
  destroyNetworkMap();
  currentView = viewFromHash();
  document.documentElement.dataset.theme = theme;
  root.innerHTML = shell();
  root.querySelector("#workspace").innerHTML = page();
  bindDragging();
  filterRows(search);
  if (currentView === "geography") initializeNetworkMap(filterByCountry(ownSites, country), roamingSessions);
}
function filterRows(query) {
  const needle = query.trim().toLowerCase();
  let count = 0;
  root.querySelectorAll("[data-search-row]").forEach((row) => {
    const match = !needle || row.dataset.search.includes(needle);
    row.hidden = !match;
    if (match) count += 1;
  });
  const result = root.querySelector(".result-count");
  if (result && needle) result.textContent = `${count} matching ${count === 1 ? "record" : "records"}`;
}
function exportCsv(kind) {
  const records = kind === "roaming" ? roamingSessions : kind === "sites" ? ownSites : kind === "finance" ? financialLines : kind === "data" ? liveSessions.map((session) => ({ ...session, site: siteName(session.siteId), country: findSite(session.siteId).country, currency: "EUR", validFrom: session.startedAt, recordedAt: "2026-09-26T10:55:00+02:00" })) : liveSessions.map((session) => ({ ...session, currency: "EUR" }));
  const headers = Object.keys(records[0] ?? {});
  const csv = [headers, ...records.map((record) => headers.map((key) => record[key]))].map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `chargeweave-${kind}-demo.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
function showSourceDialog() {
  root.querySelector("#dialog-root").innerHTML = `<div class="dialog-backdrop" data-action="close-dialog"><section class="source-dialog" role="dialog" aria-modal="true" aria-labelledby="source-title"><button type="button" class="dialog-close" data-action="close-dialog" aria-label="Close">${icon("close")}</button><span class="dialog-icon">${icon("energy")}</span><span class="eyebrow">PROTOTYPE DATA BOUNDARY</span><h2 id="source-title">Synthetic demo environment</h2><p>This isolated console renders a deterministic frontend fixture. It does not send requests to charge points, roaming hubs, payment providers, identity systems, or production storage.</p><dl><div><dt>Fixture ID</dt><dd>${DEMO_SOURCE.seed}</dd></div><div><dt>Owned-site scope</dt><dd>Netherlands and Belgium</dd></div><div><dt>Roaming scope</dt><dd>Illustrative Chargecard partner sessions across Europe</dd></div><div><dt>Currency</dt><dd>Euro (EUR)</dd></div></dl><button class="primary-button" type="button" data-action="close-dialog">Understood</button></section></div>`;
}
function movePanel(id, direction) {
  const index = panelOrder.indexOf(id);
  const next = index + (direction === "up" ? -1 : 1);
  if (index < 0 || next < 0 || next >= panelOrder.length) return;
  [panelOrder[index], panelOrder[next]] = [panelOrder[next], panelOrder[index]];
  save("chargeweave-console-panel-order", panelOrder);
  render();
}
function bindDragging() {
  const grid = root.querySelector("#dashboard-grid");
  if (!grid) return;
  grid.addEventListener("dragstart", (event) => {
    const element = event.target.closest("[data-panel]");
    if (!arrange || !element) return event.preventDefault();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", element.dataset.panel);
    element.classList.add("is-dragging");
  });
  grid.addEventListener("dragend", (event) => event.target.closest("[data-panel]")?.classList.remove("is-dragging"));
  grid.addEventListener("dragover", (event) => { if (arrange && event.target.closest("[data-panel]")) event.preventDefault(); });
  grid.addEventListener("drop", (event) => {
    if (!arrange) return;
    const target = event.target.closest("[data-panel]");
    const source = event.dataTransfer.getData("text/plain");
    if (!target || !source || target.dataset.panel === source) return;
    event.preventDefault();
    const from = panelOrder.indexOf(source);
    const to = panelOrder.indexOf(target.dataset.panel);
    if (from < 0 || to < 0) return;
    panelOrder.splice(to, 0, ...panelOrder.splice(from, 1));
    save("chargeweave-console-panel-order", panelOrder);
    render();
  });
}

root.addEventListener("click", (event) => {
  const chart = event.target.closest("[data-analytics-chart]");
  if (chart) { analyticsState.chart = chart.dataset.analyticsChart; render(); return; }
  const drill = event.target.closest("[data-analytics-drill]");
  if (drill) {
    analyticsState[drill.dataset.analyticsDrill] = drill.dataset.key;
    analyticsState.dimension = drill.dataset.analyticsDrill === "country" ? "site" : "month";
    currentView = "analytics"; location.hash = "analytics"; render(); return;
  }
  const cpoScreen = event.target.closest("[data-cpo-screen]");
  if (cpoScreen) {
    const targetScreen = Number(cpoScreen.dataset.cpoScreen);
    if (Number.isInteger(targetScreen) && targetScreen <= cpoDemo.screen) {
      cpoDemo.screen = targetScreen;
      render();
    }
    return;
  }
  const view = event.target.closest("[data-view]");
  if (view) {
    currentView = view.dataset.view;
    if (currentView === "work") selectedWorkItem = false;
    country = "all";
    search = "";
    location.hash = currentView;
    sidebarOpen = false;
    render();
    return;
  }
  const mapScopeButton = event.target.closest("[data-map-scope]");
  if (mapScopeButton) { mapScope = mapScopeButton.dataset.mapScope; country = "all"; networkMapFocus = null; render(); return; }
  const mapSite = event.target.closest("[data-map-site]");
  if (mapSite) {
    selectedMapSite = mapSite.dataset.mapSite;
    networkMapFocus = mapSite.classList.contains("geo-location-row") ? { scope: "owned", id: selectedMapSite } : null;
    render();
    return;
  }
  const mapRoaming = event.target.closest("[data-map-roaming]");
  if (mapRoaming) {
    selectedRoamingLocation = mapRoaming.dataset.mapRoaming;
    networkMapFocus = mapRoaming.classList.contains("geo-location-row") ? { scope: "roaming", id: selectedRoamingLocation } : null;
    render();
    return;
  }
  const countryButton = event.target.closest("[data-country]");
  if (countryButton) {
    country = countryButton.dataset.country;
    if (currentView === "geography" && mapScope === "owned") {
      selectedMapSite = filterByCountry(ownSites, country)[0]?.id;
      networkMapViewport = null;
      networkMapFocus = null;
    }
    render();
    return;
  }
  const session = event.target.closest("[data-session]");
  if (session) { selectedSession = session.dataset.session; render(); return; }
  const entity = event.target.closest("[data-entity]");
  if (entity) { selectedEntity = entity.dataset.entity; render(); return; }
  const tab = event.target.closest("[data-data-view]");
  if (tab) { dataTab = tab.dataset.dataView; render(); return; }
  const action = event.target.closest("[data-action]");
  if (!action) return;
  switch (action.dataset.action) {
    case "open-work-item": selectedWorkItem = true; currentView = "work"; location.hash = "work"; render(); break;
    case "back-to-work": selectedWorkItem = false; render(); break;
    case "reset-work-demo": workRun = makeMeterCorrectionRun(); selectedWorkItem = false; currentView = "work"; render(); break;
    case "theme": theme = theme === "dark" ? "light" : "dark"; save("chargeweave-console-theme", theme); render(); break;
    case "arrange": arrange = !arrange; save("chargeweave-console-arrange", String(arrange)); render(); break;
    case "move-panel": movePanel(action.dataset.panel, action.dataset.direction); break;
    case "source-info": showSourceDialog(); break;
    case "reset-analytics": analyticsState = { ...defaultAnalyticsState }; render(); break;
    case "export-analytics": {
      const result = resolveResult(provider, analyticsState);
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = "chargeweave-analytical-result.json"; link.click(); URL.revokeObjectURL(url); break;
    }
    case "close-dialog": root.querySelector("#dialog-root").innerHTML = ""; break;
    case "toggle-sidebar": sidebarOpen = !sidebarOpen; root.querySelector(".app-frame").classList.toggle("sidebar-open", sidebarOpen); root.querySelector(".mobile-menu")?.setAttribute("aria-expanded", String(sidebarOpen)); root.querySelector(".mobile-menu")?.setAttribute("aria-label", sidebarOpen ? "Close navigation" : "Open navigation"); break;
    case "export-sessions": exportCsv("sessions"); break;
    case "export-finance": exportCsv("finance"); break;
    case "export-data": exportCsv("data"); break;
    case "export-roaming": exportCsv("roaming"); break;
    case "export-sites": exportCsv("sites"); break;
    case "new-site": cpoDemo.screen = 0; currentView = "journey"; location.hash = "journey"; render(); break;
    case "session-note": case "panel-menu": showSourceDialog(); break;
    case "reset-cpo-demo":
      Object.assign(cpoDemo, { screen: 0, site: { name: "Arena parking P2", host: "Arena Parking Services", address: "Burgemeester Stramanweg 130", city: "Amsterdam", country: "NL", spaces: 480, capacityKw: 900, agreement: "SA-ARENA-2026-014" }, installation: { partner: "Northline Charge Installations", workOrder: "WO-AMS-2048", pointCount: 12, hardware: "Alfen Twin 5 Plus", meterId: "NL-MTR-AMS-4481" }, commissioning: false, session: null, invoiceCreated: false });
      render();
      break;
    case "issue-demo-invoice": cpoDemo.invoiceCreated = true; render(); break;
    case "run-query": dataTab = "Table"; render(); break;
    default: break;
  }
});
root.addEventListener("change", (event) => {
  const control = event.target.closest("[data-analytics-field]");
  if (control) {
    analyticsState[control.dataset.analyticsField] = control.value;
    if (control.dataset.analyticsField === "country") analyticsState.site = "all";
    normalizeAnalyticsState(analyticsState); render();
    root.querySelector(`[data-analytics-field="${control.dataset.analyticsField}"]`)?.focus(); return;
  }
  const visible = event.target.closest("[data-pane-visible]");
  if (visible) {
    hiddenPanes = visible.checked ? hiddenPanes.filter((id) => id !== visible.dataset.paneVisible) : [...hiddenPanes, visible.dataset.paneVisible];
    save("chargeweave-console-hidden-panes", hiddenPanes); render();
    const preferences = root.querySelector(".analytics-pane-preferences"); preferences.open = true;
    preferences.querySelector(`[data-pane-visible="${visible.dataset.paneVisible}"]`)?.focus();
  }
});
root.addEventListener("submit", (event) => {
  if (event.target.matches(".analytics-controls")) { event.preventDefault(); return; }
  const taskForm = event.target.closest("[data-work-task]");
  if (taskForm) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(taskForm).entries());
    const meterEnd = Number(values.meterEnd);
    const error = root.querySelector("#work-form-error");
    const reading = taskForm.elements.namedItem("meterEnd");
    if (meterEnd <= meterCorrectionModel.case.meterStart) {
      reading.setCustomValidity("The corrected meter end must be greater than the start reading.");
      reading.reportValidity();
      reading.addEventListener("input", () => reading.setCustomValidity(""), { once: true });
      if (error) { error.hidden = false; error.textContent = "The corrected reading must exceed the accepted start reading."; }
      return;
    }
    if (error) error.hidden = true;
    workRun.values = values;
    workRun.status = "completed";
    workRun.currentStage = "adjustment";
    workRun.outcome = { type: "correction.accepted", amount: rateCorrectedReading(meterEnd).amountEur };
    selectedWorkItem = true;
    render();
    return;
  }
  const form = event.target.closest("[data-cpo-submit]");
  if (!form) return;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  if (form.dataset.cpoSubmit === "site") {
    cpoDemo.site = { ...cpoDemo.site, ...values };
    cpoDemo.commissioning = false;
    cpoDemo.session = null;
    cpoDemo.invoiceCreated = false;
    cpoDemo.screen = 1;
  } else if (form.dataset.cpoSubmit === "installation") {
    cpoDemo.installation = { ...cpoDemo.installation, ...values };
    cpoDemo.commissioning = false;
    cpoDemo.session = null;
    cpoDemo.invoiceCreated = false;
    cpoDemo.screen = 2;
  } else if (form.dataset.cpoSubmit === "commissioning") {
    cpoDemo.commissioning = true;
    cpoDemo.session = null;
    cpoDemo.invoiceCreated = false;
    cpoDemo.screen = 3;
  } else if (form.dataset.cpoSubmit === "session") {
    if (Number(values.meterEnd) <= Number(values.meterStart)) {
      const end = form.elements.namedItem("meterEnd");
      end.setCustomValidity("The final meter reading must be greater than the start reading.");
      end.reportValidity();
      end.addEventListener("input", () => end.setCustomValidity(""), { once: true });
      return;
    }
    cpoDemo.session = values;
    cpoDemo.invoiceCreated = false;
    cpoDemo.screen = 4;
  }
  render();
});
root.addEventListener("input", (event) => {
  if (event.target.id === "global-search") { search = event.target.value; filterRows(search); }
  if (event.target.id === "entity-search") {
    const query = event.target.value.trim().toLowerCase();
    root.querySelectorAll(".entity-row").forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(query); });
  }
});
window.addEventListener("hashchange", () => { currentView = viewFromHash(); search = ""; country = "all"; render(); });
root.addEventListener("keydown", (event) => {
  const marker = event.target.closest?.("[data-map-site], [data-map-roaming]");
  if (!marker || (event.key !== "Enter" && event.key !== " ")) return;
  event.preventDefault();
  marker.click();
});
window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); root.querySelector("#global-search")?.focus(); }
  if (event.key === "Escape") { root.querySelector("#dialog-root").innerHTML = ""; if (sidebarOpen) { sidebarOpen = false; root.querySelector(".app-frame")?.classList.remove("sidebar-open"); } }
});

render();
