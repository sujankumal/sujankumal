"use client";

import { useP2P } from '../../contexts/P2PContext';
import { useAuth } from '../../contexts/AuthContext';
import { FaExchangeAlt, FaDownload, FaUpload, FaCheck, FaTimes, FaClock } from 'react-icons/fa';

export function FileTransfers() {
  const { fileTransfers } = useP2P();
  const { user } = useAuth();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FaCheck className="text-green-500" />;
      case 'failed':
        return <FaTimes className="text-red-500" />;
      case 'transferring':
        return <FaExchangeAlt className="text-blue-500 animate-pulse" />;
      default:
        return <FaClock className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'transferring':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  if (fileTransfers.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaExchangeAlt className="text-gray-400 text-2xl" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No file transfers</h3>
        <p className="text-gray-600 mb-4">
          Your file transfer history will appear here.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-blue-800 text-sm">
            💡 When you send or receive files, you&apos;ll see the transfer progress and history here.
          </p>
        </div>
      </div>
    );
  }

  const activeTransfers = fileTransfers.filter(t => t.status === 'transferring');
  const completedTransfers = fileTransfers.filter(t => t.status !== 'transferring');

  return (
    <div className="p-6">
      {/* Active Transfers */}
      {activeTransfers.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Active Transfers ({activeTransfers.length})
          </h3>
          <div className="space-y-4">
            {activeTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className={`border rounded-lg p-4 ${getStatusColor(transfer.status)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(transfer.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{transfer.fileName}</h4>
                      <p className="text-sm text-gray-600">
                        {transfer.senderId === user?.uid ? 'Sending to' : 'Receiving from'}{' '}
                        {transfer.senderId === user?.uid ? transfer.receiverName : transfer.senderName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {Math.round(transfer.progress)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(transfer.fileSize)}
                    </p>
                    {transfer.speed && transfer.speed > 0 && (
                      <p className="text-xs text-blue-600">
                        {formatSpeed(transfer.speed)}
                      </p>
                    )}
                    {transfer.eta && transfer.eta > 0 && transfer.progress < 100 && (
                      <p className="text-xs text-orange-600">
                        ETA: {formatETA(transfer.eta)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 relative">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${transfer.senderId === user?.uid ? 'bg-blue-600' : 'bg-green-600'
                      }`}
                    style={{ width: `${transfer.progress}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white drop-shadow">
                      {Math.round(transfer.progress)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${transfer.senderId === user?.uid
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                      }`}>
                      {transfer.senderId === user?.uid ? '📤 Sending' : '📥 Receiving'}
                    </span>
                    <span>{transfer.fileType}</span>
                  </div>
                  <span>{formatTimestamp(transfer.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer History */}
      {completedTransfers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Transfer History ({completedTransfers.length})
          </h3>
          <div className="space-y-3">
            {completedTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className={`border rounded-lg p-4 ${getStatusColor(transfer.status)}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    {getStatusIcon(transfer.status)}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 break-words break-all">{transfer.fileName}</h4>
                      <p className="text-sm text-gray-600 mt-1 break-words">
                        {transfer.senderId === user?.uid ? (
                          <>
                            <FaUpload className="inline mr-1" />
                            Sent to {transfer.receiverName}
                          </>
                        ) : (
                          <>
                            <FaDownload className="inline mr-1" />
                            Received from {transfer.senderName}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-gray-600 font-medium">
                      {formatFileSize(transfer.fileSize)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(transfer.timestamp)}
                    </p>
                  </div>
                </div>

                {transfer.status === 'completed' && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Transfer completed successfully
                    </p>
                  </div>
                )}

                {transfer.status === 'failed' && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="text-xs text-red-600 font-medium">
                      ✗ Transfer failed
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
