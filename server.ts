import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { campaignManager } from './src/server/campaign.ts';
import { checkGmailForVerification } from './src/server/gmail.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Multer memory storage for spreadsheet files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Campaign State & Summary
app.get('/api/campaign/state', (req, res) => {
  res.json({
    status: campaignManager.getStatus(),
    summary: campaignManager.getSummary(),
    liveState: campaignManager.getLiveState(),
    defaults: campaignManager.getDefaults(),
  });
});

// Campaign Rows
app.get('/api/campaign/rows', (req, res) => {
  const allRows = campaignManager.getRows();
  res.json({ rows: allRows });
});

// Update Campaign Defaults
app.post('/api/campaign/defaults', (req, res) => {
  campaignManager.setDefaults(req.body);
  res.json({ success: true, defaults: campaignManager.getDefaults() });
});

// Ingest Spreadsheet File
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const customMapping = req.body.mapping ? JSON.parse(req.body.mapping) : undefined;
    const result = await campaignManager.ingestSpreadsheet(
      req.file.buffer,
      req.file.originalname,
      customMapping
    );

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Spreadsheet upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to process spreadsheet file' });
  }
});

// Load Demonstration Sample Dataset
app.post('/api/campaign/sample', (req, res) => {
  campaignManager.loadSampleData();
  res.json({
    success: true,
    summary: campaignManager.getSummary(),
    rows: campaignManager.getRows(),
  });
});

// Campaign Controls
app.post('/api/campaign/start', async (req, res) => {
  if (req.body.gmailToken) {
    campaignManager.setGmailAccessToken(req.body.gmailToken);
  }
  campaignManager.startCampaign();
  res.json({ success: true, status: campaignManager.getStatus() });
});

app.post('/api/campaign/pause', (req, res) => {
  campaignManager.pauseCampaign();
  res.json({ success: true, status: campaignManager.getStatus() });
});

app.post('/api/campaign/resume', (req, res) => {
  if (req.body.gmailToken) {
    campaignManager.setGmailAccessToken(req.body.gmailToken);
  }
  campaignManager.resumeCampaign();
  res.json({ success: true, status: campaignManager.getStatus() });
});

app.post('/api/campaign/stop', (req, res) => {
  campaignManager.stopCampaign();
  res.json({ success: true, status: campaignManager.getStatus() });
});

app.post('/api/campaign/retry', (req, res) => {
  const { ids } = req.body;
  if (Array.isArray(ids)) {
    campaignManager.retrySelected(ids);
  }
  res.json({ success: true });
});

app.post('/api/campaign/manual-action', (req, res) => {
  const { id, resolutionNote } = req.body;
  if (id) {
    campaignManager.resolveManualAction(id, resolutionNote || 'User marked manual action resolved');
  }
  res.json({ success: true });
});

// Export 20-Column Excel Report
app.get('/api/campaign/export-excel', (req, res) => {
  try {
    const excelBuffer = campaignManager.generateExcelReport();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="linkpulse_campaign_report.xlsx"');
    res.send(excelBuffer);
  } catch (err: any) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

// Gmail Token & Test Lookup
app.post('/api/gmail/set-token', (req, res) => {
  const { token } = req.body;
  campaignManager.setGmailAccessToken(token);
  res.json({ success: true });
});

app.post('/api/gmail/test', async (req, res) => {
  const { token, domain } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }
  const result = await checkGmailForVerification(token, domain || 'example.com');
  res.json(result);
});

// Vite Middleware or Static Servicing
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`LinkPulse SEO Link Building Server active at http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('Server startup failure:', err);
});
