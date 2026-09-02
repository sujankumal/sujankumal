'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface MfaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MfaSettingsModal({ isOpen, onClose }: MfaSettingsModalProps) {
  const [loading, setLoading] = useState(true);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; otpUri: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMfaStatus();
    }
  }, [isOpen]);

  const fetchMfaStatus = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setBackupCodes([]);
    try {
      const res = await fetch('/api/admin/mfa');
      const data = await res.json();
      if (res.ok) {
        setIsMfaEnabled(data.enabled);
        if (!data.enabled && data.secret && data.otpUri) {
          setSetupData({ secret: data.secret, otpUri: data.otpUri });
        }
      } else {
        setErrorMsg(data.error || 'Failed to load MFA status');
      }
    } catch {
      setErrorMsg('Network error while checking 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || !verificationCode) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationCode,
          secret: setupData.secret,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsMfaEnabled(true);
        setBackupCodes(data.backupCodes || []);
        setSuccessMsg('Two-factor authentication is now active!');
      } else {
        setErrorMsg(data.error || 'Verification failed. Please check the code.');
      }
    } catch {
      setErrorMsg('Failed to enable 2FA.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/mfa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsMfaEnabled(false);
        setSuccessMsg('Two-factor authentication has been disabled.');
        fetchMfaStatus();
      } else {
        setErrorMsg(data.error || 'Failed to disable 2FA.');
      }
    } catch {
      setErrorMsg('Network error while disabling 2FA.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-700 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <h2 className="text-xl font-bold text-orange-500">
            Security & Two-Factor Authentication (2FA)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 bg-red-950/80 border border-red-500 rounded text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="my-3 p-3 bg-green-950/80 border border-green-500 rounded text-green-200 text-sm">
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading security settings...</div>
        ) : backupCodes.length > 0 ? (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-orange-950/40 border border-orange-600 rounded-lg">
              <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-1">
                Save Your Backup Recovery Codes
              </h3>
              <p className="text-xs text-gray-300">
                If you ever lose access to your authenticator app, these one-time codes are the only way to recover your account.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-gray-800 p-4 rounded font-mono text-sm text-center">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="p-1 bg-gray-900 rounded border border-gray-700 select-all">
                  {code}
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition-colors"
            >
              I have safely stored my backup codes
            </button>
          </div>
        ) : isMfaEnabled ? (
          <div className="py-4 space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-green-900/30 border border-green-600 rounded-lg">
              <span className="text-2xl">🛡️</span>
              <div>
                <div className="font-semibold text-green-400">2FA is Currently Active</div>
                <div className="text-xs text-gray-300">Your account requires an authenticator code on login.</div>
              </div>
            </div>

            <form onSubmit={handleDisableMfa} className="border-t border-gray-800 pt-4 space-y-3">
              <h4 className="text-sm font-medium text-red-400">Disable Two-Factor Authentication</h4>
              <input
                type="password"
                placeholder="Confirm password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </form>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <p className="text-xs text-gray-300">
              Scan this QR code using <strong>Google Authenticator</strong>, <strong>1Password</strong>, <strong>Apple Passwords</strong>, or <strong>Authy</strong>.
            </p>

            {setupData?.otpUri && (
              <div className="flex justify-center p-3 bg-white rounded-lg w-fit mx-auto">
                <QRCodeSVG value={setupData.otpUri} size={180} level="M" />
              </div>
            )}

            {setupData?.secret && (
              <div className="text-center">
                <span className="text-xs text-gray-400">Manual Entry Key:</span>
                <div className="font-mono text-xs text-orange-400 select-all mt-1 bg-gray-800 py-1 px-2 rounded">
                  {setupData.secret}
                </div>
              </div>
            )}

            <form onSubmit={handleEnableMfa} className="space-y-3 pt-2">
              <label className="block text-xs text-gray-300">Enter 6-Digit Authenticator Code</label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                className="w-full text-center text-xl font-mono tracking-widest bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={submitting || verificationCode.length !== 6}
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? 'Activating...' : 'Verify & Enable 2FA'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
