import { DesignOption, AIModelOption, RoomOption, PaletteOption } from './types';
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

export const PALETTE_OPTIONS: PaletteOption[] = [
    { name: 'Surprise Me', promptValue: 'surprise-me', imageUrl: 'https://i.imgur.com/6zGVd80.png' },
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
    { label: 'Custom', prompt: CUSTOM_STYLE_PROMPT },
    { label: 'Modern', prompt: 'in a modern style', imageUrl: 'https://i.imgur.com/6z0kL7v.jpeg' },
    { label: 'Tropical', prompt: 'in a tropical style', imageUrl: 'https://i.imgur.com/yior2iM.jpeg' },
    { label: 'Minimalistic', prompt: 'in a minimalistic style', imageUrl: 'https://i.imgur.com/bJLf3lS.jpeg' },
    { label: 'Bohemian', prompt: 'in a bohemian style', imageUrl: 'https://i.imgur.com/TAz9b6p.jpeg' },
    { label: 'Rustic', prompt: 'in a rustic style', imageUrl: 'https://i.imgur.com/ExaA5y4.jpeg' },
    { label: 'Vintage', prompt: 'in a vintage style', imageUrl: 'https://i.imgur.com/ZSU2TzH.jpeg' },
    { label: 'Baroque', prompt: 'in a baroque style', imageUrl: 'https://i.imgur.com/t8y5798.jpeg' },
    { label: 'Mediterranean', prompt: 'in a mediterranean style', imageUrl: 'https://i.imgur.com/uI1mRTy.jpeg' },
    { label: 'Cyberpunk', prompt: 'in a cyberpunk style', imageUrl: 'https://i.imgur.com/k2wAmnM.jpeg' },
    { label: 'Biophilic', prompt: 'in a biophilic style', imageUrl: 'https://i.imgur.com/aA4Sn6m.jpeg' },
    { label: 'Ancient Egyptian', prompt: 'in an ancient egyptian style', imageUrl: 'https://i.imgur.com/Tqo4p5b.jpeg' },
    { label: 'Airbnb', prompt: 'in a clean, welcoming, and photogenic style suitable for an Airbnb rental', imageUrl: 'https://i.imgur.com/JFAaP9e.jpeg' },
    { label: 'Discotheque', prompt: 'in a discotheque style', imageUrl: 'https://i.imgur.com/4LDRt28.jpeg' },
    { label: 'Soho Style', prompt: 'in a soho style', imageUrl: 'https://i.imgur.com/2sW343a.jpeg' },
    { label: 'Rainbow', prompt: 'in a rainbow style', imageUrl: 'https://i.imgur.com/pA30U0c.jpeg' },
    { label: 'Luxury', prompt: 'in a luxury style', imageUrl: 'https://i.imgur.com/dM2aU2l.jpeg' },
    { label: 'Technoland', prompt: 'in a futuristic technoland style', imageUrl: 'https://i.imgur.com/8n0gL2R.jpeg' },
    { label: 'Gamer', prompt: 'in a gamer or e-sports inspired style', imageUrl: 'https://i.imgur.com/eD3B3kM.jpeg' },
    { label: 'Cozy', prompt: 'in a cozy style', imageUrl: 'https://i.imgur.com/rN1fB0G.jpeg' },
    { label: 'Coastal', prompt: 'in a coastal style', imageUrl: 'https://i.imgur.com/E5Qy5V6.jpeg' },
    { label: 'Japandi', prompt: 'in a japandi style', imageUrl: 'https://i.imgur.com/6p3s0Lg.jpeg' },
    { label: 'Cottagecore', prompt: 'in a cottagecore style', imageUrl: 'https://i.imgur.com/L7p4Z5j.jpeg' },
    { label: 'Ski Chalet', prompt: 'in a ski chalet style', imageUrl: 'https://i.imgur.com/uY6d445.jpeg' },
    { label: 'Gothic', prompt: 'in a gothic style', imageUrl: 'https://i.imgur.com/eBvB5yv.jpeg' },
    { label: 'Creepy', prompt: 'in a creepy, haunted, or spooky style', imageUrl: 'https://i.imgur.com/XG0S2a9.jpeg' },
    { label: 'Medieval', prompt: 'in a medieval style', imageUrl: 'https://i.imgur.com/Y1Z545v.jpeg' },
    { label: '80s Style', prompt: 'in an 80s retro style', imageUrl: 'https://i.imgur.com/m5R6G6q.jpeg' },
    { label: 'Cartoon', prompt: 'in a cartoon or comic book style', imageUrl: 'https://i.imgur.com/Wp7b7Lq.jpeg' },
    { label: 'Wood', prompt: 'in a wood-centric style with natural wood finishes', imageUrl: 'https://i.imgur.com/c1g2T9s.jpeg' },
    { label: 'Chocolate', prompt: 'in a rich, chocolate-themed style with deep brown tones', imageUrl: 'https://i.imgur.com/N6sJ6Bq.jpeg' },
];

export const EXTERIOR_STYLE_OPTIONS: DesignOption[] = [
    { label: 'Custom', prompt: CUSTOM_STYLE_PROMPT },
    { label: 'Modern', prompt: 'in a modern style', imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=200&h=200&fit=crop&q=80' },
    { label: 'Contemporary', prompt: 'in a contemporary style', imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=200&h=200&fit=crop&q=80' },
    { label: 'Traditional', prompt: 'in a traditional style', imageUrl: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=200&h=200&fit=crop&q=80' },
    { label: 'Mediterranean', prompt: 'in a mediterranean style', imageUrl: 'https://images.unsplash.com/photo-1600585152225-358ea60c7ae8?w=200&h=200&fit=crop&q=80' },
    { label: 'Craftsman', prompt: 'in a craftsman style', imageUrl: 'https://images.unsplash.com/photo-1598228723793-52759bba239c?w=200&h=200&fit=crop&q=80' },
    { label: 'Asian', prompt: 'in an asian style', imageUrl: 'https://images.unsplash.com/photo-1531908916364-5557a588f253?w=200&h=200&fit=crop&q=80' },
    { label: 'Classic', prompt: 'in a classic style', imageUrl: 'https://images.unsplash.com/photo-1613470984931-73933f3fa635?w=200&h=200&fit=crop&q=80' },
    { label: 'Neo-Classic', prompt: 'in a neo-classic style, blending classic elegance with modern simplicity', imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=200&fit=crop&q=80' },
];

export const AI_MODELS: AIModelOption[] = [
  { name: 'Gemini Nano Banana', id: 'gemini-2.5-flash-image-preview' },
  { name: 'GPT Image 1 (Placeholder)', id: 'gpt-image-1' },
  { name: 'DALL-E 3 (Placeholder)', id: 'dall-e-3' },
];

export const DEFAULT_AI_MODEL = 'gemini-2.5-flash-image-preview';