import { NextRequest, NextResponse } from "next/server";

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
    return false;
  }
}

/**
 * Fetch website HTML
 */
async function fetchWebsiteHTML(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SocialMediaScan/1.0; +https://sanum.pt)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return html;

  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Extract business name from HTML
 */
function extractBusinessName(html: string, url: string): string {
  // Try to extract from <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    // Clean up common suffixes
    let title = titleMatch[1].trim();
    title = title.replace(/\s*[-–|]\s*(Home|Homepage|Official|Website).*$/i, '');
    return title;
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
  // Extract hero/main heading
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  let heroText = '';
  if (h1Match) {
    heroText = stripHtmlTags(h1Match[1]).trim();
  }

  // Extract tagline (usually first <p> or subtitle)
  const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  let tagline = '';
  if (pMatches && pMatches.length > 0) {
    tagline = stripHtmlTags(pMatches[0]).trim().substring(0, 200);
  }

  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1] : '';

  // Extract og:description
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const ogDescription = ogDescMatch ? ogDescMatch[1] : '';

  // Extract dominant colors from inline styles and common CSS classes
  const dominantColors = extractDominantColors(html);

  // Detect tone from text (simple heuristic)
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
 * Extract dominant colors from HTML (basic implementation)
 */
function extractDominantColors(html: string): string[] {
  const colors: string[] = [];
  const colorRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

  let match;
  const found = new Set<string>();

  while ((match = colorRegex.exec(html)) !== null && colors.length < 5) {
    const color = '#' + match[1];
    if (!found.has(color)) {
      found.add(color);
      colors.push(color);
    }
  }

  // Also check for rgb/rgba colors
  const rgbRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)/g;
  while ((match = rgbRegex.exec(html)) !== null && colors.length < 5) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    if (!found.has(hex)) {
      found.add(hex);
      colors.push(hex);
    }
  }

  return colors;
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
