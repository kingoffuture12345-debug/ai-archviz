import { DesignOption, AIModelOption, RoomOption, PaletteOption, BuildingOption } from './types';
import { AtticIcon } from './components/icons/AtticIcon';
import { BalconyIcon } from './components/icons/BalconyIcon';
import { BathroomIcon } from './components/icons/BathroomIcon';
import { BedroomIcon } from './components/icons/BedroomIcon';
import { CoffeeShopIcon } from './components/icons/CoffeeShopIcon';
import { DeckIcon } from './components/icons/DeckIcon';
import { DiningRoomIcon } from './components/icons/DiningRoomIcon';
import { GamingRoomIcon } from './components/icons/GamingRoomIcon';
import { GardenIcon } from './components/icons/GardenIcon';
import { HallIcon } from './components/icons/HallIcon';
import { HomeOfficeIcon } from './components/icons/HomeOfficeIcon';
import { KidsRoomIcon } from './components/icons/KidsRoomIcon';
import { KitchenIcon } from './components/icons/KitchenIcon';
import { LivingRoomIcon } from './components/icons/LivingRoomIcon';
import { MajlisIcon } from './components/icons/MajlisIcon';
import { OfficeIcon } from './components/icons/OfficeIcon';
import { RestaurantIcon } from './components/icons/RestaurantIcon';
import { StudyRoomIcon } from './components/icons/StudyRoomIcon';
import { ToiletIcon } from './components/icons/ToiletIcon';
import { CustomStyleIcon } from './components/icons/CustomStyleIcon';
import { ModernIcon } from './components/icons/ModernIcon';
import { MinimalisticIcon } from './components/icons/MinimalisticIcon';
import { BohemianIcon } from './components/icons/BohemianIcon';
import { RusticIcon } from './components/icons/RusticIcon';
import { VintageIcon } from './components/icons/VintageIcon';
import { BaroqueIcon } from './components/icons/BaroqueIcon';
import { MediterraneanIcon } from './components/icons/MediterraneanIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { CyberpunkIcon } from './components/icons/CyberpunkIcon';
// FIX: Import HomeIcon to fix 'Cannot find name' error.
import { HomeIcon } from './components/icons/HomeIcon';
// FIX: Import BuildingOfficeIcon to fix 'Cannot find name' error.
import { BuildingOfficeIcon } from './components/icons/BuildingOfficeIcon';
import { JapandiIcon } from './components/icons/JapandiIcon';
import { VillaIcon } from './components/icons/VillaIcon';
import { SkyscraperIcon } from './components/icons/SkyscraperIcon';
import { StorefrontIcon } from './components/icons/StorefrontIcon';
import { BrutalistIcon } from './components/icons/BrutalistIcon';
import { FrenchIcon } from './components/icons/FrenchIcon';
import { MidcenturyIcon } from './components/icons/MidcenturyIcon';
import { MiddleEasternIcon } from './components/icons/MiddleEasternIcon';
import { MoroccoIcon } from './components/icons/MoroccoIcon';
import { SpanishIcon } from './components/icons/SpanishIcon';
import { CommercialBuildingIcon } from './components/icons/CommercialBuildingIcon';
import { MixedUseBuildingIcon } from './components/icons/MixedUseBuildingIcon';
import { CustomBuildingIcon } from './components/icons/CustomBuildingIcon';
import { ImageIcon } from './components/icons/ImageIcon';
import { NeoclassicalIcon } from './components/icons/NeoclassicalIcon';
import { ClayIcon } from './components/icons/ClayIcon';
import { NoSymbolIcon } from './components/icons/NoSymbolIcon';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';


