const express = require("express");
const app = express();
app.use(express.json());

// 🔥 ID generator simple (tanpa uuid package)
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Leaderboard total
let totalDonations = {};
// Transaksi baru untuk notif
let pendingTransactions = [];

app.get("/api/donations", (req, res) => {
    console.log("📦 Kirim transaksi:", pendingTransactions.length);

    const out = [...pendingTransactions];
    pendingTransactions = []; // kosongkan queue

    res.json(out);
});

app.post("/DonationWebhook", (req, res) => {
    const b = req.body;
    const amount = parseInt(b.amount_raw ?? b.etc?.amount_to_display ?? 0) || 0;

    const playerName = (b.donator_name || "Unknown").trim();
    const message = (b.message || "").trim();

    // update total
    totalDonations[playerName] = (totalDonations[playerName] || 0) + amount;

    // simpan transaksi baru
    const entry = {
        id: generateId(),
        playerName,
        amount,
        message,
        timestamp: Date.now()
    };

    pendingTransactions.push(entry);

    console.log("💰 Transaksi:", entry);

    res.json({ success: true });
});

app.listen(3000, () => console.log("🚀 Ready"));
