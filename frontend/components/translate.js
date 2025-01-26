export async function translateContent(text, targetLanguage) {
    const response = await fetch('<API Gateway URL>/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_language: targetLanguage })
    });

    if (!response.ok) {
        console.error('Error translating content:', response.statusText);
        return text; // Fallback to the original text
    }

    const { translated_text } = await response.json();
    return translated_text;
}

// Example usage: Translate a heading on the page
document.addEventListener('DOMContentLoaded', async () => {
    const originalText = 'Welcome to VirtualFair!';
    const translatedText = await translateContent(originalText, 'es'); // Translate to Spanish
    document.getElementById('welcomeMessage').textContent = translatedText;
});
