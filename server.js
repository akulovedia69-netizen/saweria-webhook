import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Data storage - PERSISTENT
let donorTotals = {};

// Get donations for Roblox
app.get('/api/donations', (req, res) => {
  console.log('📊 GET /api/donations - Donors:', Object.keys(donorTotals).length);
  console.log('💰 Current totals:', donorTotals);
  
  const formatted = Object.entries(donorTotals).map(([name, total]) => ({
    id: `total_${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount: total,
    playerName: name,
    donor_name: name,
    message: `Total: Rp${total}`,
    timestamp: new Date().toISOString()
  }));
  
  res.json(formatted);
});

// Webhook from Saweria - FIXED
app.post('/api/webhook', (req, res) => {
  console.log('🔄 WEBHOOK RECEIVED');
  console.log('📦 Full body:', JSON.stringify(req.body, null, 2));
  
  try {
    const data = req.body;
    
    // Debug: Log semua keys
    console.log('🔑 Body keys:', Object.keys(data));
    
    // Cari amount dengan berbagai kemungkinan field
    const amount = data.amount || data.amount_raw || data.Amount || 0;
    const donorName = data.donator_name || data.donatorName || data.donator_name || 'Anonymous';
    
    console.log('🎯 Parsed - Amount:', amount, 'Donor:', donorName);

    if (!amount || amount === 0) {
      console.log('❌ ERROR: Invalid amount');
      return res.status(400).json({ error: 'Invalid amount: ' + amount });
    }

    // ACCUMULATE - Simpan ke memory
    const previousTotal = donorTotals[donorName] || 0;
    donorTotals[donorName] = previousTotal + amount;
    
    console.log('💰 ACCUMULATED:', donorName, '+Rp' + amount, '| Total: Rp' + donorTotals[donorName]);
    console.log('📈 All donors now:', donorTotals);
    
    res.json({ 
      success: true, 
      donor: donorName,
      newDonation: amount,
      totalNow: donorTotals[donorName],
      allDonors: donorTotals
    });
    
  } catch (error) {
    console.log('❌ SERVER ERROR:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check dengan data
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    totalDonors: Object.keys(donorTotals).length,
    donors: donorTotals,
    time: new Date().toISOString()
  });
});

// Clear data
app.delete('/api/clear', (req, res) => {
  donorTotals = {};
  console.log('🧹 Data cleared');
  res.json({ success: true, message: 'Data cleared' });
});

app.listen(PORT, () => {
  console.log('🚀 Server running - DEBUG MODE');
});
