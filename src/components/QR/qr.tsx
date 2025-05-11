"use client"

import { Noto_Sans_Mono } from "next/font/google";
import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { HexColorPicker } from 'react-colorful';

export const revalidate = 86400;

const noto_mono = Noto_Sans_Mono({
    subsets:['latin']
});

function svgToPng(svgElement: SVGSVGElement, size: number, fg: string, bg: string, callback: (dataUrl: string) => void) {
  // Border and padding settings
  const borderWidth = 16; // px
  const borderColor = '#999'; // or any color you want
  const padding = 64; // px (increased from 32)
  const totalSize = size + 2 * (borderWidth + padding);

  const svgString = new XMLSerializer().serializeToString(svgElement);
  const img = new window.Image();
  // Only replace fg color, not background color
  const svg = svgString.replace(/#000000|black/g, fg);
  img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = totalSize;
    canvas.height = totalSize;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw border
      ctx.fillStyle = borderColor;
      ctx.fillRect(0, 0, totalSize, totalSize);
      // Draw padding (background)
      ctx.fillStyle = bg;
      ctx.fillRect(borderWidth, borderWidth, totalSize - 2 * borderWidth, totalSize - 2 * borderWidth);
      // Draw QR image
      ctx.drawImage(img, borderWidth + padding, borderWidth + padding, size, size);
      callback(canvas.toDataURL('image/png'));
    }
  };
}

function QR() {
  const [input, setInput] = useState('https://sujankumal.com.np/QR');
  const qrRef = useRef<HTMLDivElement | null>(null);
  const [fgColor, setFgColor] = useState('#222222');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showFgPicker, setShowFgPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);

  const downloadQR = (size: number, asPng: boolean) => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    if (asPng) {
      svgToPng(svg as SVGSVGElement, size, fgColor, bgColor, (dataUrl) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `qr-code-${size}.png`;
        link.click();
      });
    } else {
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svg);
      const blob = new Blob([source], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qr-code.svg';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <main className={"grid md:grid-cols-4 min-h-screen justify-center items-center bg-gray-50 dark:bg-gray-900 p-4 " + noto_mono.className}>
      <div className="mb-8 p-8 md:m-8 md:col-span-3 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="max-w-none w-full flex flex-col items-center">
          <div className="p-6 w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-center">QR Code Generator</h2>
            <p className="text-xs text-gray-500 mb-2 text-center">Tip: Paste or type a link (e.g., https://example.com) in the field below to generate a QR code for it.</p>
            <input
              type="text"
              placeholder="Enter any link or text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4 text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-center items-center">
              <button onClick={() => setShowFgPicker(v => !v)} className="flex items-center gap-2 px-3 py-1 bg-gray-200 rounded">
                <span className="w-4 h-4 rounded border border-gray-400" style={{ background: fgColor }}></span>
                QR Color
              </button>
              <button onClick={() => setShowBgPicker(v => !v)} className="flex items-center gap-2 px-3 py-1 bg-gray-200 rounded">
                <span className="w-4 h-4 rounded border border-gray-400" style={{ background: bgColor }}></span>
                Background
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full mb-2 justify-center items-center">
              {showFgPicker && <div className="mb-2 sm:mb-0"><HexColorPicker color={fgColor} onChange={setFgColor} /></div>}
              {showBgPicker && <div><HexColorPicker color={bgColor} onChange={setBgColor} /></div>}
            </div>
            <div className="flex flex-col items-start gap-2 mb-6">
              <span className="font-medium text-gray-700 dark:text-gray-200 mb-1">Download as</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => downloadQR(256, true)}
                  disabled={!input}
                  className="px-2 py-1 text-xs bg-teal-600 text-white rounded shadow hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  PNG 256x256
                </button>
                <button
                  onClick={() => downloadQR(512, true)}
                  disabled={!input}
                  className="px-2 py-1 text-xs bg-teal-600 text-white rounded shadow hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  PNG 512x512
                </button>
                <button
                  onClick={() => downloadQR(800, true)}
                  disabled={!input}
                  className="px-2 py-1 text-xs bg-teal-600 text-white rounded shadow hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  PNG 800x800
                </button>
                <button
                  onClick={() => downloadQR(256, false)}
                  disabled={!input}
                  className="px-2 py-1 text-xs bg-gray-700 text-white rounded shadow hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  SVG
                </button>
              </div>
            </div>
            <div ref={qrRef} className="mt-6 flex justify-center items-center p-4 border border-dashed border-teal-400 rounded-lg bg-gray-100 dark:bg-gray-700">
              {input && (
                <QRCodeSVG
                  value={input}
                  size={256}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level="Q"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default QR;