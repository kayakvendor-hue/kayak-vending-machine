import React, { useEffect, useRef, useState } from 'react';

interface SignaturePadProps {
    onChange: (dataUrl: string | null) => void;
    height?: number;
}

// Lightweight mouse/touch signature capture rendered on a <canvas>.
// Calls onChange(null) when empty and onChange(dataUrl) with a PNG data URL
// whenever the drawn signature changes.
const SignaturePad: React.FC<SignaturePadProps> = ({ onChange, height = 160 }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawingRef = useRef(false);
    const hasDrawnRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    // Size the canvas's backing store for the device pixel ratio so lines stay crisp,
    // while keeping the CSS size responsive to the container width.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const ratio = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * ratio;
            canvas.height = height * ratio;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(ratio, ratio);
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#000';
            }
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [height]);

    const getPoint = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            const touch = e.touches[0];
            if (!touch) return null;
            return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const point = getPoint(e);
        if (!point) return;
        drawingRef.current = true;
        lastPointRef.current = point;
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawingRef.current) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const point = getPoint(e);
        if (!canvas || !ctx || !point || !lastPointRef.current) return;

        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();

        lastPointRef.current = point;
        hasDrawnRef.current = true;
    };

    const stopDrawing = () => {
        if (!drawingRef.current) return;
        drawingRef.current = false;
        lastPointRef.current = null;
        if (hasDrawnRef.current) {
            setIsEmpty(false);
            onChange(canvasRef.current?.toDataURL('image/png') || null);
        }
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        hasDrawnRef.current = false;
        setIsEmpty(true);
        onChange(null);
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: `${height}px`,
                    display: 'block',
                    backgroundColor: '#fff',
                    border: '2px dashed #aaa',
                    borderRadius: '6px',
                    touchAction: 'none',
                    cursor: 'crosshair'
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>
                    {isEmpty ? 'Sign above using your mouse or finger' : 'Signature captured'}
                </span>
                <button
                    type="button"
                    onClick={handleClear}
                    style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#666', width: 'auto' }}
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

export default SignaturePad;