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
  strengths: string[];
  weaknesses: string[];
  quickWin: string;
}

interface AnalysisResult {
  url: string;
  businessName: string;
  overallScore: number;
  overallInsight: string;
  platforms: PlatformAnalysis[];
  missingPlatforms: string[];
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
    const { url, platforms, businessName } = body;

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
    const analysisResult = await analyzeWithClaude(url, businessName, platforms);

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
  platforms: Platform[]
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

  const prompt = `You are a social media audit specialist. Analyze the social media presence for this business:

**Business:** ${businessName}
**Website:** ${websiteUrl}

**Social Media Accounts Found:**
${platforms.map(p => `- ${p.platform}: ${p.url}`).join('\n')}

Based ONLY on the fact that these accounts exist (we don't have access to their actual content or metrics), provide a realistic audit.

For each platform, assume typical scenarios for a small/medium business:
- Most businesses post inconsistently or rarely
- Engagement is usually low unless they're actively managing it
- Bios are often incomplete or not optimized
- Visual branding is often inconsistent

**Your task:**
1. Score each platform (0-100) based on general best practices awareness
2. Provide 2-3 likely strengths (be realistic, not overly positive)
3. Provide 2-3 likely weaknesses (common issues businesses face)
4. Suggest ONE quick win they can implement this week

Then calculate:
- Overall score (average of all platform scores)
- Overall insight (1-2 sentences summarizing their social media health)

**CRITICAL TONE REQUIREMENTS:**
- Write like a smart friend at a coffee shop, NOT a corporate consultant
- Be direct and honest, but not harsh
- Use "you" and "your" — it's about THEM
- NO buzzwords: "leverage", "optimize", "actionable insights", "comprehensive"
- NO fake enthusiasm: "Amazing!", "Fantastic!", "Great job!"
- Keep it real: "You're posting once a month. That's not going to cut it."
- Short sentences. Punchy. To the point.

Examples of GOOD tone:
- "Your bio's empty. That's prime real estate you're wasting."
- "You're posting, but it's random. Pick 2-3 themes and stick to them."
- "Last post was 6 months ago. Instagram doesn't reward ghosts."

Examples of BAD tone (NEVER use these):
- "Your content strategy could benefit from enhanced optimization"
- "We recommend implementing a comprehensive posting schedule"
- "Leverage your brand assets to maximize engagement"

Respond ONLY with valid JSON in this exact format:
{
  "platforms": [
    {
      "name": "Instagram",
      "url": "https://...",
      "handle": "username",
      "score": 45,
      "metrics": {
        "followers": "~500",
        "posts": "~30",
        "engagement": "Low",
        "lastPost": "2 months ago",
        "frequency": "Inconsistent"
      },
      "strengths": [
        "You exist on Instagram. That's more than some businesses.",
        "Visual feed looks somewhat cohesive"
      ],
      "weaknesses": [
        "Posting once a month isn't a strategy, it's a hobby",
        "Bio is empty — you're not telling people what you do",
        "No stories, no highlights. You're using 10% of the platform."
      ],
      "quickWin": "Fill out your bio properly. Who you are, what you do, why people should care. Takes 5 minutes."
    }
  ],
  "overallScore": 52,
  "overallInsight": "You're on the right platforms, but you're not really using them. Consistency beats perfection — pick one platform and commit to showing up weekly."
}

Remember:
- Be realistic (most small businesses score 30-60 out of 100)
- Make weaknesses actionable, not just critical
- Quick wins should be genuinely doable this week
- Use the tone like Nina would write it (see examples above)
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

  return {
    url: websiteUrl,
    businessName,
    overallScore: analysis.overallScore || 50,
    overallInsight: analysis.overallInsight || "Analysis complete.",
    platforms: analysis.platforms || [],
    missingPlatforms: missingPlatforms.filter(p => p !== 'X'), // Filter out X if Twitter exists
  };
}
