"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useP2P } from "../../contexts/P2PContext";
import {
  FaShare,
  FaSignOutAlt,
  FaUser,
  FaWifi,
  FaExclamationTriangle,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import { LoadingSpinner } from "./LoadingSpinner";
import Image from "next/image";

export function P2PHeader() {
  const { user, signOut, isOnline } = useAuth();
  const { isAvailable, availabilityLoaded, setAvailable } = useP2P();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSigningOut(false);
    }
  };

  const toggleAvailability = () => {
    setAvailable(!isAvailable);
  };

  if (!user) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-14 z-50">
      <div className="w-full py-4 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">

          {/* ───────────────── Logo ───────────────── */}
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FaShare className="text-white text-xs sm:text-sm" />
              </div>

              {/* Desktop title */}
              <h1 className="ml-2 sm:ml-3 text-base sm:text-xl font-bold text-gray-900 truncate">
                <span className="sm:hidden">P2P</span>
                <span className="hidden sm:inline">P2P File Share</span>
              </h1>
            </div>
          </div>

          {/* ───────────────── Controls ───────────────── */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">

            {/* Online Status */}
            <div className="hidden sm:flex items-center gap-2">
              {isOnline ? (
                <FaWifi className="text-green-500 text-sm" />
              ) : (
                <FaExclamationTriangle className="text-red-500 text-sm" />
              )}

              <span className="text-sm text-gray-600">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>

            {/* Availability */}
            <button
              onClick={toggleAvailability}
              disabled={!availabilityLoaded}
              title={
                !availabilityLoaded
                  ? "Loading availability status..."
                  : isAvailable
                    ? "You are available for file sharing"
                    : "Set yourself as available to receive files"
              }
              aria-label={
                !availabilityLoaded
                  ? "Loading availability"
                  : isAvailable
                    ? "Available"
                    : "Unavailable"
              }
              className={`
                flex items - center justify - center
gap - 1.5
px - 2 sm: px - 3
py - 1.5 sm: py - 1
rounded - full
text - sm font - medium
transition - colors
flex - shrink - 0
                ${!availabilityLoaded
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : isAvailable
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
`}
            >
              {!availabilityLoaded ? (
                <>
                  <LoadingSpinner size="sm" color="gray" />
                  <span className="hidden sm:inline">Loading...</span>
                </>
              ) : isAvailable ? (
                <>
                  <FaToggleOn className="text-green-600 text-lg sm:text-base" />
                  <span className="hidden sm:inline">Available</span>
                </>
              ) : (
                <>
                  <FaToggleOff className="text-gray-400 text-lg sm:text-base" />
                  <span className="hidden sm:inline">Unavailable</span>
                </>
              )}
            </button>

            {/* ───────────────── User Menu ───────────────── */}
            <div className="relative flex-shrink-0">

              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="Open user menu"
                aria-expanded={showUserMenu}
                className="
                  flex items-center
                  gap-1.5 sm:gap-2
                  p-1 sm:p-2
                  rounded-lg
                  hover:bg-gray-100
                  active:bg-gray-200
                  transition-colors
                "
              >
                {/* Avatar */}
                {user.photoURL ? (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaUser className="text-gray-600 text-xs sm:text-sm" />
                  </div>
                )}

                {/* User name - desktop/tablet only */}
                <span className="hidden sm:block max-w-[140px] truncate text-sm font-medium text-gray-700">
                  {user.displayName || "Anonymous User"}
                </span>
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div
                  className="
                    absolute
                    right-0
                    top-full
                    mt-2
                    w-[calc(100vw-24px)]
                    max-w-64
                    sm:w-64
                    bg-white
                    rounded-xl
                    shadow-xl
                    border border-gray-200
                    overflow-hidden
                    z-[60]
                  "
                >
                  {/* User information */}
                  <div className="px-4 py-3 border-b border-gray-100 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.displayName || "Anonymous User"}
                    </p>

                    {user.email && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {user.email}
                      </p>
                    )}
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="
                      w-full
                      flex items-center
                      gap-2
                      px-4 py-3
                      text-sm
                      text-gray-700
                      hover:bg-gray-50
                      active:bg-gray-100
                      transition-colors
                      disabled:opacity-50
                    "
                  >
                    {signingOut ? (
                      <LoadingSpinner size="sm" color="gray" />
                    ) : (
                      <FaSignOutAlt className="text-gray-500" />
                    )}

                    <span>
                      {signingOut ? "Signing out..." : "Sign Out"}
                    </span>
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
    </div>
  );
}
