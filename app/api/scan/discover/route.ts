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

    return NextResponse.json({
      url: normalizedUrl,
      businessName,
      platforms,
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
    { platform: 'Instagram', regex: /instagram\.com\/([a-zA-Z0-9._]+)/gi, type: 'profile' },
    { platform: 'Facebook', regex: /facebook\.com\/([a-zA-Z0-9._]+)/gi, type: 'profile' },
    { platform: 'LinkedIn', regex: /linkedin\.com\/(company|in)\/([a-zA-Z0-9-]+)/gi, type: 'profile' },
    { platform: 'Twitter', regex: /twitter\.com\/([a-zA-Z0-9_]+)/gi, type: 'profile' },
    { platform: 'X', regex: /x\.com\/([a-zA-Z0-9_]+)/gi, type: 'profile' },
    { platform: 'TikTok', regex: /tiktok\.com\/@([a-zA-Z0-9._]+)/gi, type: 'profile' },
    { platform: 'YouTube', regex: /youtube\.com\/(c\/|channel\/|user\/|@)?([a-zA-Z0-9_-]+)/gi, type: 'profile' },
    { platform: 'Pinterest', regex: /pinterest\.(com|pt)\/([a-zA-Z0-9_]+)/gi, type: 'profile' },
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
 * Filter out noisy/irrelevant social links
 */
function isNoisyLink(url: string): boolean {
  const noisyPatterns = [
    /privacy/i,
    /policy/i,
    /terms/i,
    /sharer\.php/i,
    /share/i,
    /intent\/tweet/i,
    /widgets/i,
  ];

  return noisyPatterns.some(pattern => pattern.test(url));
}
