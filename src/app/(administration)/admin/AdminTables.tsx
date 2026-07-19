"use client";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { AdminColumn } from "@/config/types";

interface TableSectionProps {
  columns: AdminColumn[];
  items: any[];
}

// Image cell component with consistent URL formatting
function ImageCell({ value, field }: { value: string; field: string }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Format image URL to match your existing pattern
  const formatImageUrl = (url: string): string => {
    if (!url || typeof url !== 'string') return '';

    const trimmedUrl = url.trim();
    if (!trimmedUrl) return '';

    // If it's already an absolute URL, return as is
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }

    // If it already starts with /images/, return as is
    if (trimmedUrl.startsWith('/images/')) {
      return trimmedUrl;
    }

    // If it starts with /, return as is (for other absolute paths)
    if (trimmedUrl.startsWith('/')) {
      return trimmedUrl;
    }

    // Otherwise, prepend with /images/ to match your existing pattern
    return `/images/${trimmedUrl}`;
  };

  const imageSrc = formatImageUrl(value);

  // If no valid image URL, show placeholder
  if (!imageSrc || imageError) {
    return (
      <div className="w-20 h-10 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
        <ImageIcon className="h-4 w-4 text-gray-400" />
        {imageError && (
          <span className="sr-only">Failed to load image: {value}</span>
        )}
      </div>
    );
  }

  return (
    <div className="w-20 h-10 relative bg-gray-100 rounded overflow-hidden border border-gray-200">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
        </div>
      )}
      <Image
        src={imageSrc}
        alt={field}
        fill
        className="object-cover"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
        sizes="80px"
      />
    </div>
  );
}

export function TableSection({ columns, items }: TableSectionProps) {
  return (
    <section className="mb-12">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.field} className="px-4 py-2 text-left text-sm text-gray-700">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const rowKey = item.id ?? (item.identifier && item.token ? `${item.identifier}-${item.token}` : idx);
              return (
                <tr key={rowKey} className="border-b hover:bg-gray-50 transition-colors">
                  {columns.map((column) => (
                    <td key={column.field} className="px-4 py-2 text-xs">
                      {column.renderer === 'markdown' ? (
                        <div className="max-w-xs prose prose-xs prose-orange line-clamp-3">
                          <ReactMarkdown>
                            {item[column.field]}
                          </ReactMarkdown>
                        </div>
                      ) : column.renderer === 'image' && item[column.field] && typeof item[column.field] === 'string' && item[column.field].trim() !== '' ? (
                        <ImageCell value={item[column.field]} field={column.field} />
                      ) : typeof item[column.field] === 'boolean' ? (
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${item[column.field] ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                          {item[column.field] ? "Yes" : "No"}
                        </span>
                      ) : item[column.field] instanceof Date ? (
                        new Date(item[column.field]).toLocaleDateString()
                      ) : typeof item[column.field] === 'string' && item[column.field].length > 50 ? (
                        <span title={item[column.field]} className="truncate block max-w-xs">
                          {item[column.field].substring(0, 50)}...
                        </span>
                      ) : (
                        String(item[column.field] ?? "")
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