export const ROOM_TYPE_OPTIONS: RoomOption[] = [
    { label: 'مطبخ (Kitchen)', prompt: 'kitchen', icon: KitchenIcon },
    { label: 'غرفة معيشة (Living Room)', prompt: 'living room', icon: LivingRoomIcon },
    { label: 'مجلس (Majlis)', prompt: 'majlis', icon: MajlisIcon },
    { label: 'مكتب منزلي (Home Office)', prompt: 'home office', icon: HomeOfficeIcon },
    { label: 'غرفة نوم (Bedroom)', prompt: 'bedroom', icon: BedroomIcon },
    { label: 'حمام (Bathroom)', prompt: 'bathroom', icon: BathroomIcon },
    { label: 'غرفة طعام (Dining Room)', prompt: 'dining room', icon: DiningRoomIcon },
    { label: 'مقهى (Coffee Shop)', prompt: 'coffee shop', icon: CoffeeShopIcon },
    { label: 'غرفة دراسة (Study Room)', prompt: 'study room', icon: StudyRoomIcon },
    { label: 'مطعم (Restaurant)', prompt: 'restaurant', icon: RestaurantIcon },
    { label: 'غرفة ألعاب (Gaming Room)', prompt: 'gaming room', icon: GamingRoomIcon },
    { label: 'مكتب (Office)', prompt: 'office', icon: OfficeIcon },
    { label: 'علية (Attic)', prompt: 'attic', icon: AtticIcon },
    { label: 'دورة مياه (Toilet)', prompt: 'toilet', icon: ToiletIcon },
    { label: 'شرفة (Balcony)', prompt: 'balcony', icon: BalconyIcon },
    { label: 'صالة (Hall)', prompt: 'hall', icon: HallIcon },
    { label: 'حديقة (Garden)', prompt: 'garden', icon: GardenIcon },
    { label: 'سطح (Deck)', prompt: 'deck', icon: DeckIcon },
    { label: 'غرفة أطفال (Kids Room)', prompt: 'kids room', icon: KidsRoomIcon },
    { label: 'مخصص (Custom)', prompt: 'custom room', icon: CustomStyleIcon },
];

export const BUILDING_TYPE_OPTIONS: BuildingOption[] = [
    { label: 'مخصص (Custom)', prompt: 'custom building', icon: CustomBuildingIcon },
    { label: 'فيلا (Villa)', prompt: 'villa', icon: VillaIcon },
    { label: 'ناطحة سحاب (Skyscraper)', prompt: 'skyscraper', icon: SkyscraperIcon },
    { label: 'متجر (Storefront)', prompt: 'storefront', icon: StorefrontIcon },
    { label: 'مبنى سكني (Apartment Bldg)', prompt: 'apartment building', icon: BuildingOfficeIcon },
    { label: 'منزل (House)', prompt: 'house', icon: HomeIcon },
    { label: 'مبنى تجاري (Commercial)', prompt: 'commercial building', icon: CommercialBuildingIcon },
    { label: 'سكني تجاري (Mixed-Use)', prompt: 'mixed-use building', icon: MixedUseBuildingIcon },
    { label: 'حديقة (Park)', prompt: 'park', icon: GardenIcon },
];

