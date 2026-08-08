"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, Calendar, Hash, Type, ToggleLeft, ToggleRight } from "lucide-react";
import { FormField } from "./FormField";
import { getFilterFields } from "@/config/entity-config";
import { AdminFilterField } from "@/config/types";

interface ActiveFilter {
  field: string;
  operator: string;
  value: any;
  label: string;
}

interface AdvancedFiltersProps {
  entity: string;
  onFiltersChange: (filters: ActiveFilter[]) => void;
  className?: string;
}

const operatorOptions: Record<AdminFilterField["type"], Array<{ value: string; label: string }>> = {
  text: [
    { value: "contains", label: "Contains" },
    { value: "equals", label: "Equals" },
    { value: "startsWith", label: "Starts with" },
    { value: "endsWith", label: "Ends with" },
  ],
  number: [
    { value: "equals", label: "Equals" },
    { value: "gt", label: "Greater than" },
    { value: "lt", label: "Less than" },
    { value: "gte", label: "Greater than or equal" },
    { value: "lte", label: "Less than or equal" },
  ],
  date: [
    { value: "equals", label: "On" },
    { value: "gt", label: "After" },
    { value: "lt", label: "Before" },
    { value: "gte", label: "On or after" },
    { value: "lte", label: "On or before" },
  ],
  boolean: [
    { value: "equals", label: "Is" },
  ],
  select: [
    { value: "equals", label: "Equals" },
  ],
};

export function AdvancedFilters({ entity, onFiltersChange, className = "" }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newFilter, setNewFilter] = useState({
    field: "",
    operator: "",
    value: "",
  });

  const filterOptions: AdminFilterField[] = useMemo(
    () => getFilterFields(entity),
    [entity],
  );
  const previousFilter = useRef<{ field: string; operator: string; value: any } | null>(null);

  useEffect(() => {
    const isComplete = Boolean(newFilter.field && newFilter.operator && newFilter.value !== "");
    const nextFilter = isComplete
      ? { field: newFilter.field, operator: newFilter.operator, value: newFilter.value }
      : null;

    const filterChanged = Boolean(
      nextFilter?.field !== previousFilter.current?.field ||
      nextFilter?.operator !== previousFilter.current?.operator ||
      nextFilter?.value !== previousFilter.current?.value ||
      (nextFilter === null && previousFilter.current !== null) ||
      (nextFilter !== null && previousFilter.current === null)
    );

    if (!filterChanged) {
      return;
    }

    previousFilter.current = nextFilter;

    if (!isComplete) {
      onFiltersChange([]);
      return;
    }

    const timer = window.setTimeout(() => {
      const fieldOption = filterOptions.find((opt) => opt.field === newFilter.field);
      const label = fieldOption
        ? `${fieldOption.label} ${operatorOptions[fieldOption.type].find((op) => op.value === newFilter.operator)?.label} ${newFilter.value}`
        : `${newFilter.field} ${newFilter.operator} ${newFilter.value}`;

      onFiltersChange([
        {
          field: newFilter.field,
          operator: newFilter.operator,
          value: newFilter.value,
          label,
        },
      ]);
    }, 400);

    return () => clearTimeout(timer);
  }, [newFilter.field, newFilter.operator, newFilter.value, filterOptions, onFiltersChange]);

  const clearAllFilters = () => {
    setNewFilter({ field: "", operator: "", value: "" });
    onFiltersChange([]);
  };

  const selectedFieldOption = filterOptions.find((opt) => opt.field === newFilter.field);
  const availableOperators = selectedFieldOption ? operatorOptions[selectedFieldOption.type] : [];

  const getFieldIcon = (type: string) => {
    switch (type) {
      case "text": return <Type className="h-4 w-4" />;
      case "number": return <Hash className="h-4 w-4" />;
      case "date": return <Calendar className="h-4 w-4" />;
      case "boolean": return newFilter.value ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />;
      default: return <Filter className="h-4 w-4" />;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg text-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="font-extralight text-gray-900">Advanced Filters</span>
          {newFilter.field && newFilter.operator && newFilter.value !== "" && (
            <span className="bg-orange-100 text-orange-800 text-xs font-medium p-1 rounded-full">
              live
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {/* Active Filters */}
      <div className="p-2 border-b border-gray-200 bg-gray-50 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Current Filter</span>
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Clear
          </button>
        </div>
        <div className="text-xs text-gray-600">
          {newFilter.field && newFilter.operator && newFilter.value !== ""
            ? `${filterOptions.find((opt) => opt.field === newFilter.field)?.label || newFilter.field} ${operatorOptions[selectedFieldOption?.type || "text"].find((op) => op.value === newFilter.operator)?.label || newFilter.operator} ${newFilter.value}`
            : "No filter selected yet."}
        </div>
      </div>

      {/* Filter Form */}
      {isOpen && (
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-end">
            <FormField
              label="Field"
              name="field"
              type="select"
              value={newFilter.field}
              onChange={(value) => setNewFilter(prev => ({ ...prev, field: value, operator: "", value: "" }))}
              options={filterOptions.map(opt => ({ value: opt.field, label: opt.label }))}
              className="transition-all duration-200"
            />

            {selectedFieldOption && (
              <FormField
                label="Operator"
                name="operator"
                type="select"
                value={newFilter.operator}
                onChange={(value) => setNewFilter(prev => ({ ...prev, operator: value }))}
                options={availableOperators}
              />
            )}
            {/* Value */}
            <div
              className={`transition-all duration-300 ease-out ${selectedFieldOption && newFilter.operator
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none h-0 overflow-hidden sm:h-auto"
                }`}
            >
              {selectedFieldOption && newFilter.operator && (
                <div className="relative">
                  <FormField
                    label="Value"
                    name="value"
                    type={selectedFieldOption.type === "boolean" ? "select" : selectedFieldOption.type}
                    value={newFilter.value}
                    onChange={(value) => setNewFilter(prev => ({ ...prev, value }))}
                    options={selectedFieldOption.type === "boolean" ? [
                      { value: "true", label: "Yes" },
                      { value: "false", label: "No" }
                    ] : selectedFieldOption.options}
                  />
                </div>
              )}
            </div>

            {/* Helper text */}
            <div className="flex items-center sm:items-end h-full pb-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 p-3">
                <span className="inline-block w-5 h-5 rounded-full bg-blue-500 animate-pulse" />
                <span className="ml-4">Filters apply automatically</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
