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

// Webhook from Saweria - IMPROVED ERROR HANDLING
app.post('/api/webhook', (req, res) => {
  console.log('🔄 WEBHOOK RECEIVED - Body:', JSON.stringify(req.body));
  
  try {
    const data = req.body;
    
    if (!data) {
      console.log('❌ ERROR: No data received');
      return res.status(400).json({ error: 'No data received' });
    }

    // Debug: Log semua field yang diterima
    console.log('📦 Raw data fields:', Object.keys(data));
    
    const amount = data.amount || data.amount_raw || 0;
    const donorName = data.donator_name || data.donatorName || 'Anonymous';
    
    console.log('🔍 Parsed - Amount:', amount, 'Donor:', donorName);

    if (!amount || amount === 0) {
      console.log('❌ ERROR: Invalid amount:', amount);
      return res.status(400).json({ error: 'Invalid amount: ' + amount });
    }

    // Accumulate donations
    const previousTotal = donorTotals[donorName] || 0;
    donorTotals[donorName] = previousTotal + amount;
    
    console.log('💰 DONATION ADDED:', donorName, '+Rp' + amount, 'Total: Rp' + donorTotals[donorName]);
    
    res.json({ 
      success: true, 
      donor: donorName,
      newDonation: amount,
      totalNow: donorTotals[donorName]
    });
    
  } catch (error) {
    console.log('❌ SERVER ERROR:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
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
    message: 'Saweria Webhook Server - DEBUG MODE',
    totalDonors: Object.keys(donorTotals).length
  });
});

app.listen(PORT, () => {
  console.log('🚀 Server running on port', PORT, '- DEBUG MODE');
});

export default app;
