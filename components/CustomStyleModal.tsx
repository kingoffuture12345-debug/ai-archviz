import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { CustomStyleDetails, DesignType } from '../types';

interface CustomStyleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customStyle: CustomStyleDetails) => void;
    initialValue: CustomStyleDetails;
    designType: DesignType;
}

const CustomStyleModal: React.FC<CustomStyleModalProps> = ({ isOpen, onClose, onSave, initialValue, designType }) => {
    const [details, setDetails] = useState<CustomStyleDetails>(initialValue);

    useEffect(() => {
        if (isOpen) {
            setDetails(initialValue);
        }
    }, [isOpen, initialValue]);

    if (!isOpen) {
        return null;
    }

    const handleSave = () => {
        onSave(details);
        onClose();
    };

    const handleDetailChange = (field: keyof CustomStyleDetails, value: string) => {
        setDetails(prev => ({ ...prev, [field]: value }));
    };

    const featureLabel = designType === DesignType.Interior ? 'الأثاث والديكور' : 'التفاصيل المعمارية';
    const featurePlaceholder = designType === DesignType.Interior ? 'مثال: أريكة مخملية، طاولة قهوة رخامية...' : 'مثال: نوافذ مقوسة، شرفة من الحديد...';

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity duration-300" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-light-secondary dark:bg-dark-secondary rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-light-text dark:text-dark-text">إنشاء نمط مخصص</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-light-border dark:hover:bg-dark-border" aria-label="Close modal">
                        <XMarkIcon className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary" />
                    </button>
                </div>
                
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Colors */}
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">لوحة الألوان</label>
                        <input
                            type="text"
                            value={details.colors}
                            onChange={(e) => handleDetailChange('colors', e.target.value)}
                            className="w-full bg-light-primary dark:bg-dark-primary border-2 border-light-border dark:border-dark-border rounded-lg p-2 text-light-text dark:text-dark-text focus:ring-2 focus:ring-accent focus:border-accent"
                            placeholder="مثال: ألوان ترابية دافئة مع لمسات من الذهبي..."
                        />
                    </div>

                    {/* Features */}
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">{featureLabel}</label>
                        <textarea
                            value={details.features}
                            onChange={(e) => handleDetailChange('features', e.target.value)}
                            rows={2}
                            className="w-full bg-light-primary dark:bg-dark-primary border-2 border-light-border dark:border-dark-border rounded-lg p-2 text-light-text dark:text-dark-text focus:ring-2 focus:ring-accent focus:border-accent resize-none"
                            placeholder={featurePlaceholder}
                        />
                    </div>

                    {/* Lighting */}
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">الإضاءة</label>
                        <input
                            type="text"
                            value={details.lighting}
                            onChange={(e) => handleDetailChange('lighting', e.target.value)}
                            className="w-full bg-light-primary dark:bg-dark-primary border-2 border-light-border dark:border-dark-border rounded-lg p-2 text-light-text dark:text-dark-text focus:ring-2 focus:ring-accent focus:border-accent"
                            placeholder="مثال: إضاءة طبيعية ساطعة، أو إضاءة مسائية خافتة..."
                        />
                    </div>

                     {/* Textures */}
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">الخامات والملمس</label>
                        <input
                            type="text"
                            value={details.textures}
                            onChange={(e) => handleDetailChange('textures', e.target.value)}
                            className="w-full bg-light-primary dark:bg-dark-primary border-2 border-light-border dark:border-dark-border rounded-lg p-2 text-light-text dark:text-dark-text focus:ring-2 focus:ring-accent focus:border-accent"
                            placeholder="مثال: خشب البلوط، أقمشة الكتان، معادن مصقولة..."
                        />
                    </div>

                    {/* Mood */}
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">الأجواء العامة</label>
                        <input
                            type="text"
                            value={details.mood}
                            onChange={(e) => handleDetailChange('mood', e.target.value)}
                            className="w-full bg-light-primary dark:bg-dark-primary border-2 border-light-border dark:border-dark-border rounded-lg p-2 text-light-text dark:text-dark-text focus:ring-2 focus:ring-accent focus:border-accent"
                            placeholder="مثال: مريح وهادئ، فاخر وجريء، عملي وبسيط..."
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-light-text dark:text-dark-text hover:bg-light-border dark:hover:bg-dark-border font-semibold transition-colors">
                        إلغاء
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover font-semibold transition-colors">
                        حفظ النمط
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomStyleModal;