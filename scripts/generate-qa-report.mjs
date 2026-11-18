#!/usr/bin/env node
/**
 * Genera un reporte legible para QA a partir de los artefactos de Jenkins:
 *   - frontend/test-results.xml  (Vitest, formato JUnit)
 *   - snyk-code.sarif            (Snyk Code / SAST)
 *   - snyk-oss.json              (Snyk Open Source / SCA, --all-projects)
 *   - snyk-iac.json              (Snyk IaC)
 *   - snyk-*.err                 (avisos no bloqueantes)
 *
 * Uso:
 *   node scripts/generate-qa-report.mjs --input . --output reports/qa-report --status UNSTABLE
 *
 * Cero dependencias: funciona con el Node que ya tiene el pipeline.
 */

import fs from "node:fs";
import path from "node:path";

/* ------------------------------- argv ----------------------------------- */

const argv = process.argv.slice(2);
function opt(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
}

const inputDir = path.resolve(opt("input", "."));
const outputBase = path.resolve(opt("output", "reports/qa-report"));
const buildStatus = opt("status", process.env.BUILD_STATUS || "SIN ESTADO");

/* ------------------------------ helpers --------------------------------- */

const readIfExists = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "");

function safeJson(p, fallback) {
  try {
    const txt = readIfExists(p).trim();
    return txt ? JSON.parse(txt) : fallback;
  } catch {
    return fallback;
  }
}

// Nunca mostramos tokens, JWTs, claves sk-... ni UUIDs en el reporte.
const REDACT = [
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\bsnyk_[A-Za-z0-9_-]{8,}\b/gi,
  /\bsk-[A-Za-z0-9_-]{8,}\b/gi,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  /\b[A-Fa-f0-9]{32,}\b/g,
];
function redact(value = "") {
  let out = String(value);
  for (const re of REDACT) out = out.replace(re, "[REDACTADO]");
  return out;
}

function decodeXml(s = "") {
  return String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&");
}

function cleanText(s = "", max = 260) {
  let t = redact(decodeXml(s))
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/^>\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length > max) t = `${t.slice(0, max - 1).trimEnd()}…`;
  return t;
}

