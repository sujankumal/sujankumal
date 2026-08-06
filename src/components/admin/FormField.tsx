"use client";

import { ReactNode, useState } from "react";
import { AdminFormField } from "@/config/types";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { formatImageUrl } from "@/lib/image";
import { ImagePicker } from "./image-library/ImagePicker";

interface FormFieldProps {
  label: string;
  name: string;
  type?: AdminFormField["control"] | "text" | "email" | "password" | "number" | "date" | "datetime-local" | "textarea" | "select" | "checkbox";
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
  const [pickerOpen, setPickerOpen] = useState(false);

  const baseInputClasses = `
    w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors
    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error
      ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 text-gray-900 placeholder-gray-400"
    }
  `;

  const renderInput = () => {
    switch (type) {
      case "image":
        return (
          <>
            <div className="space-y-3">

              <div className="flex gap-4">

                <div className="relative h-28 w-28 rounded border bg-gray-100 overflow-hidden">

                  {value ? (
                    <Image
                      src={formatImageUrl(value)}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}

                </div>

                <div className="flex-1 space-y-2">

                  <input
                    type="text"
                    value={value || ""}
                    placeholder="Image URL"
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={baseInputClasses}
                  />

                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    disabled={disabled}
                    className="rounded border px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    Browse Library
                  </button>

                </div>

              </div>

            </div>

            <ImagePicker
              open={pickerOpen}
              value={value}
              onClose={() => setPickerOpen(false)}
              onSelect={(image) => onChange(image)}
            />
          </>
        );
      case "textarea":
      case "markdown":
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
      case "relation":
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
      case "boolean":
        return (
          <div className="flex items-center">
            <input
              id={name}
              name={name}
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
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
