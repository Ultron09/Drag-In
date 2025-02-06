const { generateText } = require('./geminiapi'); // Adjust path accordingly

async function main() {
    const prompt = "Tell me a fun fact about space.";
    const response = await generateText(prompt);
    console.log("AI Response:", response);
}

main();
