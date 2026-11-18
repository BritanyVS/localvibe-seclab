# Reporte QA · LocalVibe

- Generado: 2026-11-18T20:33:27.543Z
- Org: grupo-cero-uno-zero-tecnologias-s.a-default
- Estado del build: **UNSTABLE**
- Pruebas funcionales: **2/2 OK**
- Hallazgos de seguridad: **12** (Code 2 · Open Source 9 · IaC 1)

> Los tests pasan porque comprueban que la búsqueda muestra el término. Snyk detecta que ese término llega a un `innerHTML`, que hay un secreto en el código y que las dependencias tienen CVEs. **Test verde ≠ aplicación segura.** El gate usa `unstable()`: el build queda en aviso, no fallido.

## 1. Pruebas funcionales

| Resultado | Prueba | Suite | Tiempo |
| --- | --- | --- | --- |
| ✅ PASS | SearchNotice — prueba funcional > muestra el término de búsqueda activo | __tests__/SearchNotice.test.tsx | 0.0862785s |
| ✅ PASS | SearchNotice — prueba funcional > conserva acentos y espacios del término | __tests__/SearchNotice.test.tsx | 0.0101007s |

## 2. Snyk Code

| Severidad | Regla | Dónde | Qué pasa | Por qué el test no lo ve | Corrección |
| --- | --- | --- | --- | --- | --- |
| high | javascript/DOMXSS (CWE-79) | frontend/components/SearchNotice.tsx:11 | Unsanitized input from the document location flows into innerHTML, where it is used to dynamically construct the HTML page on client side. This may result in a DOM Based Cross-Site Scripting attack (DOMXSS). | Los tests comprobaban que el término aparece en pantalla, no que el navegador lo trate como texto. Con un payload en ?q= el test sigue en verde mientras el HTML se ejecuta. | Sustituir innerHTML por textContent en frontend/components/SearchNotice.tsx:11 (o sanitizar con una allowlist) y añadir un test con payload malicioso. |
| high | javascript/HardcodedNonCryptoSecret (CWE-547) | backend/src/routes/concierge.ts:12 | Avoid hardcoding values that are meant to be secret. Found a hardcoded string used in here. | La llamada al concierge funciona usando la clave embebida, así que la prueba funcional no detecta que el secreto vive en el código fuente. | Usar solo OPENAI_API_KEY desde variables de entorno, eliminar la constante y rotar la clave expuesta. |

## 3. Snyk Open Source

### localvibe-backend · `backend/package-lock.json` · 2 únicos · 3 vulnerable dependency paths

| Severidad | ID | Paquete | CVE / CVSS | Ruta | Impacto | Corrección |
| --- | --- | --- | --- | --- | --- | --- |
| high | SNYK-JS-BODYPARSER-21431495 | body-parser@2.3.0 | CVE-2026-111181 / 8.7 | express@5.2.1 → body-parser@2.3.0 | Un cuerpo comprimido con bytes sobrantes provoca una excepción no controlada y puede caer el proceso del backend (denegación de servicio). | Sin ruta directa: revisar express@5.2.1 o aplicar un override de npm |
| high | SNYK-JS-QS-20943482 | qs@6.16.0 | CVE-2026-110816 / 8.2 | express@5.2.1 → qs@6.16.0 | Con arrayFormat: 'comma' y elementos sin toString, el parser lanza TypeError y puede tumbar el proceso; existe PoC público. | Sin ruta directa: revisar express@5.2.1 o aplicar un override de npm |
| high | SNYK-JS-QS-20943482 | qs@6.16.0 | CVE-2026-110816 / 8.2 | express@5.2.1 → body-parser@2.3.0 → qs@6.16.0 | Con arrayFormat: 'comma' y elementos sin toString, el parser lanza TypeError y puede tumbar el proceso; existe PoC público. | Sin ruta directa: revisar body-parser@2.3.0 o aplicar un override de npm |

### localvibe-frontend · `frontend/package-lock.json` · 7 únicos · 7 vulnerable dependency paths

| Severidad | ID | Paquete | CVE / CVSS | Ruta | Impacto | Corrección |
| --- | --- | --- | --- | --- | --- | --- |
| critical | SNYK-JS-NEXT-21460652 | next@16.3.6 | — / 9.5 | next@16.3.6 | El framework arrastra advisories de ejecución remota, deserialización, SSRF y agotamiento de CPU. Afecta al frontend aunque la UI funcione. | Actualizar a next@16.4.1 |
| critical | SNYK-JS-NEXT-21243979 | next@16.3.6 | — / 9.5 | next@16.3.6 | El framework arrastra advisories de ejecución remota, deserialización, SSRF y agotamiento de CPU. Afecta al frontend aunque la UI funcione. | Actualizar a next@16.4.1 |
| critical | SNYK-JS-NEXT-21460650 | next@16.3.6 | — / 9.5 | next@16.3.6 | El framework arrastra advisories de ejecución remota, deserialización, SSRF y agotamiento de CPU. Afecta al frontend aunque la UI funcione. | Actualizar a next@16.4.1 |
| high | SNYK-JS-NEXT-21460651 | next@16.3.6 | CVE-2026-94482 / 8.2 | next@16.3.6 | El framework arrastra advisories de ejecución remota, deserialización, SSRF y agotamiento de CPU. Afecta al frontend aunque la UI funcione. | Actualizar a next@16.4.1 |
| high | SNYK-JS-NEXT-21246253 | next@16.3.6 | — / 8.2 | next@16.3.6 | El framework arrastra advisories de ejecución remota, deserialización, SSRF y agotamiento de CPU. Afecta al frontend aunque la UI funcione. | Actualizar a next@16.4.1 |
| high | SNYK-JS-SEMVER-3247795 | semver@5.7.1 | CVE-2022-25883 / 7.5 | semver@5.7.1 | Un rango de versión manipulado dispara backtracking exponencial (ReDoS) y consume CPU del proceso. | Actualizar a semver@5.7.2 |
| high | SNYK-JS-NEXT-20366781 | next@16.3.6 | CVE-2026-94483 / 8.3 | next@16.3.6 | El framework arrastra advisories de ejecución remota, deserialización, SSRF y agotamiento de CPU. Afecta al frontend aunque la UI funcione. | Actualizar a next@16.3.8 |

## 4. Snyk IaC

| Severidad | ID | Dónde | Impacto | Corrección |
| --- | --- | --- | --- | --- |
| medium | SNYK-CC-TF-1 | iac/main.tf:23 | That potentially everyone can access your resource | Set cidr_block attribute with a more restrictive IP, for example 192.16.0.0/24 |

## 5. Avisos no bloqueantes

- **snyk-oss.json.err:** package-lock.json: Could not find package.json at package.json (lockfile found at package-lock.json) ✗ 1/3 potential projects failed to get dependencies

## Artefactos crudos

- [`frontend/test-results.xml`](../frontend/test-results.xml)
- [`snyk-code.sarif`](../snyk-code.sarif)
- [`snyk-oss.json`](../snyk-oss.json)
- [`snyk-iac.json`](../snyk-iac.json)
