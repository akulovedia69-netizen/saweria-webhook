const express = require("express");
const app = express();

app.use(express.json());

// Simpan donasi sementara
let donations = [];

// ==============================
//  ROBLOX FETCH ENDPOINT
// ==============================
app.get("/api/donations", (req, res) => {
    console.log("📦 Roblox mengambil donasi:", donations.length);

    // Kirim semua data
    res.json(donations);

    // Hapus setelah dikirim (ANTI-LAG)
    donations = [];
});

// ==============================
//  SAWERIA WEBHOOK
// ==============================
app.post("/DonationWebhook", (req, res) => {
    const donation = req.body;

    const data = {
        playerName: donation.donator_name?.trim() || "Unknown",
        amount: parseInt(donation.amount_raw || donation?.etc?.amount_to_display || 0),
        message: donation.message?.trim() || ""
    };

    console.log("💰 Donasi diterima:", data);

    // Cek data valid
    if (!data.playerName || isNaN(data.amount)) {
        console.log("❌ Donasi tidak valid:", req.body);
        return res.json({ success: false });
    }

    // Cek apakah player sudah pernah donasi
    const index = donations.findIndex(d => d.playerName === data.playerName);

    if (index !== -1) {
        donations[index].amount += data.amount;
        console.log(`🔄 Update donasi ${data.playerName}: ${donations[index].amount}`);
    } else {
        donations.push({
            playerName: data.playerName,
            amount: data.amount,
            message: data.message,
            timestamp: Date.now()
        });
        console.log(`➕ Donatur baru: ${data.playerName}`);
    }

    donations.sort((a, b) => b.amount - a.amount);

    console.log("📊 Total donasi tersimpan:", donations.length);
    res.json({ success: true });
});

// ==============================
app.get("/", (req, res) => {
    res.json({
        message: "Saweria Webhook Active",
        status: "Optimized",
        donorsStored: donations.length
    });
});

// ==============================
app.listen(3000, () => console.log("🚀 Webhook server ready"));
