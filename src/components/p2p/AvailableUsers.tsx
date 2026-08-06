"use client";

import { useState } from 'react';
import { useP2P, PeerUser } from '../../contexts/P2PContext';
import { FaUser, FaShare, FaClock } from 'react-icons/fa';
import { LoadingSpinner } from './LoadingSpinner';
import Image from 'next/image';

interface AvailableUsersProps {
  selectedFiles: File[];
  selectedUser: string | null;
  onUserSelect: (userId: string | null) => void;
}

export function AvailableUsers({ selectedFiles, selectedUser, onUserSelect }: AvailableUsersProps) {
  const { availableUsers, sendShareRequest, startFileTransfer } = useP2P();


  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  const handleSendRequest = async (user: PeerUser) => {
    if (selectedFiles.length === 0) {
      alert('Please select files to share first');
      return;
    }

    setSendingTo(user.uid);
    try {
      // Create a unique request ID for this transfer
      const requestId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // Send the share request with the requestId
      await sendShareRequest(user.uid, selectedFiles, requestId, message || undefined);

      // Start the WebRTC connection and wait for receiver to connect
      startFileTransfer(requestId, selectedFiles, user.displayName, user.uid);

      setMessage('');
      setShowMessageInput(false);
      alert(`Share request sent to ${user.displayName}! Files will transfer when they accept.`);
    } catch (error) {
      console.error('Error sending share request:', error);
      alert('Failed to send share request. Please try again.');
    } finally {
      setSendingTo(null);
    }
  };

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (availableUsers.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaUser className="text-gray-400 text-2xl" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No users available</h3>
        <p className="text-gray-600 mb-4">
          There are currently no other users available for file sharing.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-800 text-sm">
            💡 Users will appear here when they&apos;re online and set themselves as available for sharing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Available Users ({availableUsers.length})
        </h3>
        {selectedFiles.length > 0 && (
          <div className="text-sm text-gray-600">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableUsers.map((user) => (
          <div
            key={user.uid}
            className={`border rounded-lg p-4 transition-all hover:shadow-md ${
              selectedUser === user.uid
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* User Info */}
            <div className="flex items-center space-x-3 mb-4">
              {user.photoURL ? (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={user.photoURL}
                    alt={user.displayName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // console.log('User image load error:', e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FaUser className="text-white text-lg" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {user.displayName}
                </h4>
                {user.email && (
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Available</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <FaClock className="text-xs" />
                <span>{formatLastSeen(user.lastSeen)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => handleSendRequest(user)}
                disabled={selectedFiles.length === 0 || sendingTo === user.uid}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendingTo === user.uid ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <FaShare />
                    <span>Send Files</span>
                  </>
                )}
              </button>

              {selectedFiles.length === 0 && (
                <p className="text-xs text-gray-500 text-center">
                  Select files first to send a share request
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      {showMessageInput && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Optional message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message to your share request..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => {
                setShowMessageInput(false);
                setMessage('');
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowMessageInput(false)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {!showMessageInput && selectedFiles.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowMessageInput(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add optional message
          </button>
        </div>
      )}
    </div>
  );
}
