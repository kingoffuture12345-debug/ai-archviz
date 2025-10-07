import React, { useState, useEffect, useCallback, useRef } from 'react';
import { enhancePrompt, correctText } from '../services/geminiService';
import { getLibraryItems, saveLibraryItem, deleteLibraryItem } from '../services/promptLibraryService';
import { LibraryItem } from '../types';
import { fileToBase64, resizeAndCompressImage } from '../utils/imageHelpers';
import { SparklesIcon } from './icons/SparklesIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { CheckIcon } from './icons/CheckIcon';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { FolderPlusIcon } from './icons/FolderPlusIcon';
import { FolderIcon } from './icons/FolderIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ImageToPromptIcon } from './icons/ImageToPromptIcon';
import { LibraryIcon } from './icons/LibraryIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import ConfirmationModal from './ConfirmationModal';
import NewPromptModal from './NewPromptModal';
import PromptToImageView from './PromptToImageView';
import { WandSparklesIcon } from './icons/WandSparklesIcon';
import DictationButton from './DictationButton';
import { notify } from '../utils/notification';

interface TreeItem extends LibraryItem {
    children: TreeItem[];
    level: number;
}

const buildTree = (items: LibraryItem[]): TreeItem[] => {
    const itemMap: Record<string, TreeItem> = {};
    const roots: TreeItem[] = [];

    items.forEach(item => {
        itemMap[item.id] = { ...item, children: [], level: 0 };
    });

    items.forEach(item => {
        if (item.parentId && itemMap[item.parentId]) {
            itemMap[item.parentId].children.push(itemMap[item.id]);
        } else {
            roots.push(itemMap[item.id]);
        }
    });

    const setLevels = (nodes: TreeItem[], level: number) => {
        nodes.forEach(node => {
            node.level = level;
            node.children.sort((a, b) => {
                if (a.type === 'library' && b.type !== 'library') return -1;
                if (a.type !== 'library' && b.type === 'library') return 1;
                return a.name.localeCompare(b.name);
            });
            setLevels(node.children, level + 1);
        });
    };

    roots.sort((a, b) => {
        if (a.type === 'library' && b.type !== 'library') return -1;
        if (a.type !== 'library' && b.type === 'library') return 1;
        return a.name.localeCompare(b.name);
    });

    setLevels(roots, 0);
    return roots;
};

type ActiveTab = 'generate' | 'library' | 'image';

