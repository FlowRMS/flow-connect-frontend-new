'use client';

import React, { useRef, useState } from 'react';

interface SignatureCaptureModalProps {
  isOpen: boolean;
  pickupName: string;
  driverName: string;
  pickupNotes: string;
  onPickupNameChange: (name: string) => void;
  onDriverNameChange: (name: string) => void;
  onPickupNotesChange: (notes: string) => void;
  onClose: () => void;
  onConfirm: (signatureData: string, timestamp: Date) => void;
}

export default function SignatureCaptureModal({
  isOpen,
  pickupName,
  driverName,
  pickupNotes,
  onPickupNameChange,
  onDriverNameChange,
  onPickupNotesChange,
  onClose,
  onConfirm,
}: SignatureCaptureModalProps) {
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  if (!isOpen) return null;

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleCancel = () => {
    clearSignature();
    onClose();
  };

  const handleConfirm = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const signatureData = canvas.toDataURL('image/png');
      onConfirm(signatureData, new Date());
    }
  };

  const startDrawing = (x: number, y: number) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
      ctx?.moveTo(x, y);
    }
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <div className="fixed inset-0 bg-[var(--card)] z-50 flex flex-col">
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Signature & Release</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Capture handoff signature for proof of pickup</p>
          </div>
        </div>
        <button
          onClick={handleCancel}
          className="p-3 hover:bg-purple-100 rounded-xl transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-semibold text-[var(--foreground)] mb-2">
                Customer Name <span className="text-[var(--muted-foreground)] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={pickupName}
                onChange={(e) => onPickupNameChange(e.target.value)}
                placeholder="Customer or company name"
                className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl bg-[var(--background)] text-base focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-base font-semibold text-[var(--foreground)] mb-2">
                Driver / Pickup Name <span className="text-[var(--muted-foreground)] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => onDriverNameChange(e.target.value)}
                placeholder="Name of person picking up"
                className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl bg-[var(--background)] text-base focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Signature Canvas */}
          <div>
            <label className="block text-base font-semibold text-[var(--foreground)] mb-2">
              Signature <span className="text-red-500">*</span>
            </label>
            <div className="relative border-2 border-dashed border-purple-300 rounded-xl bg-white overflow-hidden">
              <canvas
                ref={signatureCanvasRef}
                width={800}
                height={300}
                className="w-full touch-none cursor-crosshair"
                style={{ minHeight: '250px' }}
                onMouseDown={(e) => {
                  const canvas = signatureCanvasRef.current;
                  if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
                    startDrawing(x, y);
                  }
                }}
                onMouseMove={(e) => {
                  const canvas = signatureCanvasRef.current;
                  if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
                    draw(x, y);
                  }
                }}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const canvas = signatureCanvasRef.current;
                  if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const touch = e.touches[0];
                    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
                    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
                    startDrawing(x, y);
                  }
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const canvas = signatureCanvasRef.current;
                  if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const touch = e.touches[0];
                    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
                    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
                    draw(x, y);
                  }
                }}
                onTouchEnd={stopDrawing}
              />
              <div className="absolute bottom-3 left-4 text-sm text-gray-400">
                Sign above using finger or stylus
              </div>
              <button
                onClick={clearSignature}
                className="absolute top-3 right-3 px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear Signature
              </button>
            </div>
          </div>

          {/* Timestamp */}
          <div>
            <label className="block text-base font-semibold text-[var(--foreground)] mb-2">Timestamp</label>
            <div className="px-4 py-3 bg-[var(--muted)]/30 border-2 border-[var(--border)] rounded-xl text-base text-[var(--muted-foreground)]">
              {new Date().toLocaleString()}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-base font-semibold text-[var(--foreground)] mb-2">
              Notes <span className="text-[var(--muted-foreground)] font-normal">(Optional)</span>
            </label>
            <textarea
              value={pickupNotes}
              onChange={(e) => onPickupNotesChange(e.target.value)}
              placeholder="Any additional notes about the pickup or delivery..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl bg-[var(--background)] text-base focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20 flex justify-center gap-4">
        <button
          onClick={handleCancel}
          className="px-8 py-3 border-2 border-[var(--border)] rounded-xl text-base font-semibold hover:bg-[var(--muted)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="px-8 py-3 rounded-xl text-base font-semibold flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Confirm & Save
        </button>
      </div>
    </div>
  );
}

