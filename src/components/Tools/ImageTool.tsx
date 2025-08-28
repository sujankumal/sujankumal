'use client'
import React, { useState, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import exifr from 'exifr';
import { ToastContainer, toast } from 'react-toastify';

export default function ImageTool() {
  // Crop modal manual controls
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoomCrop, setZoomCrop] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  // Ref for preview container during drag
  const [image, setImage] = useState<File | null>(null);
  const [inputFileName, setInputFileName] = useState<string>('output.jpg');
  const [zoom, setZoom] = useState(1);
  // Zoom handler
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(Number(e.target.value));
  };
  const [preview, setPreview] = useState<string | null>(null);
  const [rawPreview, setRawPreview] = useState<string | null>(null);
  // Use croppedPreview as reference for all operations if set
  const referencePreview = croppedPreview || rawPreview;
  const [exif, setExif] = useState<any>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compression, setCompression] = useState(0.8);
  const [outWidthMM, setOutWidthMM] = useState<number | null>(null);
  const [outHeightMM, setOutHeightMM] = useState<number | null>(null);
  const [rotate, setRotate] = useState<number>(0);
  const [mirrorH, setMirrorH] = useState(false);
  const [mirrorV, setMirrorV] = useState(false);
  const [showExif, setShowExif] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const cropRef = useRef<HTMLDivElement>(null);
  const [cropOffset, setCropOffset] = useState<{x: number, y: number}>({x: 0, y: 0});

  // Handle image upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setInputFileName(file.name || 'output.jpg');
    setOutWidthMM(null);
    setOutHeightMM(null);
    try {
      const exifData = await exifr.parse(file);
      setExif(exifData);
    } catch (err) {
      setExif(null);
    }
    // Create raw preview URL
    const url = URL.createObjectURL(file);
    setRawPreview(url);
  };

  // Cleanup raw preview URL when image changes or component unmounts
  useEffect(() => {
    return () => {
      if (rawPreview) {
        URL.revokeObjectURL(rawPreview);
      }
    };
  }, [rawPreview]);

  // Live preview canvas rendering
  useEffect(() => {
    if (!referencePreview) {
      setPreview(null);
      return;
    }
    const img = document.createElement('img');
    img.src = referencePreview;
    img.onload = () => {
      // Convert mm to px (300 DPI)
      const mmToPx = (mm: number) => Math.round(mm * 11.811);
      let cropW = outWidthMM ? mmToPx(outWidthMM) : img.width;
      let cropH = outHeightMM ? mmToPx(outHeightMM) : img.height;
      // Maintain aspect ratio, do not scale/stretch
      if (outWidthMM && outHeightMM) {
        const targetRatio = cropW / cropH;
        const imgRatio = img.width / img.height;
        if (imgRatio > targetRatio) {
          cropH = img.height;
          cropW = Math.round(cropH * targetRatio);
        } else {
          cropW = img.width;
          cropH = Math.round(cropW / targetRatio);
        }
      } else {
        cropW = img.width;
        cropH = img.height;
      }
      // Apply zoom to output size
      const zoomedW = Math.round(cropW * zoom);
      const zoomedH = Math.round(cropH * zoom);
      // Crop position (center + offset)
      let cropX = Math.floor((img.width - cropW) / 2) + cropOffset.x;
      let cropY = Math.floor((img.height - cropH) / 2) + cropOffset.y;
      cropX = Math.max(0, Math.min(cropX, img.width - cropW));
      cropY = Math.max(0, Math.min(cropY, img.height - cropH));
      const canvas = document.createElement('canvas');
      // canvas.width = zoomedW;
      // canvas.height = zoomedH;
      const paddingPx = mmToPx(1);
      canvas.width = zoomedW + 2 * paddingPx;
      canvas.height = zoomedH + 2 * paddingPx;
      const ctx = canvas.getContext('2d');
      if (!ctx) return setPreview(referencePreview);
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Mirror
      if (mirrorH) {
        ctx.translate(zoomedW, 0);
        ctx.scale(-1, 1);
      }
      if (mirrorV) {
        ctx.translate(0, zoomedH);
        ctx.scale(1, -1);
      }
      // Rotate
      if (rotate !== 0) {
        ctx.translate(zoomedW / 2, zoomedH / 2);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.translate(-zoomedW / 2, -zoomedH / 2);
      }
      // Filter for brightness, contrast, saturation
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      // ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, zoomedW, zoomedH);
      ctx.drawImage(img, cropX, cropY, cropW, cropH, paddingPx, paddingPx, zoomedW, zoomedH);
      ctx.restore();
      setPreview(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => setPreview(referencePreview);
  }, [referencePreview, outWidthMM, outHeightMM, cropOffset, rotate, mirrorH, mirrorV, brightness, contrast, saturation, zoom]);

  // Cleanup preview URL when image changes or component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Compress to JPG with options and adjustments
  const handleCompress = async () => {
    if (!image) return;
    const img = document.createElement('img');
  img.src = referencePreview!;
    img.onload = () => {
      // Convert mm to px (300 DPI)
      const mmToPx = (mm: number) => Math.round(mm * 11.811);
      let cropW = outWidthMM ? mmToPx(outWidthMM) : img.width;
      let cropH = outHeightMM ? mmToPx(outHeightMM) : img.height;
      if (outWidthMM && outHeightMM) {
        const targetRatio = cropW / cropH;
        const imgRatio = img.width / img.height;
        if (imgRatio > targetRatio) {
          cropH = img.height;
          cropW = Math.round(cropH * targetRatio);
        } else {
          cropW = img.width;
          cropH = Math.round(cropW / targetRatio);
        }
      } else {
        cropW = img.width;
        cropH = img.height;
      }
      // Apply zoom to output size
      const zoomedW = Math.round(cropW * zoom);
      const zoomedH = Math.round(cropH * zoom);
      let cropX = Math.floor((img.width - cropW) / 2);
      let cropY = Math.floor((img.height - cropH) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = zoomedW;
      canvas.height = zoomedH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return setError('Canvas error.');
      ctx.save();
      if (mirrorH) ctx.scale(-1, 1);
      if (mirrorV) ctx.scale(1, -1);
      if (rotate !== 0) {
        ctx.translate(zoomedW / 2, zoomedH / 2);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.translate(-zoomedW / 2, -zoomedH / 2);
      }
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, zoomedW, zoomedH);
      ctx.restore();
      const jpg = canvas.toDataURL('image/jpeg', compression);
      setOutput(jpg);
    };
    img.onerror = () => setError('Failed to load image for compression.');
  };
  // Passport Photo Sheet (100x150mm, 300 DPI, auto duplicate processed image)
  const handlePassportSheet = () => {
    if (!preview){
      toast.info("Please select a new image.");
      return
    }
    if (!outWidthMM || !outHeightMM){
      toast.info("Please set output size to generate the sheet.");
      return
    }
    const src = preview || referencePreview;
    if (!src) return;
    const img = document.createElement('img');
    img.src = src;
    img.onload = () => {
      // mm to px converter
      const mmToPx = (mm: number) => Math.round(mm * 11.811);
      
      // Photo dimensions
      const photoW = outWidthMM ? mmToPx(outWidthMM) : 413;
      const photoH = outHeightMM ? mmToPx(outHeightMM) : 531;
      const paddingPx = mmToPx(1); // 1mm padding between photos

      // Sheet dimensions
      const sheetW = 1772;
      const sheetH = 1181;

      // Try all possible combinations: portrait/landscape sheet and photo rotation
      const options = [
        { sheetW, sheetH, w: photoW, h: photoH, rotated: false },
        { sheetW, sheetH, w: photoH, h: photoW, rotated: true },
        { sheetW: sheetH, sheetH: sheetW, w: photoW, h: photoH, rotated: false },
        { sheetW: sheetH, sheetH: sheetW, w: photoH, h: photoW, rotated: true }
      ];

      let best = { count: 0, w: 0, h: 0, cols: 0, rows: 0, rotated: false, sheetW: 0, sheetH: 0 };
      
      for (const opt of options) {
        const cols = Math.floor((opt.sheetW - paddingPx) / (opt.w + paddingPx));
        const rows = Math.floor((opt.sheetH - paddingPx) / (opt.h + paddingPx));
        const count = cols * rows;

        if (count > best.count) {
          best = {
            count,
            w: opt.w,
            h: opt.h,
            cols,
            rows,
            rotated: opt.rotated,
            sheetW: opt.sheetW,
            sheetH: opt.sheetH
          };
        }
      }
      
      const totalW = best.cols * best.w + (best.cols - 1) * paddingPx;
      const totalH = best.rows * best.h + (best.rows - 1) * paddingPx;
      const xPad = Math.floor((best.sheetW - totalW) / 2);
      const yPad = Math.floor((best.sheetH - totalH) / 2);

      const canvas = document.createElement('canvas');
      canvas.width = best.sheetW;
      canvas.height = best.sheetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return setError('Canvas error.');

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, best.sheetW, best.sheetH);
      
      const aspectRatio = img.width / img.height;

      for (let r = 0; r < best.rows; r++) {
        for (let c = 0; c < best.cols; c++) {
          let drawW, drawH;
          let photoFrameW = best.w;
          let photoFrameH = best.h;

          if (best.rotated) {
            [photoFrameW, photoFrameH] = [photoFrameH, photoFrameW];
          }

          if (aspectRatio > photoFrameW / photoFrameH) {
            drawW = photoFrameW;
            drawH = photoFrameW / aspectRatio;
          } else {
            drawH = photoFrameH;
            drawW = photoFrameH * aspectRatio;
          }

          const x = xPad + c * (best.w + paddingPx);
          const y = yPad + r * (best.h + paddingPx);
          const centeredX = x + (best.w - drawW) / 2;
          const centeredY = y + (best.h - drawH) / 2;

          ctx.save();
          if (best.rotated) {
            ctx.translate(centeredX + drawW / 2, centeredY + drawH / 2);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(img, 0, 0, img.width, img.height, -drawH / 2, -drawW / 2, drawH, drawW);
          } else {
            ctx.drawImage(img, 0, 0, img.width, img.height, centeredX, centeredY, drawW, drawH);
          }
          ctx.restore();
        }
      }
      setOutput(canvas.toDataURL('image/jpeg', compression));
    };
    img.onerror = () => setError('Failed to create passport sheet.');
  };

  // Crop (simple center crop or selection)
  const handleCrop = () => {
    if (!image) return;
    const img = document.createElement('img');
    img.src = rawPreview!;
    img.onload = () => {
      let cropX = 0, cropY = 0, cropW = img.width, cropH = img.height;
      if (cropRef.current) {
        const cropRect = cropRef.current.getBoundingClientRect();
        const imgElem = cropRef.current.parentElement?.querySelector('img');
        if (imgElem) {
          const imgRect = imgElem.getBoundingClientRect();
          const scaleX = img.width / imgRect.width;
          const scaleY = img.height / imgRect.height;
          cropW = Math.floor(cropRect.width * scaleX);
          cropH = Math.floor(cropRect.height * scaleY);
          cropX = Math.floor((cropRect.left - imgRect.left) * scaleX);
          cropY = Math.floor((cropRect.top - imgRect.top) * scaleY);
        } else {
          const size = Math.min(img.width, img.height);
          cropW = cropH = size;
          cropX = (img.width - size) / 2;
          cropY = (img.height - size) / 2;
        }
      } else {
        const size = Math.min(img.width, img.height);
        cropW = cropH = size;
        cropX = (img.width - size) / 2;
        cropY = (img.height - size) / 2;
      }
      // Apply zoom to output size
      const zoomedW = Math.round(cropW * zoom);
      const zoomedH = Math.round(cropH * zoom);
      const canvas = document.createElement('canvas');
      canvas.width = zoomedW;
      canvas.height = zoomedH;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(
        img,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        zoomedW,
        zoomedH
      );
      setOutput(canvas.toDataURL('image/jpeg', compression));
    };
    img.onerror = () => setError('Failed to crop image.');
  };

  // Set rotation
  const handleRotate = (deg: number) => {
    setRotate(deg);
  };
  // Mirror
  const handleMirrorH = () => setMirrorH((v) => !v);
  const handleMirrorV = () => setMirrorV((v) => !v);



  // Use croppedPreview as reference for all operations if set

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Image Compression and Tools</h2>
      <input type="file" accept="image/*" onChange={handleImageChange} className="mb-4" />
      {(preview || rawPreview) && (
        <div className="mb-4 flex flex-col md:flex-row items-center gap-4">
          {rawPreview && (
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">Reference Image</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rawPreview} alt="Reference" className="max-w-full max-h-64 rounded border block" />
            </div>
          )}
          {preview && (
            <div className="relative inline-block">
              <span className="text-xs text-gray-500 mb-1 block text-center">Live Preview</span>
              <div
                className="w-80 h-80 flex items-center justify-center bg-gray-50 rounded border overflow-hidden"
                style={{ position: 'relative' }}
              >
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {exif && (
        <div className="mb-4 text-xs bg-gray-100 p-2 rounded">
          <button onClick={() => setShowExif((v) => !v)} className="text-teal-700 underline mb-2">{showExif ? 'Hide' : 'Show'} EXIF Data</button>
          {showExif && <pre className="overflow-x-auto max-h-64">{JSON.stringify(exif, null, 2)}</pre>}
        </div>
      )}
      {output && (
        <div className="mb-4">
          <h3 className="font-semibold">Output Image:</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={output} alt="Output" className="max-w-full max-h-64 rounded border" />
          <div className="mt-2 flex items-center gap-2">
            <a href={output} download={inputFileName} className="text-teal-700 underline">Download JPG</a>
            <span className="text-xs text-gray-600">(
              {(() => {
                // Calculate base64 size in KB
                const size = output.length * (3/4) - (output.endsWith('==') ? 2 : output.endsWith('=') ? 1 : 0);
                return `${Math.round(size/1024)} KB`;
              })()}
            )</span>
          </div>
          {exif && (
            <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
              <span className="font-semibold">EXIF will be preserved in original file. Downloaded output is a new JPG without EXIF unless you use a library to re-embed it.</span>
            </div>
          )}
        </div>
      )}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Compression Level: {compression}</label>
          <input type="range" min={0.1} max={1} step={0.01} value={compression} onChange={e => setCompression(Number(e.target.value))} />
          <label className="font-semibold">Output Size (mm):</label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              className={`px-2 py-1 rounded border ${outWidthMM === 25 && outHeightMM === 30 ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}
              onClick={() => { setOutWidthMM(25); setOutHeightMM(30); }}
            >25x30</button>
            <button
              type="button"
              className={`px-2 py-1 rounded border ${outWidthMM === 35 && outHeightMM === 45 ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}
              onClick={() => { setOutWidthMM(35); setOutHeightMM(45); }}
            >35x45</button>
          </div>
          <div className="flex gap-2">
            <input type="number" placeholder="Width (mm)" value={outWidthMM ?? ''} onChange={e => setOutWidthMM(e.target.value ? Number(e.target.value) : null)} className="border rounded px-2 py-1 w-24" />
            <input type="number" placeholder="Height (mm)" value={outHeightMM ?? ''} onChange={e => setOutHeightMM(e.target.value ? Number(e.target.value) : null)} className="border rounded px-2 py-1 w-24" />
          </div>
          <label className="font-semibold">Brightness: {brightness}%</label>
          <input type="range" min={0} max={200} value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
          <label className="font-semibold">Contrast: {contrast}%</label>
          <input type="range" min={0} max={200} value={contrast} onChange={e => setContrast(Number(e.target.value))} />
          <label className="font-semibold">Saturation: {saturation}%</label>
          <input type="range" min={0} max={200} value={saturation} onChange={e => setSaturation(Number(e.target.value))} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Rotate:</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => handleRotate(0)} className={`px-2 py-1 rounded ${rotate === 0 ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>0°</button>
            <button type="button" onClick={() => handleRotate(90)} className={`px-2 py-1 rounded ${rotate === 90 ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>90°</button>
            <button type="button" onClick={() => handleRotate(180)} className={`px-2 py-1 rounded ${rotate === 180 ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>180°</button>
            <button type="button" onClick={() => handleRotate(270)} className={`px-2 py-1 rounded ${rotate === 270 ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>270°</button>
          </div>
          <label className="font-semibold">Mirror:</label>
          <div className="flex gap-2">
            <button type="button" onClick={handleMirrorH} className={`px-2 py-1 rounded ${mirrorH ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>Horizontal</button>
            <button type="button" onClick={handleMirrorV} className={`px-2 py-1 rounded ${mirrorV ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>Vertical</button>
          </div>
          <label className="font-semibold">Passport Photo Sheet:</label>
          <button 
            type="button" onClick={handlePassportSheet} 
            className={`bg-teal-600 text-white px-4 py-2 rounded ${outWidthMM && outHeightMM ? '' :'disabled:opacity-90 disabled:bg-yellow-800'}`}
            title={!outWidthMM || !outHeightMM ? "Please set output size to generate the sheet." : ""}
            >Generate 100x150mm Sheet</button>
            <ToastContainer position="bottom-right" theme="dark"/>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={handleCompress} className="bg-teal-600 text-white px-4 py-2 rounded">Refresh Output</button>
        <button onClick={() => setShowCropModal(true)} className="bg-teal-600 text-white px-4 py-2 rounded">Crop</button>
        <button onClick={() => {
          setCroppedPreview(null);
          setPreview(rawPreview);
          setShowCropModal(false); // Ensure crop modal resets
        }} className="bg-gray-400 text-white px-4 py-2 rounded">Revert to Original</button>
      </div>
      {showCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-2 relative w-[400px]">
            <h3 className="font-semibold mb-2">Crop Image</h3>
            <div className="flex gap-2 mb-2 text-xs">
              <label className="my-auto">Aspect Ratio:</label>
              <input
                type="number"
                min={0.1}
                step={0.01}
                value={aspectRatio}
                onChange={e => setAspectRatio(Number(e.target.value) || 1)}
                className="border rounded px-1 w-20"
              />
              <button className={`px-1 py-1 rounded border ${aspectRatio === 1 ? 'bg-teal-600 text-white' : 'bg-gray-100'}`} onClick={() => setAspectRatio(1)}>1:1</button>
              <button className={`px-1 py-1 rounded border ${aspectRatio === 4/3 ? 'bg-teal-600 text-white' : 'bg-gray-100'}`} onClick={() => setAspectRatio(4/3)}>4:3</button>
              <button className={`px-1 py-1 rounded border ${aspectRatio === 3/4 ? 'bg-teal-600 text-white' : 'bg-gray-100'}`} onClick={() => setAspectRatio(3/4)}>3:4</button>
              <button className={`px-1 py-1 rounded border ${aspectRatio === 16/9 ? 'bg-teal-600 text-white' : 'bg-gray-100'}`} onClick={() => setAspectRatio(16/9)}>16:9</button>
              <button className={`px-1 py-1 rounded border ${aspectRatio === 9/16 ? 'bg-teal-600 text-white' : 'bg-gray-100'}`} onClick={() => setAspectRatio(9/16)}>9:16</button>
            </div>
            {/* Crop size controls removed as requested */}
            <div className="relative w-full h-64 bg-gray-100 mb-4">
              <Cropper
                image={referencePreview || ''}
                crop={crop}
                zoom={zoomCrop}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoomCrop}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs">Zoom:</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoomCrop}
                onChange={e => setZoomCrop(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-xs">{(zoomCrop * 100).toFixed(0)}%</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="bg-teal-600 text-white px-4 py-2 rounded"
                onClick={async () => {
                  if (!referencePreview || !croppedAreaPixels) return;
                  // Crop the image using canvas
                  const img = document.createElement('img');
                  img.src = referencePreview;
                  await new Promise(res => { img.onload = res; });
                  const canvas = document.createElement('canvas');
                  // Use areaPixels for crop size
                  canvas.width = croppedAreaPixels.width;
                  canvas.height = croppedAreaPixels.height;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(
                      img,
                      croppedAreaPixels.x,
                      croppedAreaPixels.y,
                      croppedAreaPixels.width,
                      croppedAreaPixels.height,
                      0,
                      0,
                      croppedAreaPixels.width,
                      croppedAreaPixels.height
                    );
                    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                    setCroppedPreview(croppedDataUrl);
                    setPreview(croppedDataUrl);
                  }
                  setShowCropModal(false);
                }}
              >Crop</button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowCropModal(false)}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
