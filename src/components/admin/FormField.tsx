"use client";

import { ReactNode, useState } from "react";
import { AdminFormField, SelectOption } from "@/config/types";
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
  options?: SelectOption[];
  rows?: number;
  disabled?: boolean;
  children?: ReactNode;
  nestedFields?: AdminFormField[];
  className?: string;
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
  nestedFields,
  className,
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
        const textareaRows = type === "markdown" ? Math.max(rows, 8) : rows;
        return (
          <textarea
            id={name}
            name={name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={textareaRows}
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
            value={value != null ? String(value) : ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option) => {
              const optionValue = String(option.value);
              return (
                <option key={optionValue} value={optionValue}>
                  {option.label}
                </option>
              );
            })}
          </select>
        );
      case "manyToMany":
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {options.map((option) => {
                const optionValue = String(option.value);
                const selectedValues = Array.isArray(value) ? value.map(String) : [];
                const isSelected = selectedValues.includes(optionValue);
                return (
                  <button
                    type="button"
                    key={optionValue}
                    onClick={() => {
                      const nextValues = isSelected
                        ? selectedValues.filter((item) => item !== optionValue)
                        : [...selectedValues, optionValue];
                      onChange(nextValues.map((item) => {
                        const parsed = Number(item);
                        return Number.isNaN(parsed) ? item : parsed;
                      }));
                    }}
                    disabled={disabled}
                    className={`rounded-md border px-3 py-2 text-sm text-left transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${isSelected ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <input
              type="hidden"
              name={name}
              value={Array.isArray(value) ? value.join(",") : ""}
            />
          </div>
        );
      case "repeatable":
        return (
          <div className="space-y-3">
            {Array.isArray(value) && value.length > 0 ? (
              value.map((item: any, itemIndex: number) => (
                <div key={itemIndex} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-700">
                      {label} {itemIndex + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextItems = value.filter((_: any, index: number) => index !== itemIndex);
                        onChange(nextItems);
                      }}
                      disabled={disabled}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  {nestedFields?.map((innerField) => (
                    <FormField
                      key={`${name}-${itemIndex}-${innerField.name}`}
                      label={innerField.label}
                      name={`${name}[${itemIndex}].${innerField.name}`}
                      type={innerField.control}
                      value={item?.[innerField.name]}
                      onChange={(innerValue) => {
                        const nextItems = value.map((current: any, index: number) =>
                          index === itemIndex ? { ...current, [innerField.name]: innerValue } : current
                        );
                        onChange(nextItems);
                      }}
                      error={undefined}
                      required={innerField.required}
                      placeholder={innerField.placeholder}
                      options={innerField.options || []}
                      rows={innerField.rows}
                      disabled={disabled}
                      nestedFields={innerField.fields}
                    />
                  ))}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No {label.toLowerCase()} added yet.</div>
            )}
            <button
              type="button"
              onClick={() => {
                const newItem: any = {};
                nestedFields?.forEach((innerField) => {
                  if (innerField.control === "boolean") {
                    newItem[innerField.name] = false;
                  } else if (innerField.control === "number") {
                    newItem[innerField.name] = 0;
                  } else if (innerField.control === "date") {
                    newItem[innerField.name] = new Date().toISOString().slice(0, 16);
                  } else {
                    newItem[innerField.name] = "";
                  }
                });
                onChange([...(Array.isArray(value) ? value : []), newItem]);
              }}
              disabled={disabled}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Add {label}
            </button>
          </div>
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
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children || renderInput()}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
