import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Rate limiting (mesmo do discover)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 15 * 60 * 1000;

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

interface Platform {
  platform: string;
  url: string;
}

interface PlatformAnalysis {
  name: string;
  url: string;
  handle?: string;
  score: number;
  metrics?: {
    followers?: string;
    posts?: string;
    engagement?: string;
    lastPost?: string;
    frequency?: string;
  };
  checkmarks: {
    good: string[];      // ✅
    bad: string[];       // ❌
    reflect: string[];   // ℹ️
  };
  quickWin: string;
}

interface AnalysisResult {
  url: string;
  businessName: string;
  overallScore: number;
  overallInsight: string;
  detectedPositioning: string;
  detectedTone: string;
  visualConsistency: string;
  platforms: PlatformAnalysis[];
  missingPlatforms: string[];
  alignmentScore?: number;
  alignmentInsight?: string;
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
    const { url, platforms, businessName, websiteData, userGoal, userAudience } = body;

    if (!url || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    if (platforms.length === 0) {
      return NextResponse.json(
        { error: "No platforms to analyze" },
        { status: 400 }
      );
    }

    // Analyze each platform with Claude
    const analysisResult = await analyzeWithClaude(
      url,
      businessName,
      platforms,
      websiteData,
      userGoal,
      userAudience
    );

    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error("Error in /api/scan/analyze:", error);

    return NextResponse.json(
      { error: "Something went wrong while analyzing social accounts" },
      { status: 500 }
    );
  }
}

/**
 * Analyze platforms using Claude AI
 */