function shortPath(p = "") {
  let s = String(p).replace(/\\/g, "/").replace(/^\.\//, "");
  const marker = "/workspace/";
  const i = s.indexOf(marker);
  if (i >= 0) s = s.slice(i + marker.length);
  return redact(s);
}

function relativize(text = "") {
  let out = String(text);
  for (const d of [inputDir, inputDir.replace(/\\/g, "/")]) {
    out = out.split(d).join(".");
  }
  // Rutas absolutas de otros equipos (logs copiados de otro workspace).
  out = out.replace(/[A-Za-z]:\\[^\r\n]*\\/g, "");
  out = out.replace(/[A-Za-z]:\/[^\r\n]*\//g, "");
  return cleanText(out, 600);
}

const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4, unknown: 5 };
const sortBySeverity = (a, b) =>
  (SEV_RANK[String(a.severity).toLowerCase()] ?? 9) -
  (SEV_RANK[String(b.severity).toLowerCase()] ?? 9);

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const mdCell = (s = "") => String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

/* --------------------------- texto para QA ------------------------------ */

const WHY_CODE = {
  "javascript/DOMXSS":
    "Los tests comprobaban que el término aparece en pantalla, no que el navegador lo trate como texto. Con un payload en ?q= el test sigue en verde mientras el HTML se ejecuta.",
  "javascript/HardcodedNonCryptoSecret":
    "La llamada al concierge funciona usando la clave embebida, así que la prueba funcional no detecta que el secreto vive en el código fuente.",
};
const FIX_CODE = {
  "javascript/DOMXSS":
    "Sustituir innerHTML por textContent en frontend/components/SearchNotice.tsx:11 (o sanitizar con una allowlist) y añadir un test con payload malicioso.",
  "javascript/HardcodedNonCryptoSecret":
    "Usar solo OPENAI_API_KEY desde variables de entorno, eliminar la constante y rotar la clave expuesta.",
};
const IMPACT_OSS = {
  "body-parser":
    "Un cuerpo comprimido con bytes sobrantes provoca una excepción no controlada y puede caer el proceso del backend (denegación de servicio).",
  qs:
    "Con arrayFormat: 'comma' y elementos sin toString, el parser lanza TypeError y puede tumbar el proceso; existe PoC público.",
  next:
    "El framework arrastra advisories de ejecución remota, deserialización, SSRF y agotamiento de CPU. Afecta al frontend aunque la UI funcione.",
  semver:
    "Un rango de versión manipulado dispara backtracking exponencial (ReDoS) y consume CPU del proceso.",
};

/* ------------------------------ parsers --------------------------------- */

function parseTests(xml) {
  const attr = (tag, key) => {
    const m = tag.match(new RegExp(`(?:^|\\s)${key}="([^"]*)"`));
    return m ? decodeXml(m[1]) : "";
  };
  const root = xml.match(/<testsuites\b([^>]*)>/);
  const cases = [];

  for (const suite of xml.matchAll(/<testsuite\b([^>]*)>([\s\S]*?)<\/testsuite>/g)) {
    const suiteName = attr(suite[1], "name");
    const body = suite[2];

    for (const tc of body.matchAll(/<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g)) {
      const tag = tc[1];
      const inner = tc[2];
      const failure = inner.match(/<(?:failure|error)\b[^>]*message="([^"]*)"/i);
      cases.push({
        suite: suiteName,
        name: attr(tag, "name"),
        time: attr(tag, "time"),
        ok: !failure,
        detail: failure ? cleanText(failure[1], 300) : "",
      });
    }
    for (const tc of body.matchAll(/<testcase\b([^>]*)\/>/g)) {
      cases.push({ suite: suiteName, name: attr(tc[1], "name"), time: attr(tc[1], "time"), ok: true, detail: "" });
    }
  }

  const rootAttrs = root ? root[1] : "";
  const passed = cases.filter((c) => c.ok).length;
  return {
    total: Number(attr(rootAttrs, "tests")) || cases.length,
    failures: Number(attr(rootAttrs, "failures")) || cases.filter((c) => !c.ok).length,
    errors: Number(attr(rootAttrs, "errors")) || 0,
    time: attr(rootAttrs, "time"),
    cases,
    passed,
  };
}

function parseOss(json) {
  const projects = Array.isArray(json) ? json : json ? [json] : [];
  return projects.filter(Boolean).map((p) => {
    const upgrade = p.remediation?.upgrade || {};
    const vulns = (p.vulnerabilities || []).map((v) => {
      const mod = v.moduleName || v.name || "paquete";
      const upgradePath = Array.isArray(v.upgradePath)
        ? v.upgradePath.filter((x) => typeof x === "string")
        : [];
      const upgradeKey = Object.keys(upgrade).find((k) => k.toLowerCase().startsWith(`${mod.toLowerCase()}@`));
      const parent = (v.from || []).slice(-2, -1)[0] || "dependencia padre";
      let fix;
      if (v.isUpgradable && upgradePath.length) fix = `Actualizar a ${upgradePath[upgradePath.length - 1]}`;
      else if (upgradeKey) fix = `Actualizar a ${upgrade[upgradeKey].upgradeTo}`;
      else fix = `Sin ruta directa: revisar ${parent} o aplicar un override de npm`;

      return {
        id: v.id || "",
        title: v.title || "",
        module: mod,
        severity: String(v.severityWithCritical || v.severity || "unknown").toLowerCase(),
        version: v.version || "",
        fixedIn: (v.fixedIn || []).join(", "),
        cve: (v.identifiers?.CVE || []).join(", "),
        cvss: v.cvssScore ?? "",
        exploit: v.exploit || "",
        paths: (v.from || []).slice(1).join(" → "),
        impact: IMPACT_OSS[mod.toLowerCase()] || cleanText(v.description, 240),
        fix,
      };
    });

    return {
      project: p.projectName || p.displayTargetFile || "proyecto",
      target: shortPath(p.displayTargetFile || ""),
      org: p.org || p.meta?.org || "",
      ok: p.ok !== false,
      uniqueCount: p.uniqueCount ?? vulns.length,
      summary: p.summary || "",
      vulns: vulns.sort(sortBySeverity),
    };
  });
}

