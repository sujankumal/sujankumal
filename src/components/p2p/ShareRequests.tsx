"use client";

import { useState } from 'react';
import { useP2P, ShareRequest } from '../../contexts/P2PContext';
import { FaInbox, FaCheck, FaTimes, FaUser, FaClock, FaFile, FaDownload } from 'react-icons/fa';
import { LoadingSpinner } from './LoadingSpinner';

export function ShareRequests() {
  const { shareRequests, acceptShareRequest, rejectShareRequest, startFileTransfer } = useP2P();
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const handleAcceptRequest = async (request: ShareRequest) => {
    setProcessingRequest(request.id);
    try {
      await acceptShareRequest(request.id);
      // Start file transfer process
      // Note: In a real implementation, you'd need to handle the WebRTC connection setup
      // console.log('Starting file transfer for request:', request.id);
    } catch (error) {
      // console.error('Error accepting request:', error);
      alert('Failed to accept request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (request: ShareRequest) => {
    setProcessingRequest(request.id);
    try {
      await rejectShareRequest(request.id);
    } catch (error) {
      alert('Failed to reject request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const pendingRequests = shareRequests.filter(r => r.status === 'pending');
  const completedRequests = shareRequests.filter(r => r.status !== 'pending');

  if (shareRequests.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaInbox className="text-gray-400 text-2xl" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No share requests</h3>
        <p className="text-gray-600 mb-4">
          You haven&apos;t received any file share requests yet.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-blue-800 text-sm">
            💡 When other users send you files, their requests will appear here for you to accept or decline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="border border-orange-200 bg-orange-50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Sender Info */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <FaUser className="text-white text-sm" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {request.fromUserName}
                        </h4>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <FaClock className="text-xs" />
                          <span>{formatTimestamp(request.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    {request.message && (
                      <div className="mb-3 p-3 bg-white rounded border">
                        <p className="text-sm text-gray-700">{request.message}</p>
                      </div>
                    )}

                    {/* Files */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Files to receive ({request.files.length})
                      </h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {request.files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 text-sm bg-white rounded p-2"
                          >
                            <FaFile className="text-gray-400" />
                            <span className="flex-1 truncate">{file.name}</span>
                            <span className="text-gray-500">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Total size: {formatFileSize(
                          request.files.reduce((total, file) => total + file.size, 0)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleAcceptRequest(request)}
                      disabled={processingRequest === request.id}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {processingRequest === request.id ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <>
                          <FaCheck className="text-sm" />
                          <span>Accept</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request)}
                      disabled={processingRequest === request.id}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <FaTimes className="text-sm" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Requests */}
      {completedRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity ({completedRequests.length})
          </h3>
          <div className="space-y-3">
            {completedRequests.map((request) => (
              <div
                key={request.id}
                className={`border rounded-lg p-4 ${request.status === 'accepted'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white text-xs" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {request.fromUserName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {request.files.length} files • {formatTimestamp(request.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${request.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {request.status === 'accepted' ? 'Accepted' : 'Declined'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
