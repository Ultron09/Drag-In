require('dotenv').config(); // Load .env variables
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText';

/**
 * Generate text using Gemini AI
 * @param {string} prompt - The input text for Gemini
 * @returns {Promise<string>} - The AI-generated response
 */
async function generateText(prompt) {
    try {
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            }
        );              
        
        return response.data.candidates[0]?.output || "No response received";
    } catch (error) {
        console.error('Error calling Gemini API:', error.message);
        return "Error generating response";
    }
}

module.exports = { generateText };