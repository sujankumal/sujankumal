"use client";

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaGoogle, FaGithub, FaUserSecret, FaShare, FaLock, FaUsers } from 'react-icons/fa';
import { LoadingSpinner } from './LoadingSpinner';

export function LoginForm() {
  const { signInWithGoogle, signInWithGithub, signInAsGuest } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (provider: 'google' | 'github' | 'guest') => {
    setLoading(provider);
    setError(null);

    try {
      switch (provider) {
        case 'google':
          await signInWithGoogle();
          break;
        case 'github':
          await signInWithGithub();
          break;
        case 'guest':
          await signInAsGuest();
          break;
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during sign in');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <FaShare className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">P2P File Share</h1>
          <p className="text-gray-600 text-lg">
            Secure, fast, and direct file sharing between peers
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FaLock className="text-blue-600 text-xl" />
            </div>
            <p className="text-sm text-gray-600">Secure</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FaShare className="text-green-600 text-xl" />
            </div>
            <p className="text-sm text-gray-600">Direct P2P</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FaUsers className="text-purple-600 text-xl" />
            </div>
            <p className="text-sm text-gray-600">Real-time</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Sign in to start sharing
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {/* Google Sign In */}
            <button
              onClick={() => handleSignIn('google')}
              disabled={loading !== null}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'google' ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <FaGoogle className="text-red-500 mr-3" />
                  Continue with Google
                </>
              )}
            </button>

            {/* Guest Sign In */}
            <button
              onClick={() => handleSignIn('guest')}
              disabled={loading !== null}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'guest' ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <FaUserSecret className="text-gray-600 mr-3" />
                  Continue as Guest
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our secure peer-to-peer file sharing service.
              No files are stored on our servers.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. Sign in and set yourself as available</p>
            <p>2. See other available users in real-time</p>
            <p>3. Send file share requests to other users</p>
            <p>4. Files transfer directly between devices</p>
          </div>
        </div>
      </div>
    </div>
  );
}
