"use client";

import { useState, useRef } from 'react';
import { useP2P } from '../../contexts/P2PContext';
import { useAuth } from '../../contexts/AuthContext';
import { AvailableUsers } from './AvailableUsers';
import { ShareRequests } from './ShareRequests';
import { FileTransfers } from './FileTransfers';
import { FileDropZone } from './FileDropZone';
import { FaUsers, FaInbox, FaExchangeAlt, FaUpload } from 'react-icons/fa';

export function P2PFileShare() {
  const { user } = useAuth();
  const { availableUsers, shareRequests, fileTransfers, isAvailable } = useP2P();

  const activeTransfers = fileTransfers.filter(t => t.status === 'transferring');
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'transfers'>('users');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                      <div className={`w-3 h-3 rounded-full ${
                        transfer.senderId === user?.uid ? 'bg-blue-500' : 'bg-green-500'
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
                      className={`h-2 rounded-full transition-all duration-300 ${
                        transfer.senderId === user?.uid ? 'bg-blue-600' : 'bg-green-600'
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Select Files to Share</h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaUpload />
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
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? `border-${tab.color}-500 text-${tab.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="text-lg" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-${tab.color}-500 rounded-full`}>
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
    </div>
  );
}
