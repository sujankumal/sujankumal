"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Shield } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
  requiresTyping?: boolean;
  typeToConfirm?: string;
  countdownSeconds?: number;
  showExtraWarning?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
  requiresTyping = false,
  typeToConfirm = "DELETE",
  countdownSeconds = 0,
  showExtraWarning = false,
}: ConfirmDialogProps) {
  const [typedText, setTypedText] = useState("");
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [canConfirm, setCanConfirm] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setTypedText("");
      setCountdown(countdownSeconds);
      setCanConfirm(!requiresTyping && countdownSeconds === 0);
    }
  }, [isOpen, requiresTyping, countdownSeconds]);

  // Countdown timer
  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => {
          const newCount = prev - 1;
          if (newCount === 0 && (!requiresTyping || typedText === typeToConfirm)) {
            setCanConfirm(true);
          }
          return newCount;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, countdown, requiresTyping, typedText, typeToConfirm]);

  // Check typing requirement
  useEffect(() => {
    if (requiresTyping) {
      const isTypingValid = typedText === typeToConfirm;
      const isCountdownDone = countdown === 0;
      setCanConfirm(isTypingValid && isCountdownDone);
    } else if (countdown === 0) {
      setCanConfirm(true);
    }
  }, [typedText, typeToConfirm, requiresTyping, countdown]);

  const typeStyles = {
    danger: {
      icon: "text-red-600",
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      border: "border-red-300",
      bg: "bg-red-50",
    },
    warning: {
      icon: "text-yellow-600",
      button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
      border: "border-yellow-300",
      bg: "bg-yellow-50",
    },
    info: {
      icon: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      border: "border-blue-300",
      bg: "bg-blue-50",
    },
  };

  const styles = typeStyles[type];

  const handleConfirm = () => {
    if (canConfirm && !isLoading) {
      onConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      {/* Extra Warning Banner */}
      {showExtraWarning && type === "danger" && (
        <div className={`mb-4 p-3 rounded-md border-2 ${styles.border} ${styles.bg}`}>
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h4 className="text-sm font-semibold text-red-800">⚠️ DESTRUCTIVE ACTION WARNING</h4>
              <p className="text-xs text-red-700 mt-1">
                This action will permanently delete data and cannot be undone. Please proceed with extreme caution.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700">{message}</p>

          {/* Countdown Timer */}
          {countdown > 0 && (
            <div className="mt-3 p-2 bg-gray-100 rounded-md flex items-center">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">
                Please wait {countdown} second{countdown !== 1 ? 's' : ''} before confirming...
              </span>
            </div>
          )}

          {/* Type to Confirm */}
          {requiresTyping && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono">{typeToConfirm}</code> to confirm:
              </label>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  typedText === typeToConfirm ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                placeholder={`Type "${typeToConfirm}" here`}
                disabled={isLoading}
                autoComplete="off"
              />
              {typedText && typedText !== typeToConfirm && (
                <p className="mt-1 text-xs text-red-600">
                  Text doesn&apos;t match. Please type exactly: {typeToConfirm}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm || isLoading}
          className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </span>
          ) : countdown > 0 ? (
            `Wait ${countdown}s`
          ) : !canConfirm && requiresTyping ? (
            "Type to Enable"
          ) : (
            confirmText
          )}
        </button>
      </div>
    </Modal>
  );
}
