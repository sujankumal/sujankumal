"use client";

import { useState } from 'react';
import { useP2P } from '../../contexts/P2PContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaExchangeAlt, FaDownload, FaUpload, FaCheck, FaTimes, FaClock,
  FaPause, FaPlay, FaRedo, FaBan, FaTrash, FaChevronDown, FaChevronUp,
  FaExclamationTriangle, FaShieldAlt, FaSpinner,
} from 'react-icons/fa';

export function FileTransfers() {
  const { fileTransfers, overallProgress, pauseTransfer, resumeTransfer, cancelTransfer, retryTransfer, clearHistory } = useP2P();
  const { user } = useAuth();
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const formatETA = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s left`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m left`;
    return `${Math.round(seconds / 3600)}h left`;
  };

  const toggleError = (id: string) => {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isSender = (transfer: ReturnType<typeof useP2P>['fileTransfers'][0]) =>
    transfer.senderId === user?.uid;

  if (fileTransfers.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          <FaExchangeAlt className="text-indigo-400 text-3xl" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No transfers yet</h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Your file transfer history will appear here. Send or receive files to get started.
        </p>
      </div>
    );
  }

  const activeTransfers = fileTransfers.filter(t => t.status === 'transferring' || t.status === 'preparing' || t.status === 'finalizing' || t.status === 'paused');
  const historyTransfers = fileTransfers.filter(t => t.status !== 'transferring' && t.status !== 'preparing' && t.status !== 'finalizing' && t.status !== 'paused');

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8 overflow-hidden">

      {/* ── Overall Progress Banner ─────────────────────────────────────────── */}
      {overallProgress.total > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h3 className="text-base font-bold text-indigo-900 flex items-center gap-2">
                <FaShieldAlt className="text-indigo-500" />
                Overall Progress
              </h3>
              <p className="text-xs text-indigo-600 mt-0.5">
                {overallProgress.remaining > 0
                  ? `${overallProgress.remaining} file${overallProgress.remaining !== 1 ? 's' : ''} remaining`
                  : 'All transfers complete'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-center text-xs">
              {overallProgress.active > 0 && (
                <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
                  <FaSpinner className="animate-spin text-xs" />
                  {overallProgress.active} active
                </div>
              )}
              {overallProgress.paused > 0 && (
                <div className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl font-semibold">
                  {overallProgress.paused} paused
                </div>
              )}
              {overallProgress.completed > 0 && (
                <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-xl font-semibold">
                  {overallProgress.completed} done
                </div>
              )}
              {overallProgress.failed > 0 && (
                <div className="bg-red-100 text-red-700 px-3 py-1.5 rounded-xl font-semibold">
                  {overallProgress.failed} failed
                </div>
              )}
            </div>
          </div>
          <div className="w-full bg-indigo-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${overallProgress.overallPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-xs text-indigo-500 font-medium">
            <span>{formatFileSize(overallProgress.transferredBytes)} / {formatFileSize(overallProgress.totalBytes)}</span>
            <span>{Math.round(overallProgress.overallPercent)}%</span>
          </div>
        </div>
      )}

      {/* ── Active / Paused / Preparing Transfers ─────────────────────────── */}
      {activeTransfers.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            In Progress — {activeTransfers.length} file{activeTransfers.length !== 1 ? 's' : ''}
          </h3>
          <div className="space-y-4">
            {activeTransfers.map((transfer) => {
              const sender = isSender(transfer);
              const isPaused = transfer.status === 'paused';
              const isPreparing = transfer.status === 'preparing';
              const isFinalizing = transfer.status === 'finalizing';

              return (
                <div
                  key={transfer.id}
                  className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ${isPreparing
                    ? 'bg-indigo-50 border-indigo-200'
                    : isFinalizing
                      ? 'bg-violet-50 border-violet-200'
                      : isPaused
                        ? 'bg-amber-50 border-amber-200'
                        : sender
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-emerald-50 border-emerald-200'
                    }`}
                >
                  {/* Header row */}
                  <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {isPreparing || isFinalizing ? (
                        <FaSpinner className="text-indigo-600 text-base animate-spin flex-shrink-0" />
                      ) : (
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isPaused ? 'bg-amber-400' : sender ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                          }`} />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate max-w-[calc(100vw-120px)] sm:max-w-xs">
                          {transfer.fileName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {sender
                            ? `📤 Sending to ${transfer.receiverName}`
                            : `📥 Receiving from ${transfer.senderName}`}
                        </p>
                      </div>
                    </div>

                    {/* Controls — only for sender */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-shrink-0">
                      {sender && (
                        <>
                          {isPaused ? (
                            <button
                              onClick={() => resumeTransfer(transfer.id)}
                              title="Resume"
                              className="p-2 rounded-xl bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                            >
                              <FaPlay className="text-xs" />
                            </button>
                          ) : (
                            <button
                              onClick={() => pauseTransfer(transfer.id)}
                              title="Pause"
                              disabled={isPreparing}
                              className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 disabled:opacity-50 transition-colors"
                            >
                              <FaPause className="text-xs" />
                            </button>
                          )}

                          {cancelConfirm === transfer.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { cancelTransfer(transfer.id); setCancelConfirm(null); }}
                                className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setCancelConfirm(null)}
                                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCancelConfirm(transfer.id)}
                              title="Cancel"
                              className="p-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                            >
                              <FaBan className="text-xs" />
                            </button>
                          )}
                        </>
                      )}

                      <div className="text-right">
                        {isPreparing ? (
                          <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-semibold">
                            <FaSpinner className="animate-spin" />
                            <span>Preparing...</span>
                          </div>
                        ) : isFinalizing ? (
                          <div className="flex items-center gap-1.5 text-violet-600 text-xs font-semibold">
                            <FaSpinner className="animate-spin" />
                            <span>Saving to disk...</span>
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-gray-900">{Math.round(transfer.progress)}%</p>
                        )}
                        <p className="text-xs text-gray-500">{formatFileSize(transfer.fileSize)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/70 rounded-full h-2.5 overflow-hidden mb-2 relative">
                    {isPreparing ? (
                      <div className="h-2.5 rounded-full bg-gradient-to-r from-indigo-400 via-blue-500 to-indigo-400 animate-pulse w-full" />
                    ) : isFinalizing ? (
                      <div className="h-2.5 rounded-full bg-violet-500 animate-pulse w-full" />
                    ) : (
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${isPaused
                          ? 'bg-amber-400'
                          : sender ? 'bg-blue-500' : 'bg-emerald-500'
                          }`}
                        style={{ width: `${transfer.progress}%` }}
                      />
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 gap-2">
                    {isPreparing ? (
                      <span className="text-indigo-600 font-medium flex items-center gap-1.5 animate-pulse">
                        <FaSpinner className="animate-spin text-[10px]" />
                        Calculating checksum & preparing file...
                      </span>
                    ) : isFinalizing ? (
                      <span className="text-violet-700 font-medium flex items-start gap-1.5 animate-pulse min-w-0">
                        <FaSpinner className="animate-spin text-[10px]" />
                        <span className="leading-5 break-words">Chrome is finalizing the disk write (.crswap is temporary)</span>
                      </span>
                    ) : (
                      <span>
                        {formatFileSize(transfer.transferredBytes ?? 0)} / {formatFileSize(transfer.fileSize)}
                      </span>
                    )}
                    <div className="flex items-center gap-3 flex-wrap sm:justify-end">
                      {!isPreparing && !isFinalizing && transfer.speed && transfer.speed > 0 && (
                        <span className={`font-medium ${sender ? 'text-blue-600' : 'text-emerald-600'}`}>
                          ↑ {formatSpeed(transfer.speed)}
                        </span>
                      )}
                      {!isPreparing && !isFinalizing && transfer.eta && transfer.eta > 0 && transfer.progress < 100 && (
                        <span className="text-gray-400">{formatETA(transfer.eta)}</span>
                      )}
                      {isPaused && (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <FaPause className="text-[10px]" /> Paused
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Receiver note */}
                  {!sender && isPaused && (
                    <p className="mt-2 text-xs text-amber-600 bg-amber-100 rounded-lg px-3 py-1.5">
                      ⏸ The sender has paused this transfer
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Transfer History ─────────────────────────────────────────────────── */}
      {historyTransfers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              History — {historyTransfers.length} transfer{historyTransfers.length !== 1 ? 's' : ''}
            </h3>
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
            >
              <FaTrash className="text-[10px]" />
              Clear history
            </button>
          </div>
          <div className="space-y-3">
            {historyTransfers.map((transfer) => {
              const sender = isSender(transfer);
              const isExpanded = expandedErrors.has(transfer.id);

              const statusStyle = {
                completed: 'bg-green-50 border-green-200',
                failed: 'bg-red-50 border-red-200',
                cancelled: 'bg-gray-50 border-gray-200',
              }[transfer.status as 'completed' | 'failed' | 'cancelled'] ?? 'bg-gray-50 border-gray-200';

              const StatusIcon = {
                completed: () => <FaCheck className="text-green-500 text-sm flex-shrink-0" />,
                failed: () => <FaExclamationTriangle className="text-red-500 text-sm flex-shrink-0" />,
                cancelled: () => <FaBan className="text-gray-400 text-sm flex-shrink-0" />,
              }[transfer.status as 'completed' | 'failed' | 'cancelled'] ?? (() => <FaClock className="text-yellow-500 text-sm flex-shrink-0" />);

              return (
                <div key={transfer.id} className={`rounded-xl border p-4 ${statusStyle} transition-all duration-200`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <StatusIcon />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm break-all">{transfer.fileName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          {sender ? <FaUpload className="inline text-[9px]" /> : <FaDownload className="inline text-[9px]" />}
                          {sender ? `Sent to ${transfer.receiverName}` : `Received from ${transfer.senderName}`}
                        </p>
                        {transfer.status === 'failed' && transfer.errorMessage && (
                          <div className="mt-2">
                            <button
                              onClick={() => toggleError(transfer.id)}
                              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              {isExpanded ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                              {isExpanded ? 'Hide details' : 'Show error details'}
                            </button>
                            {isExpanded && (
                              <p className="mt-1.5 text-xs text-red-600 bg-red-100 rounded-lg px-3 py-2">
                                {transfer.errorMessage}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 flex-wrap flex-shrink-0">
                      <p className="text-xs text-gray-500 font-medium">{formatFileSize(transfer.fileSize)}</p>
                      <p className="text-[10px] text-gray-400">{formatTimestamp(transfer.completedAt ?? transfer.timestamp)}</p>

                      {/* Retry button (sender only, failed or cancelled) */}
                      {sender && (transfer.status === 'failed' || transfer.status === 'cancelled') && (
                        <button
                          onClick={() => retryTransfer(transfer.id)}
                          title="Retry transfer"
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition-colors"
                        >
                          <FaRedo className="text-[10px]" />
                          Retry
                        </button>
                      )}

                      {/* Receiver note on failed */}
                      {!sender && transfer.status === 'failed' && (
                        <p className="text-[10px] text-gray-400 italic text-right">Ask sender to retry</p>
                      )}
                    </div>
                  </div>

                  {/* Status footer */}
                  <div className="mt-3 pt-2.5 border-t border-white/50 flex items-center gap-1.5">
                    {transfer.status === 'completed' && (
                      <p className="text-xs text-green-600 font-semibold">✓ Transfer completed successfully</p>
                    )}
                    {transfer.status === 'failed' && (
                      <p className="text-xs text-red-600 font-semibold">✗ Transfer failed</p>
                    )}
                    {transfer.status === 'cancelled' && (
                      <p className="text-xs text-gray-500 font-semibold">⊘ Transfer was cancelled</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
