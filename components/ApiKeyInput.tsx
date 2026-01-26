import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'GEMINI_API_KEY';

export const ApiKeyInput: React.FC = () => {
    const [apiKey, setApiKey] = useState<string>('');
    const [saved, setSaved] = useState<boolean>(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) || '';
        setApiKey(stored);
        setSaved(!!stored);
    }, []);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem(STORAGE_KEY, apiKey.trim());
            setSaved(true);
        }
    };

    const handleClear = () => {
        localStorage.removeItem(STORAGE_KEY);
        setApiKey('');
        setSaved(false);
    };

    return (
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1">
            <input
                type="password"
                placeholder="Gemini API Key"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="bg-slate-900 text-slate-200 placeholder-slate-500 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
                onClick={handleSave}
                className="text-xs font-bold uppercase text-indigo-400 hover:text-indigo-300"
            >
                Save
            </button>
            {saved && (
                <button
                    onClick={handleClear}
                    className="text-xs font-bold uppercase text-red-400 hover:text-red-300"
                >
                    Clear
                </button>
            )}
        </div>
    );
};
