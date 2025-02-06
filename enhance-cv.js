const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware to parse JSON request body
app.use(bodyParser.json());

// Simple in-memory database to store enhanced CVs (for demo purposes)
let enhancedCVs = {};

// Endpoint to enhance CV
app.post('/api/enhance-cv', (req, res) => {
    const cvData = req.body;

    if (!cvData) {
        return res.status(400).json({ message: 'No CV data provided' });
    }

    // Enhance CV based on input (you can add more complex logic here)
    const enhancedCV = enhanceCV(cvData);

    // Store enhanced CV (In a real-world application, store in database)
    const cvId = Math.random().toString(36).substring(2, 15);
    enhancedCVs[cvId] = enhancedCV;

    // Send enhanced CV back to the client
    res.json({ cvId, enhancedCV });
});

// Function to enhance CV (Basic enhancement example)
function enhanceCV(cvData) {
    // Enhance CV by formatting and adding default sections (like a header and skills section)
    const enhancedCV = {
        personalInfo: cvData.personalInfo,
        summary: formatSummary(cvData.summary),
        experience: formatExperience(cvData.experience),
        education: formatEducation(cvData.education),
        skills: formatSkills(cvData.skills),
        tone: cvData.tone || 'Professional', // Default tone
        style: cvData.style || 'Standard', // Default style
    };

    return enhancedCV;
}

// Function to format summary (e.g., ensure it's trimmed and concise)
function formatSummary(summary) {
    return summary.trim().length > 0 ? summary : 'A highly motivated professional with strong skills and experience.';
}

// Function to format work experience (add job titles, companies, etc.)
function formatExperience(experience) {
    return experience.map((exp) => {
        return {
            company: exp.company,
            position: exp.position,
            startDate: exp.startDate,
            endDate: exp.endDate,
            responsibilities: exp.responsibilities || 'N/A',
        };
    });
}

// Function to format education data
function formatEducation(education) {
    return education.map((edu) => {
        return {
            institution: edu.institution,
            degree: edu.degree,
            gradYear: edu.gradYear,
            gpa: edu.gpa || 'N/A',
        };
    });
}

// Function to format skills (make sure no duplicates)
function formatSkills(skills) {
    return Array.from(new Set(skills)); // Remove duplicates
}

// Start the Express server
app.listen(port, () => {
    console.log(`CV Generator API listening at http://localhost:${port}`);
});