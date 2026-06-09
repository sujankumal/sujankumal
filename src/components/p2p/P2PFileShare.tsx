"use client";

import { useState, useRef, useEffect } from 'react';
import { useP2P } from '../../contexts/P2PContext';
import { useAuth } from '../../contexts/AuthContext';
import { AvailableUsers } from './AvailableUsers';
import { ShareRequests } from './ShareRequests';
import { FileTransfers } from './FileTransfers';
import { FileDropZone } from './FileDropZone';
import { FaUsers, FaInbox, FaExchangeAlt, FaUpload } from 'react-icons/fa';

export function P2PFileShare() {
  const { user } = useAuth();
  const { availableUsers, shareRequests, fileTransfers, isAvailable, acceptShareRequest, rejectShareRequest } = useP2P();

  const activeTransfers = fileTransfers.filter(t => t.status === 'transferring');
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'transfers'>('users');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // transient popover state for incoming requests
  const [popoverRequest, setPopoverRequest] = useState<any | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFileSelect(files);
  };

  const tabs = [
    {
      id: 'users' as const,
      label: 'Available Users',
      icon: FaUsers,
      count: availableUsers.length,
      color: 'blue',
    },
    {
      id: 'requests' as const,
      label: 'Share Requests',
      icon: FaInbox,
      count: shareRequests.filter(r => r.status === 'pending').length,
      color: 'green',
    },
    {
      id: 'transfers' as const,
      label: 'File Transfers',
      icon: FaExchangeAlt,
      count: fileTransfers.filter(t => t.status === 'transferring').length,
      color: 'purple',
    },
  ];

  // Show a transient popover when a new pending share request arrives
  useEffect(() => {
    if (!shareRequests || shareRequests.length === 0) return;

    // find the newest pending request that we haven't notified about
    const pending = shareRequests.filter(r => r.status === 'pending').sort((a, b) => b.timestamp - a.timestamp);
    if (pending.length === 0) return;
    const newest = pending[0];
    if (notifiedRef.current.has(newest.id)) return;

    // set popover to show
    setPopoverRequest(newest);
    notifiedRef.current.add(newest.id);

    // auto-dismiss after 20s
    const t = setTimeout(() => setPopoverRequest(null), 20_000);
    return () => clearTimeout(t);
  }, [shareRequests]);

  if (!isAvailable) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUsers className="text-gray-400 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re currently unavailable</h2>
          <p className="text-gray-600 mb-6">
            Set yourself as available in the header to start sharing files with other users.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-800 text-sm">
              💡 When you&apos;re available, other users can see you online and send you file share requests.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Welcome Message */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.displayName || 'Anonymous User'}!
        </h1>
        <p className="text-gray-600">
          You&apos;re now available for file sharing. Select files and choose users to share with.
        </p>
      </div>

      {/* Active Transfers Progress */}
      {activeTransfers.length > 0 && (
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Transfers ({activeTransfers.length})
            </h2>
            <div className="space-y-4">
              {activeTransfers.map((transfer) => (
                <div key={transfer.id} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${transfer.senderId === user?.uid ? 'bg-blue-500' : 'bg-green-500'
                        } animate-pulse`}></div>
                      <div>
                        <h4 className="font-medium text-gray-900">{transfer.fileName}</h4>
                        <p className="text-sm text-gray-600">
                          {transfer.senderId === user?.uid ? '📤 Sending to' : '📥 Receiving from'}{' '}
                          {transfer.senderId === user?.uid ? transfer.receiverName : transfer.senderName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {Math.round(transfer.progress)}%
                      </p>
                      {transfer.speed && transfer.speed > 0 && (
                        <p className="text-sm text-blue-600">
                          {(transfer.speed / (1024 * 1024)).toFixed(1)} MB/s
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${transfer.senderId === user?.uid ? 'bg-blue-600' : 'bg-green-600'
                        }`}
                      style={{ width: `${transfer.progress}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                    <span>{((transfer.fileSize * transfer.progress) / 100 / (1024 * 1024)).toFixed(1)} MB / {(transfer.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                    {transfer.eta && transfer.eta > 0 && transfer.progress < 100 && (
                      <span>ETA: {transfer.eta < 60 ? `${Math.round(transfer.eta)}s` : `${Math.round(transfer.eta / 60)}m`}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* File Selection Area */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Select Files to Share
            </h2>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center space-x-2 px-5 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all active:scale-95 shadow-sm w-full sm:w-auto"
            >
              <FaUpload className="text-lg" />
              <span>Browse Files</span>
            </button>
          </div>

          <FileDropZone
            onFilesSelected={handleFileSelect}
            selectedFiles={selectedFiles}
            onRemoveFile={(index) => {
              setSelectedFiles(files => files.filter((_, i) => i !== index));
            }}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex flex-col sm:flex-row sm:space-x-8 gap-1 sm:gap-0 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-start sm:justify-center space-x-2 py-3 px-4 sm:px-1 border-b-2 font-medium text-sm transition-colors w-full sm:w-auto ${isActive
                    ? `border-${tab.color}-500 text-${tab.color}-600 bg-gray-50 sm:bg-transparent`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="text-lg" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-${tab.color}-500 rounded-full ml-auto sm:ml-0`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {activeTab === 'users' && (
          <AvailableUsers
            selectedFiles={selectedFiles}
            selectedUser={selectedUser}
            onUserSelect={setSelectedUser}
          />
        )}
        {activeTab === 'requests' && <ShareRequests />}
        {activeTab === 'transfers' && <FileTransfers />}
      </div>

      {/* Incoming share request popover */}
      {popoverRequest && (
        <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto z-50 max-w-[380px] mx-auto md:mx-0">
          <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-5">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  Share request from {popoverRequest.fromUserName || 'Unknown'}
                </h3>

                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {popoverRequest.message || `${popoverRequest.files?.length || 0} file(s)`}
                </p>

                <div className="mt-4 flex flex-col xs:flex-row gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await acceptShareRequest(popoverRequest.id);
                      } catch (e) {
                        // ignore
                      }
                      setPopoverRequest(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Accept
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await rejectShareRequest(popoverRequest.id);
                      } catch (e) {
                        // ignore
                      }
                      setPopoverRequest(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-xl text-sm font-medium transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>

              <button
                onClick={() => setPopoverRequest(null)}
                className="ml-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
