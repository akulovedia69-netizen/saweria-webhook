const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();
app.use(express.json());

// -----------------------------
// Data
// -----------------------------
// untuk leaderboard total (per player)
let totalDonations = {}; // { "Andika": 5000, "Ujang": 3000 }

// untuk transaksi baru (antrian)
let pendingTransactions = []; // transaksi per donasi (untuk notif 1:1)


// -----------------------------
// GET untuk Roblox — kirim transaksi baru (notif saja)
// -----------------------------
app.get("/api/donations", (req, res) => {
    console.log("📦 Mengirim transaksi baru:", pendingTransactions.length);

    const toSend = [...pendingTransactions];
    pendingTransactions = []; // kosongkan agar tidak dikirim ulang

    res.json(toSend);
});


// -----------------------------
// POST dari Saweria — simpan transaksi & update total
// -----------------------------
app.post("/DonationWebhook", (req, res) => {
    const body = req.body;

    const amountRaw = body.amount_raw ?? body.etc?.amount_to_display ?? 0;
    const amount = parseInt(amountRaw) || 0;

    const player = (body.donator_name || "Unknown").trim();
    const message = (body.message || "").trim();

    // 🔥 1. Tambahkan ke total
    totalDonations[player] = (totalDonations[player] || 0) + amount;

    // 🔥 2. Buat transaksi baru untuk notif
    const entry = {
        id: uuidv4(),
        playerName: player,
        amount: amount, // per transaksi
        message: message,
        timestamp: Date.now()
    };

    pendingTransactions.push(entry);

    console.log("💰 Transaksi baru masuk:", entry);
    console.log("📊 TOTAL Donasi", player, "=", totalDonations[player]);

    res.json({ success: true });
});


// -----------------------------
// Root
// -----------------------------
app.get("/", (req, res) => {
    res.json({
        status: "Saweria Webhook Active",
        pendingTransactions: pendingTransactions.length,
        totalDonations
    });
});


// -----------------------------
app.listen(3000, () => console.log("🚀 Server siap (Leaderboard Total + Notif Transaksi)"));
