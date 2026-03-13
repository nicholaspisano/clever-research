const { put, list } = require('@vercel/blob');

const FILE = 'studies.json';

async function getStudies() {
  try {
    const { blobs } = await list({ prefix: FILE, token: process.env.BLOB_READ_WRITE_TOKEN });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].url);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('getStudies error:', e);
    return [];
  }
}

async function saveStudies(studies) {
  await put(FILE, JSON.stringify(studies), {
    access: 'public',
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    cacheControlMaxAge: 0
  });
}

module.exports = async function handler(req, res) {
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
};
