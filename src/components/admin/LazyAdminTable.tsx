"use client";

import { useState, useCallback } from "react";
import { AdminCRUDTable } from "./AdminCRUDTable";
import { TableSection } from "../../app/(administration)/admin/AdminTables";
import { ErrorBoundary } from "./ErrorBoundary";

interface LazyAdminTableProps {
  title: string;
  entity: string;
  fields: string[];
  markdownFields?: string[];
  imageFields?: string[];
  searchableFields?: string[];
  isCRUD?: boolean;
  description?: string;
}

export function LazyAdminTable({
  title,
  entity,
  fields,
  markdownFields = [],
  imageFields = [],
  searchableFields = [],
  isCRUD = true,
  description,
}: LazyAdminTableProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isCRUD) {
        // For CRUD tables, we'll let the AdminCRUDTable handle its own data loading
        setIsLoaded(true);
      } else {
        // For read-only tables, fetch the data here
        const response = await fetch(`/api/admin/${entity}?limit=10`);
        if (!response.ok) {
          throw new Error(`Failed to load ${entity} data`);
        }
        const result = await response.json();
        setData(result.items || []);
        setIsLoaded(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${entity}`);
    } finally {
      setIsLoading(false);
    }
  }, [entity, isLoaded, isLoading, isCRUD]);

  const renderContent = () => {
    if (error) {
      return (
        <div className="p-6 text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-red-600 font-medium">Error loading {title}</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoaded(false);
              loadData();
            }}
            className="mt-3 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!isLoaded) {
      return null; // This will show the loading state from CollapsibleSection
    }

    if (isCRUD) {
      return (
        <AdminCRUDTable
          title={title}
          entity={entity}
          fields={fields}
          markdownFields={markdownFields}
          imageFields={imageFields}
          searchableFields={searchableFields}
          initialData={[]} // Let it load its own data
        />
      );
    } else {
      return (
        <div className="p-6">
          <TableSection
            title={title}
            items={data}
            fields={fields}
            markdownFields={markdownFields}
            imageFields={imageFields}
          />
        </div>
      );
    }
  };

  return (
    <ErrorBoundary>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isCRUD && (
                <span className="px-2 py-1 text-xs bg-teal-100 text-teal-800 rounded-full font-medium">
                  Full CRUD
                </span>
              )}
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                {entity}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading {title.toLowerCase()}...</p>
              </div>
            </div>
          )}
          
          {renderContent()}
          
          {!isLoaded && !isLoading && (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">Click to load {title.toLowerCase()}</p>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
              >
                Load {title}
              </button>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
