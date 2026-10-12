import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.MODEL || 'openai/gpt-4o-mini';

/**
 * Generate real prospective customer leads and tailored outbound emails using OpenRouter AI
 */
export async function generateLeadsAndOutreach({
  productDescription,
  country,
  industry,
  numberOfLeads = 10
}) {
  const targetCount = Math.min(Math.max(parseInt(numberOfLeads) || 5, 1), 20);

  const prompt = `
You are an expert B2B Outbound Growth Engineer and Lead Researcher at a premier marketing agency.
Your task is to identify REAL, high-potential target organizations and craft ultra-personalized cold outreach emails.

CAMPAIGN PARAMETERS:
- SaaS Startup Product: "${productDescription}"
- Target Country / Geography: "${country}"
- Target Industry: "${industry}"
- Requested Lead Count: ${targetCount}

INSTRUCTIONS:
1. Research and discover EXACTLY ${targetCount} REAL, authentic organizations / institutions / companies in "${country}" within the "${industry}" sector that would genuinely benefit from "${productDescription}".
2. For each organization, provide:
   - organizationName: Real, accurate name of the entity.
   - website: Real official website URL (e.g. https://www.example.com).
   - country: "${country}".
   - industry: "${industry}".
   - contactEmail: Plausible public inquiry/outreach or leadership email (e.g., info@domain.com, contact@domain.com, admissions@domain.com, or partnerships@domain.com).
   - description: 1-2 concise sentences summarizing what this organization does and their scale or focus.
   - sourceUrl: URL where this organization or public directory listing is found (e.g. company website / directory listing / linkedin).
3. Draft a tailored, high-converting B2B Cold Outreach Email for each organization:
   - emailSubject: Irresistible, personalized subject line (no clickbait, mentions their specific pain point or institution name).
   - emailBody: 3-4 short, punchy paragraphs:
     * Hook: Mention the organization's specific context, mission, or pain points in ${industry}.
     * Value Proposition: How our SaaS product ("${productDescription}") solves their specific operational friction and drives quantifiable ROI.
     * Proof/Relevance: Why this matters to them specifically now.
   - callToAction: A clear, low-friction call-to-action (e.g., "Open to a brief 10-minute walkthrough this Thursday at 2 PM?", "Would you be against a 5-minute video demo tailored for your team?").

OUTPUT FORMAT:
You MUST respond ONLY with a valid JSON array of objects. Do not include markdown code block syntax or extra text if possible, just the raw JSON array.
Each object must have these exact keys:
[
  {
    "organizationName": "...",
    "website": "...",
    "country": "...",
    "industry": "...",
    "contactEmail": "...",
    "description": "...",
    "sourceUrl": "...",
    "emailSubject": "...",
    "emailBody": "...",
    "callToAction": "..."
  }
]
`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5000',
      'X-Title': 'Outbound Lead Generator'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an elite B2B outbound researcher. You return strictly valid JSON arrays of high-quality verified leads and tailored outreach emails.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' } // or raw json
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API request failed with status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content?.trim();

  if (!rawContent) {
    throw new Error('Received empty response from OpenRouter API');
  }

  // Robust JSON Extraction
  let parsedLeads = [];
  try {
    // Attempt direct parse
    parsedLeads = JSON.parse(rawContent);
  } catch (e) {
    // Strip markdown code fences if present
    const cleaned = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    try {
      parsedLeads = JSON.parse(cleaned);
    } catch (e2) {
      // Find outermost array or object
      const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        parsedLeads = JSON.parse(arrayMatch[0]);
      } else {
        const objMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objMatch) {
          const obj = JSON.parse(objMatch[0]);
          parsedLeads = obj.leads || obj.organizations || obj.results || Object.values(obj)[0] || [];
        } else {
          throw new Error('Unable to extract structured leads JSON from LLM response.');
        }
      }
    }
  }

  // Handle case where object contains a leads property: { leads: [...] }
  if (!Array.isArray(parsedLeads)) {
    if (parsedLeads.leads && Array.isArray(parsedLeads.leads)) {
      parsedLeads = parsedLeads.leads;
    } else if (parsedLeads.results && Array.isArray(parsedLeads.results)) {
      parsedLeads = parsedLeads.results;
    } else {
      parsedLeads = [parsedLeads];
    }
  }

  // Normalize each lead object
  return parsedLeads.map(lead => ({
    organizationName: lead.organizationName || lead.name || 'Unnamed Organization',
    website: lead.website || (lead.domain ? `https://${lead.domain}` : 'https://example.com'),
    country: lead.country || country,
    industry: lead.industry || industry,
    contactEmail: lead.contactEmail || lead.email || `contact@${(lead.website || 'example.com').replace(/https?:\/\/(www\.)?/, '').split('/')[0]}`,
    description: lead.description || 'Target organization in ' + industry,
    sourceUrl: lead.sourceUrl || lead.source || lead.website || 'https://www.google.com/search?q=' + encodeURIComponent(lead.organizationName || ''),
    emailSubject: lead.emailSubject || `Partnering with ${lead.organizationName || 'your team'} on ${industry} innovation`,
    emailBody: lead.emailBody || '',
    callToAction: lead.callToAction || 'Would you be open to a quick 10-minute conversation this week?',
    status: 'Not Contacted',
    campaign: {
      productDescription,
      country,
      industry
    }
  }));
}
