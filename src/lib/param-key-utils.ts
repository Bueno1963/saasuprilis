/**
 * Generates a storage key for exam parameters.
 * For params named "Observações" that appear in multiple sections (ERITROGRAMA/LEUCOGRAMA),
 * we use a section-qualified key to avoid collisions.
 */

const QUALIFIED_SECTIONS = ["ERITROGRAMA", "LEUCOGRAMA", "SEDIMENTOSCOPIA"];

export function getParamKey(paramName: string, section?: string): string {
  if (paramName === "Observações" && section && QUALIFIED_SECTIONS.includes(section.toUpperCase())) {
    return `Observações_${section.toUpperCase()}`;
  }
  return paramName;
}

/**
 * Resolves a param value from stored values, trying the qualified key first, then falling back to plain key.
 * This ensures backward compatibility with data stored before the qualified key change.
 */
export function resolveParamValue(paramValues: Record<string, string>, paramName: string, section?: string): string {
  const qualifiedKey = getParamKey(paramName, section);
  if (qualifiedKey !== paramName && paramValues[qualifiedKey] !== undefined) {
    return paramValues[qualifiedKey];
  }
  // Fallback to plain key for backward compatibility (only if qualified key not found)
  if (qualifiedKey !== paramName) {
    return paramValues[paramName] || "";
  }
  return paramValues[paramName] || "";
}
