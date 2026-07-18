"use client";

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useP2P } from '../../contexts/P2PContext';
import { FaShare, FaSignOutAlt, FaUser, FaWifi, FaBan, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { LoadingSpinner } from './LoadingSpinner';
import Image from 'next/image';

export function Header() {
  const { user, signOut, isOnline } = useAuth();
  const { isAvailable, setAvailable } = useP2P();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {

    } finally {
      setSigningOut(false);
    }
  };

  const toggleAvailability = () => {
    setAvailable(!isAvailable);
  };

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FaShare className="text-white text-sm" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">P2P File Share</h1>
            </div>
          </div>

          {/* Status and Controls */}
          <div className="flex items-center space-x-4">
            {/* Online Status */}
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <FaWifi className="text-green-500 text-sm" />
              ) : (
                <FaBan className="text-red-500 text-sm" />
              )}
              <span className="text-sm text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAvailability}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${isAvailable
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {isAvailable ? (
                  <FaToggleOn className="text-green-600" />
                ) : (
                  <FaToggleOff className="text-gray-400" />
                )}
                <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
              </button>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {user.photoURL ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <Image src={user.photoURL} alt={user.displayName || 'User'} width={32} height={32} className="object-cover" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <FaUser className="text-gray-600 text-sm" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user.displayName || 'Anonymous User'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user.displayName || 'Anonymous User'}
                    </p>
                    {user.email && (
                      <p className="text-xs text-gray-500">{user.email}</p>
                    )}
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {signingOut ? (
                      <LoadingSpinner size="sm" color="gray" />
                    ) : (
                      <FaSignOutAlt />
                    )}
                    <span className="ml-2">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}
