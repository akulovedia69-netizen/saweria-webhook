import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let donations = [];
let processedIds = new Set();

// ✅ Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Saweria Webhook Server is running!',
    endpoints: {
      '/api/donations': 'GET - Get all donations for Roblox',
      '/api/webhook': 'POST - Receive webhook from Saweria', 
      '/api/health': 'GET - Health check'
    }
  });
});

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    totalDonations: donations.length,
    time: new Date().toISOString()
  });
});

// ✅ Get donations for Roblox
app.get('/api/donations', (req, res) => {
  console.log('📊 GET /api/donations - Total:', donations.length);
  
  const formatted = donations.map(d => ({
    id: d.id,
    amount: d.amount,
    playerName: d.donor_name,
    donor_name: d.donor_name,
    message: d.message || '',
    timestamp: d.timestamp
  }));
  
  res.json(formatted);
});

// ✅ Webhook from Saweria
app.post('/api/webhook', (req, res) => {
  console.log('🔄 POST /api/webhook - Body:', req.body);
  
  const data = req.body;
  const amount = data.amount || 0;
  const donorName = data.donator_name || 'Anonymous';
  
  if (amount === 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const donationId = data.id || `saweria_${Date.now()}`;
  
  if (!processedIds.has(donationId)) {
    donations.push({
      id: donationId,
      amount: amount,
      donor_name: donorName,
      message: data.message || '',
      timestamp: new Date().toISOString()
    });
    processedIds.add(donationId);
    console.log('✅ Donation added:', donorName, amount);
  }

  res.json({ success: true, donationId: donationId });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
