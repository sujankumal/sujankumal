"use client";

import { ReactNode, useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

interface SafetyWrapperProps {
  children: ReactNode;
  requireConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  onConfirm?: () => void;
  disabled?: boolean;
  className?: string;
}

export function SafetyWrapper({
  children,
  requireConfirmation = false,
  confirmationTitle = "Confirm Action",
  confirmationMessage = "Are you sure you want to perform this action?",
  onConfirm,
  disabled = false,
  className = "",
}: SafetyWrapperProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    if (requireConfirmation) {
      e.preventDefault();
      setShowConfirmation(true);
    }
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    onConfirm?.();
  };

  return (
    <>
      <div
        className={`${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        onClick={handleClick}
      >
        {children}
      </div>
      
      <ConfirmDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
        title={confirmationTitle}
        message={confirmationMessage}
        type="warning"
      />
    </>
  );
}

interface SafeDeleteButtonProps {
  onDelete: () => void;
  itemName?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function SafeDeleteButton({
  onDelete,
  itemName = "item",
  disabled = false,
  className = "",
  children,
}: SafeDeleteButtonProps) {
  return (
    <SafetyWrapper
      requireConfirmation
      confirmationTitle="Delete Item"
      confirmationMessage={`Are you sure you want to delete this ${itemName}? This action cannot be undone.`}
      onConfirm={onDelete}
      disabled={disabled}
      className={className}
    >
      {children}
    </SafetyWrapper>
  );
}

interface DataIntegrityCheckProps {
  data: any;
  requiredFields?: string[];
  onValidationError?: (errors: string[]) => void;
  children: ReactNode;
}

export function DataIntegrityCheck({
  data,
  requiredFields = [],
  onValidationError,
  children,
}: DataIntegrityCheckProps) {
  const [errors, setErrors] = useState<string[]>([]);

  const validateData = () => {
    const validationErrors: string[] = [];

    requiredFields.forEach(field => {
      if (!data || data[field] === undefined || data[field] === null || data[field] === "") {
        validationErrors.push(`${field} is required`);
      }
    });

    setErrors(validationErrors);
    
    if (validationErrors.length > 0) {
      onValidationError?.(validationErrors);
      return false;
    }
    
    return true;
  };

  if (errors.length > 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Data Validation Errors
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface SecureActionProps {
  action: () => Promise<void> | void;
  requiresAuth?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export function SecureAction({
  action,
  requiresAuth = true,
  requiresConfirmation = false,
  confirmationMessage = "Are you sure you want to perform this action?",
  onSuccess,
  onError,
  disabled = false,
  children,
  className = "",
}: SecureActionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const executeAction = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await action();
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (requiresConfirmation) {
      setShowConfirmation(true);
    } else {
      executeAction();
    }
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    executeAction();
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`${disabled || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      >
        {children}
      </div>
      
      <ConfirmDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
        title="Confirm Action"
        message={confirmationMessage}
        isLoading={isLoading}
        type="warning"
      />
    </>
  );
}
