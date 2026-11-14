import React, { useEffect, useRef, useState } from 'react';
import api from '../config/axios';

// Set REACT_APP_SAFETY_VIDEO_URL to override (CRA reads env vars at build/start time)
const SAFETY_VIDEO_URL = process.env.REACT_APP_SAFETY_VIDEO_URL || 'https://www.youtube.com/watch?v=TAEkR13ChPs';

const getYouTubeId = (url: string): string | null => {
    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1) || null;
        return parsed.searchParams.get('v');
    } catch {
        return null;
    }
};

interface SafetyVideoGateProps {
    onWatched: () => void;
}

const SafetyVideoGate: React.FC<SafetyVideoGateProps> = ({ onWatched }) => {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const playerHostRef = useRef<HTMLDivElement>(null);
    const onWatchedRef = useRef(onWatched);
    onWatchedRef.current = onWatched;
    const videoId = getYouTubeId(SAFETY_VIDEO_URL);

    // Fires once the YouTube player reports the video has ended.
    useEffect(() => {
        if (!videoId || !playerHostRef.current) return;

        const host = playerHostRef.current;
        const target = document.createElement('div');
        host.appendChild(target);
        let player: any = null;
        let cancelled = false;

        const markWatched = async () => {
            setSaving(true);
            setError('');
            try {
                // Recorded once per account; the backend keeps the first viewing date.
                await api.post('/api/auth/safety-video/complete');
                onWatchedRef.current();
            } catch (err) {
                setError('Could not save your progress. Please try again.');
            } finally {
                setSaving(false);
            }
        };

        const createPlayer = () => {
            if (cancelled) return;
            player = new (window as any).YT.Player(target, {
                videoId,
                width: '100%',
                height: '100%',
                playerVars: { rel: 0, modestbranding: 1 },
                events: {
                    onStateChange: (event: any) => {
                        if (event.data === (window as any).YT.PlayerState.ENDED) {
                            markWatched();
                        }
                    }
                }
            });
        };

        if ((window as any).YT?.Player) {
            createPlayer();
        } else {
            const previousReady = (window as any).onYouTubeIframeAPIReady;
            (window as any).onYouTubeIframeAPIReady = () => {
                previousReady?.();
                createPlayer();
            };
            if (!document.getElementById('youtube-iframe-api')) {
                const script = document.createElement('script');
                script.id = 'youtube-iframe-api';
                script.src = 'https://www.youtube.com/iframe_api';
                document.body.appendChild(script);
            }
        }

        return () => {
            cancelled = true;
            player?.destroy?.();
            host.removeChild(target);
        };
    }, [videoId]);

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <h2>Safety Video Required</h2>
            <p style={{ color: '#555' }}>
                Please watch the Company's safety video before your first rental. You only need to do this once.
            </p>

            {videoId ? (
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
                    <div ref={playerHostRef} style={{ position: 'absolute', inset: 0 }} />
                </div>
            ) : (
                <div style={{
                    padding: '60px 20px',
                    border: '2px dashed #999',
                    borderRadius: '12px',
                    color: '#666',
                    backgroundColor: '#f7f7f7'
                }}>
                    Safety video coming soon.
                </div>
            )}

            {saving && <p style={{ marginTop: '12px', color: '#555' }}>Saving your progress…</p>}
            {error && <p style={{ marginTop: '12px', color: '#d32f2f', fontWeight: 'bold' }}>{error}</p>}
        </div>
    );
};

export default SafetyVideoGate;