export const DECOR_PALETTE_OPTIONS: PaletteOption[] = [
    { name: 'لا شيء', promptValue: 'none' },
    { name: 'Surprise Me', promptValue: 'surprise-me' },
    { name: 'Trend', promptValue: 'earthy-modern-trend', colors: ['#EAE0D5', '#B07D62', '#8A9A5B', '#5C4033'] },
    { name: 'Trend (Arabian)', promptValue: 'desert-chic-gulf-trend', colors: ['#F4EFE8', '#DCD0C0', '#B8A898', '#A1887F'] },
    { name: 'Crisp White', promptValue: 'crisp-white', colors: ['#FFFFFF', '#F8F8F8', '#F0F0F0', '#E8E8E8'] },
    { name: 'Warm Neutrals', promptValue: 'warm-neutrals', colors: ['#F5F5DC', '#F0EAD6', '#E1C699', '#D2B48C'] },
    { name: 'Earthy Clay', promptValue: 'earthy-clay', colors: ['#E3A387', '#C48A70', '#A5725A', '#875B45'] },
    { name: 'Subtle Greens', promptValue: 'subtle-greens', colors: ['#D1E2C4', '#B3D1A7', '#95C089', '#77AF6C'] },
    { name: 'Misty Blues', promptValue: 'misty-blues', colors: ['#C9DAE5', '#AEC5D6', '#94B0C7', '#799BB8'] },
    { name: 'Dark Academia', promptValue: 'dark-academia', colors: ['#2F4F4F', '#556B2F', '#483C32', '#36454F'] },
    { name: 'Japandi Wood', promptValue: 'japandi-wood', colors: ['#D6CFCB', '#C1B6AF', '#A8998D', '#544B45'] },
    { name: 'Custom 1', promptValue: 'custom-1', colors: ['#cccccc', '#aaaaaa', '#888888', '#666666'] },
    { name: 'Custom 2', promptValue: 'custom-2', colors: ['#cccccc', '#aaaaaa', '#888888', '#666666'] },
    { name: 'Custom 3', promptValue: 'custom-3', colors: ['#cccccc', '#aaaaaa', '#888888', '#666666'] },
];

export const FURNITURE_PALETTE_OPTIONS: PaletteOption[] = [
    { name: 'لا شيء', promptValue: 'none' },
    { name: 'Surprise Me', promptValue: 'surprise-me' },
    { name: 'Trend', promptValue: 'rich-naturals-trend', colors: ['#003366', '#228B22', '#CC5500', '#800020'] },
    { name: 'Trend (Arabian)', promptValue: 'royal-oasis-gulf-trend', colors: ['#003E51', '#8A3324', '#D4AF37', '#4B0082'] },
    { name: 'Linen & Cotton', promptValue: 'linen-cotton', colors: ['#F5F5F5', '#EAEAEA', '#D3D3D3', '#A9A9A9'] },
    { name: 'Velvet Jewels', promptValue: 'velvet-jewels', colors: ['#004225', '#800020', '#00008B', '#FFD700'] },
    { name: 'Coastal Blues', promptValue: 'coastal-blues', colors: ['#ADD8E6', '#87CEEB', '#0077BE', '#F0F8FF'] },
    { name: 'Sunset Hues', promptValue: 'sunset-hues', colors: ['#FFC0CB', '#FFA07A', '#FF7F50', '#E9967A'] },
    { name: 'Forest Greens', promptValue: 'forest-greens', colors: ['#556B2F', '#2E8B57', '#6B8E23', '#CADFB7'] },
    { name: 'Spiced Earth', promptValue: 'spiced-earth', colors: ['#D2691E', '#A0522D', '#B87333', '#DAA520'] },
    { name: 'Monochrome Bold', promptValue: 'monochrome-bold', colors: ['#000000', '#36454F', '#808080', '#FFFFFF'] },
    { name: 'Pastel Dreams', promptValue: 'pastel-dreams', colors: ['#FFDAB9', '#E6E6FA', '#B0E0E6', '#F0FFF0'] },
    { name: 'Custom 1', promptValue: 'custom-1', colors: ['#cccccc', '#aaaaaa', '#888888', '#666666'] },
    { name: 'Custom 2', promptValue: 'custom-2', colors: ['#cccccc', '#aaaaaa', '#888888', '#666666'] },
    { name: 'Custom 3', promptValue: 'custom-3', colors: ['#cccccc', '#aaaaaa', '#888888', '#666666'] },
];

