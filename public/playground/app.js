/**
 * Social Media Scan — Client-side App
 * Handles form submission, API calls, and report rendering
 */

// Loading messages rotation
const loadingMessages = [
    "Crawling your website like a very polite spider 🕷️",
    "Finding your Instagram... let's see what you've been posting 📸",
    "Checking Facebook... remember Facebook? Yeah, same. 👥",
    "Looking for TikTok... Gen Z marketing go brrrr 🎵",
    "Scanning LinkedIn... corporate serious mode activated 💼",
    "Hunting for YouTube... do you even vlog? 📺",
    "Reading your bio... this better not say 'passionate entrepreneur' 😬",
    "Almost done... AI is thinking very hard rn 🤖"
];

let loadingMessageInterval;
let currentMessageIndex = 0;

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const scanForm = document.getElementById('scanForm');
    if (scanForm) {
        scanForm.addEventListener('submit', handleScanSubmit);
    }
});

/**
 * Handle scan form submission
 */
async function handleScanSubmit(e) {
    e.preventDefault();

    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();

    if (!url) {
        showError("You forgot to paste a URL. Kind of need that to scan anything.");
        return;
    }

    // Validate URL format
    if (!isValidUrl(url)) {
        showError("That doesn't look like a valid URL. Try something like https://yourbusiness.com");
        return;
    }

    // Show loading state
    showLoading();

    try {
        // Clear old data
        localStorage.removeItem('socialScanReport');
        
        // Store URL for the report page to pick up
        let normalizedUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            normalizedUrl = 'https://' + url;
        }
        localStorage.setItem('pendingScanUrl', normalizedUrl);

        // Redirect to report page — it handles the scan with nice progress UI
        window.location.href = '/playground/report.html';

    } catch (error) {
        console.error('Scan error:', error);
        showError(error.message || "Something broke on our end. That's embarrassing. Try again?");
    }
}

/**
 * Show loading state
 */
function showLoading() {
    const form = document.getElementById('scanForm');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');

    form.style.display = 'none';
    errorState.style.display = 'none';
    loadingState.style.display = 'block';

    // Rotate loading messages
    currentMessageIndex = 0;
    rotateLoadingMessage();
    loadingMessageInterval = setInterval(rotateLoadingMessage, 3000);
}

/**
 * Rotate through loading messages
 */
function rotateLoadingMessage() {
    const loadingText = document.getElementById('loadingText');
    loadingText.textContent = loadingMessages[currentMessageIndex];
    currentMessageIndex = (currentMessageIndex + 1) % loadingMessages.length;
}

/**
 * Show error state
 */
function showError(message) {
    const form = document.getElementById('scanForm');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');

    // Clear loading interval
    if (loadingMessageInterval) {
        clearInterval(loadingMessageInterval);
    }

    form.style.display = 'none';
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    errorMessage.textContent = message;
}

/**
 * Reset scan form
 */
function resetScan() {
    const form = document.getElementById('scanForm');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');

    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    form.style.display = 'block';
}

/**
 * Validate URL format (accepts domain without protocol)
 */
function isValidUrl(string) {
    // Remove whitespace
    string = string.trim();

    // Try as-is first
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        // Try adding https:// prefix
        try {
            const url = new URL('https://' + string);
            // Must have a valid hostname with at least one dot
            return url.hostname.includes('.');
        } catch (_) {
            return false;
        }
    }
}

/**
 * Normalize URL (add https if missing)
 */
function normalizeUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
    }
    return url;
}
