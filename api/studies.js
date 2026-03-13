const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

async function getStudies() {
  try {
    const listRes = await fetch('https://blob.vercel-storage.com?prefix=studies.json&limit=1', {
      headers: { Authorization: `Bearer ${BLOB_TOKEN}` }
    });
    const listData = await listRes.json();
    if (!listData.blobs || !listData.blobs.length) return [];
    const fileRes = await fetch(listData.blobs[0].url);
    const data = await fileRes.json();
    return Array.isArray(data) ? data : [];
  } catch (e) { return []; }
}

async function saveStudies(studies) {
  await fetch('https://blob.vercel-storage.com/studies.json', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${BLOB_TOKEN}`,
      'x-api-version': '7',
      'x-content-type': 'application/json',
      'x-add-random-suffix': '0',
      'x-cache-control-max-age': '0'
    },
    body: JSON.stringify(studies)
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const studies = await getStudies();
    return res.status(200).json(studies);
  }

  if (req.method === 'POST') {
    const studies = await getStudies();
    const study = req.body;
    study.id = Date.now().toString();
    study.createdAt = new Date().toISOString();
    studies.push(study);
    await saveStudies(studies);
    return res.status(200).json({ ok: true, study });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    let studies = await getStudies();
    studies = studies.filter(s => s.id !== id);
    await saveStudies(studies);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
