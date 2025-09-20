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
import { TropicalIcon } from './components/icons/TropicalIcon';
import { MinimalisticIcon } from './components/icons/MinimalisticIcon';
import { BohemianIcon } from './components/icons/BohemianIcon';
import { RusticIcon } from './components/icons/RusticIcon';
import { VintageIcon } from './components/icons/VintageIcon';
import { BaroqueIcon } from './components/icons/BaroqueIcon';
import { MediterraneanIcon } from './components/icons/MediterraneanIcon';
import { CyberpunkIcon } from './components/icons/CyberpunkIcon';
import { BiophilicIcon } from './components/icons/BiophilicIcon';
import { AncientEgyptianIcon } from './components/icons/AncientEgyptianIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
// FIX: Import HomeIcon to fix 'Cannot find name' error.
import { HomeIcon } from './components/icons/HomeIcon';
// FIX: Import BuildingOfficeIcon to fix 'Cannot find name' error.
import { BuildingOfficeIcon } from './components/icons/BuildingOfficeIcon';
import { CoastalIcon } from './components/icons/CoastalIcon';
import { CozyIcon } from './components/icons/CozyIcon';
import { JapandiIcon } from './components/icons/JapandiIcon';
import { CottagecoreIcon } from './components/icons/CottagecoreIcon';
import { SkiChaletIcon } from './components/icons/SkiChaletIcon';
import { GothicIcon } from './components/icons/GothicIcon';
import { CreepyIcon } from './components/icons/CreepyIcon';
import { MedievalIcon } from './components/icons/MedievalIcon';
import { EightiesStyleIcon } from './components/icons/EightiesStyleIcon';
import { CartoonIcon } from './components/icons/CartoonIcon';
import { WoodIcon } from './components/icons/WoodIcon';
import { ChocolateIcon } from './components/icons/ChocolateIcon';
import { VillaIcon } from './components/icons/VillaIcon';
import { SkyscraperIcon } from './components/icons/SkyscraperIcon';
import { StorefrontIcon } from './components/icons/StorefrontIcon';
import { ArtDecoIcon } from './components/icons/ArtDecoIcon';
import { BrutalistIcon } from './components/icons/BrutalistIcon';
import { ChineseIcon } from './components/icons/ChineseIcon';
import { FarmHouseIcon } from './components/icons/FarmHouseIcon';
import { FrenchIcon } from './components/icons/FrenchIcon';
import { ItalianateIcon } from './components/icons/ItalianateIcon';
import { JapaneseIcon } from './components/icons/JapaneseIcon';
import { MidcenturyIcon } from './components/icons/MidcenturyIcon';
import { MiddleEasternIcon } from './components/icons/MiddleEasternIcon';
import { MoroccoIcon } from './components/icons/MoroccoIcon';
import { SpanishIcon } from './components/icons/SpanishIcon';
import { CommercialBuildingIcon } from './components/icons/CommercialBuildingIcon';
import { MixedUseBuildingIcon } from './components/icons/MixedUseBuildingIcon';
import { CustomBuildingIcon } from './components/icons/CustomBuildingIcon';


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

export const PALETTE_OPTIONS: PaletteOption[] = [
    { name: 'Surprise Me', promptValue: 'surprise-me' },
    { name: 'Millennial Gray', promptValue: 'millennial-gray', colors: ['#d1d5db', '#9ca3af', '#6b7280', '#4b5563'] },
    { name: 'Terracotta Mirage', promptValue: 'terracotta-mirage', colors: ['#fecaca', '#fca5a5', '#f87171', '#ef4444'] },
    { name: 'Neon Sunset', promptValue: 'neon-sunset', colors: ['#fb923c', '#f472b6', '#eab308', '#fecaca'] },
    { name: 'Forest Hues', promptValue: 'forest-hues', colors: ['#bbf7d0', '#86efac', '#4ade80', '#166534'] },
    { name: 'Peach Orchard', promptValue: 'peach-orchard', colors: ['#fee2e2', '#fecaca', '#fca5a5', '#fecdd3'] },
    { name: 'Fuschia Blossom', promptValue: 'fuschia-blossom', colors: ['#fce7f3', '#fbcfe8', '#f9a8d4', '#db2777'] },
    { name: 'Emerald Gem', promptValue: 'emerald-gem', colors: ['#34d399', '#a7f3d0', '#6ee7b7', '#059669'] },
    { name: 'Pastel Breeze', promptValue: 'pastel-breeze', colors: ['#c7d2fe', '#e0e7ff', '#f5d0fe', '#f0abfc'] },
    { name: 'Azure Mirage', promptValue: 'azure-mirage', colors: ['#7dd3fc', '#bae6fd', '#e0f2fe', '#f0f9ff'] },
    { name: 'Twilight Blues', promptValue: 'twilight-blues', colors: ['#374151', '#4b5563', '#6b7280', '#9ca3af'] },
    { name: 'Earthy Harmony', promptValue: 'earthy-harmony', colors: ['#a3a3a3', '#d4d4d4', '#e5e5e5', '#f5f5f5'] },
    { name: 'Arctic Lavender', promptValue: 'arctic-lavender', colors: ['#d1d5db', '#e5e7eb', '#ddd6fe', '#c4b5fd'] },
    { name: 'Antique Sage', promptValue: 'antique-sage', colors: ['#86efac', '#bbf7d0', '#dcfce7', '#a3a3a3'] },
    { name: 'Earthy Hues', promptValue: 'earthy-hues', colors: ['#a8a29e', '#d6d3d1', '#e7e5e4', '#a16207'] },
    { name: 'Velvet Dusk', promptValue: 'velvet-dusk', colors: ['#7e22ce', '#a855f7', '#d8b4fe', '#f3e8ff'] },
    { name: 'Ocean Mist', promptValue: 'ocean-mist', colors: ['#67e8f9', '#a5f3fc', '#cffafe', '#e0f2fe'] },
    { name: 'Amethyst Dream', promptValue: 'amethyst-dream', colors: ['#c084fc', '#d8b4fe', '#e9d5ff', '#a855f7'] },
    { name: 'Sakura Bloom', promptValue: 'sakura-bloom', colors: ['#fbcfe8', '#fce7f3', '#fdf2f8', '#f9a8d4'] },
    { name: 'Lilac Love', promptValue: 'lilac-love', colors: ['#d8b4fe', '#e9d5ff', '#f3e8ff', '#faf5ff'] },
    { name: 'Whimsical Wish', promptValue: 'whimsical-wish', colors: ['#fde68a', '#fef3c7', '#fef9c3', '#fefce8'] },
    { name: 'Turquoise Lagoon', promptValue: 'turquoise-lagoon', colors: ['#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1'] },
];

export const CUSTOM_STYLE_PROMPT = 'custom';

