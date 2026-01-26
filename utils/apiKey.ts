export const getApiKey = (): string => {
    const key = localStorage.getItem('GEMINI_API_KEY');
    if (!key) {
        console.warn('Gemini API key not set in localStorage');
        return '';
    }
    return key;
};
