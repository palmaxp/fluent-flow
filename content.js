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

    // Filter: Ignore strictly numbers or date-like strings
    if (/^[0-9\s\/\.\-]+$/.test(cleanText)) return;

    // Filter: Ignore Emails (aggressive check)
    if (/\S+@\S+\.\S+/.test(cleanText)) return;

    // Filter: Ignore Portugese Heuristics
    // If text contains very common Portuguese stopwords, we assume it's PT.
    const ptStopwords = /\b(pq|q|que|nao|não|com|para|uma|um|os|as|em|por|voce|você|estou|está|esta)\b/i;
    if (ptStopwords.test(cleanText)) return;

    // Filter: Ignore URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    if (urlRegex.test(cleanText)) return;

    // Send to Background for AI Verification (Costly check)
    browser.runtime.sendMessage({
        action: "CHECK_AND_SAVE",
        text: cleanText
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