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

// ✅ Endpoint untuk Roblox - SESUAI FORMAT YANG DIMINTA
app.get('/api/donations', (req, res) => {
  try {
    console.log('📊 Fetching donations data for Roblox');
    
    // Format data sesuai dengan yang diharapkan script Roblox
    const formattedDonations = donations.map(donation => ({
      id: donation.id,
      amount: donation.amount,
      playerName: donation.donor_name, // Sesuai dengan yang dicari script Roblox
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

// ✅ Endpoint untuk webhook Saweria - FORMAT RESMI SAWERIA
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
      playerName: donorName, // ✅ SESUAI DENGAN YANG DICARI SCRIPT ROBLOX
      message: message,
      timestamp: new Date().toISOString(),
      // Simpan data asli untuk referensi
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

// ✅ Endpoint manual test (untuk testing tanpa webhook)
app.post('/api/test-donation', (req, res) => {
  try {
    const { donor_name, amount, message } = req.body;
    
    const donationId = `test_${Date.now()}`;
    const donationData = {
      id: donationId,
      amount: amount || 50000,
      donor_name: donor_name || 'TestDonor',
      playerName: donor_name || 'TestDonor',
      message: message || 'Test donation',
      timestamp: new Date().toISOString()
    };

    donations.push(donationData);
    processedIds.add(donationId);

    console.log('🧪 Test donation added:', donationData);
    res.json({ success: true, donation: donationData });

  } catch (error) {
    console.error('Test donation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    totalDonations: donations.length,
    serverTime: new Date().toISOString(),
    endpoint: 'saweria-webhook-fawn.vercel.app'
  });
});

// ✅ Get stats
app.get('/api/stats', (req, res) => {
  const totalAmount = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
  const uniqueDonors = new Set(donations.map(d => d.donor_name)).size;
  
  res.json({
    totalDonations: donations.length,
    totalAmount: totalAmount,
    uniqueDonors: uniqueDonors,
    lastDonation: donations[donations.length - 1] || null,
    serverUptime: process.uptime()
  });
});

// ✅ Clear data endpoint (untuk testing)
app.delete('/api/clear', (req, res) => {
  const previousCount = donations.length;
  donations = [];
  processedIds.clear();
  console.log('🧹 All data cleared. Previous:', previousCount, 'donations');
  res.json({ success: true, message: `Cleared ${previousCount} donations` });
});

// ✅ Get specific donation by ID
app.get('/api/donations/:id', (req, res) => {
  const donation = donations.find(d => d.id === req.params.id);
  if (donation) {
    res.json(donation);
  } else {
    res.status(404).json({ error: 'Donation not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Saweria Webhook Server running on port ${PORT}`);
  console.log(`📍 Domain: saweria-webhook-fawn.vercel.app`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET  /api/donations     - Untuk Roblox fetch data`);
  console.log(`   POST /api/webhook       - Untuk webhook Saweria`);
  console.log(`   POST /api/test-donation - Untuk testing manual`);
  console.log(`   GET  /api/health        - Health check`);
  console.log(`   GET  /api/stats         - Statistics`);
  console.log(`   DELETE /api/clear       - Clear data (testing)`);
});
