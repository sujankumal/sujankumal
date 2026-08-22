"use client";

import { useState, useEffect, useCallback } from "react";
import { adminEntities } from "@/config/entities";

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UseTableDataOptions {
  entity: keyof typeof adminEntities;
}

/**
 * Encapsulates all data-fetching, pagination, sorting, searching and filter
 * state for the AdminCRUDTable. Extracted so the table component stays focused
 * on rendering and event delegation.
 */
export function useTableData({ entity }: UseTableDataOptions) {
  const config = adminEntities[entity];
  const defaultSort = config?.defaultSort ?? { field: "id", order: "desc" };

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState(defaultSort.field);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSort.order);
  const [filters, setFilters] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        sortBy,
        sortOrder,
      });

      if (filters.length > 0) {
        params.set(
          "filters",
          JSON.stringify(filters.map(({ field, operator, value }) => ({ field, operator, value })))
        );
      }

      const response = await fetch(`/api/admin/${entity}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [entity, filters, pagination.page, pagination.limit, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleFiltersChange = useCallback((newFilters: any[]) => {
    setFilters(prevFilters => {
      const isSame =
        prevFilters.length === newFilters.length &&
        prevFilters.every((prevFilter, index) => {
          const nextFilter = newFilters[index];
          return (
            prevFilter.field === nextFilter?.field &&
            prevFilter.operator === nextFilter?.operator &&
            prevFilter.value === nextFilter?.value
          );
        });
      return isSame ? prevFilters : newFilters;
    });
    setPagination(prev => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, []);

  const getSortIcon = (field: string) => ({ isSorted: sortBy === field, sortOrder });

  return {
    items,
    setItems,
    loading,
    error,
    setError,
    searchTerm,
    sortBy,
    sortOrder,
    pagination,
    filters,
    fetchData,
    handleSort,
    handleSearch,
    handlePageChange,
    handleFiltersChange,
    getSortIcon,
  };
}
