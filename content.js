function extractText(target) {
    if (target.type === 'password') return '';

    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return target.value;
    }
    else if (target.isContentEditable) {
        return target.innerText;
    }
    return '';
}

function saveToStorage(text) {
    const cleanText = text.trim();

    // Filter: Ignore short texts or strictly numbers
    if (cleanText.length < 3 || !isNaN(cleanText)) return;

    // Filter: Ignore URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    if (urlRegex.test(cleanText)) return;

    browser.storage.local.get({ savedInputs: [] }).then((result) => {
        const inputs = result.savedInputs;

        if (inputs.length > 0 && inputs[0].text === cleanText) return;

        inputs.unshift({
            id: Date.now(),
            text: cleanText,
            url: window.location.hostname,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        browser.storage.local.set({ savedInputs: inputs.slice(0, 50) });
    });
}

document.addEventListener('blur', (e) => {
    const text = extractText(e.target);
    if (text) saveToStorage(text);
}, true);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        const text = extractText(e.target);
        if (text) saveToStorage(text);
    }
}, true);