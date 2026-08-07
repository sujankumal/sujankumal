"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, Shield, Clock } from "lucide-react";

interface WarningBannerProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "warning" | "danger" | "critical";
  autoHide?: boolean;
  duration?: number;
}

export function WarningBanner({
  show,
  onClose,
  title,
  message,
  type = "warning",
  autoHide = true,
  duration = 5000,
}: WarningBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(Math.ceil(duration / 1000));

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setCountdown(Math.ceil(duration / 1000));
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }, duration);

        const countdownTimer = setInterval(() => {
          setCountdown(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => {
          clearTimeout(timer);
          clearInterval(countdownTimer);
        };
      }
    } else {
      setIsVisible(false);
    }
  }, [show, duration, autoHide, onClose]);

  const typeStyles = {
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-800",
      icon: "text-yellow-600",
      button: "text-yellow-600 hover:text-yellow-800",
    },
    danger: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: "text-red-600",
      button: "text-red-600 hover:text-red-800",
    },
    critical: {
      bg: "bg-red-100 border-red-300 shadow-lg",
      text: "text-red-900",
      icon: "text-red-700",
      button: "text-red-700 hover:text-red-900",
    },
  };

  const styles = typeStyles[type];
  const Icon = type === "critical" ? Shield : AlertTriangle;

  if (!show && !isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className={`max-w-md w-full border-2 rounded-lg p-4 ${styles.bg}`}>
        <div className="flex items-start">
          <div className="shrink-0">
            <Icon className={`h-6 w-6 ${styles.icon}`} />
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-bold ${styles.text}`}>
              {title}
            </h3>
            <p className={`mt-1 text-sm ${styles.text} opacity-90`}>
              {message}
            </p>
            {autoHide && countdown > 0 && (
              <div className="mt-2 flex items-center text-xs opacity-75">
                <Clock className="h-3 w-3 mr-1" />
                <span>Auto-hide in {countdown}s</span>
              </div>
            )}
          </div>
          <div className="ml-4 shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className={`inline-flex ${styles.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {type === "critical" && (
          <div className="mt-3 pt-3 border-t border-red-200">
            <div className="flex items-center text-xs text-red-700">
              <Shield className="h-3 w-3 mr-1" />
              <span className="font-medium">CRITICAL ACTION WARNING</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for managing warning banners
export function useWarningBanner() {
  const [warnings, setWarnings] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: "warning" | "danger" | "critical";
    autoHide: boolean;
    duration: number;
  }>>([]);

  const showWarning = (
    title: string,
    message: string,
    type: "warning" | "danger" | "critical" = "warning",
    autoHide = true,
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setWarnings(prev => [...prev, { id, title, message, type, autoHide, duration }]);
  };

  const hideWarning = (id: string) => {
    setWarnings(prev => prev.filter(warning => warning.id !== id));
  };

  const showDeleteWarning = (entityName: string, count = 1) => {
    const title = count > 1 ? `🚨 Bulk Delete Warning` : `⚠️ Delete Warning`;
    const message = count > 1 
      ? `You are about to delete ${count} ${entityName}(s). This action is permanent and cannot be undone.`
      : `You are about to delete this ${entityName}. This action is permanent and cannot be undone.`;
    
    showWarning(title, message, count > 5 ? "critical" : "danger", true, count > 5 ? 8000 : 6000);
  };

  const WarningBanners = () => (
    <>
      {warnings.map((warning) => (
        <WarningBanner
          key={warning.id}
          show={true}
          onClose={() => hideWarning(warning.id)}
          title={warning.title}
          message={warning.message}
          type={warning.type}
          autoHide={warning.autoHide}
          duration={warning.duration}
        />
      ))}
    </>
  );

  return {
    showWarning,
    showDeleteWarning,
    hideWarning,
    WarningBanners,
  };
}
