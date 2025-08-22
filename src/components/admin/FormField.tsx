"use client";

import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number" | "date" | "datetime-local" | "textarea" | "select" | "checkbox";
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  rows?: number;
  disabled?: boolean;
  children?: ReactNode;
}

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  placeholder,
  options = [],
  rows = 3,
  disabled = false,
  children,
}: FormFieldProps) {
  const baseInputClasses = `
    w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors
    focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error 
      ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500" 
      : "border-gray-300 text-gray-900 placeholder-gray-400"
    }
  `;

  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            id={name}
            name={name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={baseInputClasses}
          />
        );

      case "select":
        return (
          <select
            id={name}
            name={name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="flex items-center">
            <input
              id={name}
              name={name}
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <label htmlFor={name} className="ml-2 text-sm text-gray-700">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      default:
        return (
          <input
            id={name}
            name={name}
            type={type}
            value={value || ""}
            onChange={(e) => {
              const newValue = type === "number" ? parseFloat(e.target.value) || "" : e.target.value;
              onChange(newValue);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={baseInputClasses}
          />
        );
    }
  };

  if (type === "checkbox") {
    return (
      <div className="space-y-1">
        {renderInput()}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children || renderInput()}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
