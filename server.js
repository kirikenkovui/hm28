import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const rawPageId = process.env.NOTION_PAGE_ID;
const rawDatabaseId = process.env.NOTION_DATABASE_ID;
const NOTION_VERSION = '2022-06-28';

function extractNotionId(value) {
  if (!value) return null;
  const idMatch = value.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (idMatch) return idMatch[0];
  const compactMatch = value.match(/^[0-9a-fA-F]{32}$/);
  if (compactMatch) return value.replace(/([0-9a-fA-F]{8})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{12})/, '$1-$2-$3-$4-$5');
  return null;
}

const NOTION_PAGE_ID = extractNotionId(rawPageId);
const NOTION_DATABASE_ID = extractNotionId(rawDatabaseId);

if (!NOTION_API_KEY) {
  console.warn('No NOTION_API_KEY set in environment.');
}
if (!NOTION_PAGE_ID && !NOTION_DATABASE_ID) {
  console.warn('No NOTION_PAGE_ID or NOTION_DATABASE_ID set in environment. 400 requests will fail.');
}


app.post('/api/notion-pages', async (req, res) => {
  const notionUrl = 'https://api.notion.com/v1/pages';

  const parent = NOTION_PAGE_ID ? { page_id: NOTION_PAGE_ID } : NOTION_DATABASE_ID ? { database_id: NOTION_DATABASE_ID } : null;
  if (!parent) {
    return res.status(400).json({
      error: 'Missing notion parent identifier',
      message: 'Set NOTION_PAGE_ID or NOTION_DATABASE_ID in .env and restart server',
    });
  }

  const body = {
    parent,
    properties: {
      title: {
        title: [{ type: 'text', text: { content: req.body.title || 'Untitled' } }]
      }
    },
    children: req.body.children || []
  };

  try {
    const notionResp = await fetch(notionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await notionResp.json();
    res.status(notionResp.status).json(data);
  } catch (error) {
    console.error('Backend Notion proxy error:', error);
    res.status(500).json({ error: 'Backend Notion proxy failed', details: String(error) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Notion proxy server running on http://localhost:${PORT}`);
});