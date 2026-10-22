/**
 * [SEGURIDAD] Sanitizadores propios del backend.
 *
 * En la demo de Snyk se declara `customCommandSanitizer` como "sanitizer" de
 * Command Injection en Settings > Snyk Code > Rule extensions, para que el
 * motor entienda que la entrada no confiable ya fue saneada antes del sink
 * (por ejemplo `child_process.exec`).
 */

/**
 * Elimina los metacaracteres de shell que permiten encadenar comandos
 * (; & | ` $ ( ) < > \ salto de línea). Mitiga Command Injection.
 */
export function customCommandSanitizer(input: string): string {
  if (!input) return "";
  return input.replace(/[;&|`$()<>\\\n\r]/g, "");
}
