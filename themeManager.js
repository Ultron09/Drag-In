class ThemeManager {
    constructor() {
        this.root = document.documentElement;
        this.defaultColor = '#00fff2';
        this.initializeTheme();
        this.setupEventListeners();
    }

    initializeTheme() {
        const savedColor = localStorage.getItem('themeColor') || this.defaultColor;
        this.setThemeColor(savedColor);
        
        // Set initial slider value based on saved color
        const hue = this.colorToHue(savedColor);
        const slider = document.getElementById('hueSlider');
        if (slider) {
            slider.value = hue;
            this.updateColorPreview(this.hueToColor(hue));
        }
    }

    setupEventListeners() {
        // Color slider
        const slider = document.getElementById('hueSlider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                const color = this.hueToColor(e.target.value);
                this.updateColorPreview(color);
            });

            slider.addEventListener('change', (e) => {
                const color = this.hueToColor(e.target.value);
                this.setThemeColor(color);
                this.saveTheme(color);
                this.animateThemeChange();
            });
        }

        // Preset buttons
        const presetBtns = document.querySelectorAll('.preset-btn');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const color = btn.dataset.color;
                this.setThemeColor(color);
                this.saveTheme(color);
                this.animateThemeChange();
                
                // Update slider position
                const hue = this.colorToHue(color);
                slider.value = hue;
                this.updateColorPreview(color);
            });
        });
    }

    updateColorPreview(color) {
        const preview = document.querySelector('.color-preview');
        if (preview) {
            preview.style.backgroundColor = color;
        }
    }

    hueToColor(hue) {
        return `hsl(${hue}, 100%, 50%)`;
    }

    colorToHue(color) {
        // Convert hex/hsl to hue value
        let hue = 180; // default
        if (color.startsWith('#')) {
            const rgb = this.hexToRgb(color);
            if (rgb) {
                const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
                hue = hsl[0];
            }
        }
        return hue;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h * 360, s * 100, l * 100];
    }

    setThemeColor(color) {
        this.root.style.setProperty('--primary-color', color);
        
        // Update other theme-dependent colors
        const rgb = this.hexToRgb(color);
        if (rgb) {
            this.root.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
            this.root.style.setProperty('--primary-transparent', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
            this.root.style.setProperty('--primary-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
        }
    }

    saveTheme(color) {
        localStorage.setItem('themeColor', color);
    }

    animateThemeChange() {
        document.body.classList.add('theme-transition');
        
        const ripple = document.createElement('div');
        ripple.className = 'theme-ripple';
        document.body.appendChild(ripple);

        setTimeout(() => {
            ripple.style.transform = 'scale(100)';
            ripple.style.opacity = '0';
        }, 0);

        setTimeout(() => {
            document.body.removeChild(ripple);
            document.body.classList.remove('theme-transition');
        }, 1000);
    }
}

// Initialize theme manager when document loads
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
}); 