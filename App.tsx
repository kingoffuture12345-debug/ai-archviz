import React, { useState } from 'react';
import Header from './components/Header';
import ArchitectureView from './components/ArchitectureView';
import ImageEditingView from './components/ImageEditingView';
import PlanToView from './components/PlanTo3DView';
import HistoryView from './components/HistoryView';
import { AppMode } from './types';
import OfflineBanner from './components/OfflineBanner';
import NotificationCenter from './components/NotificationCenter';

function App() {
    const [appMode, setAppMode] = useState<AppMode>(AppMode.Architecture);

    return (
        <div className="bg-dark-primary min-h-screen p-4 sm:p-6 md:p-8 font-sans">
            <OfflineBanner />
            <NotificationCenter />
            <div className="max-w-7xl mx-auto space-y-4">
                <Header 
                    appMode={appMode}
                    onModeChange={setAppMode}
                />
                
                <main>
                    <div hidden={appMode !== AppMode.Architecture}>
                        <ArchitectureView />
                    </div>
                    <div hidden={appMode !== AppMode.ImageEditing}>
                        <ImageEditingView />
                    </div>
                    <div hidden={appMode !== AppMode.PlanToView}>
                        <PlanToView />
                    </div>
                    <div hidden={appMode !== AppMode.History}>
                        <HistoryView />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;
