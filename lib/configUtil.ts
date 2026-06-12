export const rootDir = process.cwd();

export function envString(name: string, fallback = ""): string {
  const value = process.env[name];
  return value && value.trim().length > 0
    ? value.trim().replaceAll("\\n", "\n")
    : fallback;
}

export function envBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function envList(name: string, fallback: string[]): string[] {
  const value = process.env[name];
  if (!value) return fallback;
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : fallback;
}
