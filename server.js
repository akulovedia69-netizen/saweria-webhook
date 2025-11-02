// ===========================
// 🔧 Import dan Setup Awal
// ===========================
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // ✅ IMPORTANT: Tambah ini

// ✅ Import fetch (karena Node.js v18+ tidak otomatis punya)
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

// ✅ MIDDLEWARE (Tambahkan ini)
app.use(bodyParser.json());
app.use(cors()); // ✅ ENABLE CORS UNTUK SEMUA REQUEST

// ===========================
// 🌐 Cek apakah server aktif
// ===========================
app.get("/", (req, res) => {
  res.send("Saweria Webhook Active ✅");
});

// ===========================
// ⚙️ Konfigurasi Roblox API
// ===========================
// Ganti dengan data kamu
const ROBLOX_API_URL = "https://apis.roblox.com/messaging-service/v1/universes/9051885068/topics/DonationWebhook";
const ROBLOX_API_KEY = "ylLD5H14YUS5W+Ec0GCssQGLM+7GkB2UCxVKtFaxyHWR5rxwZXlKaGJHY2lPaUpTVXpJMU5pSXNJbXRwWkNJNkluTnBaeTB5TURJeExUQTNMVEV6VkRFNE9qVXhPalE1PalE1V2lJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaGRXUWlPaUpTYjJKc2IzaEpiblJsY201aGJDSXNJbWx6Y3lJNklrTnNiM1ZrUVhWMGFHVnVkR2xqWVhScGIyNVRaWEoyYVdObElpd2lZbUZ6WlVGd2FVdGxlU0k2SW5sc1RFUTFTREUwV1ZWVE5WY3JSV013UjBOemMxRkhURTByTjBkclFqSlZRM2hXUzNSR1lYaDVTRmRTTlhKNGR5SXNJbTkzYm1WeVNXUWlPaUk0TkRJeU56WTJNVE0xSWl3aVpYaHdJam94TnpZeU1EYzVNelU1TENKcFlYUWlPakUzTmpJd056VTNOVGtzSW01aVppSTZNVGMyTWpBM05UYzFPWDAubHlLNF81a2ZnUlVfdXdFeUF6MW9CeXRxR0xrcm9XN1VEd2laV2VJeTVwNmFyTmljR2R3Nk9jaFllR3FaYVhQR2EydERPdnVmS2toczY3WjdMWDVSZW15QjZPU1MtMVRHTEV4c0xzRUxDQUFVZjhIVXhRREExSV8xSXpIdHpOc0FIR1M1YkdJX0pTZjRGR2lfYVhOWk14ektfLXFZcnRma3M3S1JFM3gzellEXzVYa05XN2VidFl6enBMVW1GckFseWpyTU0yTFhOQkNZN2FqOGp2Y25NN0xLbldSN0t6Z2hsN1dwclEwY0xnX2psRFFuY0dtd3Q0V21iNkMyQ01rWi13TFgyVmJjNjFobWtiTlBjZFB3S2swWDdlMzBHUS1PZkNKalUxbVYwU0owY1Bld2FUQnpJVVBKWGdGZEZqMnNoSDd5UjJkOTRRaU5EQ2R2U1lrMzZ3";

// ===========================
// 💰 Endpoint untuk Saweria Webhook
// ===========================
app.post("/DonationWebhook", async (req, res) => {
  const donation = req.body;

  // 🔍 Ambil data penting dari webhook Saweria
  const data = {
    playerName: donation.donator_name?.trim() || "Unknown",
    amount: donation.etc?.amount_to_display || donation.amount_raw || 0,
    message: donation.message?.trim() || "",
  };

  // Log data di console biar mudah dipantau
  console.log("💰 Donasi diterima:", donation);
  console.log("📤 Data dikirim ke Roblox:", data);

  try {
    // 🔗 Kirim data ke Roblox MessagingService API
    const response = await fetch(ROBLOX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ROBLOX_API_KEY,
      },
      body: JSON.stringify({
        message: JSON.stringify(data),
      }),
    });

    // Cek apakah sukses
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    console.log("✅ Berhasil kirim ke Roblox!");
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Gagal kirim ke Roblox:", error.message);
    res.sendStatus(500);
  }
});

// ===========================
// 🚀 Jalankan Server
// ===========================
app.listen(3000, () => console.log("🚀 Server jalan di port 3000"));
