import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ SIMPAN DATA PER DONOR (ACCUMULATE)
let donorTotals = {}; // { "DewaYunani": 50000, "OtherDonor": 10000 }
let donationHistory = []; // History semua donasi untuk Roblox

// ✅ Get donations for Roblox - FORMAT UNTUK ACCUMULATE
app.get('/api/donations', (req, res) => {
  console.log('📊 GET /api/donations - Donors:', Object.keys(donorTotals).length);
  
  // Format untuk Roblox: setiap donor sebagai entry terpisah
  const formattedDonations = Object.entries(donorTotals).map(([donor_name, totalAmount]) => ({
    id: `donor_${donor_name}_${Date.now()}`,
    amount: totalAmount,
    playerName: donor_name,
    donor_name: donor_name,
    message: `Total donations: Rp${totalAmount}`,
    timestamp: new Date().toISOString()
  }));
  
  console.log('📨 Sending accumulated donations to Roblox');
  res.json(formattedDonations);
});

// ✅ Webhook from Saweria - ACCUMULATE BY DONOR
app.post('/api/webhook', (req, res) => {
  console.log('🔄 WEBHOOK RECEIVED');
  
  const data = req.body;
  const amount = data.amount || 0;
  const donorName = data.donator_name || 'Anonymous';
  const message = data.message || '';
  
  if (amount === 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // ✅ ACCUMULATE: Tambah amount ke total donor
  const previousTotal = donorTotals[donorName] || 0;
  donorTotals[donorName] = previousTotal + amount;
  
  // ✅ Simpan history donasi (untuk tracking)
  const donationId = `saweria_${donorName}_${amount}_${Date.now()}`;
  donationHistory.push({
    id: donationId,
    amount: amount,
    donor_name: donorName,
    message: message,
    timestamp: new Date().toISOString()
  });

  console.log('💰 DONATION ACCUMULATED:', 
    donorName, 
    '+Rp' + amount, 
    '| Total: Rp' + donorTotals[donorName]
  );
  
  res.json({ 
    success: true, 
    donor: donorName,
    newDonation: amount,
    totalNow: donorTotals[donorName],
    status: 'ACCUMULATED'
  });
});

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    totalDonors: Object.keys(donorTotals).length,
    totalAmount: Object.values(donorTotals).reduce((a, b) => a + b, 0),
    time: new Date().toISOString()
  });
});

// ✅ Get donor stats
app.get('/api/stats', (req, res) => {
  res.json({
    donorTotals: donorTotals,
    totalDonations: donationHistory.length,
    topDonors: Object.entries(donorTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
  });
});

// ✅ Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Saweria Webhook Server - ACCUMULATE MODE',
    totalDonors: Object.keys(donorTotals).length,
    totalAmount: Object.values(donorTotals).reduce((a, b) => a + b, 0)
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} - ACCUMULATE MODE`);
});
