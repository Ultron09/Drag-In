document.addEventListener("DOMContentLoaded", function () {
    fetchCVData();
    setupProfileUpload();
    setupDownloadButton();
});

function fetchCVData() {
    fetch('/get_last_cv')
    .then(response => response.json())
    .then(data => {
        console.log("Fetched CV Data:", data); // Debugging output

        if (!data || typeof data !== "object") {
            console.error("Invalid CV data format.");
            return;
        }

        // Personal Details
        updateTextContent("#name", data.personalInfo?.name, "Your Name");
        updateTextContent("#email", data.personalInfo?.email, "email@example.com");
        updateTextContent("#phone", data.personalInfo?.phone, "+1234567890");
        updateTextContent("#location", data.personalInfo?.location, "City, Country");

        // Professional Summary - Handles JSON-encoded summaries
        let formattedSummary = data.summary.trim();

if (formattedSummary.startsWith("{") || formattedSummary.startsWith("[")) {
    try {
        formattedSummary = JSON.parse(formattedSummary);
    } catch (e) {
        console.warn("⚠️ Could not parse summary JSON, using raw text.");
    }
}

updateTextContent("#summary", formattedSummary, "No summary available.");


        // Work Experience
        updateInnerHTML("#work-experience", formatExperience(data.experience));

        // Education
        updateInnerHTML("#education", formatEducation(data.education));

        // Skills
        updateInnerHTML("#skills", data.skills);

        // Projects
        updateInnerHTML("#projects", formatProjects(data.projects));

        // Awards & Recognition
        updateInnerHTML("#awards", formatAwards(data.awardsAndRecognition));
    })
    .catch(error => console.error("Error loading CV:", error));
}

function updateTextContent(selector, value, fallback) {
    const element = document.querySelector(selector);
    if (element) {
        if (typeof value === "object") {
            element.innerText = JSON.stringify(value, null, 2); // Format objects properly
        } else {
            element.textContent = value?.trim() || fallback;
        }
    }
}

function updateInnerHTML(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.innerHTML = value || "<em>No data available.</em>";
}

function formatExperience(experience) {
    if (!Array.isArray(experience) || experience.length === 0) return "<em>No experience listed.</em>";
    return experience.map(exp => `
        <strong>${exp.position} - ${exp.company}</strong><br>
        ${exp.startDate} - ${exp.endDate || "Present"}<br>
        <ul>${exp.responsibilities?.map(res => `<li>${res}</li>`).join("") || ""}</ul>
    `).join("");
}

function formatEducation(education) {
    if (!Array.isArray(education) || education.length === 0) return "<em>No education listed.</em>";
    return education.map(edu => `
        <strong>${edu.degree} - ${edu.institution}</strong><br>
        Graduation Year: ${edu.graduationYear || "N/A"}<br>
        GPA: ${edu.gpa || "N/A"}<br>
        <ul>${edu.courses?.map(course => `<li>${course}</li>`).join("") || ""}</ul>
    `).join("");
}

function formatSkills(skills) {
    if (!skills || typeof skills !== "object") return "<em>No skills listed.</em>";
    return `
        <strong>Technical Skills:</strong> ${skills.technicalSkills?.join(", ") || "N/A"}<br>
        <strong>Leadership Skills:</strong> ${skills.leadershipSkills?.join(", ") || "N/A"}<br>
        <strong>Other Skills:</strong> ${skills.otherSkills?.join(", ") || "N/A"}
    `;
}

function formatProjects(projects) {
    if (!Array.isArray(projects) || projects.length === 0) return "<em>No projects listed.</em>";
    return projects.map(proj => `
        <strong>${proj.name}</strong><br>
        ${proj.description}<br>
        <strong>Technologies Used:</strong> ${proj.technologiesUsed?.join(", ") || "N/A"}<br>
    `).join("");
}

function formatAwards(awards) {
    if (!Array.isArray(awards) || awards.length === 0) return "<em>No awards listed.</em>";
    return awards.map(award => `
        <strong>${award.name}</strong> - ${award.organization} (${award.year})<br>
        ${award.description}
    `).join("");
}

// Profile Upload
function setupProfileUpload() {
    const profileUpload = document.getElementById("profileUpload");
    const profileImage = document.getElementById("profileImage");

    if (!profileUpload || !profileImage) return;

    profileUpload.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                profileImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Download CV as PDF
function setupDownloadButton() {
    const downloadButton = document.getElementById("downloadCV");
    if (!downloadButton) return;

    downloadButton.addEventListener("click", function () {
        if (typeof html2pdf !== "function") {
            console.error("html2pdf library is not loaded.");
            return;
        }

        const element = document.getElementById("cvDocument");
        if (!element) {
            console.error("CV document container not found.");
            return;
        }

        html2pdf().from(element).save("CV.pdf");
    });
}
