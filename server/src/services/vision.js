import { categories } from '../models/Complaint.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function analyzeImage(file) {
  if (!process.env.GEMINI_API_KEY) throw Object.assign(new Error('AI media analysis is not configured. Add GEMINI_API_KEY to server/.env.'), { status: 503 });
  const isVideo = file.mimetype.startsWith('video/');
  const mediaMimeType = file.mimetype === 'video/quicktime' ? 'video/mov' : file.mimetype;
  const base64 = file.buffer.toString('base64');
  const requestBody = JSON.stringify({
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    store: false,
    input: [
      { type: 'text', text: `Inspect this ${isVideo ? 'video' : 'image'} for a civic infrastructure issue. Identify the most likely issue visible and return its category and severity as suggestions, not verified facts. For video, consider the clip as a whole. Use category exactly from this list: ${categories.join(', ')}. Severity must be Low, Medium, or High. If no issue is visible, use Other civic issues and Low.` },
      { type: isVideo ? 'video' : 'image', mime_type: mediaMimeType, data: base64 }
    ],
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: {
        type: 'object',
        properties: {
          detectedIssue: { type: 'string' },
          category: { type: 'string', enum: categories },
          severity: { type: 'string', enum: ['Low', 'Medium', 'High'] },
          description: { type: 'string' },
          confidence: { type: 'number' }
        },
        required: ['detectedIssue', 'category', 'severity', 'description', 'confidence'],
        additionalProperties: false
      }
    }
  });

  let response;
  let data;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', { method: 'POST', headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      }, body: requestBody });
      data = await response.json();
    } catch (error) {
      if (attempt === 2) throw Object.assign(new Error('The image analysis service is temporarily unreachable. Please try again shortly.'), { status: 503, cause: error });
      await sleep(700 * (2 ** attempt));
      continue;
    }

    if (response.ok) break;
    const providerMessage = data.error?.message || '';
    const retryAfterHeader = Number(response.headers.get('retry-after'));
    const retryAfterInBody = providerMessage.match(/retry\s+in\s+([\d.]+)\s*(seconds?|secs?|s)\b/i);
    const retryAfter = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
      ? retryAfterHeader
      : retryAfterInBody ? Number(retryAfterInBody[1]) : null;
    const quotaOrBilling = response.status === 402 || /exceeded (your )?current quota|quota exceeded|billing|prepay|spend cap/i.test(providerMessage);

    // A persistent quota/billing rejection cannot be fixed by immediately
    // resending the same request. Return a useful explanation instead.
    if (quotaOrBilling) {
      const message = response.status === 402
        ? 'Gemini rejected the request because of a billing or prepayment issue. Check the project billing settings.'
        : 'Gemini quota or spend limit reached. Check this project’s model rate limits and usage, then try again.';
      throw Object.assign(new Error(message), { status: response.status === 402 ? 402 : 429, cause: providerMessage });
    }

    const transient = [429, 500, 502, 503, 504].includes(response.status) || /high demand|overload|temporarily unavailable/i.test(providerMessage);
    if (!transient) throw Object.assign(new Error(providerMessage || 'The image analysis service could not process this image.'), { status: 502 });
    if (attempt === 2) {
      if (response.status === 429) {
        const waitHint = retryAfter ? ` Retry after about ${Math.ceil(retryAfter)} seconds.` : ' Wait briefly before trying again.';
        throw Object.assign(new Error(`Gemini rate limit reached.${waitHint} If it keeps happening, check the project’s model rate limits and usage.`), { status: 429, cause: providerMessage });
      }
      throw Object.assign(new Error('Gemini is temporarily overloaded. Please try the image analysis again in a few moments.'), { status: 503, cause: providerMessage });
    }

    // Honor short server-provided delays; avoid holding an interactive upload
    // open for a long quota window when the provider asks us to wait.
    if (retryAfter && retryAfter > 5) {
      throw Object.assign(new Error(`Gemini rate limit reached. Retry after about ${Math.ceil(retryAfter)} seconds. If it keeps happening, check the project’s model rate limits and usage.`), { status: 429, cause: providerMessage });
    }
    const delay = retryAfter ? retryAfter * 1000 : 700 * (2 ** attempt);
    await sleep(delay);
  }

  const raw = data.steps?.flatMap((step) => step.type === 'model_output' ? step.content || [] : []).find((part) => part.type === 'text')?.text;
  let result;
  try { result = JSON.parse(raw); } catch { throw Object.assign(new Error('The image analysis service returned an unreadable result. Please try again.'), { status: 502 }); }
  if (!categories.includes(result.category)) result.category = 'Other civic issues';
  if (!['Low', 'Medium', 'High'].includes(result.severity)) result.severity = 'Medium';
  result.confidence = Math.max(0, Math.min(1, Number(result.confidence) || 0));
  return { detectedIssue: String(result.detectedIssue || 'Civic issue').slice(0, 160), category: result.category, severity: result.severity, description: String(result.description || 'A civic issue may be visible in this image.').slice(0, 500), confidence: result.confidence };
}