export const INTERIOR_STYLE_OPTIONS: DesignOption[] = [
    { label: 'Custom', prompt: CUSTOM_STYLE_PROMPT, icon: CustomStyleIcon },
    { label: 'Modern', prompt: 'in a modern style', icon: ModernIcon },
    { label: 'Tropical', prompt: 'in a tropical style', icon: TropicalIcon },
    { label: 'Minimalistic', prompt: 'in a minimalistic style', icon: MinimalisticIcon },
    { label: 'Bohemian', prompt: 'in a bohemian style', icon: BohemianIcon },
    { label: 'Rustic', prompt: 'in a rustic style', icon: RusticIcon },
    { label: 'Vintage', prompt: 'in a vintage style', icon: VintageIcon },
    { label: 'Baroque', prompt: 'in a baroque style', icon: BaroqueIcon },
    { label: 'Mediterranean', prompt: 'in a mediterranean style', icon: MediterraneanIcon },
    { label: 'Cyberpunk', prompt: 'in a cyberpunk style', icon: CyberpunkIcon },
    { label: 'Biophilic', prompt: 'in a biophilic style', icon: BiophilicIcon },
    { label: 'Ancient Egyptian', prompt: 'in an ancient egyptian style', icon: AncientEgyptianIcon },
    { label: 'Airbnb', prompt: 'in a clean, welcoming, and photogenic style suitable for an Airbnb rental', icon: HomeIcon },
    { label: 'Discotheque', prompt: 'in a discotheque style', icon: SparklesIcon },
    { label: 'Soho Style', prompt: 'in a soho style', icon: BuildingOfficeIcon },
    { label: 'Rainbow', prompt: 'in a rainbow style', icon: SparklesIcon },
    { label: 'Luxury', prompt: 'in a luxury style', icon: SparklesIcon },
    { label: 'Technoland', prompt: 'in a futuristic technoland style', icon: SparklesIcon },
    { label: 'Gamer', prompt: 'in a gamer or e-sports inspired style', icon: GamingRoomIcon },
    { label: 'Cozy', prompt: 'in a cozy style', icon: CozyIcon },
    { label: 'Coastal', prompt: 'in a coastal style', icon: CoastalIcon },
    { label: 'Japandi', prompt: 'in a japandi style', icon: JapandiIcon },
    { label: 'Cottagecore', prompt: 'in a cottagecore style', icon: CottagecoreIcon },
    { label: 'Ski Chalet', prompt: 'in a ski chalet style', icon: SkiChaletIcon },
    { label: 'Gothic', prompt: 'in a gothic style', icon: GothicIcon },
    { label: 'Creepy', prompt: 'in a creepy, haunted, or spooky style', icon: CreepyIcon },
    { label: 'Medieval', prompt: 'in a medieval style', icon: MedievalIcon },
    { label: '80s Style', prompt: 'in an 80s retro style', icon: EightiesStyleIcon },
    { label: 'Cartoon', prompt: 'in a cartoon or comic book style', icon: CartoonIcon },
    { label: 'Wood', prompt: 'in a wood-centric style with natural wood finishes', icon: WoodIcon },
    { label: 'Chocolate', prompt: 'in a rich, chocolate-themed style with deep brown tones', icon: ChocolateIcon },
];

export const EXTERIOR_STYLE_OPTIONS: DesignOption[] = [
    { label: 'Custom', prompt: CUSTOM_STYLE_PROMPT, icon: CustomStyleIcon },
    { label: 'Art Deco', prompt: 'in an art deco style', icon: ArtDecoIcon },
    { label: 'Brutalist', prompt: 'in a brutalist style', icon: BrutalistIcon },
    { label: 'Chinese', prompt: 'in a chinese style', icon: ChineseIcon },
    { label: 'Cottage', prompt: 'in a cottage style', icon: CottagecoreIcon },
    { label: 'Farm House', prompt: 'in a farm house style', icon: FarmHouseIcon },
    { label: 'French', prompt: 'in a french style', icon: FrenchIcon },
    { label: 'Gothic', prompt: 'in a gothic style', icon: GothicIcon },
    { label: 'Italianate', prompt: 'in an italianate style', icon: ItalianateIcon },
    { label: 'Japanese', prompt: 'in a japanese style', icon: JapaneseIcon },
    { label: 'Mediterranean', prompt: 'in a mediterranean style', icon: MediterraneanIcon },
    { label: 'Midcentury', prompt: 'in a midcentury modern style', icon: MidcenturyIcon },
    { label: 'Middle Eastern', prompt: 'in a middle eastern style', icon: MiddleEasternIcon },
    { label: 'Minimalistic', prompt: 'in a minimalistic style', icon: MinimalisticIcon },
    { label: 'Modern', prompt: 'in a modern style', icon: ModernIcon },
    { label: 'Morocco', prompt: 'in a moroccan style', icon: MoroccoIcon },
    { label: 'Ski Chalet', prompt: 'in a ski chalet style', icon: SkiChaletIcon },
    { label: 'Spanish', prompt: 'in a spanish style', icon: SpanishIcon },
];

export const AI_MODELS: AIModelOption[] = [
  { name: 'Gemini Nano Banana', id: 'gemini-2.5-flash-image-preview' },
  { name: 'GPT Image 1 (Placeholder)', id: 'gpt-image-1' },
  { name: 'DALL-E 3 (Placeholder)', id: 'dall-e-3' },
];

export const DEFAULT_AI_MODEL = 'gemini-2.5-flash-image-preview';