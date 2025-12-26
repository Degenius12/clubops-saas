import React, { useRef, useState, useEffect, MouseEvent, TouchEvent } from 'react';
import { RotateCcw, Check, Pen, AlertCircle } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureComplete: (signatureDataUrl: string) => void;
  width?: number;
  height?: number;
  lineWidth?: number;
  lineColor?: string;
  backgroundColor?: string;
  disabled?: boolean;
  existingSignature?: string;
}

export function SignatureCanvas({
  onSignatureComplete,
  width = 600,
  height = 200,
  lineWidth = 2,
  lineColor = '#000000',
  backgroundColor = '#ffffff',
  disabled = false,
  existingSignature
}: SignatureCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const MIN_STROKES = 3; // Minimum number of strokes to consider valid signature

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Load existing signature if provided
    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setHasDrawn(true);
        setStrokeCount(MIN_STROKES); // Assume existing signature is valid
      };
      img.src = existingSignature;
    }
  }, [width, height, backgroundColor, existingSignature]);

  const getCoordinates = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    e.preventDefault();
    setIsDrawing(true);
    setError(null);
    setIsSaved(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();

    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setStrokeCount(prev => prev + 1);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    setHasDrawn(false);
    setStrokeCount(0);
    setError(null);
    setIsSaved(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!hasDrawn) {
      setError('Please draw your signature before saving');
      return;
    }

    if (strokeCount < MIN_STROKES) {
      setError(`Signature must have at least ${MIN_STROKES} strokes. Please sign more completely.`);
      return;
    }

    // Convert canvas to base64 PNG
    const dataUrl = canvas.toDataURL('image/png');

    onSignatureComplete(dataUrl);
    setError(null);
    setIsSaved(true);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Digital Signature
      </label>

      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className={`
            touch-none block mx-auto
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}
          `}
          style={{ maxWidth: '100%', height: 'auto' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={clearCanvas}
            disabled={disabled || !hasDrawn}
            className="
              inline-flex items-center px-3 py-2 text-sm font-medium
              text-gray-700 bg-white border border-gray-300 rounded-md
              hover:bg-gray-50 focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </button>

          <button
            type="button"
            onClick={saveSignature}
            disabled={disabled || !hasDrawn || isSaved}
            className="
              inline-flex items-center px-4 py-2 text-sm font-medium
              text-white bg-blue-600 border border-transparent rounded-md
              hover:bg-blue-700 focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Signature
              </>
            )}
          </button>
        </div>

        <div className="flex items-center text-xs text-gray-500">
          <Pen className="w-3 h-3 mr-1" />
          {hasDrawn ? (
            <span className="text-green-600 font-medium">
              {strokeCount} stroke{strokeCount !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>Sign above</span>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 flex items-start space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {isSaved && !error && (
        <div className="mt-2 flex items-start space-x-2 text-green-600 text-sm">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>Signature saved successfully</p>
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Draw your signature using your mouse or finger. Minimum {MIN_STROKES} strokes required.
      </p>
    </div>
  );
}
