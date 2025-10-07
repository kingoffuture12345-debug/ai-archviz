import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { LibraryItem } from '../types';

interface NewPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (details: { name: string; content: string; parentId: string | null }) => void;
    libraries: LibraryItem[];
    initialParentId?: string | null;
    initialContent?: string;
}

const flattenLibrariesForSelect = (items: LibraryItem[], parentId: string | null = null, prefix = ''): { label: string, id: string }[] => {
    let libraries: { label: string, id: string }[] = [];
    const children = items.filter(item => item.parentId === parentId && item.type === 'library');
    children.sort((a, b) => a.name.localeCompare(b.name));
    children.forEach(child => {
        libraries.push({ label: `${prefix}${child.name}`, id: child.id });
        libraries = libraries.concat(flattenLibrariesForSelect(items, child.id, `${prefix}  └─ `));
    });
    return libraries;
};


const NewPromptModal: React.FC<NewPromptModalProps> = ({ isOpen, onClose, onSave, libraries, initialParentId, initialContent }) => {
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [parentId, setParentId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const libraryOptions = flattenLibrariesForSelect(libraries);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setContent(initialContent || '');
            setParentId(initialParentId || null);
            setError('');
        }
    }, [isOpen, initialParentId, initialContent]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim()) {
            setError('اسم البرومت مطلوب.');
            return;
        }
        setError('');
        onSave({ name, content, parentId });
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity duration-300" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-dark-secondary rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 transform transition-all duration-300 animate-fade-in-scale" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-dark-text">إضافة برومت جديد</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-dark-border" aria-label="Close modal">
                        <XMarkIcon className="w-6 h-6 text-dark-text-secondary" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-dark-text-secondary mb-1">اسم البرومت</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full bg-dark-primary border-2 rounded-lg p-2 text-dark-text focus:ring-2 focus:ring-accent focus:border-accent ${error ? 'border-red-500' : 'border-dark-border'}`}
                            placeholder="مثال: برومت غرفة معيشة مودرن"
                            autoFocus
                        />
                         {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-text-secondary mb-1">المكتبة (اختياري)</label>
                        <select
                            value={parentId || ''}
                            onChange={(e) => setParentId(e.target.value || null)}
                            className="w-full bg-dark-primary border-2 border-dark-border rounded-lg p-2 text-dark-text focus:ring-2 focus:ring-accent focus:border-accent"
                        >
                            <option value="">-- حفظ في المستوى الرئيسي --</option>
                            {libraryOptions.map(lib => (
                                <option key={lib.id} value={lib.id}>{lib.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-text-secondary mb-1">محتوى البرومت</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={5}
                            className="w-full bg-dark-primary border-2 border-dark-border rounded-lg p-2 text-dark-text focus:ring-2 focus:ring-accent focus:border-accent resize-y"
                            placeholder="أدخل محتوى البرومت هنا..."
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-dark-primary text-dark-text hover:bg-dark-border font-semibold transition-colors">
                        إلغاء
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover font-semibold transition-colors">
                        حفظ البرومت
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewPromptModal;
