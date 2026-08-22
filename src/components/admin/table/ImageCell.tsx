"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { formatImageUrl } from "@/lib/image";

interface ImageCellProps {
  value: string;
  field: string;
}

/** Renders a small thumbnail in table cells where renderer === "image". */
export function ImageCell({ value, field }: ImageCellProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageSrc = formatImageUrl(value);

  if (!imageSrc || imageError) {
    return (
      <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
        <ImageIcon className="h-4 w-4 text-gray-400" />
        {imageError && (
          <span className="sr-only">Failed to load image: {value}</span>
        )}
      </div>
    );
  }

  return (
    <div className="w-16 h-10 relative bg-gray-100 rounded overflow-hidden border border-gray-200">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
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
        unoptimized
        sizes="64px"
      />
    </div>
  );
}
