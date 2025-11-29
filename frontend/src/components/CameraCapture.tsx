import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
    onCapture: (photoData: string) => void;
    onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [facingMode]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError('');
        } catch (err) {
            console.error('Camera access error:', err);
            setError('Unable to access camera. Please allow camera permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(imageData);
            }
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            stopCamera();
            onCapture(capturedImage);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        setCapturedImage(null);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {error ? (
                <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>
                    <p>{error}</p>
                    <button
                        onClick={onCancel}
                        style={{
                            marginTop: '20px',
                            padding: '12px 24px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
                </div>
            ) : (
                <>
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '800px',
                        maxHeight: '80vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {capturedImage ? (
                            <img
                                src={capturedImage}
                                alt="Captured"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '80vh',
                                    objectFit: 'contain'
                                }}
                            />
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                style={{
                                    width: '100%',
                                    maxHeight: '80vh',
                                    objectFit: 'contain',
                                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                                }}
                            />
                        )}
                    </div>

                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '15px',
                        padding: '0 20px'
                    }}>
                        {capturedImage ? (
                            <>
                                <button
                                    onClick={handleRetake}
                                    style={{
                                        padding: '15px 30px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    🔄 Retake
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    style={{
                                        padding: '15px 30px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    ✓ Use Photo
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onCancel}
                                    style={{
                                        padding: '15px 30px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    ✕ Cancel
                                </button>
                                <button
                                    onClick={switchCamera}
                                    style={{
                                        padding: '15px 30px',
                                        backgroundColor: '#667eea',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    🔄 Flip
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    style={{
                                        padding: '15px 30px',
                                        backgroundColor: '#fff',
                                        color: '#000',
                                        border: '4px solid #667eea',
                                        borderRadius: '50px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    📷 Capture
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default CameraCapture;
