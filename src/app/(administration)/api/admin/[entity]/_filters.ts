/**
 * Coerces a raw filter value to the most appropriate type for the given
 * operator so that Prisma receives the right primitive (boolean, number, Date,
 * or string).
 */
export function normalizeFilterValue(rawValue: unknown, operator: string): unknown {
  if (rawValue === "true") return true;
  if (rawValue === "false") return false;

  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    if (trimmed === "") return trimmed;

    if (["gt", "gte", "lt", "lte"].includes(operator)) {
      const dateValue = new Date(trimmed);
      if (!Number.isNaN(dateValue.getTime())) return dateValue;

      const numericValue = Number(trimmed);
      if (!Number.isNaN(numericValue)) return numericValue;
    }

    if (operator === "equals") {
      const numericValue = Number(trimmed);
      if (!Number.isNaN(numericValue)) return numericValue;

      const dateValue = new Date(trimmed);
      if (!Number.isNaN(dateValue.getTime())) return dateValue;
    }
  }

  return rawValue;
}

export interface RawFilter {
  field?: string;
  operator?: string;
  value?: unknown;
}

/**
 * Parses the raw `filters` query-string value and returns an array of Prisma
 * AND conditions ready to spread into a `where` clause.
 *
 * Invalid / malformed filter payloads are silently ignored.
 */
export function buildFilterConditions(
  filtersParam: string | null
): Record<string, unknown>[] {
  if (!filtersParam) return [];

  try {
    const parsedFilters: RawFilter[] = JSON.parse(filtersParam);
    if (!Array.isArray(parsedFilters)) return [];

    const conditions: Record<string, unknown>[] = [];

    for (const filter of parsedFilters) {
      if (
        !filter?.field ||
        !filter?.operator ||
        filter?.value === undefined ||
        filter?.value === ""
      ) {
        continue;
      }

      const normalizedValue = normalizeFilterValue(filter.value, filter.operator);
      const condition: Record<string, unknown> = {};

      switch (filter.operator) {
        case "contains":
          condition[filter.field] = { contains: normalizedValue, mode: "insensitive" };
          break;
        case "startsWith":
          condition[filter.field] = { startsWith: normalizedValue, mode: "insensitive" };
          break;
        case "endsWith":
          condition[filter.field] = { endsWith: normalizedValue, mode: "insensitive" };
          break;
        case "equals":
          condition[filter.field] = normalizedValue;
          break;
        case "gt":
        case "gte":
        case "lt":
        case "lte":
          condition[filter.field] = { [filter.operator]: normalizedValue };
          break;
        default:
          break;
      }

      if (Object.keys(condition).length) {
        conditions.push(condition);
      }
    }

    return conditions;
  } catch {
    // Ignore invalid filter payloads and continue with no filters.
    return [];
  }
}
