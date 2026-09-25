import semver from "semver";

export const APP_VERSION = "1.4.2";
export const CATALOG_MIN_VERSION = "1.0.0";

export function isSupportableVersion(version: string): boolean {
  return semver.valid(version) !== null && semver.gte(version, CATALOG_MIN_VERSION);
}

export function releaseLabel(version: string): string {
  const valid = semver.valid(version);
  return valid ? `v${valid}` : "versión desconocida";
}