function parseCode(json) {
  const runs = json?.runs || [];
  const rules = new Map();
  for (const r of runs.flatMap((x) => x?.tool?.driver?.rules || [])) rules.set(r.id, r);

  return runs
    .flatMap((x) => x?.results || [])
    .map((r) => {
      const rule = rules.get(r.ruleId) || {};
      const loc = r.locations?.[0]?.physicalLocation || {};
      const level = r.level || "warning";
      return {
        id: r.ruleId || "",
        title: rule.shortDescription?.text || r.message?.text || "Hallazgo de Snyk Code",
        severity: level === "error" ? "high" : level === "warning" ? "medium" : "low",
        level,
        cwe: (rule.properties?.cwe || []).join(", "),
        file: shortPath(loc.artifactLocation?.uri || ""),
        line: loc.region?.startLine ?? "",
        message: cleanText(r.message?.text || "", 320),
        why: WHY_CODE[r.ruleId] || "La prueba funcional no cubre este flujo de datos; Snyk analiza el código, no el resultado esperado.",
        fix: FIX_CODE[r.ruleId] || "Revisar el hallazgo en Snyk y aplicar la corrección recomendada.",
        priority: r.properties?.priorityScore ?? "",
      };
    })
    .sort(sortBySeverity);
}

function parseIac(json) {
  const projects = Array.isArray(json) ? json : json ? [json] : [];
  const issues = projects.flatMap((p) => p?.infrastructureAsCodeIssues || []);
  const target = shortPath(projects[0]?.targetFile || projects[0]?.path || "");
  return issues
    .map((i) => ({
      id: i.id || i.publicId || "",
      title: i.title || "Hallazgo de infraestructura",
      severity: String(i.severity || "info").toLowerCase(),
      file: shortPath(i.targetFile || (typeof i.path === "string" ? i.path : "") || target),
      line: i.lineNumber ?? "",
      message: cleanText(i.issue || i.msg || "", 280),
      impact: cleanText(i.impact || "", 240),
      fix: cleanText(i.resolve || i.remediation?.terraform || "", 240),
      doc: i.documentation || "",
    }))
    .sort(sortBySeverity);
}

function parseWarnings() {
  return fs
    .readdirSync(inputDir)
    .filter((f) => /^snyk-.*\.err$/.test(f))
    .map((f) => ({ file: f, text: relativize(readIfExists(path.join(inputDir, f))) }))
    .filter((w) => w.text.trim());
}

/* ------------------------------- render --------------------------------- */

