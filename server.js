const express = require("express");
const app = express();
app.use(express.json());

// ✅ Simpan data donasi di memory
let donations = [];

// ✅ Endpoint untuk Roblox fetch data
app.get("/api/donations", (req, res) => {
    console.log("📦 Mengirim data ke Roblox:", donations.length, "donasi");
    res.json(donations);
});

// ✅ Endpoint untuk Saweria webhook
app.post("/DonationWebhook", (req, res) => {
    const donation = req.body;
    
    const data = {
        playerName: donation.donator_name?.trim() || "Unknown",
        amount: donation.amount_raw || donation.etc?.amount_to_display || 0,
        message: donation.message?.trim() || ""
    };

    console.log("💰 Donasi diterima:", data);

    // ✅ Cari apakah player sudah ada
    const existingIndex = donations.findIndex(d => d.playerName === data.playerName);
    
    if (existingIndex !== -1) {
        // Update donasi existing
        donations[existingIndex].amount += parseInt(data.amount);
        console.log("🔄 Update donasi:", data.playerName, "sekarang:", donations[existingIndex].amount);
    } else {
        // Tambah donasi baru
        donations.push({
            playerName: data.playerName,
            amount: parseInt(data.amount),
            timestamp: new Date().toISOString()
        });
        console.log("➕ Tambah donasi baru:", data.playerName, data.amount);
    }

    // ✅ Urutkan dari terbesar
    donations.sort((a, b) => b.amount - a.amount);
    
    console.log("✅ Donasi updated. Total:", donations.length, "donatur");
    res.json({ success: true, message: "Donasi berhasil diproses" });
});

// ✅ Root endpoint
app.get("/", (req, res) => {
    res.json({ 
        message: "Saweria Webhook Active ✅",
        status: "HTTP Polling Mode",
        totalDonations: donations.length
    });
});

app.listen(3000, () => console.log("🚀 Server ready - HTTP Polling Mode"));
