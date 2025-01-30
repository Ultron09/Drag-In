class CVGenerator {
    constructor() {
        this.skills = new Set();
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setupSkillsInput();
    }

    setupEventListeners() {
        // Add more experience button
        document.getElementById('addExperience')?.addEventListener('click', () => {
            this.addExperienceEntry();
        });

        // Add more education button
        document.getElementById('addEducation')?.addEventListener('click', () => {
            this.addEducationEntry();
        });

        // Form submission
        document.getElementById('cvForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(e);
        });

        // Modal close button
        document.querySelector('.close-modal')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Download button
        document.getElementById('downloadPDF')?.addEventListener('click', () => {
            this.downloadCV();
        });

        // Edit button
        document.getElementById('editCV')?.addEventListener('click', () => {
            this.closeModal();
        });
    }

    setupSkillsInput() {
        const skillInput = document.getElementById('skillInput');
        const skillsTags = document.getElementById('skillsTags');

        if (skillInput && skillsTags) {
            skillInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const skill = skillInput.value.trim();
                    if (skill && !this.skills.has(skill)) {
                        this.addSkill(skill);
                        skillInput.value = '';
                    }
                }
            });
        }
    }

    addSkill(skill) {
        const skillsTags = document.getElementById('skillsTags');
        this.skills.add(skill);

        const skillTag = document.createElement('div');
        skillTag.className = 'skill-tag';
        skillTag.innerHTML = `
            ${skill}
            <span class="remove-skill" data-skill="${skill}">&times;</span>
        `;

        skillTag.querySelector('.remove-skill').addEventListener('click', () => {
            this.removeSkill(skill);
            skillTag.remove();
        });

        skillsTags.appendChild(skillTag);
    }

    removeSkill(skill) {
        this.skills.delete(skill);
    }

    addExperienceEntry() {
        const experienceEntries = document.querySelector('.experience-entries');
        const newEntry = document.createElement('div');
        newEntry.className = 'experience-entry';
        newEntry.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label>Company Name</label>
                    <input type="text" name="companies[]" required>
                </div>
                <div class="form-group">
                    <label>Position</label>
                    <input type="text" name="positions[]" required>
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="date" name="startDates[]" required>
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="date" name="endDates[]">
                </div>
            </div>
            <div class="form-group">
                <label>Responsibilities & Achievements</label>
                <textarea name="responsibilities[]" rows="3" required></textarea>
            </div>
            <button type="button" class="remove-entry-btn">Remove</button>
        `;

        newEntry.querySelector('.remove-entry-btn').addEventListener('click', () => {
            newEntry.remove();
        });

        experienceEntries.appendChild(newEntry);
    }

    addEducationEntry() {
        const educationEntries = document.querySelector('.education-entries');
        const newEntry = document.createElement('div');
        newEntry.className = 'education-entry';
        newEntry.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label>Institution</label>
                    <input type="text" name="institutions[]" required>
                </div>
                <div class="form-group">
                    <label>Degree</label>
                    <input type="text" name="degrees[]" required>
                </div>
                <div class="form-group">
                    <label>Graduation Year</label>
                    <input type="number" name="gradYears[]" min="1900" max="2099" required>
                </div>
                <div class="form-group">
                    <label>GPA</label>
                    <input type="number" name="gpas[]" step="0.01" min="0" max="4">
                </div>
            </div>
            <button type="button" class="remove-entry-btn">Remove</button>
        `;

        newEntry.querySelector('.remove-entry-btn').addEventListener('click', () => {
            newEntry.remove();
        });

        educationEntries.appendChild(newEntry);
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        this.showLoadingState();

        try {
            const formData = this.gatherFormData();
            console.log('Submitting CV data:', formData);

            const response = await fetch('http://localhost:3000/api/enhance-cv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate CV');
            }

            const enhancedCV = await response.json();
            console.log('Enhanced CV:', enhancedCV);

            // Store the CV data
            localStorage.setItem('cvData', JSON.stringify(enhancedCV));

            // Redirect to view page
            window.location.href = 'viewCV.html';
        } catch (error) {
            console.error('Error generating CV:', error);
            this.showError(`Failed to generate CV: ${error.message}`);
        } finally {
            this.hideLoadingState();
        }
    }

    gatherFormData() {
        return {
            personalInfo: {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                location: document.getElementById('location').value
            },
            summary: document.getElementById('summary').value,
            experience: this.gatherExperienceData(),
            education: this.gatherEducationData(),
            skills: Array.from(this.skills),
            tone: document.getElementById('tone').value,
            style: document.getElementById('cvStyle').value
        };
    }

    gatherExperienceData() {
        const experiences = [];
        const experienceEntries = document.querySelectorAll('.experience-entry');
        
        experienceEntries.forEach(entry => {
            experiences.push({
                company: entry.querySelector('[name="companies[]"]').value,
                position: entry.querySelector('[name="positions[]"]').value,
                startDate: entry.querySelector('[name="startDates[]"]').value,
                endDate: entry.querySelector('[name="endDates[]"]').value || 'Present',
                responsibilities: entry.querySelector('[name="responsibilities[]"]').value
            });
        });

        return experiences;
    }

    gatherEducationData() {
        const education = [];
        const educationEntries = document.querySelectorAll('.education-entry');
        
        educationEntries.forEach(entry => {
            education.push({
                institution: entry.querySelector('[name="institutions[]"]').value,
                degree: entry.querySelector('[name="degrees[]"]').value,
                gradYear: entry.querySelector('[name="gradYears[]"]').value,
                gpa: entry.querySelector('[name="gpas[]"]').value
            });
        });

        return education;
    }

    showPreview(cvData) {
        const modal = document.getElementById('previewModal');
        const preview = document.getElementById('cvPreview');
        
        // Generate HTML for preview
        preview.innerHTML = this.generatePreviewHTML(cvData);
        
        // Show modal
        modal.style.display = 'block';
    }

    generatePreviewHTML(cvData) {
        // This is a basic preview - you can enhance this based on the selected style
        return `
            <div class="cv-preview ${cvData.style}">
                <header>
                    <h1>${cvData.personalInfo.fullName}</h1>
                    <div class="contact-info">
                        <p>${cvData.personalInfo.email} | ${cvData.personalInfo.phone}</p>
                        <p>${cvData.personalInfo.location}</p>
                    </div>
                </header>

                <section class="summary">
                    <h2>Professional Summary</h2>
                    <p>${cvData.summary}</p>
                </section>

                <section class="experience">
                    <h2>Work Experience</h2>
                    ${this.generateExperienceHTML(cvData.experience)}
                </section>

                <section class="education">
                    <h2>Education</h2>
                    ${this.generateEducationHTML(cvData.education)}
                </section>

                <section class="skills">
                    <h2>Skills</h2>
                    <div class="skills-list">
                        ${cvData.skills.join(', ')}
                    </div>
                </section>
            </div>
        `;
    }

    generateExperienceHTML(experience) {
        return experience.map(exp => `
            <div class="experience-item">
                <h3>${exp.position}</h3>
                <h4>${exp.company}</h4>
                <p class="date">${exp.startDate} - ${exp.endDate || 'Present'}</p>
                <p>${exp.responsibilities}</p>
            </div>
        `).join('');
    }

    generateEducationHTML(education) {
        return education.map(edu => `
            <div class="education-item">
                <h3>${edu.degree}</h3>
                <h4>${edu.institution}</h4>
                <p>Graduated: ${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</p>
            </div>
        `).join('');
    }

    closeModal() {
        const modal = document.getElementById('previewModal');
        modal.style.display = 'none';
    }

    async downloadCV() {
        // Implement PDF generation and download
        // You can use libraries like html2pdf.js or jsPDF
        console.log('Downloading CV...');
    }

    showLoadingState() {
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        }
    }

    hideLoadingState() {
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate CV';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize CV Generator when document loads
document.addEventListener('DOMContentLoaded', () => {
    const generator = new CVGenerator();
    
    // Add form submit event listener
    const form = document.getElementById('cvForm');
    if (form) {
        form.addEventListener('submit', (e) => generator.handleFormSubmit(e));
    }
}); 