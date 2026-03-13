module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, studies } = req.body;

  if (!query || !studies) {
    return res.status(400).json({ error: 'Missing query or studies' });
  }

  const prompt = `You are a research assistant for a real estate data company. Search through these studies and return findings relevant to the query.

Studies data:
${JSON.stringify(studies, null, 2)}

Query: "${query}"

Return a JSON array of relevant findings. Each finding should have:
- studyName: the name of the study
- finding: the specific relevant data point or takeaway
- relevance: why this is relevant to the query

Return ONLY valid JSON array, no other text.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text;

  try {
    const findings = JSON.parse(text);
    return res.status(200).json({ findings });
  } catch (e) {
    return res.status(200).json({ findings: [], raw: text });
  }
};
