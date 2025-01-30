class CVViewer {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.loadCV();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('downloadCV')?.addEventListener('click', () => this.downloadPDF());
        document.getElementById('profileUpload')?.addEventListener('change', (e) => this.handleProfileUpload(e));
    }

    async loadCV() {
        try {
            // Load CV data from localStorage
            const cvData = JSON.parse(localStorage.getItem('cvData'));
            if (!cvData) {
                throw new Error('No CV data found');
            }

            this.updateCVDisplay(cvData);
        } catch (error) {
            console.error('Error loading CV:', error);
            this.showError('Failed to load CV data');
        }
    }

    updateCVDisplay(cvData) {
        // Update personal info
        document.getElementById('cvName').textContent = cvData.personalInfo.fullName;
        document.getElementById('cvEmail').textContent = cvData.personalInfo.email;
        document.getElementById('cvPhone').textContent = cvData.personalInfo.phone;
        document.getElementById('cvLocation').textContent = cvData.personalInfo.location;

        // Update summary
        document.getElementById('cvSummary').textContent = cvData.summary;

        // Update experience
        const experienceHTML = cvData.experience.map(exp => `
            <div class="experience-item">
                <h3>${exp.position}</h3>
                <h4>${exp.company}</h4>
                <p class="date">${exp.startDate} - ${exp.endDate || 'Present'}</p>
                <div class="responsibilities">
                    ${exp.responsibilities}
                </div>
            </div>
        `).join('');
        document.getElementById('cvExperience').innerHTML = experienceHTML;

        // Update education
        const educationHTML = cvData.education.map(edu => `
            <div class="education-item">
                <h3>${edu.degree}</h3>
                <h4>${edu.institution}</h4>
                <p>Graduated: ${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</p>
            </div>
        `).join('');
        document.getElementById('cvEducation').innerHTML = educationHTML;

        // Update skills
        const skillsHTML = cvData.skills.map(skill => `
            <div class="skill-item">${skill}</div>
        `).join('');
        document.getElementById('cvSkills').innerHTML = skillsHTML;

        // Load profile picture if exists
        const profileImage = localStorage.getItem('profileImage');
        if (profileImage) {
            document.getElementById('profileImage').src = profileImage;
        }
    }

    async handleProfileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const profileImage = document.getElementById('profileImage');
                    profileImage.src = e.target.result;
                    localStorage.setItem('profileImage', e.target.result);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                this.showError('Failed to upload profile picture');
            }
        }
    }

    async downloadPDF() {
        const element = document.getElementById('cvDocument');
        const opt = {
            margin: 1,
            filename: 'my-cv.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showError('Failed to generate PDF');
        }
    }

    showError(message) {
        // Implement error notification
        alert(message);
    }
}

// Initialize CV viewer when document loads
document.addEventListener('DOMContentLoaded', () => {
    new CVViewer();
}); 