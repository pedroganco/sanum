/**
 * Social Media Scan — Client-side App
 * Handles form submission, API calls, and report rendering
 */

// Loading messages rotation
const loadingMessages = [
    "Stalking your socials... in a totally professional way 🔍",
    "Finding your Instagram... hope it's not private 📸",
    "Checking if your LinkedIn exists... fingers crossed 💼",
    "Scanning for TikToks... (please don't have cringe ones) 🎵",
    "Rating your Facebook page... this might take a sec 👥",
    "Looking for YouTube... do you even video? 📺"
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
        // Step 1: Discover social media accounts
        const discoverResponse = await fetch('/api/scan/discover', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        if (!discoverResponse.ok) {
            const errorData = await discoverResponse.json();
            throw new Error(errorData.error || 'Failed to discover social accounts');
        }

        const discoverData = await discoverResponse.json();

        // Check if any platforms were found
        if (!discoverData.platforms || discoverData.platforms.length === 0) {
            showError("Hmm, we couldn't find any social accounts linked to that site. Either they're hiding really well, or they don't exist yet. Either way — that's useful information, right?");
            return;
        }

        // Step 2: Analyze platforms
        const analyzeResponse = await fetch('/api/scan/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                platforms: discoverData.platforms,
                businessName: discoverData.businessName
            })
        });

        if (!analyzeResponse.ok) {
            const errorData = await analyzeResponse.json();
            throw new Error(errorData.error || 'Failed to analyze social accounts');
        }

        const analyzeData = await analyzeResponse.json();

        // Store report data in localStorage
        localStorage.setItem('socialScanReport', JSON.stringify(analyzeData));

        // Redirect to report page
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
 * Validate URL format
 */
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        // Try adding https:// prefix
        try {
            const url = new URL('https://' + string);
            return true;
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
