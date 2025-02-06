const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const axios = require('axios');
const app = express();
const port = 3000;

dotenv.config();  // Load environment variables from .env file

// Middleware to parse JSON request body
app.use(bodyParser.json());

// Simple in-memory database to store enhanced CVs (for demo purposes)
let enhancedCVs = {};

// Endpoint to enhance CV
app.post('/js/enhance-cv', async (req, res) => {
    const cvData = req.body;

    if (!cvData) {
        return res.status(400).json({ message: 'No CV data provided' });
    }

    try {
        const enhancedCV = await enhanceCV(cvData);
        const cvId = Math.random().toString(36).substring(2, 15);
        enhancedCVs[cvId] = enhancedCV;

        // Send enhanced CV back to the client
        res.json({ cvId, enhancedCV });
    } catch (error) {
        console.error('Error enhancing CV:', error);
        res.status(500).json({ message: 'Failed to enhance CV', error: error.message });
    }
});

// Function to enhance CV using Gemini API
async function enhanceCV(cvData) {
    try {
        const response = await axios.post(process.env.GEMINI_API_URL, {
            api_key: process.env.GEMINI_API_KEY,
            data: cvData,  // Send the CV data to Gemini for enhancement
        });

        if (response.data.success) {
            // Enhance CV with the returned data
            const enhancedCV = response.data.enhanced_cv;
            return enhancedCV;
        } else {
            throw new Error('Gemini API enhancement failed');
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error('Error enhancing CV with Gemini API');
    }
}

// Start the Express server
app.listen(port, () => {
    console.log(`CV Generator API listening at http://localhost:${port}`);
});
