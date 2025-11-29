import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let donations = [];
let processedIds = new Set();

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

// ✅ Webhook from Saweria - FIXED ID ISSUE
app.post('/api/webhook', (req, res) => {
  console.log('🔄 WEBHOOK RECEIVED');
  
  const data = req.body;
  const amount = data.amount || 0;
  const donorName = data.donator_name || 'Anonymous';
  const message = data.message || '';
  
  if (amount === 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // ✅ FIX: Generate unique ID based on donor + amount + timestamp
  const donationId = data.id !== '00000000-0000-0000-0000-000000000000' 
    ? data.id 
    : `saweria_${donorName}_${amount}_${Date.now()}`;

  console.log('🔑 Donation ID:', donationId);

  // Cek duplikasi
  if (!processedIds.has(donationId)) {
    donations.push({
      id: donationId,
      amount: amount,
      donor_name: donorName,
      message: message,
      timestamp: new Date().toISOString()
    });
    processedIds.add(donationId);
    
    console.log('✅ NEW DONATION ADDED:', donorName, 'Rp' + amount);
    res.json({ success: true, donationId: donationId, status: 'NEW' });
  } else {
    console.log('⏭️ DUPLICATE SKIPPED:', donationId);
    res.json({ success: true, donationId: donationId, status: 'DUPLICATE' });
  }
});

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    totalDonations: donations.length,
    time: new Date().toISOString()
  });
});

// ✅ Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Saweria Webhook Server - FIXED ID ISSUE',
    totalDonations: donations.length
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
