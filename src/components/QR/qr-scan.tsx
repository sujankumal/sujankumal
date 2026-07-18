"use client"

import React, { useRef, useState } from "react";

export default function QRScanPage() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  async function handleFile(file?: File) {
    setError(null);
    setResult(null);
    if (!file) return;
    setScanning(true);

    try {
      const img = new Image();
      imgRef.current = img;
      const url = URL.createObjectURL(file);
      img.src = url;
      await new Promise((res, rej) => {
        img.onload = () => res(true);
        img.onerror = (e) => rej(e);
      });

      // Draw into canvas with a reasonable max size for performance
      const maxDim = 1024;
      const { width: iw, height: ih } = img;
      let w = iw;
      let h = ih;
      if (Math.max(iw, ih) > maxDim) {
        const scale = maxDim / Math.max(iw, ih);
        w = Math.round(iw * scale);
        h = Math.round(ih * scale);
      }

      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Unable to get canvas context");
      ctx.drawImage(img, 0, 0, w, h);


      // Fallback: try dynamic import of jsQR if available
      try {
        // Import only when needed to keep initial bundle small
        // @ts-ignore
        const { default: jsQR } = await import("jsqr");
        const imageData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          setResult(code.data);
          setScanning(false);
          URL.revokeObjectURL(url);
          return;
        }
      } catch (e) {

        // Try browser BarcodeDetector first (fast, native)
        const win = window as any;
        if (win.BarcodeDetector) {
          try {
            const detector = new win.BarcodeDetector({ formats: ["qr_code"] });
            // detect expects an ImageBitmapSource — canvas works
            const barcodes = await detector.detect(canvas as any);
            if (barcodes && barcodes.length > 0) {
              setResult(barcodes[0].rawValue || "");
              setScanning(false);
              URL.revokeObjectURL(url);
              return;
            }
          } catch (e) {
            // fall through to jsQR fallback
          }
        }
      }

      setError("No QR code detected. Try a clearer image or use a browser with BarcodeDetector support.");
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setScanning(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (f) handleFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.type.startsWith("image/")) {
        const file = it.getAsFile();
        if (file) await handleFile(file);
        return;
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Scan QR from Image</h1>
      <p className="text-sm text-gray-600 mb-4">Upload, paste, or drag an image that contains a QR code. Uses the native BarcodeDetector when available for best performance.</p>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={handlePaste}
        className="border border-dashed rounded p-4 mb-4 bg-white"
      >
        <input aria-label="Upload image" type="file" accept="image/*" capture="environment" onChange={handleInputChange} />
        <div className="mt-3 text-sm text-gray-500">Or paste an image from the clipboard / drag & drop an image here.</div>
      </div>

      <div className="text-center">
        <div className="mx-auto">
          <canvas ref={canvasRef} className="border block mx-auto" style={{ maxWidth: 320, maxHeight: 320 }} />
        </div>
        <div className="mt-4 mx-auto">
          {scanning && <div className="text-sm text-orange-600">Scanning…</div>}
          {result && (
            <div>
              <div>
                <h2 className="font-medium">Result</h2>
                <pre className="bg-gray-100 p-2 rounded text-left break-all whitespace-pre-wrap max-w-full overflow-x-auto">{result}</pre>
              </div>
              <div className="mt-2 space-x-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(result)}
                  className="px-3 py-1 bg-orange-600 text-white rounded"
                >
                  Copy
                </button>
                {/^https?:\/\//.test(result) && (
                  <a href={result} target="_blank" rel="noreferrer" className="px-3 py-1 bg-gray-800 text-white rounded">Open</a>
                )}
              </div>
            </div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}
