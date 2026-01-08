async function verifyLanguageAndSave(text, sender) {
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: `You are a language detector.
                        Return a JSON with:
                        "is_english": boolean (true if the text is primarily in English, false if it is Portuguese or another language).
                        `
                    },
                    { role: "user", content: text }
                ]
            })
        });

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);

        if (result.is_english) {
            // It is English, save it!
            const cleanText = text.trim();
            const storageData = await browser.storage.local.get({ savedInputs: [] });
            const inputs = storageData.savedInputs;

            // Avoid duplicates at top
            if (inputs.length > 0 && inputs[0].text === cleanText) return;

            inputs.unshift({
                id: Date.now(),
                text: cleanText,
                url: sender.url || "unknown",
                date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            await browser.storage.local.set({ savedInputs: inputs.slice(0, 50) });
            console.log("Saved English text:", cleanText);
        } else {
            console.log("Discarded non-English text:", text);
        }

    } catch (error) {
        console.error("AI Verification Failed:", error);
    }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "CHECK_AND_SAVE") {
        verifyLanguageAndSave(message.text, sender);
    }
});