export const EXTERIOR_PALETTE_OPTIONS: PaletteOption[] = [
    { name: 'لا شيء', promptValue: 'none' },
    { name: 'Surprise Me', promptValue: 'surprise-me' },
    { name: 'Neutral Elegance', promptValue: 'neutral-elegance', colors: ['#d8d8d8', '#000000'] },
    { name: 'Warm Earth', promptValue: 'warm-earth', colors: ['#f5f5dc', '#9a572a', '#f5f5f5'] },
    { name: 'Stone & Concrete', promptValue: 'stone-concrete', colors: ['#bdbdbd', '#5d5d5d', '#e0e0e0'] },
    { name: 'Mediterranean Touch', promptValue: 'mediterranean-touch', colors: ['#204a6b', '#b15f3e'] },
    { name: 'Luxury Contrast', promptValue: 'luxury-contrast', colors: ['#333333', '#b8b8b8', '#ffd700'] },
    { name: 'Green Harmony', promptValue: 'green-harmony', colors: ['#f5f5f5', '#808080', '#556b2f'] },
    { name: 'Classic Cream', promptValue: 'classic-cream', colors: ['#fffacd', '#d2b48c', '#8b4513'] },
    { name: 'Urban Modern', promptValue: 'urban-modern', colors: ['#4a4a4a', '#ffffff', '#b86747'] },
    { name: 'Custom 1', promptValue: 'custom-1', colors: ['#cccccc', '#aaaaaa', '#888888', '#666666'] },
    { name: 'Custom 2', promptValue: 'custom-2', colors: ['#cccccc', '#aaaaaa', '#888888', '#666666'] },
    { name: 'Custom 3', promptValue: 'custom-3', colors: ['#cccccc', '#aaaaaa', '#888888', '#666666'] },
];


export const CUSTOM_STYLE_PROMPT = 'custom';
export const FROM_IMAGE_STYLE_PROMPT = 'from-image';

export const INTERIOR_STYLE_OPTIONS: DesignOption[] = [
    { label: 'Modern', prompt: 'in a modern style', icon: ModernIcon },
    { label: 'Minimalistic', prompt: 'in a minimalistic style', icon: MinimalisticIcon },
    { label: 'Luxury', prompt: 'in a luxury style', icon: SparklesIcon },
    { label: 'Contemporary', prompt: 'in a contemporary style', icon: MidcenturyIcon },
    { label: 'Classic', prompt: 'in a classic style', icon: BaroqueIcon },
    { label: 'Vintage / Retro', prompt: 'in a vintage retro style', icon: VintageIcon },
    { label: 'Mediterranean', prompt: 'in a mediterranean style', icon: MediterraneanIcon },
    { label: 'Scandinavian (Nordic)', prompt: 'in a Scandinavian (Nordic) style', icon: JapandiIcon },
    { label: 'Industrial', prompt: 'in an industrial style', icon: BrutalistIcon },
    { label: 'Rustic / Farmhouse', prompt: 'in a rustic farmhouse style', icon: RusticIcon },
    { label: 'Bohemian (Boho)', prompt: 'in a bohemian (boho) style', icon: BohemianIcon },
    { label: 'Custom', prompt: CUSTOM_STYLE_PROMPT, icon: CustomStyleIcon },
    { label: 'From image', prompt: FROM_IMAGE_STYLE_PROMPT, icon: ImageIcon },
];

export const EXTERIOR_STYLE_OPTIONS: DesignOption[] = [
    { label: 'Modern', prompt: 'in a modern style', icon: ModernIcon },
    { label: 'Minimalistic', prompt: 'in a minimalistic style', icon: MinimalisticIcon },
    { label: 'Contemporary', prompt: 'in a contemporary style', icon: MidcenturyIcon },
    { label: 'Luxury', prompt: 'in a luxury style', icon: SparklesIcon },
    { label: 'Neoclassical', prompt: 'in a neoclassical style', icon: NeoclassicalIcon },
    { label: 'Classic general', prompt: 'in a classic general style', icon: BaroqueIcon },
    { label: 'French Classic', prompt: 'in a french classic style', icon: FrenchIcon },
    { label: 'Mediterranean', prompt: 'in a mediterranean style', icon: MediterraneanIcon },
    { label: 'Spanish', prompt: 'in a spanish style', icon: SpanishIcon },
    { label: 'Moroccan', prompt: 'in a moroccan style', icon: MoroccoIcon },
    { label: 'Middle Eastern', prompt: 'in a middle eastern style', icon: MiddleEasternIcon },
    { label: 'Rustic / Farmhouse', prompt: 'in a rustic farmhouse style', icon: RusticIcon },
    { label: 'Clay', prompt: 'in a clay style', icon: ClayIcon },
    { label: 'Custom', prompt: CUSTOM_STYLE_PROMPT, icon: CustomStyleIcon },
    { label: 'From image', prompt: FROM_IMAGE_STYLE_PROMPT, icon: ImageIcon },
];

