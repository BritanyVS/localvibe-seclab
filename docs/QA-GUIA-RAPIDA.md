# Guía rápida de QA — Reporte de pruebas + seguridad

Este documento existe para que el equipo de pruebas pueda ver, **sin interpretar JSON ni SARIF**, qué está pasando en cada build de `demo-bn-localvibe`.

## 1. Dónde está el reporte

En Jenkins, entra al build y abre **Archivos archivados**:

| Archivo | Para qué sirve |
| --- | --- |
| `reports/qa-report.html` | **El principal.** Se abre con doble clic en el navegador. Sin instalaciones, sin internet. |
| `reports/qa-report.md` | Para pegar en Teams, Confluence o un issue de GitHub. |
| `frontend/test-results.xml` | Resultado crudo de Vitest (JUnit). |
| `snyk-code.sarif`, `snyk-oss.json`, `snyk-iac.json` | Detalle técnico crudo, para desarrollo. |

> Los enlaces a artefactos crudos funcionan dentro del build de Jenkins. En la copia de ejemplo que vive en este repositorio apuntan a los archivos archivados del build.

También se puede generar localmente, sobre los artefactos de un build ya descargado:

```bash
node scripts/generate-qa-report.mjs --input . --output reports/qa-report --status UNSTABLE
```

## 2. Cómo leer el resumen (los 4 números)

- **Pruebas funcionales OK:** `2/2` significa que las dos pruebas de `SearchNotice` pasaron (término visible, acentos y espacios conservados).
- **Hallazgos de seguridad:** total de cosas que Snyk marca. Hoy: **12** = 2 de Code + 9 de Open Source + 1 de IaC.
- **Code · Open Source · IaC:** desglose por tipo de análisis.
- **Avisos no bloqueantes:** problemas de ejecución del escaneo que **no** son vulnerabilidades. Hoy hay uno: el `package-lock.json` de la raíz no tiene `package.json` al lado; el escaneo de backend y frontend sí se hizo.

> ⚠️ **El build está `UNSTABLE`, no `FAILED`.** Es una decisión deliberada del pipeline: usa `unstable()` para que el equipo vea el aviso sin frenar entregas todavía. Los hallazgos `high/critical` (Code y OSS) y `medium` (IaC) son los que disparan el aviso. Si se cambia a `error()`, el build se pondrá rojo.

## 3. Qué mirar en cada sección

1. **Pruebas funcionales:** nombre de cada prueba y resultado. Si aparece `FAIL`, ahí está el detalle del error.
2. **Snyk Code:** cada tarjeta indica `Dónde` (archivo:línea), `Qué pasa`, `Por qué el test no lo ve` y `Cómo corregirlo`.
3. **Snyk Open Source:** por proyecto (`backend`, `frontend`), paquete vulnerable, ruta de dependencia CVE/CVSS y versión correctora.
4. **Snyk IaC:** regla de Terraform, archivo:línea, impacto y cambio sugerido.
5. **Avisos y artefactos:**/logs del escaneo y enlaces a los archivos crudos.

El reporte **no muestra tokens ni secretos**: cualquier valor con forma de clave, JWT o UUID se sustituye por `[REDACTADO]`.

## 4. Por qué los tests están en verde y Snyk en rojo

No es un error del pipeline. Es exactamente lo que queremos demostrar:

- Las pruebas comprueban que `/?q=cafe%20de%20especialidad` **muestra** `Búsqueda activa: cafe de especialidad`.
- Snyk Code detecta que ese mismo parámetro `q` se escribe con `innerHTML` en `frontend/components/SearchNotice.tsx:11`. Con `?q=<img src=x onerror=...>` el texto también "aparece", pero el navegador ejecuta el HTML. El test no distingue un caso del otro.
- Snyk detecta además una clave embebida en `backend/src/routes/concierge.ts:12`. La llamada funciona, así que ningún test falla.
- Snyk Open Source cruza las versiones del lockfile con su base de datos de CVEs. Una versión vulnerable suele funcionar perfectamente: `next@16.3.6`, `semver@5.7.1`, `body-parser@2.3.0` y `qs@6.16.0` están ahí.

**Frase para el equipo:** los tests responden "¿la función hace lo que promete?"; Snyk responde "¿la función hace lo que promete *sin abrir una puerta*?".

## 5. Validación manual (solo en el entorno de demo)

Para ver el DOM XSS con tus propios ojos:

1. Abrir el frontend y navegar a `/?q=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E`.
2. Comprobar que el navegador interpreta el payload como HTML en lugar de mostrarlo como texto.
3. Adjuntar captura al issue.

No hacer esto en producción.

## 6. A quién escalar

| Hallazgo | Dueño | Acción mínima esperada |
| --- | --- | --- |
| DOM XSS (`SearchNotice.tsx`) | Frontend | `innerHTML` → `textContent` y añadir test con payload malicioso. |
| Secreto hardcoded (`concierge.ts`) | Backend | Leer solo desde `OPENAI_API_KEY` y rotar la clave. |
| `next`, `semver` | Frontend | Actualizar a `next@16.4.1` y `semver@5.7.2`. |
| `body-parser`, `qs` | Backend | No hay salto directo: revisar `express@5.2.1` o aplicar `overrides`. |
| IaC `SNYK-CC-TF-1` | Infra | Restringir `cidr_blocks` en `iac/main.tf:28`. |

## 7. Estado actual de este repositorio

Las vulnerabilidades están **reintroducidas a propósito** para la demo: `node:18.12.0-slim`, `semver@5.7.1`, `next@16.3.6`, XSS, secreto hardcoded y reglas de red abiertas. No las "corrijas" sin avisar: forman parte del guion de la demostración.
