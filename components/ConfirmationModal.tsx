import React from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700',
}) => {
    if (!isOpen) return null;

    const handleConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();
        onConfirm();
    }

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity duration-300"
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-dark-secondary rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-dark-text">{title}</h2>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-dark-border" aria-label="Close modal">
                        <XMarkIcon className="w-6 h-6 text-dark-text-secondary" />
                    </button>
                </div>
                <p className="text-dark-text-secondary mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={handleClose} className="px-4 py-2 rounded-lg bg-dark-primary text-dark-text hover:bg-dark-border font-semibold transition-colors">
                        إلغاء
                    </button>
                    <button onClick={handleConfirm} className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${confirmButtonClass}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