const CSS = `
:root{--ink:#1a2233;--muted:#5c6b7f;--line:#dfe5ec;--bg:#f5f7fa;--card:#fff;
--ok:#1b7f4b;--critical:#a1122b;--high:#c62828;--medium:#e07b00;--low:#2f7d32;}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
.wrap{max-width:1080px;margin:0 auto;padding:28px 20px 60px}
header h1{margin:0 0 6px;font-size:28px}
.sub{color:var(--muted);margin:0 0 24px}
.badge{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:700;color:#fff;background:#455a64}
.b-critical{background:var(--critical)}.b-high{background:var(--high)}.b-medium{background:var(--medium)}
.b-low{background:var(--low)}.b-info{background:#546e7a}.b-unknown{background:#455a64}
.b-ok{background:var(--ok)}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:0 0 22px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.kpi .n{font-size:30px;font-weight:750;line-height:1.1}
.kpi .l{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.04em;margin-top:4px}
section{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin:0 0 18px}
h2{margin:0 0 12px;font-size:19px}h3{margin:20px 0 10px;font-size:15px;color:var(--muted)}
.callout{border-left:4px solid var(--medium);background:#fffaf0}
.callout p{margin:6px 0}
ul.tests{list-style:none;padding:0;margin:0}
ul.tests li{padding:9px 12px;border:1px solid var(--line);border-radius:8px;margin-bottom:8px;display:flex;gap:10px;align-items:baseline}
ul.tests li.fail{border-color:#f3c2c2;background:#fff5f5}
.test-name{flex:1}.suite{color:var(--muted);font-size:12px}
.item{border:1px solid var(--line);border-left:4px solid var(--line);border-radius:8px;padding:12px 14px;margin:0 0 10px}
.item.critical{border-left-color:var(--critical)}.item.high{border-left-color:var(--high)}
.item.medium{border-left-color:var(--medium)}.item.low{border-left-color:var(--low)}
.item h4{margin:0 0 6px;font-size:15px}
.meta{color:var(--muted);font-size:12px;margin:0 0 8px}
.kv{margin:3px 0}.kv b{display:inline-block;min-width:120px;color:var(--muted);font-weight:600}
code{background:#eef2f6;border-radius:4px;padding:1px 5px;font-size:12px;word-break:break-all}
.warn{background:#fffaf0;border:1px solid #f0dfb8;border-radius:8px;padding:10px 12px;margin:8px 0}
pre{white-space:pre-wrap;word-break:break-word;font-size:12px;color:var(--muted);margin:6px 0 0}
a{color:#145da0}
footer{color:var(--muted);font-size:12px;text-align:center;margin-top:26px}
`;

function badge(sev, label) {
  const cls = `b-${String(sev).toLowerCase().replace(/[^a-z]/g, "") || "unknown"}`;
  return `<span class="badge ${cls}">${esc(label || sev)}</span>`;
}

