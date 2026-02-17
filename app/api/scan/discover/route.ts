import { NextRequest, NextResponse } from "next/server";
import puppeteer from 'puppeteer';

// Rate limiting simples (in-memory)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // 20 requests
const RATE_WINDOW = 15 * 60 * 1000; // 15 minutos

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Normalize URL
    const normalizedUrl = normalizeUrl(url);

    // Validate URL
    if (!isValidUrl(normalizedUrl)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch website HTML
    const html = await fetchWebsiteHTML(normalizedUrl);

    // Extract business name from page
    const businessName = extractBusinessName(html, normalizedUrl);

    // Find social media links
    const platforms = findSocialMediaLinks(html);

    if (platforms.length === 0) {
      return NextResponse.json(
        { error: "No social media accounts found" },
        { status: 404 }
      );
    }

    // Extract website metadata
    const websiteData = extractWebsiteMetadata(html);

    return NextResponse.json({
      url: normalizedUrl,
      businessName,
      platforms,
      websiteData,
    });

  } catch (error) {
    console.error("Error in /api/scan/discover:", error);

    if (error instanceof Error) {
      if (error.message.includes('fetch failed')) {
        return NextResponse.json(
          { error: "Couldn't reach that website. Is the URL correct?" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Something went wrong while scanning the website" },
      { status: 500 }
    );
  }
}

/**
 * Normalize URL (add https if missing)
 */
function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Remove any leading/trailing whitespace
  normalized = normalized.replace(/^\s+|\s+$/g, '');

  // Add https:// if no protocol specified
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  return normalized;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    // If URL parsing fails, try adding https:// and validating again
    try {
      const withHttps = 'https://' + url;
      const parsed = new URL(withHttps);
      return parsed.protocol === 'https:' && parsed.hostname.includes('.');
    } catch {
      return false;
    }
  }
}

/**
 * Fetch website HTML using Puppeteer (renders JavaScript)
 */
async function fetchWebsiteHTML(url: string): Promise<string> {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ]
    });

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get rendered HTML
    const html = await page.content();

    return html;

  } catch (error) {
    console.error('Puppeteer error:', error);
    throw new Error('Failed to fetch website');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Extract business name from HTML
 */
function extractBusinessName(html: string, url: string): string {
  // Try og:site_name first
  const ogSiteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
  if (ogSiteMatch && ogSiteMatch[1]) {
    return ogSiteMatch[1].trim();
  }

  // Try to extract from <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    let title = titleMatch[1].trim();
    // Clean up common suffixes
    title = title.replace(/\s*[-–|]\s*(Home|Homepage|Official|Website|Welcome).*$/i, '');
    title = title.replace(/\s*[-–|]\s*$/, ''); // Remove trailing separator
    if (title.length > 0 && title.length < 100) {
      return title;
    }
  }

  // Fallback to domain name
  try {
    const hostname = new URL(url).hostname;
    const domain = hostname.replace(/^www\./, '').split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Business';
  }
}

/**
 * Find social media links in HTML
 */
