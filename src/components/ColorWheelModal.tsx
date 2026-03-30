import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

interface ColorWheelModalProps {
  initialColor: string;
  onConfirm: (color: string) => void;
  onCancel: () => void;
}

// HSV ↔ Hex helpers
function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToHsv(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

const WHEEL_SIZE = 220;
const WHEEL_RADIUS = WHEEL_SIZE / 2;

const ColorWheelModal: React.FC<ColorWheelModalProps> = ({ initialColor, onConfirm, onCancel }) => {
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(initialColor));
  const [hexInput, setHexInput] = useState(initialColor.toUpperCase());
  const wheelRef = useRef<HTMLCanvasElement>(null);
  const brightnessRef = useRef<HTMLCanvasElement>(null);
  const draggingWheel = useRef(false);
  const draggingBrightness = useRef(false);

  const [h, s, v] = hsv;
  const currentHex = hsvToHex(h, s, v);

  // Draw wheel
  useEffect(() => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const size = WHEEL_SIZE;
    const radius = WHEEL_RADIUS;
    canvas.width = size * 2;
    canvas.height = size * 2;
    ctx.clearRect(0, 0, size * 2, size * 2);

    for (let x = 0; x < size * 2; x++) {
      for (let y = 0; y < size * 2; y++) {
        const dx = x - size;
        const dy = y - size;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius * 2) {
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const hue = (angle + 360) % 360;
          const sat = Math.min(dist / (radius * 2), 1);
          ctx.fillStyle = hsvToHex(hue, sat, v);
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [v]);

  // Draw brightness slider
  useEffect(() => {
    const canvas = brightnessRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = 32;
    const ht = WHEEL_SIZE * 2;
    canvas.width = w * 2;
    canvas.height = ht;
    for (let y = 0; y < ht; y++) {
      const brightness = 1 - y / ht;
      ctx.fillStyle = hsvToHex(h, s, brightness);
      ctx.fillRect(0, y, w * 2, 1);
    }
  }, [h, s]);

  // Sync hex input when hsv changes
  useEffect(() => {
    setHexInput(currentHex);
  }, [currentHex]);

  const handleWheelInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) / rect.width * WHEEL_SIZE * 2 - WHEEL_SIZE;
    const y = (clientY - rect.top) / rect.height * WHEEL_SIZE * 2 - WHEEL_SIZE;
    const dist = Math.sqrt(x * x + y * y);
    if (dist > WHEEL_RADIUS * 2) return;
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const hue = (angle + 360) % 360;
    const sat = Math.min(dist / (WHEEL_RADIUS * 2), 1);
    setHsv([hue, sat, v]);
  }, [v]);

  const handleBrightnessInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = brightnessRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    setHsv([h, s, 1 - y]);
  }, [h, s]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (draggingWheel.current) {
        handleWheelInteraction(e as any);
      }
      if (draggingBrightness.current) {
        handleBrightnessInteraction(e as any);
      }
    };
    const handleUp = () => {
      draggingWheel.current = false;
      draggingBrightness.current = false;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [handleWheelInteraction, handleBrightnessInteraction]);

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setHsv(hexToHsv(val));
    }
  };

  // Wheel indicator position
  const indicatorX = WHEEL_RADIUS + s * WHEEL_RADIUS * Math.cos((h * Math.PI) / 180);
  const indicatorY = WHEEL_RADIUS + s * WHEEL_RADIUS * Math.sin((h * Math.PI) / 180);
  const brightnessY = (1 - v) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative z-10 rounded-2xl border border-border bg-card p-6 shadow-xl max-w-xs w-full mx-4 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">Pick a Colour</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-start gap-4 justify-center mb-5">
          {/* Colour wheel */}
          <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
            <canvas
              ref={wheelRef}
              className="rounded-full cursor-crosshair"
              style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
              onMouseDown={(e) => { draggingWheel.current = true; handleWheelInteraction(e); }}
              onTouchStart={(e) => { draggingWheel.current = true; handleWheelInteraction(e); }}
            />
            {/* Indicator */}
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: indicatorX,
                top: indicatorY,
                backgroundColor: currentHex,
              }}
            />
          </div>

          {/* Brightness slider */}
          <div className="relative" style={{ width: 28, height: WHEEL_SIZE }}>
            <canvas
              ref={brightnessRef}
              className="rounded-lg cursor-pointer"
              style={{ width: 28, height: WHEEL_SIZE }}
              onMouseDown={(e) => { draggingBrightness.current = true; handleBrightnessInteraction(e); }}
              onTouchStart={(e) => { draggingBrightness.current = true; handleBrightnessInteraction(e); }}
            />
            {/* Brightness indicator */}
            <div
              className="absolute left-0 w-full h-1 bg-white rounded-full shadow pointer-events-none"
              style={{ top: `${brightnessY}%` }}
            />
          </div>
        </div>

        {/* Preview + hex input */}
        <div className="flex items-center gap-3 mb-5">
          <span className="h-9 w-9 rounded-md shrink-0 border border-border" style={{ backgroundColor: currentHex }} />
          <input
            type="text"
            value={hexInput}
            onChange={e => handleHexChange(e.target.value)}
            className="flex-1 rounded-lg bg-secondary border border-border px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="#8B5CF6"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(currentHex)}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorWheelModal;
