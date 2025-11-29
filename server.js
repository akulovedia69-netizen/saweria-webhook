import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Data storage
let donations = [];
let processedIds = new Set();

// ✅ ROOT ENDPOINT - PASTI BALIK 200
app.get('/', (req, res) => {
  console.log('📍 Root endpoint accessed');
  res.json({ 
    status: 'OK',
    message: 'Saweria Webhook Server is RUNNING!',
    timestamp: new Date().toISOString(),
    totalDonations: donations.length
  });
});

// ✅ Health check
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check');
  res.json({ 
    status: 'ALIVE', 
    totalDonations: donations.length,
    serverTime: new Date().toISOString()
  });
});

// ✅ Get donations for Roblox
app.get('/api/donations', (req, res) => {
  console.log('📊 GET /api/donations - Total donations:', donations.length);
  
  const formattedDonations = donations.map(donation => ({
    id: donation.id,
    amount: donation.amount,
    playerName: donation.donor_name,
    donor_name: donation.donor_name, 
    message: donation.message || '',
    timestamp: donation.timestamp
  }));
  
  res.json(formattedDonations);
});

// ✅ Webhook from Saweria
app.post('/api/webhook', (req, res) => {
  console.log('🔄 WEBHOOK RECEIVED from Saweria');
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    const saweriaData = req.body;
    
    if (!saweriaData) {
      return res.status(400).json({ error: 'No data received' });
    }

    const amount = saweriaData.amount || saweriaData.amount_raw || 0;
    const donorName = saweriaData.donator_name || saweriaData.donatorName || 'Anonymous';
    const message = saweriaData.message || '';

    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const donationId = saweriaData.id || `saweria_${Date.now()}`;

    // Cek duplikat
    if (!processedIds.has(donationId)) {
      const donationData = {
        id: donationId,
        amount: amount,
        donor_name: donorName,
        message: message,
        timestamp: new Date().toISOString()
      };

      donations.push(donationData);
      processedIds.add(donationId);

      console.log('✅ DONATION SAVED:', donorName, 'Rp' + amount);
    } else {
      console.log('⏭️ Duplicate donation skipped:', donationId);
    }

    res.json({ 
      success: true, 
      message: 'Donation processed',
      donationId: donationId
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Error handling
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.url);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.url,
    availableRoutes: ['/', '/api/health', '/api/donations', '/api/webhook']
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 SERVER STARTED on port', PORT);
  console.log('📍 Domain: saweria-webhook-q3jlsbafc-andikas-projects-2e1b375c.vercel.app');
  console.log('✅ Endpoints:');
  console.log('   GET  /');
  console.log('   GET  /api/health');
  console.log('   GET  /api/donations');
  console.log('   POST /api/webhook');
});

export default app;
