import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simpan data donasi di memory
let donations = [];
let processedIds = new Set();

// ✅ Endpoint untuk Roblox - /api/donations
app.get('/api/donations', (req, res) => {
  try {
    console.log('📊 Fetching donations data for Roblox - Total:', donations.length);
    
    // Format data sesuai dengan yang diharapkan script Roblox
    const formattedDonations = donations.map(donation => ({
      id: donation.id,
      amount: donation.amount,
      playerName: donation.donor_name,
      donor_name: donation.donor_name,
      message: donation.message || '',
      timestamp: donation.timestamp
    }));
    
    console.log(`📨 Sending ${formattedDonations.length} donations to Roblox`);
    res.json(formattedDonations);
    
  } catch (error) {
    console.error('❌ Error fetching donations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Endpoint untuk webhook Saweria - /api/webhook
app.post('/api/webhook', (req, res) => {
  try {
    const saweriaData = req.body;
    console.log('🔄 Received webhook from Saweria:', JSON.stringify(saweriaData, null, 2));

    // Validasi data dasar
    if (!saweriaData) {
      return res.status(400).json({ error: 'No data received' });
    }

    // Format data sesuai webhook Saweria resmi
    const amount = saweriaData.amount || saweriaData.amount_raw || 0;
    const donorName = saweriaData.donator_name || saweriaData.donatorName || 'Anonymous';
    const message = saweriaData.message || '';
    
    if (amount === 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Generate unique ID
    const donationId = saweriaData.id || `saweria_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Cek duplikasi
    if (processedIds.has(donationId)) {
      console.log('⏭️ Duplicate donation, skipping:', donationId);
      return res.json({ success: true, message: 'Duplicate donation ignored' });
    }

    // Format data untuk kompatibilitas Roblox
    const donationData = {
      id: donationId,
      amount: amount,
      donor_name: donorName,
      playerName: donorName,
      message: message,
      timestamp: new Date().toISOString(),
      rawData: saweriaData
    };

    // Simpan donation
    donations.push(donationData);
    processedIds.add(donationId);

    console.log('✅ Donation processed successfully:', {
      id: donationId,
      donor: donorName,
      amount: amount,
      message: message,
      totalDonations: donations.length
    });

    res.json({ 
      success: true, 
      message: 'Donation processed successfully',
      donationId: donationId
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    totalDonations: donations.length,
    serverTime: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Saweria Webhook Server running on port ${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET  /api/donations - Untuk Roblox fetch data`);
  console.log(`   POST /api/webhook   - Untuk webhook Saweria`);
  console.log(`   GET  /api/health    - Health check`);
});
