import React, { useState } from 'react';
import { ImageEditingMode } from '../types';
import ImageEditingModeSwitcher from './ImageEditingModeSwitcher';
import StandardImageEditor from './StandardImageEditor';
import ImageToPromptView from './ImageToPromptView';
import TextureGeneratorView from './TextureGeneratorView';

function ImageEditingView() {
    const [mode, setMode] = useState<ImageEditingMode>(ImageEditingMode.Edit);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-2xl shadow-lg">
                <ImageEditingModeSwitcher selected={mode} onSelect={setMode} />
            </div>

            <div hidden={mode !== ImageEditingMode.Edit}>
                <StandardImageEditor />
            </div>
            <div hidden={mode !== ImageEditingMode.ImageToPrompt}>
                <ImageToPromptView />
            </div>
            <div hidden={mode !== ImageEditingMode.Texture}>
                <TextureGeneratorView />
            </div>
        </div>
    );
}

export default ImageEditingView;
