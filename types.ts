import React from 'react';

// FIX: Removed self-import of `DesignOption` to resolve a name conflict.
export enum DesignType {
    Interior = 'Interior',
    Exterior = 'Exterior',
}

export enum AppMode {
    Architecture = 'Architecture',
    ImageEditing = 'ImageEditing',
    PlanToView = 'PlanToView',
    History = 'History',
}

export enum ImageEditingMode {
    Edit = 'Edit',
    ImageToPrompt = 'ImageToPrompt',
    Texture = 'Texture',
}

export enum PlanMode {
    PlanTo3D = 'PlanTo3D',
    SketchTo3D = 'SketchTo3D',
}

export interface DesignOption {
    label: string;
    prompt: string;
    imageUrl?: string;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface RoomOption {
    label:string;
    prompt: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface BuildingOption {
    label:string;
    prompt: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface PaletteOption {
    name: string;
    promptValue: string;
    colors?: string[];
    imageUrl?: string;
}

export interface CustomStyleDetails {
    colors: string;
    features: string;
    lighting: string;
    mood: string;
    textures: string;
}

export interface AIModelOption {
    name: string;
    id: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  beforeImageUrl: string;
  afterImageUrl: string;
  settings: {
    appMode: AppMode;
    designType?: DesignType;
    roomType?: string;
    buildingType?: string;
    style?: string;
    customStyleDetails?: CustomStyleDetails;
    selectedPalette?: string; // For exterior designs
    decorPalette?: string; // For interior decor
    furniturePalette?: string; // For interior furniture
    editablePrompt: string;
    referenceImageUrls?: string[]; 
  };
}

export interface LibraryItem {
    id: string;
    name: string;
    parentId: string | null;
    type: 'library' | 'prompt';
    content?: string; // for prompts
    timestamp: number;
}

export interface GeneratedAsset {
  id: string;
  url: string; // data URL
  base64: { data: string; mimeType: string };
}

export interface Asset {
  id: string;
  url: string; 
  base64: { data: string; mimeType: string };
  description: string;
  _generatedAssetsCache?: GeneratedAsset[]; 
}
