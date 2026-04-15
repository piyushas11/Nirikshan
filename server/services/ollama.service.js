// server/services/ollama.service.js
import fetch from "node-fetch";

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const VISION_MODEL = process.env.OLLAMA_VISION_MODEL || "llava";
const TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL || "llama3.1";

/**
 * Analyse a waste photo and return a structured segregation report.
 * @param {Buffer} imageBuffer
 * @param {string} mimeType  e.g. "image/jpeg"
 * @returns {{ score: number, wrong_items: string[], improvement_steps: string[], raw_analysis: string }}
 */
export async function runSegregationCheck(imageBuffer, mimeType = "image/jpeg") {
  const base64Image = imageBuffer.toString("base64");

  const prompt = `You are a waste segregation expert. Analyse this photo of waste materials.
Return a JSON object with EXACTLY these keys:
{
  "score": <integer 0-100 representing segregation quality>,
  "wrong_items": [<list of incorrectly placed items detected>],
  "improvement_steps": [<list of actionable improvement suggestions>],
  "raw_analysis": "<brief one-paragraph summary>"
}
Do not include any text outside the JSON.`;

  const body = {
    model: VISION_MODEL,
    prompt,
    images: [base64Image],
    stream: false,
    format: "json",
  };

  const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama vision error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const raw = data.response || "{}";

  try {
    const parsed = JSON.parse(raw);
    return {
      score: typeof parsed.score === "number" ? Math.min(100, Math.max(0, parsed.score)) : 50,
      wrong_items: Array.isArray(parsed.wrong_items) ? parsed.wrong_items : [],
      improvement_steps: Array.isArray(parsed.improvement_steps) ? parsed.improvement_steps : [],
      raw_analysis: parsed.raw_analysis || raw,
    };
  } catch {
    // If Ollama returns non-JSON, wrap in a fallback
    return {
      score: 50,
      wrong_items: [],
      improvement_steps: ["Could not parse AI response. Please try again with a clearer photo."],
      raw_analysis: raw,
    };
  }
}

/**
 * Generate a weekly narrative report from summary statistics.
 * @param {object} summaryData
 * @param {string} weekStart - ISO date string
 * @returns {string} Markdown report text
 */
export async function generateWeeklyReportOllama(summaryData, weekStart) {
  const prompt = `You are a waste management analyst. Generate a concise weekly report in Markdown.
Week starting: ${weekStart}
Data:
${JSON.stringify(summaryData, null, 2)}

Include:
1. Executive summary (2-3 sentences)
2. Key metrics table
3. Highlights & anomalies
4. Recommendations (bullet points)
Keep it under 400 words.`;

  const body = {
    model: TEXT_MODEL,
    prompt,
    stream: false,
  };

  const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw new Error(`Ollama text error ${response.status}`);
  }

  const data = await response.json();
  return data.response || "Report generation failed.";
}