function findSocialMediaLinks(html: string): Array<{ platform: string; url: string }> {
  const platforms: Array<{ platform: string; url: string }> = [];
  const found = new Set<string>(); // Prevent duplicates

  // Social media patterns
  const patterns = [
    { platform: 'Instagram', regex: /(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/gi, type: 'profile' },
    { platform: 'Facebook', regex: /(?:www\.)?facebook\.com\/([a-zA-Z][a-zA-Z0-9._-]*)/gi, type: 'profile' }, // Must start with letter
    { platform: 'LinkedIn', regex: /linkedin\.com\/(company|in)\/([a-zA-Z0-9-]+)/gi, type: 'profile' },
    { platform: 'Twitter', regex: /twitter\.com\/([a-zA-Z0-9_]+)/gi, type: 'profile' },
    { platform: 'X', regex: /x\.com\/([a-zA-Z0-9_]+)/gi, type: 'profile' },
    { platform: 'TikTok', regex: /tiktok\.com\/@([a-zA-Z0-9._]+)/gi, type: 'profile' },
    { platform: 'YouTube', regex: /youtube\.com\/(?:c\/|channel\/|user\/|@)?([a-zA-Z0-9_-]+)/gi, type: 'profile' },
    { platform: 'Pinterest', regex: /pinterest\.(com|pt)\/([a-zA-Z0-9_]+)/gi, type: 'profile' },
    { platform: 'Google Business', regex: /(?:google\.com\/maps\/place\/|goo\.gl\/maps\/|g\.page\/|business\.google\.com\/|maps\.google\.com\/\?cid=)([^"'\s<>&]+)/gi, type: 'business' },
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(html)) !== null) {
      const fullUrl = match[0];

      // Skip if already found this platform
      if (found.has(pattern.platform)) {
        continue;
      }

      // Clean up URL
      let cleanUrl = fullUrl;
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      // Filter out noise (privacy policy links, etc)
      if (isNoisyLink(cleanUrl)) {
        continue;
      }

      // Platform-specific validation
      if (!isValidPlatformUrl(pattern.platform, cleanUrl)) {
        continue;
      }

      platforms.push({
        platform: pattern.platform,
        url: cleanUrl,
      });

      found.add(pattern.platform);
    }
  }

  return platforms;
}

/**
 * Validate platform-specific URL format
 */
function isValidPlatformUrl(platform: string, url: string): boolean {
  // Extract the handle/username/path
  const urlLower = url.toLowerCase();

  switch (platform) {
    case 'Facebook':
      // Must not be numeric-only (like /2008)
      const fbMatch = url.match(/facebook\.com\/([^/?#]+)/i);
      if (!fbMatch) return false;
      const fbHandle = fbMatch[1];

      // Reject if purely numeric
      if (/^\d+$/.test(fbHandle)) return false;

      // Reject very short handles (1-3 chars) - usually reserved paths or tracking
      // Examples: /tr (tracking), /me, /a, /p, etc.
      if (fbHandle.length <= 3) return false;

      // Reject common reserved paths
      const reservedPaths = [
        'pages', 'profile.php', 'groups', 'events', 'photo', 'watch',
        'help', 'about', 'privacy', 'terms', 'login', 'signup',
        'marketplace', 'gaming', 'settings', 'notifications'
      ];
      if (reservedPaths.includes(fbHandle.toLowerCase())) {
        return false;
      }

      // Must start with a letter
      if (!/^[a-zA-Z]/.test(fbHandle)) return false;

      return true;

    case 'Instagram':
      const igMatch = url.match(/instagram\.com\/([^/?#]+)/i);
      if (!igMatch) return false;
      const igHandle = igMatch[1];

      // Reject reserved paths
      if (['p', 'reel', 'tv', 'explore', 'accounts', 'direct'].includes(igHandle)) {
        return false;
      }

      return true;

    case 'YouTube':
      // Reject watch/embed URLs (already filtered in isNoisyLink, but double-check)
      if (urlLower.includes('/watch') || urlLower.includes('/embed') || urlLower.includes('/shorts')) {
        return false;
      }
      // Accept channel/user/c/@ URLs or clean channel names
      return true;

    case 'Google Business':
      // Accept various Google Business/Maps URL formats
      if (
        urlLower.includes('google.com/maps/place') ||
        urlLower.includes('goo.gl/maps') ||
        urlLower.includes('g.page/') ||
        urlLower.includes('business.google.com') ||
        urlLower.includes('maps.google.com/?cid=')
      ) {
        return true;
      }
      return false;

    default:
      return true; // Other platforms pass validation
  }
}

/**
 * Filter out noisy/irrelevant social links
 */
function isNoisyLink(url: string): boolean {
  const noisyPatterns = [
    /privacy/i,
    /policy/i,
    /terms/i,
    /sharer\.php/i,
    /sharer/i,
    /share/i,
    /intent\/tweet/i,
    /widgets/i,
    /plugins/i,
    /embed/i,
    /dialog/i,
    /hashtag/i,
    /explore/i,
    /search/i,
    // Facebook specific noise
    /facebook\.com\/pages\//i,
    /facebook\.com\/profile\.php/i,
    /facebook\.com\/groups/i,
    /facebook\.com\/events/i,
    /facebook\.com\/photo/i,
    /facebook\.com\/watch/i,
    // Instagram noise
    /instagram\.com\/p\//i,  // individual posts
    /instagram\.com\/reel\//i,
    /instagram\.com\/tv\//i,
    /instagram\.com\/explore/i,
    // YouTube noise
    /youtube\.com\/watch/i,  // individual videos
    /youtube\.com\/embed/i,
    /youtube\.com\/shorts/i,
    // Generic numeric-only paths (like facebook.com/2008)
    /\/\d+\/?$/,
  ];

  return noisyPatterns.some(pattern => pattern.test(url));
}

/**
 * Extract website metadata (text, tone, colors, meta tags)
 */
function extractWebsiteMetadata(html: string): {
  heroText: string;
  tagline: string;
  metaDescription: string;
  ogDescription: string;
  dominantColors: string[];
  detectedTone: string;
} {
  // Extract hero/main heading (first h1 that has actual content)
  const h1Matches = Array.from(html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi));
  let heroText = '';
  for (const match of h1Matches) {
    const text = stripHtmlTags(match[1]).trim();
    // Skip h1s that are too short (navigation, buttons) or too long (full sentences)
    if (text.length > 10 && text.length < 150 && !text.includes('\n')) {
      heroText = text;
      break;
    }
  }

  // Extract tagline (first meaningful h2 or large p near top)
  let tagline = '';

  // Try h2 first
  const h2Matches = Array.from(html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi));
  for (const match of h2Matches) {
    const text = stripHtmlTags(match[1]).trim();
    if (text.length > 15 && text.length < 200) {
      tagline = text;
      break;
    }
  }

  // If no h2, try first meaningful p
  if (!tagline) {
    const pMatches = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
    for (const match of pMatches) {
      const text = stripHtmlTags(match[1]).trim();
      // Skip very short paragraphs (likely navigation/footer)
      if (text.length > 30 && text.length < 300) {
        tagline = text;
        break;
      }
    }
  }

  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1] : '';

  // Extract og:description
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const ogDescription = ogDescMatch ? ogDescMatch[1] : '';

  // Extract dominant colors
  const dominantColors = extractDominantColors(html);

  // Detect tone from text
  const detectedTone = detectTone(heroText + ' ' + tagline + ' ' + metaDescription);

  return {
    heroText,
    tagline,
    metaDescription,
    ogDescription,
    dominantColors,
    detectedTone,
  };
}

/**
 * Strip HTML tags from string
 */
function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

/**
 * Extract dominant colors from HTML
 */
function extractDominantColors(html: string): string[] {
  const colors: string[] = [];
  const colorMap = new Map<string, number>(); // Track color frequency

  // Extract from inline styles and CSS
  const styleRegex = /(?:color|background(?:-color)?|border-color|fill):\s*([^;}"'\s]+)/gi;
  let match;

  while ((match = styleRegex.exec(html)) !== null) {
    const colorValue = match[1].trim();
    let hex = null;

    // Convert to hex
    if (colorValue.startsWith('#')) {
      hex = normalizeHexColor(colorValue);
    } else if (colorValue.startsWith('rgb')) {
      hex = rgbToHex(colorValue);
    }

    if (hex && !isGrayscale(hex) && !isNearWhite(hex)) {
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }
  }

  // Sort by frequency and take top 5
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color)
    .slice(0, 5);

  return sortedColors;
}

function normalizeHexColor(color: string): string {
  let hex = color.replace('#', '');
  // Expand shorthand
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  return '#' + hex.toUpperCase();
}

function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function isGrayscale(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Check if RGB values are close (grayscale)
  return Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10;
}

function isNearWhite(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Check if close to white
  return r > 240 && g > 240 && b > 240;
}

/**
 * Detect tone from text (simple keyword-based heuristic)
 */
function detectTone(text: string): string {
  const lower = text.toLowerCase();

  // Professional/Corporate indicators
  const professionalKeywords = ['solution', 'enterprise', 'business', 'professional', 'industry', 'expert'];
  const professionalCount = professionalKeywords.filter(k => lower.includes(k)).length;

  // Casual/Friendly indicators
  const casualKeywords = ['hey', 'awesome', 'cool', 'fun', 'easy', 'simple', 'love'];
  const casualCount = casualKeywords.filter(k => lower.includes(k)).length;

  // Playful/Creative indicators
  const playfulKeywords = ['amazing', 'exciting', 'magic', 'wow', 'yay', '!'];
  const playfulCount = playfulKeywords.filter(k => lower.includes(k)).length;

  if (professionalCount > casualCount && professionalCount > playfulCount) {
    return 'Professional';
  } else if (playfulCount > professionalCount && playfulCount > casualCount) {
    return 'Playful';
  } else if (casualCount > 0) {
    return 'Casual/Friendly';
  }

  return 'Neutral';
}
