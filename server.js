import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Data storage
let donorTotals = {};

// Get donations for Roblox
app.get('/api/donations', (req, res) => {
  console.log('GET /api/donations - Donors:', Object.keys(donorTotals).length);
  
  const formatted = Object.entries(donorTotals).map(([name, total]) => ({
    id: `total_${name}_${Date.now()}`,
    amount: total,
    playerName: name,
    donor_name: name,
    message: `Total: Rp${total}`,
    timestamp: new Date().toISOString()
  }));
  
  res.json(formatted);
});

// Webhook from Saweria
app.post('/api/webhook', (req, res) => {
  console.log('POST /api/webhook');
  
  const data = req.body;
  const amount = data.amount || 0;
  const donorName = data.donator_name || 'Anonymous';
  
  if (amount === 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // Accumulate donations
  donorTotals[donorName] = (donorTotals[donorName] || 0) + amount;
  
  console.log('DONATION ADDED:', donorName, '+Rp' + amount, 'Total: Rp' + donorTotals[donorName]);
  
  res.json({ 
    success: true, 
    donor: donorName,
    newDonation: amount,
    totalNow: donorTotals[donorName]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    totalDonors: Object.keys(donorTotals).length,
    time: new Date().toISOString()
  });
});

// Root
app.get('/', (req, res) => {
  res.json({ 
    message: 'Saweria Webhook Server',
    totalDonors: Object.keys(donorTotals).length
  });
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});

export default app;