function renderHtml(d, artifactPrefix) {
  const ossCount = d.oss.reduce((n, p) => n + p.uniqueCount, 0);
  const total = d.code.length + ossCount + d.iac.length;
  const out = [];

  out.push(`<!doctype html><html lang="es"><head><meta charset="utf-8">`);
  out.push(`<meta name="viewport" content="width=device-width,initial-scale=1">`);
  out.push(`<title>Reporte QA · LocalVibe</title><style>${CSS}</style></head><body><div class="wrap">`);
  out.push(`<header><h1>Reporte QA · LocalVibe</h1>`);
  out.push(`<p class="sub">Generado: ${esc(d.generado)} · Org: ${esc(d.org || "—")} · Estado del build: ${badge(d.status)}</p></header>`);

  out.push(`<div class="kpis">`);
  out.push(`<div class="kpi"><div class="n" style="color:var(--ok)">${d.tests.passed}/${d.tests.total}</div><div class="l">Pruebas funcionales OK</div></div>`);
  out.push(`<div class="kpi"><div class="n" style="color:var(--critical)">${total}</div><div class="l">Hallazgos de seguridad</div></div>`);
  out.push(`<div class="kpi"><div class="n">${d.code.length} · ${ossCount} · ${d.iac.length}</div><div class="l">Code · Open Source · IaC</div></div>`);
  out.push(`<div class="kpi"><div class="n">${d.warnings.length}</div><div class="l">Avisos no bloqueantes</div></div>`);
  out.push(`</div>`);

  out.push(`<section class="callout"><h2>Cómo leer este reporte</h2>`);
  out.push(`<p><b>Las pruebas funcionales pasan y Snyk marca hallazgos; no es una contradicción.</b></p>`);
  out.push(`<p>Los tests verifican que la búsqueda muestra el término. Snyk verifica que ese mismo término llega a un <code>innerHTML</code>, que hay secretos en el código y que las versiones instaladas tienen CVEs conocidos. Un test en verde confirma que la función hace lo que promete, no que sea segura.</p>`);
  out.push(`<p>El gate del pipeline usa <code>unstable()</code> como modo de transición: el build queda <b>UNSTABLE</b> (aviso visible) en lugar de fallar. Los hallazgos con severidad <b>high/critical</b> en Code y OSS, y <b>medium</b> en IaC, son los que disparan el aviso.</p></section>`);

  out.push(`<section><h2>1. Pruebas funcionales (QA)</h2>`);
  if (!d.tests.cases.length) out.push(`<p class="sub">No se encontró <code>frontend/test-results.xml</code>.</p>`);
  out.push(`<ul class="tests">`);
  for (const c of d.tests.cases) {
    out.push(`<li class="${c.ok ? "" : "fail"}">${c.ok ? badge("ok", "PASS") : badge("high", "FAIL")}`);
    out.push(`<span class="test-name">${esc(c.name)}</span><span class="suite">${esc(c.suite)} · ${esc(c.time)}s</span></li>`);
    if (c.detail) out.push(`<pre>${esc(c.detail)}</pre>`);
  }
  out.push(`</ul></section>`);

  out.push(`<section><h2>2. Snyk Code — hallazgos en el código</h2>`);
  if (!d.code.length) out.push(`<p class="sub">Sin hallazgos de Snyk Code.</p>`);
  for (const i of d.code) {
    out.push(`<div class="item ${esc(i.severity)}">`);
    out.push(`<h4>${badge(i.severity)} ${esc(i.title)}</h4>`);
    out.push(`<p class="meta">${esc(i.id)} · ${esc(i.cwe || "sin CWE")} · prioridad ${esc(i.priority || "—")} · nivel Snyk: ${esc(i.level)}</p>`);
    out.push(`<p class="kv"><b>Dónde</b> <code>${esc(i.file)}${i.line ? `:${i.line}` : ""}</code></p>`);
    out.push(`<p class="kv"><b>Qué pasa</b> ${esc(i.message)}</p>`);
    out.push(`<p class="kv"><b>Por qué el test no lo ve</b> ${esc(i.why)}</p>`);
    out.push(`<p class="kv"><b>Cómo corregirlo</b> ${esc(i.fix)}</p></div>`);
  }
  out.push(`</section>`);

  out.push(`<section><h2>3. Snyk Open Source — dependencias</h2>`);
  for (const p of d.oss) {
    out.push(`<h3>${esc(p.project)} · <code>${esc(p.target)}</code> · ${p.uniqueCount} únicos · ${esc(p.summary)}</h3>`);
    if (!p.vulns.length) out.push(`<p class="sub">Sin vulnerabilidades en este proyecto.</p>`);
    for (const v of p.vulns) {
      out.push(`<div class="item ${esc(v.severity)}">`);
      out.push(`<h4>${badge(v.severity)} ${esc(v.title)}</h4>`);
      out.push(`<p class="meta">${esc(v.id)} · ${esc(v.module)}@${esc(v.version)} · ${esc(v.cve || "sin CVE")} · CVSS ${esc(v.cvss || "—")} · exploit: ${esc(v.exploit)}</p>`);
      out.push(`<p class="kv"><b>Ruta</b> <code>${esc(v.paths)}</code></p>`);
      out.push(`<p class="kv"><b>Impacto</b> ${esc(v.impact)}</p>`);
      out.push(`<p class="kv"><b>Corrección</b> ${esc(v.fix)}${v.fixedIn ? ` (versiones fijas: ${esc(v.fixedIn)})` : ""}</p></div>`);
    }
  }
  out.push(`</section>`);

  out.push(`<section><h2>4. Snyk IaC — infraestructura</h2>`);
  if (!d.iac.length) out.push(`<p class="sub">Sin hallazgos de infraestructura.</p>`);
  for (const i of d.iac) {
    out.push(`<div class="item ${esc(i.severity)}">`);
    out.push(`<h4>${badge(i.severity)} ${esc(i.title)}</h4>`);
    out.push(`<p class="meta">${esc(i.id)} · <code>${esc(i.file)}${i.line ? `:${i.line}` : ""}</code></p>`);
    out.push(`<p class="kv"><b>Qué pasa</b> ${esc(i.message)}</p>`);
    out.push(`<p class="kv"><b>Impacto</b> ${esc(i.impact)}</p>`);
    out.push(`<p class="kv"><b>Corrección</b> ${esc(i.fix)}</p></div>`);
  }
  out.push(`</section>`);

  out.push(`<section><h2>5. Avisos y artefactos</h2>`);
  for (const w of d.warnings) {
    out.push(`<div class="warn"><b>${esc(w.file)}</b> (no bloquea el build)<pre>${esc(w.text)}</pre></div>`);
  }
  out.push(`<p>Detalle completo, por si necesitas profundizar:</p><ul>`);
  for (const f of ["frontend/test-results.xml", "snyk-code.sarif", "snyk-oss.json", "snyk-iac.json"]) {
    out.push(`<li><a href="${esc(artifactPrefix)}/${esc(f)}">${esc(f)}</a></li>`);
  }
  out.push(`</ul></section>`);
  out.push(`<footer>Reporte generado automáticamente por <code>scripts/generate-qa-report.mjs</code>. No incluye tokens ni secretos.</footer>`);
  out.push(`</div></body></html>`);
  return out.join("\n");
}

