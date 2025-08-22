"use client";

import { useState } from "react";
import { CheckSquare, Square, Trash2, Edit, Download, MoreHorizontal } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

interface BulkActionsProps {
  selectedItems: any[];
  onSelectAll: (selected: boolean) => void;
  onSelectItem: (item: any, selected: boolean) => void;
  onBulkDelete: (items: any[]) => Promise<void>;
  onBulkEdit?: (items: any[]) => void;
  onExport?: (items: any[]) => void;
  totalItems: number;
  entity: string;
  onShowDeleteWarning?: (count: number) => void;
}

export function BulkActions({
  selectedItems,
  onSelectAll,
  onSelectItem,
  onBulkDelete,
  onBulkEdit,
  onExport,
  totalItems,
  entity,
  onShowDeleteWarning,
}: BulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isAllSelected = selectedItems.length === totalItems && totalItems > 0;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < totalItems;

  const handleSelectAll = () => {
    onSelectAll(!isAllSelected);
  };

  const handleBulkDelete = async () => {
    setIsLoading(true);
    try {
      await onBulkDelete(selectedItems);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport(selectedItems);
    } else {
      // Default CSV export
      const csvContent = generateCSV(selectedItems);
      downloadCSV(csvContent, `${entity}-export.csv`);
    }
  };

  const generateCSV = (items: any[]) => {
    if (items.length === 0) return "";

    const headers = Object.keys(items[0]).filter(key => 
      typeof items[0][key] !== "object" || items[0][key] === null
    );
    
    const csvRows = [
      headers.join(","),
      ...items.map(item => 
        headers.map(header => {
          const value = item[header];
          // Escape commas and quotes in CSV
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        }).join(",")
      )
    ];

    return csvRows.join("\n");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (totalItems === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Select All Checkbox */}
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
          >
            {isAllSelected ? (
              <CheckSquare className="h-5 w-5 text-teal-600" />
            ) : isPartiallySelected ? (
              <div className="h-5 w-5 bg-teal-600 rounded border-2 border-teal-600 flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-sm" />
              </div>
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
            <span>
              {selectedItems.length > 0 
                ? `${selectedItems.length} selected`
                : "Select all"
              }
            </span>
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center space-x-2">
            {onBulkEdit && (
              <button
                onClick={() => onBulkEdit(selectedItems)}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit ({selectedItems.length})
              </button>
            )}

            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4 mr-1" />
              Export ({selectedItems.length})
            </button>

            <button
              onClick={() => {
                onShowDeleteWarning?.(selectedItems.length);
                setShowDeleteDialog(true);
              }}
              className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border-2 border-red-300 rounded-md hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="font-semibold">⚠️ Delete ({selectedItems.length})</span>
              {selectedItems.length > 5 && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  BULK
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title={`🚨 Bulk Delete Warning`}
        message={`You are about to permanently delete ${selectedItems.length} ${entity}(s). This is a destructive action that will remove all selected items and their associated data. This action cannot be undone.`}
        confirmText={`Delete ${selectedItems.length} Items`}
        cancelText="Cancel & Keep Safe"
        type="danger"
        isLoading={isLoading}
        requiresTyping={selectedItems.length > 5}
        typeToConfirm="DELETE ALL"
        countdownSeconds={selectedItems.length > 10 ? 5 : selectedItems.length > 5 ? 3 : 0}
        showExtraWarning={true}
      />
    </>
  );
}

interface SelectableRowProps {
  item: any;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  children: React.ReactNode;
}

export function SelectableRow({ item, isSelected, onSelect, children }: SelectableRowProps) {
  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onSelect(!isSelected)}
          className="flex items-center"
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-teal-600" />
          ) : (
            <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </td>
      {children}
    </tr>
  );
}
