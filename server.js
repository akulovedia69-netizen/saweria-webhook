const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();
app.use(express.json());

// Leaderboard total per player
let totalDonations = {}; 

// Transaksi baru (untuk notif)
let pendingTransactions = []; 


// Roblox mengambil transaksi baru
app.get("/api/donations", (req, res) => {
    console.log("📦 Transaksi baru dikirim:", pendingTransactions.length);

    const toSend = [...pendingTransactions];
    pendingTransactions = [];

    res.json(toSend);
});


// Webhook Saweria
app.post("/DonationWebhook", (req, res) => {
    const donation = req.body;

    const amountRaw = donation.amount_raw ?? donation.etc?.amount_to_display ?? 0;
    const amount = parseInt(amountRaw) || 0;
    const player = (donation.donator_name || "Unknown").trim();
    const message = (donation.message || "").trim();

    // Update TOTAL donation untuk leaderboard
    totalDonations[player] = (totalDonations[player] || 0) + amount;

    // Buat transaksi baru untuk notif
    const entry = {
        id: uuidv4(),
        playerName: player,
        amount: amount, // PER transaksi
        message: message,
        timestamp: Date.now()
    };

    pendingTransactions.push(entry);

    console.log("💰 Transaksi baru:", entry);
    console.log("📊 TOTAL", player, "=", totalDonations[player]);

    res.json({ success: true });
});


// Root endpoint
app.get("/", (req, res) => {
    res.json({
        status: "Saweria Webhook Active",
        pendingTransactions: pendingTransactions.length,
        totalDonations
    });
});


app.listen(3000, () => console.log("🚀 Server ready - Leaderboard TOTAL + Notif per transaksi"));
