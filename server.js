import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import finnhub from 'finnhub';
import cors from 'cors';

// Initialize dotenv
dotenv.config();

// Setup directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const port = 3000;

// Enable CORS
app.use(cors());
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());

// Serve dashboard.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Pages/dashboard.html'));
});

// ✅ Existing API keys endpoint
app.get('/api/keys', (req, res) => {
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

    if (!NEWS_API_KEY || !FINNHUB_API_KEY) {
        return res.status(500).json({ error: 'API keys are missing!' });
    }

    res.json({ newsApiKey: NEWS_API_KEY, finnhubApiKey: FINNHUB_API_KEY });
});

// ✅ Existing CV Enhancement Functionality
let enhancedCVs = {};

app.post('/api/enhance-cv', async (req, res) => {
    const cvData = req.body;

    if (!cvData) {
        return res.status(400).json({ message: 'No CV data provided' });
    }

    try {
        const enhancedCV = await enhanceCV(cvData);
        const cvId = Math.random().toString(36).substring(2, 15);
        enhancedCVs[cvId] = enhancedCV;

        res.json({ cvId, enhancedCV });
    } catch (error) {
        console.error('Error enhancing CV:', error);
        res.status(500).json({ message: 'Failed to enhance CV', error: error.message });
    }
});

async function enhanceCV(cvData) {
    try {
        const response = await axios.post(process.env.GEMINI_API_URL, {
            api_key: process.env.GEMINI_API_KEY,
            data: cvData,
        });

        if (response.data.success) {
            return response.data.enhanced_cv;
        } else {
            throw new Error('Gemini API enhancement failed');
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error('Error enhancing CV with Gemini API');
    }
}

// ✅ New: Finnhub API Setup
const finnhubApiKey = process.env.FINNHUB_API_KEY;
const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = finnhubApiKey;
const finnhubClient = new finnhub.DefaultApi();

// ✅ New: Fetch Finance News Endpoint
app.get('/api/finance-news', async (req, res) => {
    finnhubClient.marketNews("general", {}, (error, data) => {
        if (error) {
            console.error('Error fetching finance news:', error);
            return res.status(500).json({ error: 'Failed to fetch finance news' });
        }
        res.json(data);
    });
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
