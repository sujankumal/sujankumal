"use client";

import { useState } from "react";
import { Filter, X, Calendar, Hash, Type, ToggleLeft, ToggleRight } from "lucide-react";
import { FormField } from "./FormField";

interface FilterOption {
  field: string;
  label: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  options?: Array<{ value: string | number; label: string }>;
}

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

const entityFilterOptions: Record<string, FilterOption[]> = {
  post: [
    { field: "published", label: "Published", type: "boolean" },
    { field: "date", label: "Date", type: "date" },
    { field: "authorId", label: "Author ID", type: "number" },
  ],
  user: [
    { field: "verified", label: "Verified", type: "boolean" },
    { field: "createdAt", label: "Created Date", type: "date" },
  ],
  category: [
    { field: "name", label: "Name", type: "text" },
  ],
  project: [
    { field: "title", label: "Title", type: "text" },
  ],
  social: [
    { field: "embed", label: "Embed", type: "boolean" },
    { field: "name", label: "Platform", type: "text" },
  ],
  updates: [
    { field: "date", label: "Date", type: "date" },
  ],
  site: [
    { field: "year", label: "Year", type: "number" },
  ],
  profile: [
    { field: "authorId", label: "Author ID", type: "number" },
  ],
  content: [
    { field: "type", label: "Content Type", type: "text" },
    { field: "sequence", label: "Sequence", type: "number" },
    { field: "postId", label: "Post ID", type: "number" },
  ],
  categoriesOnPosts: [
    { field: "postId", label: "Post ID", type: "number" },
    { field: "categoryId", label: "Category ID", type: "number" },
  ],
};

const operatorOptions = {
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
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [newFilter, setNewFilter] = useState({
    field: "",
    operator: "",
    value: "",
  });

  const filterOptions = entityFilterOptions[entity] || [];

  const addFilter = () => {
    if (!newFilter.field || !newFilter.operator || newFilter.value === "") return;

    const fieldOption = filterOptions.find(opt => opt.field === newFilter.field);
    if (!fieldOption) return;

    const filter: ActiveFilter = {
      field: newFilter.field,
      operator: newFilter.operator,
      value: newFilter.value,
      label: `${fieldOption.label} ${operatorOptions[fieldOption.type].find(op => op.value === newFilter.operator)?.label} ${newFilter.value}`,
    };

    const updatedFilters = [...activeFilters, filter];
    setActiveFilters(updatedFilters);
    onFiltersChange(updatedFilters);

    // Reset form
    setNewFilter({ field: "", operator: "", value: "" });
  };

  const removeFilter = (index: number) => {
    const updatedFilters = activeFilters.filter((_, i) => i !== index);
    setActiveFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    onFiltersChange([]);
  };

  const selectedFieldOption = filterOptions.find(opt => opt.field === newFilter.field);
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
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900">Advanced Filters</span>
          {activeFilters.length > 0 && (
            <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFilters.length}
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
      {activeFilters.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="inline-flex items-center bg-teal-100 text-teal-800 text-sm px-3 py-1 rounded-full"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => removeFilter(index)}
                  className="ml-2 text-teal-600 hover:text-teal-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Form */}
      {isOpen && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              label="Field"
              name="field"
              type="select"
              value={newFilter.field}
              onChange={(value) => setNewFilter(prev => ({ ...prev, field: value, operator: "", value: "" }))}
              options={filterOptions.map(opt => ({ value: opt.field, label: opt.label }))}
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
                >
                  <div className="absolute left-3 top-8 pointer-events-none">
                    {getFieldIcon(selectedFieldOption.type)}
                  </div>
                </FormField>
              </div>
            )}

            <div className="flex items-end">
              <button
                onClick={addFilter}
                disabled={!newFilter.field || !newFilter.operator || newFilter.value === ""}
                className="w-full px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
