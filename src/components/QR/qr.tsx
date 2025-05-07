"use client"

import { Noto_Sans_Mono } from "next/font/google";
import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const revalidate = 10;

const noto_mono = Noto_Sans_Mono({
    subsets:['latin']
});

function QR() {
  const [input, setInput] = useState('https://sujankumal.com.np/QR');
  const qrRef = useRef<HTMLDivElement | null>(null);

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qr-code.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={"grid md:grid-cols-4 min-h-screen justify-center items-center bg-gray-50 dark:bg-gray-900 p-4 " + noto_mono.className}>
      <div className="mb-8 p-8 md:m-8 md:col-span-3 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="max-w-none w-full flex flex-col items-center">
          <div className="p-6 w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-center">QR Code Generator</h2>
            <input
              type="text"
              placeholder="Enter any link or text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4 text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={downloadQR}
              disabled={!input}
              className="px-6 py-2 bg-teal-600 text-white rounded-md shadow hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-6"
            >
              Download QR
            </button>
            <div ref={qrRef} className="mt-6 flex justify-center items-center p-4 border border-dashed border-teal-400 rounded-lg bg-gray-100 dark:bg-gray-700">
              {input && <QRCodeSVG value={input} size={256} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default QR;