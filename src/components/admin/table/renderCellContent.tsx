"use client";

import ReactMarkdown from "react-markdown";
import { ImageCell } from "./ImageCell";

/**
 * Renders the appropriate content for a table cell based on the column's
 * `renderer` type and the item's value.
 *
 * Supported renderers: text, number, date, boolean, image, markdown,
 * relation, manyToMany, plus automatic FK-relationship display.
 */
export function renderCellContent(item: any, column: any): React.ReactNode {
  const { field, renderer, display } = column;
  const value = item[field];

  if (renderer === "markdown" && value) {
    return (
      <div className="max-w-none prose prose-xs prose-orange line-clamp-3">
        <ReactMarkdown>{value}</ReactMarkdown>
      </div>
    );
  }

  if (renderer === "image" && value) {
    return <ImageCell value={value} field={field} />;
  }

  // Handle foreign key relationships (e.g. authorId → author.name)
  if (field.endsWith("Id") && item[field.replace("Id", "")]) {
    const relatedItem = item[field.replace("Id", "")];
    if (relatedItem) {
      const displayName = relatedItem.name || relatedItem.title || relatedItem.email || `ID: ${value}`;
      return (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-900">{displayName}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ID: {value}</span>
        </div>
      );
    }
  }

  // Handle explicit relation field
  if (renderer === "relation" && value) {
    const displayValue =
      value?.[display ?? "name"] ??
      value?.[display ?? "post"] ??
      value?.[display ?? "category"] ??
      value?.title ??
      value?.name ??
      value?.email ??
      value?.id;

    return (
      <div className="flex items-center space-x-2">
        <span>{displayValue}</span>
      </div>
    );
  }

  if (renderer === "manyToMany" && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.slice(0, 3).map((item: any, idx: number) => {
          const displayValue =
            item.category?.[display ?? "name"] ??
            item[display ?? "name"] ??
            item.title ??
            item.name;
          return (
            <span
              key={`${item.id || idx}-${column.field}`}
              className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full"
            >
              {displayValue}
            </span>
          );
        })}
        {value.length > 3 && (
          <span className="text-xs text-gray-500">
            +{value.length - 3} more
          </span>
        )}
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        {value ? "Yes" : "No"}
      </span>
    );
  }

  if (renderer === "date" && value) {
    return new Date(value).toLocaleDateString();
  }

  if (renderer === "number") {
    return value ?? "";
  }

  if (typeof value === "string" && value.length > 50) {
    return (
      <span title={value} className="truncate block max-w-xs">
        {value.substring(0, 50)}...
      </span>
    );
  }

  // Guard against rendering objects as [object Object]
  if (value !== null && typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value ?? "");
}
