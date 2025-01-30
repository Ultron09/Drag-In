document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('themeSelect');
    const emailNotifications = document.getElementById('emailNotifications');

    // Load saved settings
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedNotifications = localStorage.getItem('emailNotifications') === 'true';

    themeSelect.value = savedTheme;
    emailNotifications.checked = savedNotifications;

    // Theme change handler
    themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.body.className = theme;
        localStorage.setItem('theme', theme);
    });

    // Notifications change handler
    emailNotifications.addEventListener('change', (e) => {
        localStorage.setItem('emailNotifications', e.target.checked);
    });
}); 