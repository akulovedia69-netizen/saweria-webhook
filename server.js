import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simpan data donasi di memory (untuk production, gunakan database)
let donations = [];
let processedIds = new Set();

// ✅ Endpoint untuk Roblox fetch data
app.get('/api/donations', (req, res) => {
  try {
    console.log('📊 Fetching donations data for Roblox');
    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Endpoint untuk webhook Saweria
app.post('/api/webhook', (req, res) => {
  try {
    const saweriaData = req.body;
    console.log('🔄 Received webhook from Saweria:', saweriaData);

    // Validasi data dasar
    if (!saweriaData || !saweriaData.amount) {
      return res.status(400).json({ error: 'Invalid donation data' });
    }

    // Generate unique ID jika tidak ada
    const donationId = saweriaData.id || `saweria_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Cek duplikasi
    if (processedIds.has(donationId)) {
      console.log('⏭️ Duplicate donation, skipping:', donationId);
      return res.json({ success: true, message: 'Duplicate donation ignored' });
    }

    // Format data untuk kompatibilitas Roblox
    const donationData = {
      id: donationId,
      amount: saweriaData.amount,
      donor_name: saweriaData.donator_name || 'Anonymous',
      playerName: saweriaData.donator_name || 'Anonymous', // Untuk Roblox
      message: saweriaData.message || '',
      timestamp: new Date().toISOString(),
      rawData: saweriaData // Simpan data asli untuk debugging
    };

    // Simpan donation
    donations.push(donationData);
    processedIds.add(donationId);

    console.log('✅ Donation processed:', {
      id: donationId,
      donor: donationData.donor_name,
      amount: donationData.amount,
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

// ✅ Clear data endpoint (untuk testing)
app.delete('/api/clear', (req, res) => {
  donations = [];
  processedIds.clear();
  console.log('🧹 All data cleared');
  res.json({ success: true, message: 'All data cleared' });
});

// ✅ Get stats
app.get('/api/stats', (req, res) => {
  const totalAmount = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
  
  res.json({
    totalDonations: donations.length,
    totalAmount: totalAmount,
    lastDonation: donations[donations.length - 1] || null,
    serverUptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Saweria Webhook Server running on port ${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET  /api/donations - Untuk Roblox fetch data`);
  console.log(`   POST /api/webhook   - Untuk webhook Saweria`);
  console.log(`   GET  /api/health    - Health check`);
  console.log(`   GET  /api/stats     - Statistics`);
});
