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
    const [submitted, setSubmitted] = useState(false);

    // Size the canvas's backing store for the device pixel ratio so lines stay crisp,
    // while keeping the CSS size responsive to the container width.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const ratio = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            // Hidden after submit (display: none); keep the last size until shown again.
            if (rect.width === 0) return;
            const newWidth = Math.round(rect.width * ratio);
            const newHeight = Math.round(height * ratio);
            // Mobile browsers fire resize while scrolling (address bar show/hide).
            // Setting canvas.width clears the drawing, so only resize when the size really changed.
            if (canvas.width === newWidth && canvas.height === newHeight) return;

            const snapshot = document.createElement('canvas');
            snapshot.width = canvas.width;
            snapshot.height = canvas.height;
            snapshot.getContext('2d')?.drawImage(canvas, 0, 0);

            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(ratio, ratio);
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#000';
                if (hasDrawnRef.current && snapshot.width > 0) {
                    ctx.drawImage(snapshot, 0, 0, snapshot.width / ratio, snapshot.height / ratio);
                }
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

    // Sends the signature to the parent and hides the drawing box.
    const handleSubmit = () => {
        const canvas = canvasRef.current;
        if (!canvas || isEmpty) return;
        onChange(canvas.toDataURL('image/png'));
        setSubmitted(true);
    };

    const handleSignAgain = () => {
        handleClear();
        setSubmitted(false);
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: `${height}px`,
                    display: submitted ? 'none' : 'block',
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
            {submitted ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 600 }}>Signature submitted</span>
                    <button
                        type="button"
                        onClick={handleSignAgain}
                        style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#666', width: 'auto' }}
                    >
                        Sign again
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                        {isEmpty ? 'Sign above using your mouse or finger' : 'Looks good? Press Submit to confirm'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            type="button"
                            onClick={handleClear}
                            style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#666', width: 'auto' }}
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isEmpty}
                            style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                backgroundColor: '#2e7d32',
                                width: 'auto',
                                opacity: isEmpty ? 0.5 : 1,
                                cursor: isEmpty ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

};

export default SignaturePad;