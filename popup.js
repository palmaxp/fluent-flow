const API_KEY = "[REDACTED]";

async function askOpenAI(text) {
    if (API_KEY.includes("COLE_SUA_CHAVE")) {
        return { corrected: "Erro", explanation: "Configure sua API Key no arquivo popup.js" };
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: `You are an expert English teacher for a developer. 
            Analyze the input text.
            Return a JSON with:
            "corrected": The text fixed (grammar/vocabulary). If perfect, repeat it.
            "explanation": A concise tip on why you changed it or a compliment if perfect.
            "is_english": boolean (true if the text is primarily in English, false otherwise).`
                    },
                    { role: "user", content: text }
                ]
            })
        });

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);

    } catch (error) {
        console.error(error);
        return { corrected: "Erro de Conexão", explanation: "Verifique sua internet ou a chave API.", is_english: true };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('list');
    const emptyElement = document.getElementById('empty');

    browser.storage.local.get({ savedInputs: [] }).then((result) => {
        let inputs = result.savedInputs;

        if (inputs.length === 0) {
            emptyElement.style.display = 'block';
            return;
        }

        const updateStorage = (newInputs) => {
            browser.storage.local.set({ savedInputs: newInputs });
            inputs = newInputs;
            if (inputs.length === 0) {
                emptyElement.style.display = 'block';
                listElement.innerHTML = '';
            }
        };

        inputs.forEach(item => {
            const li = document.createElement('li');
            li.className = 'input-item';
            li.id = `item-${item.id}`;

            const savedResponseHtml = item.aiResponse ? `
                <div class="ai-response" style="display: block;" data-done="true">
                    <div class="correction">✅ ${item.aiResponse.corrected}</div>
                    <div class="explanation">ℹ️ ${item.aiResponse.explanation}</div>
                </div>
            ` : `
                <div class="ai-response" id="ai-${item.id}">
                    <div class="loading">✨ Analyzing with AI...</div>
                </div>
            `;

            li.innerHTML = `
        <button class="delete-btn" title="Excluir item">&times;</button>
        <div class="meta-info">
          <span>${item.url}</span>
          <span>${item.date}</span>
        </div>
        <div class="user-text">"${item.text}"</div>
        ${savedResponseHtml}
      `;

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                li.remove();

                const newInputs = inputs.filter(i => i.id !== item.id);
                updateStorage(newInputs);
            });

            li.addEventListener('click', async () => {
                if (item.aiResponse) return;

                const aiBox = document.getElementById(`ai-${item.id}`);

                if (aiBox.style.display === 'block' && aiBox.getAttribute('data-done')) {
                    aiBox.style.display = 'none';
                    return;
                }

                aiBox.style.display = 'block';

                if (aiBox.getAttribute('data-done')) return;

                const result = await askOpenAI(item.text);

                if (result.is_english === false) {
                    // Remove from UI
                    li.remove();
                    // Remove from storage
                    const newInputs = inputs.filter(i => i.id !== item.id);
                    updateStorage(newInputs);
                    return;
                }

                // It is English, show result and save it
                aiBox.innerHTML = `
          <div class="correction">✅ ${result.corrected}</div>
          <div class="explanation">ℹ️ ${result.explanation}</div>
        `;

                aiBox.setAttribute('data-done', 'true');

                // Save to storage
                const itemIndex = inputs.findIndex(i => i.id === item.id);
                if (itemIndex !== -1) {
                    inputs[itemIndex].aiResponse = {
                        corrected: result.corrected,
                        explanation: result.explanation
                    };
                    updateStorage(inputs);
                    // Update local item reference so future clicks know it's saved
                    item.aiResponse = inputs[itemIndex].aiResponse;
                }
            });

            listElement.appendChild(li);
        });
    });

    // LinkedIn Link Handler
    const linkedinLink = document.getElementById('linkedin-link');
    if (linkedinLink) {
        linkedinLink.addEventListener('click', () => {
            browser.tabs.create({ url: 'https://www.linkedin.com/in/jo%C3%A3o-palma-5a9489211/' }); // Replace with actual LinkedIn URL if known, or let user edit it
        });
    }
});