export const DAYTIME_LIGHTING_OPTIONS: DesignOption[] = [
    { label: 'بدون', prompt: 'none', icon: NoSymbolIcon },
    { label: 'نهارية غائمة', prompt: 'Completely transform the scene to an overcast daytime scene, regardless of the original lighting. The lighting should be soft, diffused natural light that evenly illuminates all surfaces and minimizes harsh shadows, making it look like it was shot on a cloudy day.', icon: SunIcon },
    { label: 'الساعة الذهبية', prompt: 'Completely transform the scene to the golden hour at sunset, regardless of the original lighting. The low-angle sunlight must cast a warm, golden hue on the space and create long, dramatic shadows. Make it look like it was shot during a beautiful sunset.', icon: SunIcon },
    { label: 'إضاءة استوديو', prompt: 'Completely transform the scene to a bright, clean, and evenly illuminated daytime scene, regardless of the original lighting. The space is lit with professional, multi-point studio lighting with controlled highlights, perfect for a magazine feature.', icon: SparklesIcon },
    { label: 'صباح ضبابي', prompt: 'Completely transform the scene to a misty or foggy morning, regardless of the original lighting. The light must be extremely soft and diffused, and parts of the structure/background should be partially obscured by fog, creating a serene and mysterious daytime atmosphere.', icon: MinimalisticIcon },
];

export const NIGHTTIME_LIGHTING_OPTIONS: DesignOption[] = [
    { label: 'بدون', prompt: 'none', icon: NoSymbolIcon },
    { label: 'سينمائية درامية', prompt: 'Completely transform the scene to a dramatic, cinematic nighttime shot, regardless of the original lighting. Use high contrast lighting (chiaroscuro), with parts of the scene in deep shadow and other key features highlighted by strong, focused artificial spotlights. Make it look like a scene from a movie at night.', icon: MoonIcon },
    { label: 'ضوء الشموع', prompt: 'Completely transform the scene to a nighttime ambiance, regardless of the original lighting. The space must be dimly lit ONLY by the warm, flickering glow of numerous candles, creating an intimate and romantic atmosphere.', icon: SparklesIcon },
    { label: 'توقيت الشفق', prompt: 'Completely transform the scene to the "blue hour" at twilight, after sunset but before full night, regardless of the original lighting. The sky must be a deep, rich blue, and artificial lights (interior or accent) should be turned on and glow warmly.', icon: MoonIcon },
    { label: 'سايبربانك', prompt: 'Completely transform the scene into a dark, futuristic cyberpunk city at night, regardless of the original lighting. The scene must be filled with glowing neon signs in shades of magenta, cyan, and electric yellow. Add rain-slicked streets that reflect the vibrant holographic advertisements. The architecture should be dark and imposing.', icon: CyberpunkIcon },
];

export const AI_MODELS: AIModelOption[] = [
  { name: 'Gemini Nano Banana', id: 'gemini-2.5-flash-image' },
  { name: 'GPT Image 1 (Placeholder)', id: 'gpt-image-1' },
  { name: 'DALL-E 3 (Placeholder)', id: 'dall-e-3' },
];

export const DEFAULT_AI_MODEL = 'gemini-2.5-flash-image';