const ImageToPromptView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('generate');
    const [images, setImages] = useState<Array<{ id: string; url: string; base64: { data: string; mimeType: string } }>>([]);
    const [notes, setNotes] = useState('');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCorrectingText, setIsCorrectingText] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasCopied, setHasCopied] = useState(false);
    const textBeforeDictation = useRef('');

    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
    const [tree, setTree] = useState<TreeItem[]>([]);
    const [expandedLibs, setExpandedLibs] = useState<Record<string, boolean>>({});
    const [addingLibrary, setAddingLibrary] = useState<{ parentId: string | null } | null>(null);
    const [renamingItem, setRenamingItem] = useState<{ id: string; name: string } | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    const [addingPromptDetails, setAddingPromptDetails] = useState<{ parentId: string | null; content?: string } | null>(null);

    const folderColors = [
        'text-yellow-400', // level 0
        'text-sky-400',    // level 1
        'text-emerald-400',// level 2
        'text-pink-400',   // level 3
        'text-orange-400', // level 4
    ];

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadLibrary = useCallback(async () => {
        try {
            setError(null);
            const items = await getLibraryItems();
            setLibraryItems(items);
            setTree(buildTree(items));
        } catch (err) {
            setError("Failed to load prompt library.");
        }
    }, []);

    useEffect(() => {
        loadLibrary();
    }, [loadLibrary]);
    
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        try {
            const newImages = await Promise.all(Array.from(files).map(async (file: File) => {
                const compressedFile = await resizeAndCompressImage(file);
                const url = URL.createObjectURL(compressedFile);
                const base64 = await fileToBase64(compressedFile);
                return { id: `${Date.now()}-${Math.random()}`, url, base64 };
            }));
            setImages(prev => [...prev, ...newImages]);
            setError(null);
        } catch (e) {
            setError("Failed to process one or more images.");
            console.error("Image processing error:", e);
        }
        if (event.target) event.target.value = '';
    };

    const handleImageRemove = (idToRemove: string) => {
        const imageToRemove = images.find(img => img.id === idToRemove);
        if (imageToRemove) URL.revokeObjectURL(imageToRemove.url);
        setImages(prev => prev.filter(img => img.id !== idToRemove));
    };

    const handleGeneratePrompt = async () => {
        if (images.length === 0) {
            setError('Please upload at least one image first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            let userInstruction = 'Describe the provided image(s) in detail for an AI image generator.';
            if (notes.trim()) {
                userInstruction += `\n\nPlease also consider these specific instructions: "${notes.trim()}"`;
            }

            const promptText = await enhancePrompt(userInstruction, 'image-to-prompt', undefined, images.map(i => i.base64));
            setGeneratedPrompt(promptText);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate prompt. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyToClipboard = () => {
        if (!generatedPrompt) return;
        navigator.clipboard.writeText(generatedPrompt).then(() => {
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2000);
        });
    };
    
    const handleSaveCurrentPrompt = async () => {
        setAddingPromptDetails({ parentId: null, content: generatedPrompt });
    };
    
    const handleConfirmSaveLibrary = async (name: string, parentId: string | null) => {
        if (!name.trim()) {
            return;
        }
        setError(null);
        const trimmedName = name.trim();
        const siblingExists = libraryItems.some(
            item => item.parentId === parentId && item.name.toLowerCase() === trimmedName.toLowerCase() && item.type === 'library'
        );

        if (siblingExists) {
            setError(`A library named "${trimmedName}" already exists here.`);
            return;
        }

        const newItem: LibraryItem = {
            id: `item_${Date.now()}_${Math.random()}`,
            name: trimmedName,
            parentId,
            type: 'library',
            timestamp: Date.now(),
        };

        try {
            await saveLibraryItem(newItem);
            setAddingLibrary(null);
            await loadLibrary();
            if (parentId) {
                setExpandedLibs(prev => ({ ...prev, [parentId]: true }));
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(`Could not save library. Reason: ${message}`);
        }
    };

    const handleAddNewPrompt = async (details: { name: string, content: string, parentId: string | null }) => {
        const { name, content, parentId } = details;
    
        setError(null);
        const newItem: LibraryItem = {
            id: `item_${Date.now()}_${Math.random()}`,
            name: name.trim(),
            parentId,
            type: 'prompt',
            content: content.trim(),
            timestamp: Date.now(),
        };
    
        try {
            await saveLibraryItem(newItem);
            await loadLibrary();
            if (parentId) {
                setExpandedLibs(prev => ({ ...prev, [parentId]: true }));
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(`Could not save prompt. Reason: ${message}`);
        } finally {
            setAddingPromptDetails(null); // Close modal
        }
    };

    const handleDeleteConfirmed = async (id: string) => {
        try {
            await deleteLibraryItem(id, libraryItems);
            await loadLibrary();
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(`Failed to delete item from the library. Reason: ${message}`);
        } finally {
            setDeletingItemId(null);
        }
    };

    const handleStartRename = (item: LibraryItem) => {
        setAddingLibrary(null); // Cancel any additions
        setRenamingItem({ id: item.id, name: item.name });
    };

    const handleCancelRename = () => {
        setRenamingItem(null);
    };

    const handleConfirmRename = async () => {
        if (!renamingItem) return;
        const { id, name } = renamingItem;
        const trimmedName = name.trim();
        
        const itemToUpdate = libraryItems.find(item => item.id === id);
        if (!itemToUpdate) {
            setError("Item not found.");
            setRenamingItem(null);
            return;
        }

        if (!trimmedName) {
            setError("Name cannot be empty.");
            return;
        }
        
        if (trimmedName === itemToUpdate.name) {
            setRenamingItem(null);
            return;
        }

        const hasDuplicate = libraryItems.some(item =>
            item.parentId === itemToUpdate.parentId &&
            item.type === itemToUpdate.type &&
            item.name.toLowerCase() === trimmedName.toLowerCase() &&
            item.id !== id
        );

        if (hasDuplicate) {
            setError(`An item named "${trimmedName}" already exists here.`);
            return;
        }

        const updatedItem = { ...itemToUpdate, name: trimmedName };

        try {
            await saveLibraryItem(updatedItem);
            setRenamingItem(null);
            await loadLibrary();
            setError(null);
        } catch (err) {
            setError("Failed to save the new name.");
        }
    };
    
    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelRename();
        }
    };

    const handleDictationStart = () => {
        const currentPrompt = notes;
        if (currentPrompt.length > 0 && !/\s$/.test(currentPrompt)) {
            textBeforeDictation.current = currentPrompt + ' ';
        } else {
            textBeforeDictation.current = currentPrompt;
        }
    };
    const handleDictationUpdate = (transcript: string) => {
        setNotes(textBeforeDictation.current + transcript);
    };
    const handleDictationStop = async (finalTranscript: string) => {
        const rawAppendedPrompt = textBeforeDictation.current + finalTranscript;
        setNotes(rawAppendedPrompt);

        if (!finalTranscript.trim()) {
            return;
        }
        
        setIsCorrectingText(true);
        try {
            const correctedTranscript = await correctText(finalTranscript);
            setNotes(currentNotes => {
                if (currentNotes.endsWith(finalTranscript)) {
                    const base = currentNotes.slice(0, currentNotes.length - finalTranscript.length);
                    return base + correctedTranscript;
                }
                return currentNotes;
            });
        } catch(e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            notify(`Failed to correct text: ${errorMessage}`);
            console.error("Text correction error:", e);
        } finally {
            setIsCorrectingText(false);
        }
    };
    
    const NewLibraryInput: React.FC<{
        parentId: string | null;
        onSave: (name: string, parentId: string | null) => void;
        onCancel: () => void;
        level: number;
    }> = ({ parentId, onSave, onCancel, level }) => {
        const [name, setName] = useState('');
        const inputRef = useRef<HTMLInputElement>(null);
        const folderColorClass = folderColors[level % folderColors.length];
    
        useEffect(() => {
            inputRef.current?.focus();
        }, []);
    
        const handleSave = (e: React.MouseEvent) => {
            e.stopPropagation();
            onSave(name, parentId);
        };
    
        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') onSave(name, parentId);
            else if (e.key === 'Escape') onCancel();
        };

        const handleCancel = (e: React.MouseEvent) => {
            e.stopPropagation();
            onCancel();
        }
    
        return (
            <div className="flex items-center gap-2 p-2 animate-fade-in" style={{ paddingRight: `${level * 1.5 + 0.5}rem` }}>
                <FolderIcon className={`w-5 h-5 ${folderColorClass} flex-shrink-0`} />
                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => !name.trim() && onCancel()}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="اسم المكتبة الجديدة"
                    className="flex-grow bg-dark-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button onClick={handleSave} className="p-1 text-dark-text-secondary hover:text-green-400" title="حفظ"><CheckIcon className="w-5 h-5" /></button>
                <button onClick={handleCancel} className="p-1 text-dark-text-secondary hover:text-red-400" title="إلغاء"><XMarkIcon className="w-5 h-5" /></button>
            </div>
        );
    };

    const LibraryTreeView: React.FC<{ nodes: TreeItem[] }> = ({ nodes }) => (
        <>
            {nodes.map(node => {
                const isRenaming = renamingItem?.id === node.id;
                const folderColorClass = node.type === 'library' ? folderColors[node.level % folderColors.length] : '';
                return (
                    <div key={node.id}>
                        <div
                            className="group flex items-center gap-2 p-2 rounded-lg hover:bg-dark-border cursor-pointer"
                            style={{ paddingRight: `${node.level * 1.5 + 0.5}rem` }}
                            onClick={(e) => {
                                if ((e.target as HTMLElement).closest('button')) return;
                                if (isRenaming) return;

                                if (node.type === 'library') {
                                    setExpandedLibs(p => ({ ...p, [node.id]: !p[node.id] }));
                                } else if (node.content) {
                                    setGeneratedPrompt(node.content);
                                    setActiveTab('generate');
                                }
                            }}
                        >
                            <div className="w-4 flex-shrink-0">
                                {node.type === 'library' && (
                                    <ChevronDownIcon className={`w-4 h-4 text-dark-text-secondary transition-transform ${expandedLibs[node.id] ? 'rotate-0' : '-rotate-90'}`} />
                                )}
                            </div>
    
                            {node.type === 'library' ? <FolderIcon className={`w-5 h-5 ${folderColorClass} flex-shrink-0`} /> : <DocumentTextIcon className="w-5 h-5 text-dark-text-secondary flex-shrink-0" />}
                            
                            {isRenaming ? (
                                <input
                                    type="text"
                                    value={renamingItem.name}
                                    onChange={(e) => setRenamingItem({ ...renamingItem, name: e.target.value })}
                                    onKeyDown={handleRenameKeyDown}
                                    onBlur={handleConfirmRename}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="flex-grow bg-dark-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            ) : (
                                <span className="text-sm truncate flex-grow">{node.name}</span>
                            )}
    
                            <div className="flex-shrink-0 flex items-center gap-1 ml-2 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                                {node.type === 'library' && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); setAddingPromptDetails({ parentId: node.id }); }} title="إضافة برومت جديد" className="p-1 rounded-full hover:bg-dark-primary"><DocumentPlusIcon className="w-5 h-5 text-dark-text-secondary hover:text-white" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setAddingLibrary({ parentId: node.id }); setRenamingItem(null); }} title="إضافة مكتبة فرعية" className="p-1 rounded-full hover:bg-dark-primary"><FolderPlusIcon className="w-5 h-5 text-dark-text-secondary hover:text-white" /></button>
                                    </>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); handleStartRename(node); }} title="إعادة تسمية" className="p-1 rounded-full hover:bg-dark-primary"><PencilIcon className="w-5 h-5 text-dark-text-secondary hover:text-white" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setDeletingItemId(node.id); }} title="حذف" className="p-1 rounded-full hover:bg-dark-primary"><TrashIcon className="w-5 h-5 text-dark-text-secondary hover:text-red-500" /></button>
                            </div>
                        </div>
                        {node.type === 'library' && expandedLibs[node.id] && (
                            <div className="border-r-2 border-dark-border/50">
                                <LibraryTreeView nodes={node.children} />
                                {addingLibrary?.parentId === node.id && (
                                    <NewLibraryInput 
                                        parentId={node.id} 
                                        onSave={handleConfirmSaveLibrary} 
                                        onCancel={() => setAddingLibrary(null)} 
                                        level={node.level + 1}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
            )}
        </>
    );

    const TabButton: React.FC<{ tabId: ActiveTab; label: string; icon: React.FC<any> }> = ({ tabId, label, icon: Icon }) => {
        const isActive = activeTab === tabId;
        const activeClasses = 'bg-accent text-white';
        const inactiveClasses = 'bg-dark-primary text-dark-text-secondary hover:bg-dark-border';
        return (
            <button onClick={() => setActiveTab(tabId)} className={`w-1/3 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}>
                <Icon className="w-5 h-5" />
                {label}
            </button>
        );
    };

    return (
        <div className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-2xl shadow-lg flex flex-col h-full space-y-4 min-h-[700px]">
            <div className="flex bg-dark-primary p-1 rounded-xl w-full">
                <TabButton tabId="generate" label="توليد البرومت" icon={ImageToPromptIcon} />
                <TabButton tabId="library" label="مكتبة البرومتات" icon={LibraryIcon} />
                <TabButton tabId="image" label="برمت إلى صورة" icon={WandSparklesIcon} />
            </div>
             {error && <p className="text-red-400 text-sm text-center animate-fade-in -mb-2">{error}</p>}

            {/* Generate Prompt Tab */}
            <div className={`flex-col space-y-4 ${activeTab === 'generate' ? 'flex' : 'hidden'}`}>
                <div className="flex-grow border-2 border-dashed border-dark-border rounded-xl p-3 min-h-[150px]">
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {images.map(img => (
                            <div key={img.id} className="relative aspect-square group">
                                <img src={img.url} alt="Uploaded preview" className="w-full h-full object-cover rounded-lg" />
                                <button onClick={() => handleImageRemove(img.id)} className="absolute -top-1 -right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button onClick={() => fileInputRef.current?.click()} className="aspect-square flex flex-col items-center justify-center bg-dark-primary rounded-lg border-2 border-dashed border-dark-border hover:border-accent text-dark-text-secondary hover:text-accent transition-colors">
                            <PlusIcon className="w-8 h-8" />
                            <span className="text-xs mt-1">إضافة</span>
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="prompt-notes" className="block text-sm font-medium text-dark-text-secondary mb-1">
                        ملاحظات إضافية (اختياري)
                    </label>
                    <div className="bg-dark-primary border-2 border-dark-border rounded-lg focus-within:ring-2 focus-within:ring-accent focus-within:border-accent flex flex-col transition-all duration-200">
                        <div className="p-2.5 pb-0">
                            <textarea 
                                id="prompt-notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="w-full bg-transparent text-dark-text placeholder:text-dark-text-secondary focus:outline-none resize-none transition-colors"
                                placeholder="مثال: ركز على الألوان، تجاهل النص في الصورة..."
                                disabled={isLoading || isCorrectingText}
                            />
                        </div>
                        <div className="flex items-center justify-end p-2 gap-2">
                            {isCorrectingText && (
                                <div title="Correcting dictation...">
                                    <svg className="animate-spin h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            )}
                            <DictationButton
                                onStart={handleDictationStart}
                                onUpdate={handleDictationUpdate}
                                onStop={handleDictationStop}
                                disabled={isLoading || isCorrectingText}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0">
                    <button onClick={handleGeneratePrompt} disabled={images.length === 0 || isLoading} className="w-full bg-accent hover:bg-accent-hover disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300">
                        {isLoading ? (
                            <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>تحليل...</>
                        ) : (
                            <><SparklesIcon className="w-5 h-5 mr-2" />توليد البرومت</>
                        )}
                    </button>
                </div>
                
                <div className="relative flex-grow bg-dark-primary rounded-xl p-4 min-h-[150px]">
                    <textarea value={generatedPrompt} onChange={(e) => setGeneratedPrompt(e.target.value)} className="w-full h-full bg-transparent text-dark-text-secondary focus:outline-none resize-none" placeholder="سيظهر البرومت الوصفي هنا بعد تحليل الصورة (الصور)..." />
                    {generatedPrompt && (
                        <div className="absolute top-3 left-3 flex gap-2">
                            <button onClick={handleSaveCurrentPrompt} className="p-2 rounded-lg bg-dark-secondary hover:bg-dark-border transition-colors" title="حفظ البرومت في المكتبة"><BookmarkIcon className="w-5 h-5 text-dark-text-secondary" /></button>
                            <button onClick={handleCopyToClipboard} className="p-2 rounded-lg bg-dark-secondary hover:bg-dark-border transition-colors" title="نسخ إلى الحافظة">
                                {hasCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <DocumentDuplicateIcon className="w-5 h-5 text-dark-text-secondary" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Prompt Library Tab */}
            <div className={`flex-col h-full space-y-4 ${activeTab === 'library' ? 'flex' : 'hidden'}`}>
                <div className="flex justify-end items-center gap-2">
                     <button onClick={() => setAddingPromptDetails({ parentId: null })} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-dark-primary border border-dark-border text-dark-text-secondary hover:border-accent hover:text-accent font-semibold transition-colors">
                        <DocumentPlusIcon className="w-5 h-5" /> برومت جديد
                    </button>
                    <button onClick={() => setAddingLibrary({ parentId: null })} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent-hover font-semibold transition-colors">
                        <FolderPlusIcon className="w-5 h-5" /> مكتبة جديدة
                    </button>
                </div>
                <div className="bg-dark-primary rounded-xl p-2 flex-grow overflow-y-auto">
                    {addingLibrary?.parentId === null && (
                         <NewLibraryInput 
                            parentId={null} 
                            onSave={handleConfirmSaveLibrary} 
                            onCancel={() => setAddingLibrary(null)} 
                            level={0}
                        />
                    )}
                    {tree.length > 0 || addingLibrary?.parentId === null ? <LibraryTreeView nodes={tree} /> : <p className="text-center text-sm text-dark-text-secondary p-4">لا توجد برومتات محفوظة بعد.</p>}
                </div>
            </div>
            
            {/* NEW Prompt to Image Tab */}
            <div className={`flex-col h-full ${activeTab === 'image' ? 'flex' : 'hidden'}`}>
                <PromptToImageView />
            </div>

            <ConfirmationModal
                isOpen={!!deletingItemId}
                onClose={() => setDeletingItemId(null)}
                onConfirm={() => deletingItemId && handleDeleteConfirmed(deletingItemId)}
                title="تأكيد الحذف"
                message="هل أنت متأكد من حذف هذا العنصر وجميع محتوياته؟ لا يمكن التراجع عن هذا الإجراء."
                confirmText="نعم، احذف"
            />

            <NewPromptModal
                isOpen={!!addingPromptDetails}
                onClose={() => setAddingPromptDetails(null)}
                onSave={handleAddNewPrompt}
                libraries={libraryItems}
                initialParentId={addingPromptDetails?.parentId}
                initialContent={addingPromptDetails?.content}
            />

        </div>
    );
};

export default ImageToPromptView;