function renderMarkdown(d, artifactPrefix) {
  const ossCount = d.oss.reduce((n, p) => n + p.uniqueCount, 0);
  const total = d.code.length + ossCount + d.iac.length;
  const L = [];

  L.push(`# Reporte QA · LocalVibe`);
  L.push(``);
  L.push(`- Generado: ${d.generado}`);
  L.push(`- Org: ${d.org || "—"}`);
  L.push(`- Estado del build: **${d.status}**`);
  L.push(`- Pruebas funcionales: **${d.tests.passed}/${d.tests.total} OK**`);
  L.push(`- Hallazgos de seguridad: **${total}** (Code ${d.code.length} · Open Source ${ossCount} · IaC ${d.iac.length})`);
  L.push(``);
  L.push(`> Los tests pasan porque comprueban que la búsqueda muestra el término. Snyk detecta que ese término llega a un \`innerHTML\`, que hay un secreto en el código y que las dependencias tienen CVEs. **Test verde ≠ aplicación segura.** El gate usa \`unstable()\`: el build queda en aviso, no fallido.`);
  L.push(``);

  L.push(`## 1. Pruebas funcionales`);
  L.push(``);
  L.push(`| Resultado | Prueba | Suite | Tiempo |`);
  L.push(`| --- | --- | --- | --- |`);
  for (const c of d.tests.cases) {
    L.push(`| ${c.ok ? "✅ PASS" : "❌ FAIL"} | ${mdCell(c.name)} | ${mdCell(c.suite)} | ${c.time}s |`);
  }
  L.push(``);

  L.push(`## 2. Snyk Code`);
  L.push(``);
  L.push(`| Severidad | Regla | Dónde | Qué pasa | Por qué el test no lo ve | Corrección |`);
  L.push(`| --- | --- | --- | --- | --- | --- |`);
  for (const i of d.code) {
    L.push(`| ${mdCell(i.severity)} | ${mdCell(`${i.id} (${i.cwe || "sin CWE"})`)} | ${mdCell(`${i.file}:${i.line}`)} | ${mdCell(i.message)} | ${mdCell(i.why)} | ${mdCell(i.fix)} |`);
  }
  L.push(``);

  L.push(`## 3. Snyk Open Source`);
  L.push(``);
  for (const p of d.oss) {
    L.push(`### ${p.project} · \`${p.target}\` · ${p.uniqueCount} únicos · ${p.summary}`);
    L.push(``);
    L.push(`| Severidad | ID | Paquete | CVE / CVSS | Ruta | Impacto | Corrección |`);
    L.push(`| --- | --- | --- | --- | --- | --- | --- |`);
    for (const v of p.vulns) {
      L.push(`| ${mdCell(v.severity)} | ${mdCell(v.id)} | ${mdCell(`${v.module}@${v.version}`)} | ${mdCell(`${v.cve || "—"} / ${v.cvss || "—"}`)} | ${mdCell(v.paths)} | ${mdCell(v.impact)} | ${mdCell(v.fix)} |`);
    }
    L.push(``);
  }

  L.push(`## 4. Snyk IaC`);
  L.push(``);
  L.push(`| Severidad | ID | Dónde | Impacto | Corrección |`);
  L.push(`| --- | --- | --- | --- | --- |`);
  for (const i of d.iac) {
    L.push(`| ${mdCell(i.severity)} | ${mdCell(i.id)} | ${mdCell(`${i.file}:${i.line}`)} | ${mdCell(i.impact)} | ${mdCell(i.fix)} |`);
  }
  L.push(``);

  if (d.warnings.length) {
    L.push(`## 5. Avisos no bloqueantes`);
    L.push(``);
    for (const w of d.warnings) {
      L.push(`- **${w.file}:** ${mdCell(w.text)}`);
    }
    L.push(``);
  }

  L.push(`## Artefactos crudos`);
  L.push(``);
  for (const f of ["frontend/test-results.xml", "snyk-code.sarif", "snyk-oss.json", "snyk-iac.json"]) {
    L.push(`- [\`${f}\`](${artifactPrefix}/${f})`);
  }
  L.push(``);
  return L.join("\n");
}

/* -------------------------------- main ---------------------------------- */

const junitPath =
  (fs.existsSync(path.join(inputDir, "frontend/test-results.xml")) &&
    path.join(inputDir, "frontend/test-results.xml")) ||
  path.join(inputDir, "test-results.xml");

const oss = parseOss(safeJson(path.join(inputDir, "snyk-oss.json"), []));
const code = parseCode(safeJson(path.join(inputDir, "snyk-code.sarif"), {}));
const iac = parseIac(safeJson(path.join(inputDir, "snyk-iac.json"), {}));

const org =
  oss.find((p) => p.vulns.length)?.org ||
  safeJson(path.join(inputDir, "snyk-iac.json"), {})?.meta?.org ||
  safeJson(path.join(inputDir, "snyk-iac.json"), {})?.org ||
  "";

const data = {
  generado: new Date().toISOString(),
  status: buildStatus,
  org,
  tests: parseTests(readIfExists(junitPath)),
  code,
  oss,
  iac,
  warnings: parseWarnings(),
};

fs.mkdirSync(path.dirname(outputBase), { recursive: true });
const htmlPath = `${outputBase}.html`;
const mdPath = `${outputBase}.md`;
const htmlOutDir = path.dirname(htmlPath);
const artifactPrefix = path.relative(htmlOutDir, inputDir).split(path.sep).join("/") || ".";

fs.writeFileSync(htmlPath, renderHtml(data, artifactPrefix), "utf8");
fs.writeFileSync(mdPath, renderMarkdown(data, artifactPrefix), "utf8");

const ossCount = data.oss.reduce((n, p) => n + p.uniqueCount, 0);
console.log(
  `[QA] Pruebas ${data.tests.passed}/${data.tests.total} OK | ` +
    `Hallazgos: Code ${code.length}, Open Source ${ossCount}, IaC ${iac.length} | ` +
    `Estado: ${buildStatus}`
);
console.log(`[QA] Reporte HTML: ${htmlPath}`);
console.log(`[QA] Reporte Markdown: ${mdPath}`);
