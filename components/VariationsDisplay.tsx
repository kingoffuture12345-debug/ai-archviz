import React from 'react';
import { ImageIcon } from './icons/ImageIcon';

interface VariationsDisplayProps {
    images: string[];
    onSelectVariation: (imageUrl: string) => void;
    isLoading?: boolean;
    loadingCount?: number;
}

const LoadingSkeleton: React.FC = () => (
    <div className="aspect-square bg-dark-primary rounded-lg animate-pulse flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-dark-border" />
    </div>
);

const VariationsDisplay: React.FC<VariationsDisplayProps> = ({ images, onSelectVariation, isLoading = false, loadingCount = 4 }) => {
    if (!isLoading && images.length === 0) {
        return null;
    }

    return (
        <div className="bg-dark-secondary p-4 rounded-2xl shadow-lg animate-fade-in">
            <h3 className="text-lg font-bold text-dark-text mb-3">
                {isLoading ? 'جاري إنشاء التنويعات...' : 'التنويعات التي تم إنشاؤها'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {isLoading ? (
                    Array.from({ length: loadingCount }).map((_, index) => <LoadingSkeleton key={index} />)
                ) : (
                    images.map((img, index) => (
                        <div
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative transition-transform transform hover:scale-105 bg-dark-primary"
                            onClick={() => onSelectVariation(img)}
                        >
                            <img src={img} alt={`Variation ${index + 1}`} className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">تعيين كصورة رئيسية</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
             {!isLoading && <p className="text-xs text-dark-text-secondary mt-2 text-center">انقر على أي تنويع لجعله الصورة الرئيسية "بعد".</p>}
        </div>
    );
};

export default VariationsDisplay;