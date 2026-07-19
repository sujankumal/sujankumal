"use client";

import { useCallback, useState, useEffect, SubmitEvent } from "react";
import {
  Folder,
  Key,
  Edit,
  Trash2,
  Home,
  RefreshCw,
  Plus,
  Copy,
  Lock,
  Unlock,
  Eye,
  Code,
  ChevronRight,
  AlertTriangle,
  FileText,
  X,
  CornerDownRight,
} from "lucide-react";

interface FirebaseDataResponse {
  path: string;
  exists: boolean;
  data: any;
}

export default function FirebaseManager() {
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [dbData, setDbData] = useState<any>(null);
  const [exists, setExists] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Security & Editing Controls (Read-Only by Default)
  const [isReadOnly, setIsReadOnly] = useState<boolean>(true);

  // Path input state
  const [pathInput, setPathInput] = useState<string>("/");

  // View mode: 'tree' or 'raw'
  const [viewMode, setViewMode] = useState<"tree" | "raw">("tree");

  // Raw JSON edit text
  const [rawJsonText, setRawJsonText] = useState<string>("");
  const [isSavingRaw, setIsSavingRaw] = useState<boolean>(false);

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Add node form states
  const [newKey, setNewKey] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");
  const [newValueType, setNewValueType] = useState<"string" | "number" | "boolean" | "object">("string");
  const [isAddingNode, setIsAddingNode] = useState<boolean>(false);

  // Edit node form states
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [editValue, setEditValue] = useState<string>("");
  const [editValueType, setEditValueType] = useState<"string" | "number" | "boolean" | "object">("string");
  const [isEditingNode, setIsEditingNode] = useState<boolean>(false);

  // Double-Action Delete form states
  const [deleteTargetKey, setDeleteTargetKey] = useState<string>("");
  const [deleteCountdown, setDeleteCountdown] = useState<number>(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>("");
  const [isDeletingNode, setIsDeletingNode] = useState<boolean>(false);

  // Quick paths helper
  const quickPaths = [
    { label: "Root (All)", path: "/" },
    { label: "Users Status", path: "/users" },
    { label: "Share Requests", path: "/shareRequests" },
    { label: "Signaling Sessions", path: "/signaling" },
    { label: "Uploads", path: "/uploads" },
  ];

  // Fetch data from Firebase at currentPath
  const fetchData = useCallback(async (path: string = currentPath) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ path });
      const res = await fetch(`/api/admin/firebase?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to load database content");
      }
      const resData: FirebaseDataResponse = await res.json();
      setDbData(resData.data);
      setExists(resData.exists);
      setRawJsonText(resData.data ? JSON.stringify(resData.data, null, 2) : "");
      setCurrentPath(resData.path);
      setPathInput(resData.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Firebase data");
    } finally {
      setIsLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigate to a specific path
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  // Breadcrumbs builder
  const renderBreadcrumbs = () => {
    const parts = currentPath.split("/").filter(Boolean);
    return (
      <div className="flex items-center flex-wrap gap-1 text-sm text-zinc-600 mb-4 bg-zinc-100 p-2.5 rounded-lg border border-zinc-200">
        <button
          onClick={() => handleNavigate("/")}
          className="flex items-center gap-1 hover:text-orange-600 font-semibold transition-colors duration-150"
        >
          <Home className="h-4 w-4" />
          <span>Root</span>
        </button>
        {parts.map((part, index) => {
          const pathUpTo = "/" + parts.slice(0, index + 1).join("/");
          return (
            <div key={pathUpTo} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-zinc-400" />
              <button
                onClick={() => handleNavigate(pathUpTo)}
                className="hover:text-orange-600 transition-colors duration-150 font-medium max-w-[120px] truncate"
                title={part}
              >
                {part}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // Safe delete handler trigger (opens double-action modal)
  const triggerDelete = (key: string) => {
    if (isReadOnly) return;
    setDeleteTargetKey(key);
    setDeleteConfirmText("");
    setDeleteCountdown(3);
    setShowDeleteModal(true);
  };

  // Deletion countdown timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showDeleteModal && deleteCountdown > 0) {
      timer = setTimeout(() => {
        setDeleteCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [showDeleteModal, deleteCountdown]);

  // Execute delete operation
  const executeDelete = async () => {
    if (isReadOnly || deleteCountdown > 0 || deleteConfirmText !== "DELETE") return;
    setIsDeletingNode(true);
    setError(null);
    setSuccessMsg(null);

    const targetPath = currentPath === "/" ? `/${deleteTargetKey}` : `${currentPath}/${deleteTargetKey}`;

    try {
      const params = new URLSearchParams({ path: targetPath });
      const res = await fetch(`/api/admin/firebase?${params.toString()}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete item");
      }

      setSuccessMsg(`Successfully deleted node '${deleteTargetKey}'`);
      setShowDeleteModal(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setIsDeletingNode(false);
    }
  };

  // Safe add node form submission
  const handleAddNodeSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isReadOnly || !newKey.trim()) return;

    setIsAddingNode(true);
    setError(null);
    setSuccessMsg(null);

    const targetPath = currentPath === "/" ? `/${newKey.trim()}` : `${currentPath}/${newKey.trim()}`;

    // Convert value according to selected type
    let parsedValue: any = newValue;
    if (newValueType === "number") {
      parsedValue = Number(newValue);
    } else if (newValueType === "boolean") {
      parsedValue = newValue === "true";
    } else if (newValueType === "object") {
      try {
        parsedValue = JSON.parse(newValue);
      } catch (err) {
        setError("Invalid JSON format for Object type");
        setIsAddingNode(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/admin/firebase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: targetPath, value: parsedValue }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create node");
      }

      setSuccessMsg(`Successfully created node '${newKey.trim()}'`);
      setShowAddModal(false);
      setNewKey("");
      setNewValue("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add node");
    } finally {
      setIsAddingNode(false);
    }
  };

  // Safe edit node trigger
  const triggerEdit = (key: string, value: any) => {
    if (isReadOnly) return;
    setSelectedKey(key);

    let type: "string" | "number" | "boolean" | "object" = "string";
    let valStr = String(value);

    if (typeof value === "number") {
      type = "number";
    } else if (typeof value === "boolean") {
      type = "boolean";
    } else if (typeof value === "object" && value !== null) {
      type = "object";
      valStr = JSON.stringify(value, null, 2);
    }

    setEditValueType(type);
    setEditValue(valStr);
    setShowEditModal(true);
  };

  // Safe edit node form submission
  const handleEditNodeSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isReadOnly) return;

    setIsEditingNode(true);
    setError(null);
    setSuccessMsg(null);

    const targetPath = currentPath === "/" ? `/${selectedKey}` : `${currentPath}/${selectedKey}`;

    let parsedValue: any = editValue;
    if (editValueType === "number") {
      parsedValue = Number(editValue);
    } else if (editValueType === "boolean") {
      parsedValue = editValue === "true";
    } else if (editValueType === "object") {
      try {
        parsedValue = JSON.parse(editValue);
      } catch (err) {
        setError("Invalid JSON format for Object type");
        setIsEditingNode(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/admin/firebase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: targetPath, value: parsedValue }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update node");
      }

      setSuccessMsg(`Successfully updated node '${selectedKey}'`);
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update node");
    } finally {
      setIsEditingNode(false);
    }
  };

  // Edit entire raw JSON submission
  const handleSaveRawJson = async () => {
    if (isReadOnly) return;

    setIsSavingRaw(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(rawJsonText);
      } catch (err) {
        throw new Error("Invalid JSON structure. Please fix formatting issues.");
      }

      const res = await fetch("/api/admin/firebase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: currentPath, value: parsedValue }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to write raw data");
      }

      setSuccessMsg(`Successfully saved raw data at path '${currentPath}'`);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save JSON");
    } finally {
      setIsSavingRaw(false);
    }
  };

  // Helper to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMsg("Copied raw JSON to clipboard");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Helper to determine type and layout in lists
  const renderValueItem = (key: string, value: any) => {
    const isObject = typeof value === "object" && value !== null;
    const valueType = isObject ? "object" : typeof value;

    return (
      <tr key={key} className="hover:bg-zinc-50 border-b border-zinc-150 text-sm transition-colors">
        <td className="px-2 py-1 text-zinc-800">
          <div className="flex items-center gap-2">
            {isObject ? (
              <Folder className="h-4 w-4 text-orange-500 fill-orange-100" />
            ) : (
              <Key className="h-4 w-4 text-zinc-400" />
            )}
            <span className="font-mono text-sm">{key}</span>
          </div>
        </td>
        <td className="px-2 py-1">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${isObject ? "bg-orange-100 text-orange-800" :
            valueType === "boolean" ? "bg-blue-100 text-blue-800" :
              valueType === "number" ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"
            }`}>
            {valueType}
          </span>
        </td>
        <td className="px-2 py-1 max-w-md truncate">
          {isObject ? (
            <button
              onClick={() => handleNavigate(currentPath === "/" ? `/${key}` : `${currentPath}/${key}`)}
              className="text-xs font-semibold text-orange-600 hover:text-orange-800 hover:underline flex items-center gap-1"
            >
              <span>Explore subtree</span>
              <CornerDownRight className="h-3 w-3" />
            </button>
          ) : (
            <span className="font-mono text-xs text-zinc-600">
              {value === null ? "null" : String(value)}
            </span>
          )}
        </td>
        <td className="px-2 py-1 text-right">
          <div className="flex justify-end gap-2">
            {isObject && (
              <button
                onClick={() => handleNavigate(currentPath === "/" ? `/${key}` : `${currentPath}/${key}`)}
                className="p-1 text-zinc-500 hover:bg-zinc-100 rounded"
                title="Enter Folder"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            {!isReadOnly && (
              <>
                {!isObject && (
                  <button
                    onClick={() => triggerEdit(key, value)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit item"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => triggerDelete(key)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Delete item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 font-sans pb-12">
      <div className="mx-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* Header Block */}
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <span>Admin Database Manager</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <h3 className="text-xl font-semibold tracking-normal mt-1 flex items-center gap-2">
              Firebase Realtime Database
            </h3>
          </div>

          <div className="flex justify-end items-center gap-3 text-xs">
            {/* Read-Only Safety Switch */}
            <button
              onClick={() => setIsReadOnly(!isReadOnly)}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-2 py-1 text-xs transition-all duration-300 shadow-sm border ${isReadOnly
                ? "bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800"
                : "bg-orange-500 border-orange-500 text-white hover:bg-orange-600 animate-pulse-subtle"
                }`}
            >
              {isReadOnly ? (
                <>
                  <Lock className="h-3 w-3" />
                  <span>Read-Only Mode</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3 w-3" />
                  <span>Editing Mode Active</span>
                </>
              )}
            </button>

            <a
              href="/admin"
              className="inline-flex w-fit items-center justify-center rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-100 transition-colors"
            >
              Dashboard
            </a>
          </div>
        </header>

        {/* Warning Banner for Write Mode */}
        {!isReadOnly && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-800">Caution: Editing Mode Enabled</h3>
              <p className="text-xs text-amber-700 mt-1">
                Any modifications made here will directly overwrite values in the live Firebase Realtime Database. Double-check your parameters before saving. Deletions are protected by a safety confirmation modal.
              </p>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {(error || successMsg) && (
          <div className={`p-4 rounded-lg text-sm border flex items-center justify-between ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{error ? "Error: " : "Success: "}</span>
              <span>{error || successMsg}</span>
            </div>
            <button onClick={() => { setError(null); setSuccessMsg(null); }} className="text-zinc-400 hover:text-zinc-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Quick Paths & Navigation Form */}
        <section className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start w-full min-w-0">
          <div className="flex flex-col gap-4 min-w-0">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm text-zinc-500 uppercase tracking-wider mb-3">Quick Paths</h2>
              <div className="flex flex-col gap-1">
                {quickPaths.map((qp) => (
                  <button
                    key={qp.path}
                    onClick={() => handleNavigate(qp.path)}
                    className={`text-left px-3 py-2 text-xs rounded transition-colors ${currentPath === qp.path
                      ? "bg-orange-50 text-orange-700"
                      : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex flex-col gap-4 min-w-0 w-full">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleNavigate(pathInput);
                  }}
                  className="relative flex-1 flex items-center"
                >
                  <input
                    type="text"
                    value={pathInput}
                    onChange={(e) => setPathInput(e.target.value)}
                    placeholder="Enter path, e.g. /users"
                    className="h-10 w-full rounded-md border border-zinc-300 pl-3 pr-[60px] text-xs font-mono outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 h-8 px-4 text-xs font-bold bg-zinc-900 text-white rounded hover:bg-zinc-800 transition-colors"
                  >
                    Go
                  </button>
                </form>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => fetchData()}
                  disabled={isLoading}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
                  title="Reload current path"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>

                {!isReadOnly && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-orange-600 text-white px-4 text-sm font-semibold hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Key</span>
                  </button>
                )}
              </div>
            </div>

            {/* Breadcrumbs */}
            {renderBreadcrumbs()}

            {/* Tabs for Tree / Raw */}
            <div className="flex border-b border-zinc-200">
              <button
                onClick={() => setViewMode("tree")}
                className={`py-2.5 px-4 text-sm border-b-2 flex items-center gap-1.5 transition-colors ${viewMode === "tree"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
              >
                <Folder className="h-4 w-4" />
                <span>Tree Browser</span>
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`py-2.5 px-4 text-sm border-b-2 flex items-center gap-1.5 transition-colors ${viewMode === "raw"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
              >
                <Code className="h-4 w-4" />
                <span>Raw JSON View</span>
              </button>
            </div>

            {/* Loading state overlay */}
            <div className="relative rounded-lg border border-zinc-200 bg-white min-h-[300px] overflow-hidden shadow-sm">
              {isLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10 transition-opacity">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-zinc-600">Fetching Realtime Data...</p>
                  </div>
                </div>
              )}

              {/* View Modes */}
              {!isLoading && !exists && (
                <div className="p-12 text-center text-zinc-500">
                  <FileText className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-zinc-700">No Data Exists</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Path <span className="font-mono text-zinc-600 font-bold">{currentPath}</span> returned null or does not exist.
                  </p>
                </div>
              )}

              {!isLoading && exists && viewMode === "tree" && (
                <div>
                  {typeof dbData !== "object" || dbData === null ? (
                    /* Primitive Leaf Data Explorer */
                    <div className="p-8">
                      <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-6 max-w-xl">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Leaf Value</span>
                        <div className="mt-2 font-mono text-lg font-semibold text-zinc-800 break-all bg-white p-3 rounded border border-zinc-200">
                          {String(dbData)}
                        </div>
                        <div className="mt-4 flex gap-2">
                          {!isReadOnly && (
                            <>
                              <button
                                onClick={() => {
                                  const parts = currentPath.split("/");
                                  const key = parts[parts.length - 1] || "";
                                  triggerEdit(key, dbData);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                Edit Value
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              const parts = currentPath.split("/");
                              // Go up one level
                              const parent = "/" + parts.slice(0, -1).filter(Boolean).join("/");
                              handleNavigate(parent);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded hover:bg-zinc-300"
                          >
                            Go Up Parent
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Hierarchical keys list */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase">
                          <tr>
                            <th className="px-4 py-3">Key Name</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Value Preview</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-150">
                          {Object.keys(dbData).map((key) => renderValueItem(key, dbData[key]))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {!isLoading && exists && viewMode === "raw" && (
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Raw representation at {currentPath}</span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(dbData, null, 2))}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-zinc-100 text-zinc-700 px-2.5 py-1.5 rounded border border-zinc-300 hover:bg-zinc-200"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy JSON
                    </button>
                  </div>

                  <textarea
                    value={rawJsonText}
                    onChange={(e) => setRawJsonText(e.target.value)}
                    disabled={isReadOnly}
                    rows={18}
                    className="w-full font-mono text-xs p-4 rounded-lg bg-zinc-950 text-emerald-400 border border-zinc-800 outline-none focus:ring-2 focus:ring-orange-100 disabled:bg-zinc-900 disabled:text-zinc-400 disabled:cursor-not-allowed"
                  />

                  {!isReadOnly && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleSaveRawJson}
                        disabled={isSavingRaw}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                      >
                        {isSavingRaw && <RefreshCw className="h-3 w-3 animate-spin" />}
                        Save Raw JSON
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ADD CHILD NODE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-800">Add Child Node under {currentPath}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddNodeSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Key Name</label>
                <input
                  required
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. isOnline"
                  className="w-full h-10 rounded border border-zinc-300 px-3 text-sm font-mono outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Value Type</label>
                <select
                  value={newValueType}
                  onChange={(e) => {
                    setNewValueType(e.target.value as any);
                    setNewValue("");
                  }}
                  className="w-full h-10 rounded border border-zinc-300 px-2 text-sm outline-none focus:border-orange-500"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="object">JSON Object</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Value</label>
                {newValueType === "boolean" ? (
                  <select
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    required
                    className="w-full h-10 rounded border border-zinc-300 px-2 text-sm outline-none focus:border-orange-500"
                  >
                    <option value="">-- Choose Boolean --</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : newValueType === "object" ? (
                  <textarea
                    required
                    rows={4}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder='{"someKey": "someValue"}'
                    className="w-full font-mono text-xs p-3 rounded border border-zinc-300 outline-none focus:border-orange-500"
                  />
                ) : (
                  <input
                    required
                    type={newValueType === "number" ? "number" : "text"}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Enter value"
                    className="w-full h-10 rounded border border-zinc-300 px-3 text-sm outline-none focus:border-orange-500"
                  />
                )}
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingNode}
                  className="px-4 py-2 text-xs font-semibold bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isAddingNode && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Create Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEAF NODE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-800">Edit Node: {selectedKey}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEditNodeSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Path</label>
                <div className="w-full bg-zinc-100 p-2.5 rounded text-xs font-mono text-zinc-600 break-all select-all">
                  {currentPath === "/" ? `/${selectedKey}` : `${currentPath}/${selectedKey}`}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Value Type</label>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 border border-zinc-300 text-zinc-700 uppercase">
                  {editValueType}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Value</label>
                {editValueType === "boolean" ? (
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    required
                    className="w-full h-10 rounded border border-zinc-300 px-2 text-sm outline-none focus:border-orange-500"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : editValueType === "object" ? (
                  <textarea
                    required
                    rows={6}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full font-mono text-xs p-3 rounded border border-zinc-300 outline-none focus:border-orange-500"
                  />
                ) : (
                  <input
                    required
                    type={editValueType === "number" ? "number" : "text"}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full h-10 rounded border border-zinc-300 px-3 text-sm outline-none focus:border-orange-500"
                  />
                )}
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditingNode}
                  className="px-4 py-2 text-xs font-semibold bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isEditingNode && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOUBLE-ACTION DELETION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity animate-fade-in">
          <div className="bg-white rounded-lg border border-red-200 shadow-xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="font-bold text-sm">Dangerous Deletion Attempt</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-zinc-600">
                You are about to permanently delete the node <span className="font-mono font-bold bg-zinc-100 text-zinc-800 px-1 rounded">{deleteTargetKey}</span> at path:
              </p>

              <div className="w-full bg-zinc-100 p-2.5 rounded text-xs font-mono text-zinc-700 break-all">
                {currentPath === "/" ? `/${deleteTargetKey}` : `${currentPath}/${deleteTargetKey}`}
              </div>

              <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800">
                <strong>Warning:</strong> This deletion bypasses typical checks and removes all child records recursively. Any connected users or active transfers using this signaling metadata may disconnect.
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700">
                  Please type <span className="font-bold font-mono bg-red-100 text-red-700 px-1 rounded">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full h-10 rounded border border-zinc-300 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
                />
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded"
                >
                  Keep Safe
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  disabled={isDeletingNode || deleteCountdown > 0 || deleteConfirmText !== "DELETE"}
                  className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isDeletingNode ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : deleteCountdown > 0 ? (
                    <span>Wait {deleteCountdown}s...</span>
                  ) : (
                    <span>Permanently Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
