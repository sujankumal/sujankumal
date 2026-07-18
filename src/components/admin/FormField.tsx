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
  const [showImagePicker, setShowImagePicker] = useState(false);
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
      // case "image":
      //   const imageSrc = formatImageUrl(value);

      //   return (
      //     <div className="space-y-3">
      //       <input
      //         id={name}
      //         name={name}
      //         type="text"
      //         value={value || ""}
      //         onChange={(e) => onChange(e.target.value)}
      //         placeholder={placeholder || "Enter image URL or filename"}
      //         disabled={disabled}
      //         className={baseInputClasses}
      //       />

      //       <div className="w-56 h-36 rounded-md border bg-gray-50 overflow-hidden flex items-center justify-center">
      //         {imageSrc ? (
      //           <Image
      //             src={imageSrc}
      //             alt={label}
      //             width={224}
      //             height={144}
      //             className="object-contain w-full h-full"
      //             unoptimized
      //           />
      //         ) : (
      //           <ImageIcon className="h-10 w-10 text-gray-400" />
      //         )}
      //       </div>

      //       {value && (
      //         <p className="text-xs text-gray-500 break-all">
      //           {imageSrc}
      //         </p>
      //       )}
      //     </div>
      //   );

      // case "image":
      //   return (
      //     <>
      //       <div className="space-y-3">

      //         {value && (
      //           <button
      //             type="button"
      //             onClick={() => setShowImagePicker(true)}
      //             className="relative w-48 h-32 rounded-md border overflow-hidden bg-gray-100 hover:ring-2 hover:ring-orange-300 transition"
      //           >
      //             <div className="relative w-40 h-28 rounded border overflow-hidden bg-gray-100">
      //               <Image
      //                 src={value}
      //                 alt={label}
      //                 fill
      //                 className="object-cover"
      //                 unoptimized
      //               />
      //             </div>
      //           </button>
      //         )}
      //         {!value && (
      //           <button
      //             type="button"
      //             onClick={() => setShowImagePicker(true)}
      //             className="w-48 h-32 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500 hover:border-orange-400 hover:text-orange-600"
      //           >
      //             Choose Image
      //           </button>
      //         )}
      //         <div className="flex gap-2">

      //           <input
      //             id={name}
      //             name={name}
      //             type="text"
      //             value={value || ""}
      //             placeholder={placeholder || "/images/example.webp"}
      //             onChange={(e) => onChange(e.target.value)}
      //             disabled={disabled}
      //             className={`${baseInputClasses} flex-1`}
      //           />

      //           <button
      //             type="button"
      //             disabled={disabled}
      //             onClick={() => setShowImagePicker(true)}
      //             className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
      //           >
      //             Browse
      //           </button>
      //           {value && (
      //             <button
      //               type="button"
      //               disabled={disabled}
      //               onClick={() => onChange("")}
      //               className="px-4 py-2 rounded-md border border-red-300 text-red-600 hover:bg-red-50"
      //             >
      //               Clear
      //             </button>
      //           )}
      //         </div>

      //       </div >

      //       <ImagePicker
      //         open={showImagePicker}
      //         value={value}
      //         onClose={() => setShowImagePicker(false)}
      //         onSelect={(image) => {
      //           onChange(image);
      //           setShowImagePicker(false);
      //         }}
      //       />
      //     </>
      //   );
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
