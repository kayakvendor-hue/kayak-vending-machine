import React, { useRef } from 'react';

const SignaturePad: React.FC<{ onSave: (signature: string) => void }> = ({ onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawing = useRef(false);
    const lastX = useRef(0);
    const lastY = useRef(0);

    const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
        isDrawing.current = true;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            lastX.current = event.clientX - rect.left;
            lastY.current = event.clientY - rect.top;
        }
    };

    const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing.current || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(lastX.current, lastY.current);
            const rect = canvasRef.current.getBoundingClientRect();
            lastX.current = event.clientX - rect.left;
            lastY.current = event.clientY - rect.top;
            ctx.lineTo(lastX.current, lastY.current);
            ctx.closePath();
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        isDrawing.current = false;
        if (canvasRef.current) {
            const dataURL = canvasRef.current.toDataURL();
            onSave(dataURL);
        }
    };

    return (
        <canvas
            ref={canvasRef}
            width={400}
            height={200}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ border: '1px solid black' }}
        />
    );
};

export default SignaturePad;