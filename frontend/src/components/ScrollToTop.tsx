import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scrolls to the top of the page on every route change so new pages
// don't open partway down (common on mobile browsers).
const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
