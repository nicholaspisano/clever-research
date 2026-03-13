export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, studies } = req.body;
  if (!query || !studies) return res.status(400).json({ error: 'Missing query or studies' });

  const context = studies.map(s => {
    const parts = ['STUDY: ' + s.name];
    if (s.date) parts.push('Date: ' + s.date);
    if (s.topic) parts.push('Topic: ' + s.topic);
    if (s.series) parts.push('Series: ' + s.series);
    if (s.audience && s.audience.length) parts.push('Audience: ' + s.audience.join(', '));
    if (s.generations && s.generations.length) parts.push('Generations: ' + s.generations.join(', '));
    if (s.takeaways && s.takeaways.length) parts.push('Takeaways:\n' + s.takeaways.map(t => '- ' + t).join('\n'));
    if (s.questions && s.questions.length) {
      s.questions.forEach(q => {
        parts.push('\nQ: ' + q.question);
        if (q.rows && q.rows.length) {
          parts.push(q.rows.slice(0, 15).map(r => r.filter(c => c !== '').join(' | ')).join('\n'));
        }
      });
    }
    return parts.join('\n');
  }).join('\n\n---\n\n');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are a research assistant for a real estate data company. Find findings relevant to the query from the repository data provided. Return ONLY a JSON array, no other text. Each object must have: "study" (study name), "date" (string or ""), "series" (series name or ""), "finding" (specific stat as a complete sentence with numbers), "context" (1-2 sentences of additional context), "audience" (array of strings), "generations" (array of strings). Return 1-5 of the most relevant results. If nothing is relevant return [].',
        messages: [{ role: 'user', content: 'Query: ' + query + '\n\nRepository:\n' + context }]
      })
    });

    const data = await response.json();
    const text = data.content && data.content[0] ? data.content[0].text : '[]';
    const results = JSON.parse(text.replace(/```json|```/g, '').trim());
    return res.status(200).json(results);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
