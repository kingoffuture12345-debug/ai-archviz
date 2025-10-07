import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from './icons/XMarkIcon';
import { CheckIcon } from './icons/CheckIcon';

interface Notification {
    id: string;
    message: string;
    image?: string;
}

const NotificationToast: React.FC<{ notification: Notification; onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(notification.id);
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    return (
        <div 
            className="flex items-start gap-3 bg-dark-secondary p-4 rounded-xl shadow-2xl border border-dark-border/50 animate-fade-in-scale w-full max-w-sm"
            role="alert"
            aria-live="assertive"
        >
            {notification.image ? (
                <img src={notification.image} alt="Notification preview" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            ) : (
                <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="w-7 h-7 text-white" />
                </div>
            )}
            <p className="flex-grow text-sm text-dark-text pt-1">{notification.message}</p>
            <button 
                onClick={() => onDismiss(notification.id)} 
                className="p-1 rounded-full text-dark-text-secondary hover:bg-dark-border flex-shrink-0"
                aria-label="Dismiss notification"
            >
                <XMarkIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const handleNotification = (event: Event) => {
            const customEvent = event as CustomEvent<Notification>;
            setNotifications(prev => [customEvent.detail, ...prev]);
        };

        window.addEventListener('app-notification', handleNotification);
        return () => {
            window.removeEventListener('app-notification', handleNotification);
        };
    }, []);

    const dismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return createPortal(
        <div className="fixed top-20 right-4 z-50 space-y-3">
            {notifications.map(notification => (
                <NotificationToast 
                    key={notification.id}
                    notification={notification}
                    onDismiss={dismissNotification}
                />
            ))}
        </div>,
        document.body
    );
};

export default NotificationCenter;