async function analyzeWithClaude(
  websiteUrl: string,
  businessName: string,
  platforms: Platform[],
  websiteData?: any,
  userGoal?: string,
  userAudience?: string
): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const anthropic = new Anthropic({ apiKey });

  // All possible platforms
  const allPlatforms = ['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'X', 'TikTok', 'YouTube', 'Pinterest', 'Google Business'];
  const foundPlatformNames = platforms.map(p => p.platform);
  const missingPlatforms = allPlatforms.filter(p => !foundPlatformNames.includes(p));

  // Build website context
  let websiteContext = '';
  if (websiteData) {
    websiteContext = `
**Website Analysis:**
- Hero text: "${websiteData.heroText || 'Not found'}"
- Tagline: "${websiteData.tagline || 'Not found'}"
- Meta description: "${websiteData.metaDescription || 'Not found'}"
- Detected tone: ${websiteData.detectedTone || 'Unknown'}
- Dominant colors: ${websiteData.dominantColors?.join(', ') || 'Not detected'}
`;
  }

  // Build user context (if re-analysis with user inputs)
  let userContext = '';
  if (userGoal || userAudience) {
    userContext = `
**User-Provided Context (use this to check alignment):**
${userGoal ? `- Goal: "${userGoal}"` : ''}
${userAudience ? `- Target audience: "${userAudience}"` : ''}
`;
  }

  const FRAMEWORK = `
# SOCIAL MEDIA ANALYST FRAMEWORK

## Scoring Categories (from socialmediaanalyst.md)

### 1. Messaging & Positioning (20%)
- Target audience clarity — can you tell WHO they serve in 5 seconds?
- Pain point articulation — do they address a specific problem?
- Value proposition clarity — what makes them different?
- Cross-platform consistency — same core message everywhere?
- Tone–audience alignment — does the language match who they serve?
- USP presence — is there a clear differentiator?

### 2. Tone of Voice (10%)
- Is the tone consistent across platforms?
- Does it fit the industry? (Professional services = authoritative, Food = warm/playful, etc.)
- Do replies/comments match the post tone?

### 3. Visual Consistency (15%)
- Same colors/logo across platforms?
- Profile pictures consistent?
- Cover/banner images current and on-brand?
- Feed/grid looks cohesive?

### 4. Content Strategy (20%)
- Posting frequency meets minimum benchmarks?
- Content mix: 40% educational, 30% engaging, 20% promo, 10% BTS
- Multiple formats used? (Reels, Stories, carousels, etc.)
- Responds to comments?
- Uses hashtags effectively?
- Has clear CTAs?

### 5. Platform Best Practices (15%)
- Instagram: Bio complete? Story highlights? Reels present?
- LinkedIn: Company page complete? Employee advocacy?
- Facebook: Business info complete? Reviews responded to?
- TikTok: Using trending sounds? Text overlays?
(etc. for each platform)

### 6. Website–Social Integration (10%)
- Social links visible on website?
- Messaging alignment between site and socials?
- Social proof on website?

### 7. Red Flags (DEDUCTIONS)
- Dead accounts (30+ days no post): -10 per platform
- Inconsistent branding: -5 to -10
- Never replies to comments: -8
- Broken links: -5 per link
- Bought followers (high count, <0.1% engagement): -15
- Negative reviews with no response: -8

## TONE OF VOICE (from TONEOFVOICE.md)

Write like Nina Hudson — smart friend at a coffee shop:
- Direct, honest, but not harsh
- Use "you" and "your"
- NO buzzwords: "leverage", "optimize", "actionable insights"
- NO fake enthusiasm: "Amazing!", "Fantastic!"
- Short sentences. Punchy. To the point.
- Cheeky but helpful

GOOD: "Your bio's empty. That's prime real estate you're wasting."
BAD: "Your content strategy could benefit from enhanced optimization."

## OUTPUT FORMAT

Use CHECKMARKS instead of long paragraphs:
- ✅ Things done well (2-3 max)
- ❌ Things to fix (2-3 max)
- ℹ️ Things to reflect on (1-2 max)
- 🚀 ONE quick win (actionable this week)
`;

  const prompt = `${FRAMEWORK}

You are a social media analyst. Analyze this business's social presence using the framework above.

**Business:** ${businessName}
**Website:** ${websiteUrl}
${websiteContext}
${userContext}

**Social Media Accounts Found:**
${platforms.map(p => `- ${p.platform}: ${p.url}`).join('\n')}

**Your task:**

1. **Detect positioning:**
   - Based on website text and social presence, what do you think this business is about?
   - Who do they serve? What pain do they solve?
   - Write 1-2 sentences summarizing detected positioning.

2. **Detect tone of voice:**
   - Analyze tone from website text and social accounts
   - Classify as: Professional, Casual/Friendly, Playful, Authoritative, Empathetic, Luxury, etc.
   - Check consistency across platforms

3. **Visual consistency:**
   - Do colors/branding seem consistent? (Use website colors as reference if available)
   - Rate as: Consistent, Mostly Consistent, Inconsistent

4. **For each platform, provide:**
   - Score (0-100) using the framework categories
   - Realistic metrics estimate (followers, posts, engagement, last post, frequency)
   - Checkmarks in this format:
     * good: ["Thing 1", "Thing 2"] — max 3 items
     * bad: ["Issue 1", "Issue 2"] — max 3 items
     * reflect: ["Question 1"] — max 2 items
   - quickWin: ONE actionable thing to do this week

5. **Overall assessment:**
   - Overall score (weighted average using framework percentages)
   - Overall insight (1-2 sentences, Nina's tone)

${userGoal || userAudience ? `
6. **Alignment check (user provided goal/audience):**
   - Does what you see on the site/socials align with their stated goal and audience?
   - Alignment score (0-100)
   - Alignment insight (1-2 sentences)
` : ''}

**Assumptions for small/medium businesses (be realistic):**
- Most post inconsistently (1-2×/month instead of weekly)
- Engagement is usually low (<1% on Instagram)
- Bios often incomplete
- Visual branding often inconsistent
- Typical score range: 30-60/100

**Use Nina's tone throughout.** Be direct but kind. No corporate speak.

Respond ONLY with valid JSON in this exact format:
{
  "detectedPositioning": "One sentence about what the business is about and who they serve",
  "detectedTone": "Professional" or "Casual/Friendly" or "Playful" etc,
  "visualConsistency": "Consistent" or "Mostly Consistent" or "Inconsistent",
  "platforms": [
    {
      "name": "Instagram",
      "url": "https://...",
      "handle": "username",
      "score": 45,
      "metrics": {
        "followers": "~500",
        "posts": "~30",
        "engagement": "Low (<1%)",
        "lastPost": "2 months ago",
        "frequency": "Inconsistent (1-2×/month)"
      },
      "checkmarks": {
        "good": ["You exist on Instagram — that's more than some businesses", "Profile picture is professional"],
        "bad": ["Posting once a month isn't a strategy", "Bio doesn't say what you do", "No Stories or Highlights"],
        "reflect": ["Are you using Instagram because it's right for your audience, or just because everyone else is?"]
      },
      "quickWin": "Fill out your bio. Who you are, what you do, why people should care. 5 minutes."
    }
  ],
  "overallScore": 52,
  "overallInsight": "You're on the right platforms, but barely using them. Pick one and commit to showing up weekly."${userGoal || userAudience ? `,
  "alignmentScore": 65,
  "alignmentInsight": "Your stated goal is X, but your content says Y. Let's fix that gap."` : ''}
}

Keep it real. Use Nina's voice. Be helpful, not harsh.
`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  // Parse JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude did not return valid JSON");
  }

  const analysis = JSON.parse(jsonMatch[0]);

  // Normalize platform data (Claude sometimes returns strengths/weaknesses instead of checkmarks)
  const normalizedPlatforms = (analysis.platforms || []).map((p: any) => {
    // If Claude returned strengths/weaknesses, convert to checkmarks format
    if (!p.checkmarks && (p.strengths || p.weaknesses)) {
      p.checkmarks = {
        good: p.strengths || [],
        bad: p.weaknesses || [],
        reflect: p.reflect || []
      };
      delete p.strengths;
      delete p.weaknesses;
      delete p.reflect;
    }
    return p;
  });

  return {
    url: websiteUrl,
    businessName,
    overallScore: analysis.overallScore || 50,
    overallInsight: analysis.overallInsight || "Analysis complete.",
    detectedPositioning: analysis.detectedPositioning || "Unknown business positioning",
    detectedTone: analysis.detectedTone || "Unknown",
    visualConsistency: analysis.visualConsistency || "Unknown",
    platforms: normalizedPlatforms,
    missingPlatforms: missingPlatforms.filter(p => p !== 'X'), // Filter out X if Twitter exists
    alignmentScore: analysis.alignmentScore,
    alignmentInsight: analysis.alignmentInsight,
  };
}
