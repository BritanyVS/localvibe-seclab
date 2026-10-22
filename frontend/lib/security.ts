/**
 * [SEGURIDAD] Sanitizadores propios de la aplicación.
 *
 * Este módulo es el punto central donde viven los helpers de saneo. En la demo
 * de Snyk se declara `customXssSanitizer` como "sanitizer" en
 * Settings > Snyk Code > Rule extensions, de modo que el motor deje de reportar
 * el flujo source (parámetro de búsqueda) -> sink (innerHTML) como XSS.
 */

/**
 * Escapa los caracteres peligrosos de HTML para poder insertar texto no
 * confiable en el DOM de forma segura (mitiga Cross-site Scripting).
 */
export function customXssSanitizer(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * [SEGURIDAD] Sanitizador de comandos para el backend: elimina los caracteres
 * que permiten encadenar comandos de shell (mitiga Command Injection). Se
 * declara como sanitizer de "Command Injection" en Rule extensions.
 */
export function customCommandSanitizer(input: string): string {
  if (!input) return "";
  return input.replace(/[;&|`$()<>\\\n\r]/g, "");
}
