import React, { useState, useEffect } from 'react';
import { WifiOffIcon } from './icons/WifiOffIcon';

const OfflineBanner: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!isOffline) {
        return null;
    }

    return (
        <div 
            className="fixed top-0 left-0 right-0 bg-red-600 text-white p-3 text-center z-50 flex items-center justify-center gap-2 animate-fade-in"
            role="alert"
            aria-live="assertive"
        >
            <WifiOffIcon className="w-5 h-5" />
            <span>ليس هناك إنترنت</span>
        </div>
    );
};

export default OfflineBanner;
