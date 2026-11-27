const THEME_STORAGE_KEY = 'freshTrackTheme';

function getSavedTheme() {
    try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
    } catch (error) {
        return 'dark';
    }
}

function setTheme(theme, savePreference = true) {
    const currentTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    if (savePreference) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
        } catch (error) {
            console.error('Could not save the theme preference.', error);
        }
    }

    document.dispatchEvent(new CustomEvent('themechange', {
        detail: { theme: currentTheme }
    }));
}

function initializeThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    const currentTheme = document.documentElement.getAttribute('data-theme');

    if (!toggle) {
        return;
    }

    toggle.setAttribute('aria-checked', currentTheme === 'dark' ? 'true' : 'false');
    toggle.setAttribute(
        'aria-label',
        currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );

    toggle.addEventListener('click', () => {
        const nextTheme = document.documentElement.getAttribute('data-theme') === 'light'
            ? 'dark'
            : 'light';

        setTheme(nextTheme);
        toggle.setAttribute('aria-checked', nextTheme === 'dark' ? 'true' : 'false');
        toggle.setAttribute(
            'aria-label',
            nextTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
        );
    });
}

document.documentElement.setAttribute('data-theme', getSavedTheme());
document.addEventListener('DOMContentLoaded', initializeThemeToggle);
