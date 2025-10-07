import React, { useState, useEffect, useCallback } from 'react';
import { getHistory, deleteHistoryItem, clearHistory } from '../services/historyService';
import { HistoryItem } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { ClockIcon } from './icons/ClockIcon';
import { XMarkIcon } from './icons/XMarkIcon';

const HistoryCard: React.FC<{ item: HistoryItem; onDelete: (id: string) => void; }> = ({ item, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(true);
    };
    
    const confirmDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(item.id);
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(false);
    };

    const designTitle = item.settings.editablePrompt.split('.')[0] || 'Untitled Design';
    const formattedDate = new Date(item.timestamp).toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="group relative bg-dark-secondary rounded-2xl overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-dark-primary">
                <img src={item.afterImageUrl} alt="Generated design" className="w-full h-full object-contain transition-opacity duration-300 group-hover:opacity-80" loading="lazy" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end">
                <h3 className="text-white font-bold text-lg leading-tight truncate">{designTitle}</h3>
                <p className="text-dark-text-secondary text-xs mt-1">{formattedDate}</p>
            </div>
            
            <button 
                onClick={handleDeleteClick}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Delete item"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
            
            {isDeleting && (
                <div 
                    className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    <p className="text-white font-semibold mb-4">هل أنت متأكد من الحذف؟</p>
                    <div className="flex gap-3">
                        <button onClick={cancelDelete} className="px-4 py-2 text-sm rounded-lg bg-dark-border hover:bg-dark-primary">إلغاء</button>
                        <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white">حذف</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const HistoryView: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);

    const loadHistory = useCallback(async () => {
        try {
            setIsLoading(true);
            const items = await getHistory();
            setHistory(items);
        } catch (err) {
            setError('Failed to load design history.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const handleDelete = async (id: string) => {
        try {
            await deleteHistoryItem(id);
            setHistory(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            setError('Failed to delete item.');
        }
    };

    const handleClearAll = async () => {
        try {
            await clearHistory();
            setHistory([]);
            setIsConfirmingClear(false);
        } catch (err) {
            setError('Failed to clear history.');
        }
    };
    
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">سجل التصاميم</h2>
                {history.length > 0 && (
                    <button 
                        onClick={() => setIsConfirmingClear(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                        <TrashIcon className="w-5 h-5" />
                        <span>مسح السجل بالكامل</span>
                    </button>
                )}
            </div>

            {isLoading && <p className="text-center text-dark-text-secondary">جاري تحميل السجل...</p>}
            {error && <p className="text-center text-red-400">{error}</p>}

            {!isLoading && history.length === 0 && (
                <div className="text-center py-16 px-6 bg-dark-secondary rounded-2xl">
                    <ClockIcon className="w-16 h-16 mx-auto text-dark-border mb-4" />
                    <h3 className="text-xl font-semibold text-dark-text">لا توجد تصميمات محفوظة</h3>
                    <p className="text-dark-text-secondary mt-2">
                        ستظهر تصميماتك التي تم إنشاؤها هنا تلقائيًا.
                    </p>
                </div>
            )}

            {!isLoading && history.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {history.map(item => (
                        <HistoryCard key={item.id} item={item} onDelete={handleDelete} />
                    ))}
                </div>
            )}
            
            {isConfirmingClear && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity duration-300" 
                    onClick={() => setIsConfirmingClear(false)}
                >
                    <div 
                        className="bg-dark-secondary rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 animate-fade-in-scale" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-dark-text">تأكيد مسح السجل</h2>
                            <button onClick={() => setIsConfirmingClear(false)} className="p-1 rounded-full hover:bg-dark-border">
                                <XMarkIcon className="w-6 h-6 text-dark-text-secondary" />
                            </button>
                        </div>
                        <p className="text-dark-text-secondary mb-6">
                            هل أنت متأكد من رغبتك في حذف جميع التصاميم من سجلك؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsConfirmingClear(false)} className="px-4 py-2 rounded-lg bg-dark-primary text-dark-text hover:bg-dark-border font-semibold transition-colors">
                                إلغاء
                            </button>
                            <button onClick={handleClearAll} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold transition-colors">
                                نعم، احذف كل شيء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryView;