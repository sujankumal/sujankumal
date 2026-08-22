"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Pagination } from "./Pagination";
import { LoadingOverlay } from "./LoadingSpinner";
import { EntityForm } from "./forms/EntityForm";
import { ToastContainer, useToast } from "./Toast";
import { AdvancedFilters } from "./AdvancedFilters";
import { BulkActions, SelectableRow } from "./BulkActions";
import { useWarningBanner } from "./WarningBanner";
import { adminEntities } from "@/config/entities";
import { renderCellContent } from "./table/renderCellContent";
import { useTableData } from "./table/useTableData";

interface AdminCRUDTableProps {
  entity: keyof typeof adminEntities;
  initialData?: any[];
}

export function AdminCRUDTable({ entity, initialData = [] }: AdminCRUDTableProps) {
  const config = adminEntities[entity];

  if (!config) {
    throw new Error(`No admin configuration found for entity "${entity}"`);
  }

  // ── Data / fetch / sort / filter state (extracted hook) ───────────────────
  const {
    items,
    loading,
    error,
    setError,
    searchTerm,
    sortBy,
    sortOrder,
    pagination,
    fetchData,
    handleSort,
    handleSearch,
    handlePageChange,
    handleFiltersChange,
  } = useTableData({ entity });

  // ── Modal states ──────────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // ── Toast / warning banners ───────────────────────────────────────────────
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { showDeleteWarning, WarningBanners } = useWarningBanner();

  // ── Sort icon helper ──────────────────────────────────────────────────────
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortOrder === "asc"
      ? <ArrowUp className="h-4 w-4 text-orange-600" />
      : <ArrowDown className="h-4 w-4 text-orange-600" />;
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleCreate = () => { setSelectedItem(null); setShowCreateModal(true); };
  const handleEdit = (item: any) => { setSelectedItem(item); setShowEditModal(true); };

  const handleDelete = (item: any) => {
    showDeleteWarning(entity, 1);
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      const response = await fetch(`/api/admin/${entity}?id=${selectedItem.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to delete item. ${response.statusText}`);
      await fetchData();
      setShowDeleteDialog(false);
      setSelectedItem(null);
      showSuccess("Item deleted", `${entity} has been successfully deleted.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to delete item: ${err}`;
      setError(msg);
      showError("Delete failed", msg);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    setFormLoading(true);
    setError(null);
    try {
      const isEdit = !!selectedItem;
      const body = isEdit ? { ...selectedItem, ...formData } : formData;
      const response = await fetch(`/api/admin/${entity}`, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.fields) return result.fields;
        throw new Error(result.error);
      }
      await fetchData();
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedItem(null);
      const action = isEdit ? "updated" : "created";
      showSuccess(`Item ${action}`, `${entity} has been successfully ${action}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save item";
      setError(msg);
      showError("Save failed", msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedItem(null);
    setError(null);
  };

  // ── Bulk operations ───────────────────────────────────────────────────────
  const handleSelectAll = (selected: boolean) => {
    setSelectedItems(selected ? [...items] : []);
  };

  const handleSelectItem = (item: any, selected: boolean) => {
    setSelectedItems(prev => selected ? [...prev, item] : prev.filter(i => i.id !== item.id));
  };

  const handleBulkDelete = async (itemsToDelete: any[]) => {
    showDeleteWarning(entity, itemsToDelete.length);
    try {
      await Promise.all(
        itemsToDelete.map(item => fetch(`/api/admin/${entity}?id=${item.id}`, { method: "DELETE" }))
      );
      await fetchData();
      setSelectedItems([]);
      showSuccess("Items deleted", `${itemsToDelete.length} ${entity}(s) have been successfully deleted.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete items";
      setError(msg);
      showError("Bulk delete failed", msg);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
      <LoadingOverlay isLoading={loading} />

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">{config.title}</h2>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-2 py-1 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {config.title}
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={`Search ${config.title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full text-xs pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters entity={entity} onFiltersChange={handleFiltersChange} className="mx-6 my-2" />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedItems}
        onSelectAll={handleSelectAll}
        onSelectItem={handleSelectItem}
        onBulkDelete={handleBulkDelete}
        totalItems={items.length}
        entity={entity}
        onShowDeleteWarning={(count) => showDeleteWarning(entity, count)}
      />

      {/* Error */}
      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {/* Bulk select header handled by BulkActions */}
              </th>
              {config.columns.map((column) => (
                <th
                  key={column.field}
                  className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.field)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {getSortIcon(column.field)}
                  </div>
                </th>
              ))}
              <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, idx) => {
              const rowKey = config.primaryKey ?? "id";
              const isSelected = selectedItems.some(s => s[rowKey] === item[rowKey]);
              return (
                <SelectableRow
                  key={item[rowKey] ?? idx}
                  item={item}
                  isSelected={isSelected}
                  onSelect={(selected) => handleSelectItem(item, selected)}
                >
                  {config.columns.map((column) => (
                    <td key={`${item[rowKey]}-${column.field}`} className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                      {renderCellContent(item, column)}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="group relative text-red-600 hover:text-red-900 rounded-md hover:bg-red-50 transition-all duration-200"
                        title="⚠️ Delete (Permanent Action)"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-65 group-hover:opacity-100"></span>
                      </button>
                    </div>
                  </td>
                </SelectableRow>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No {config.title.toLowerCase()} found.</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={handlePageChange}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={handleFormCancel} title={`Create ${config.title}`} size="lg">
        <EntityForm entity={entity} onSubmit={handleFormSubmit} onCancel={handleFormCancel} isLoading={formLoading} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={handleFormCancel} title={`Edit ${config.title}`} size="lg">
        <EntityForm entity={entity} initialData={selectedItem} onSubmit={handleFormSubmit} onCancel={handleFormCancel} isLoading={formLoading} />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="⚠️ Confirm Deletion"
        message={`You are about to permanently delete this ${entity}. This action cannot be undone and will remove all associated data.`}
        confirmText="Delete Permanently"
        cancelText="Keep Safe"
        type="danger"
        requiresTyping={true}
        typeToConfirm="DELETE"
        countdownSeconds={3}
        showExtraWarning={true}
      />

      <WarningBanners />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
