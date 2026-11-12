import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scrolls to the top of the page on every route change so new pages
// don't open partway down (common on mobile browsers).
const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation();

    // Stop the browser from restoring the old scroll position on navigation.
    useLayoutEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    useLayoutEffect(() => {
        const toTop = () => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        };
        toTop();
        // Mobile browsers can restore scroll after the first paint; scroll again after it.
        const frame = requestAnimationFrame(toTop);
        const timer = window.setTimeout(toTop, 100);
        return () => {
            cancelAnimationFrame(frame);
            window.clearTimeout(timer);
        };
    }, [pathname]);

    return null;
};

export default ScrollToTop;
