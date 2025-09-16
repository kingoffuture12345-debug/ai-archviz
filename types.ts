import React from 'react';

// FIX: Removed self-import of `DesignOption` to resolve a name conflict.
export enum DesignType {
    Interior = 'Interior',
    Exterior = 'Exterior',
}

export enum AppMode {
    Architecture = 'Architecture',
    ImageEditing = 'ImageEditing',
}

export interface DesignOption {
    label: string;
    prompt: string;
    imageUrl?: string;
}

export interface RoomOption {
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