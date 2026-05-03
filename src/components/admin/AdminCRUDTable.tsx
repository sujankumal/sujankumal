"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Pagination } from "./Pagination";
import { LoadingSpinner, LoadingOverlay } from "./LoadingSpinner";
import { EntityForm } from "./forms/EntityForm";
import { ToastContainer, useToast } from "./Toast";
import { AdvancedFilters } from "./AdvancedFilters";
import { BulkActions, SelectableRow } from "./BulkActions";
import { useWarningBanner } from "./WarningBanner";

interface AdminCRUDTableProps {
  title: string;
  entity: string;
  fields: string[];
  markdownFields?: string[];
  imageFields?: string[];
  searchableFields?: string[];
  initialData?: any[];
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function AdminCRUDTable({
  title,
  entity,
  fields,
  markdownFields = [],
  imageFields = [],
  searchableFields = [],
  initialData = [],
}: AdminCRUDTableProps) {
  const [items, setItems] = useState<any[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [filters, setFilters] = useState<any[]>([]);

  // Toast notifications
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();

  // Warning banners
  const { showDeleteWarning, WarningBanners } = useWarningBanner();

  // Fetch data
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

      const response = await fetch(`/api/admin/${entity}?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [entity, pagination.page, pagination.limit, searchTerm, sortBy, sortOrder]);

  // Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
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

  const handleCreate = () => {
    setSelectedItem(null);
    setShowCreateModal(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (item: any) => {
    // Show warning banner first
    showDeleteWarning(entity, 1);

    // Show warning toast as well
    showWarning(
      "Confirm Delete",
      `You are about to permanently delete this ${entity}. This action cannot be undone.`
    );

    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(`/api/admin/${entity}?id=${selectedItem.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      await fetchData();
      setShowDeleteDialog(false);
      setSelectedItem(null);
      showSuccess("Item deleted", `${entity} has been successfully deleted.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete item";
      setError(errorMessage);
      showError("Delete failed", errorMessage);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    setFormLoading(true);
    setError(null);

    try {
      const isEdit = !!selectedItem;
      const url = `/api/admin/${entity}`;
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit ? { ...formData, id: selectedItem.id } : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save item");
      }

      await fetchData();
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedItem(null);

      const action = isEdit ? "updated" : "created";
      showSuccess(`Item ${action}`, `${entity} has been successfully ${action}.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save item";
      setError(errorMessage);
      showError("Save failed", errorMessage);
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

  // Bulk operations
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems([...items]);
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (item: any, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, item]);
    } else {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const handleBulkDelete = async (itemsToDelete: any[]) => {
    // Show warning banner for bulk delete
    showDeleteWarning(entity, itemsToDelete.length);

    try {
      await Promise.all(
        itemsToDelete.map(item =>
          fetch(`/api/admin/${entity}?id=${item.id}`, { method: "DELETE" })
        )
      );

      await fetchData();
      setSelectedItems([]);
      showSuccess("Items deleted", `${itemsToDelete.length} ${entity}(s) have been successfully deleted.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete items";
      setError(errorMessage);
      showError("Bulk delete failed", errorMessage);
    }
  };

  const handleFiltersChange = (newFilters: any[]) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const ImageCell = ({ value, field }: { value: string; field: string }) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Validate and format image URL to match your existing pattern
    const formatImageUrl = (url: string): string => {
      if (!url || typeof url !== 'string') return '';

      const trimmedUrl = url.trim();
      if (!trimmedUrl) return '';

      // If it's already an absolute URL, return as is
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl;
      }

      // If it already starts with /images/, return as is
      if (trimmedUrl.startsWith('/images/')) {
        return trimmedUrl;
      }

      // If it starts with /, return as is (for other absolute paths)
      if (trimmedUrl.startsWith('/')) {
        return trimmedUrl;
      }

      // Otherwise, prepend with /images/ to match your existing pattern
      return `/images/${trimmedUrl}`;
    };

    const imageSrc = formatImageUrl(value);

    // If no valid image URL, show placeholder
    if (!imageSrc || imageError) {
      return (
        <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
          <ImageIcon className="h-4 w-4 text-gray-400" />
          {imageError && (
            <span className="sr-only">Failed to load image: {value}</span>
          )}
        </div>
      );
    }

    return (
      <div className="w-16 h-10 relative bg-gray-100 rounded overflow-hidden border border-gray-200">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
          </div>
        )}
        <Image
          src={imageSrc}
          alt={field}
          fill
          className="object-cover"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImageError(true);
            setIsLoading(false);
          }}
          // Remove unoptimized prop to let Next.js handle optimization
          sizes="64px"
        />
      </div>
    );
  };

  const renderCellContent = (item: any, field: string) => {
    const value = item[field];

    if (markdownFields.includes(field) && value) {
      return (
        <div className="max-w-xs prose prose-xs prose-orange max-w-none line-clamp-3">
          <ReactMarkdown>
            {value}
          </ReactMarkdown>
        </div>
      );
    }

    if (imageFields.includes(field) && value && typeof value === "string" && value.trim() !== "") {
      return <ImageCell value={value} field={field} />;
    }

    // Handle foreign key relationships
    if (field.endsWith("Id") && item[field.replace("Id", "")]) {
      const relatedItem = item[field.replace("Id", "")];
      if (relatedItem) {
        const displayName = relatedItem.name || relatedItem.title || relatedItem.email || `ID: ${value}`;
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900">{displayName}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ID: {value}</span>
          </div>
        );
      }
    }

    // Handle special relationship fields
    if (field === "author" && value) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-900">{value.name}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{value.email}</span>
        </div>
      );
    }

    if (field === "post" && value) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-900">{value.title}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ID: {value.id}</span>
        </div>
      );
    }

    if (field === "category" && value) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-900">{value.name}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ID: {value.id}</span>
        </div>
      );
    }

    if (field === "categories" && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 3).map((cat: any, idx: number) => (
            <span key={idx} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
              {cat.category?.name || cat.name}
            </span>
          ))}
          {value.length > 3 && (
            <span className="text-xs text-gray-500">+{value.length - 3} more</span>
          )}
        </div>
      );
    }

    if (typeof value === "boolean") {
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {value ? "Yes" : "No"}
        </span>
      );
    }

    if (value instanceof Date) {
      return new Date(value).toLocaleDateString();
    }

    if (typeof value === "string" && value.length > 50) {
      return (
        <span title={value} className="truncate block max-w-xs">
          {value.substring(0, 50)}...
        </span>
      );
    }

    return String(value ?? "");
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === "asc" ? 
      <ArrowUp className="h-4 w-4 text-orange-600" /> : 
      <ArrowDown className="h-4 w-4 text-orange-600" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
      <LoadingOverlay isLoading={loading} />
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {title}
          </button>
        </div>
        
        {/* Search */}
        <div className="mt-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        entity={entity}
        onFiltersChange={handleFiltersChange}
        className="mx-6 mb-4"
      />

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

      {/* Error Message */}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {/* Bulk select header handled by BulkActions */}
              </th>
              {fields.map((field) => (
                <th
                  key={field}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(field)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{field.replace(/_/g, " ")}</span>
                    {getSortIcon(field)}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, idx) => {
              const isSelected = selectedItems.some(selected => selected.id === item.id);
              return (
                <SelectableRow
                  key={item.id ?? idx}
                  item={item}
                  isSelected={isSelected}
                  onSelect={(selected) => handleSelectItem(item, selected)}
                >
                  {fields.map((field) => (
                    <td key={field} className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      {renderCellContent(item, field)}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                        className="group relative text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all duration-200"
                        title="⚠️ Delete (Permanent Action)"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-75 group-hover:opacity-100"></span>
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
          <p className="text-gray-500">No {title.toLowerCase()} found.</p>
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
      <Modal
        isOpen={showCreateModal}
        onClose={handleFormCancel}
        title={`Create ${title}`}
        size="lg"
      >
        <EntityForm
          entity={entity}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={formLoading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleFormCancel}
        title={`Edit ${title}`}
        size="lg"
      >
        <EntityForm
          entity={entity}
          initialData={selectedItem}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={formLoading}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
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

      {/* Warning Banners */}
      <WarningBanners />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
