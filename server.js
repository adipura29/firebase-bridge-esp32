const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON); // atau require('./serviceAccountKey.json') jika lokal

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://optimization-antena-sectoral-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// === POST /update : dari ESP32 (data sensor) ===
app.post('/update', async (req, res) => {
  const { azimuth, tilting } = req.body;

  if (typeof azimuth !== 'number' || typeof tilting !== 'number') {
    return res.status(400).send("Invalid payload");
  }

  try {
    await db.ref("sensor/azimuth").set(azimuth);
    await db.ref("sensor/tilting").set(tilting);
    res.status(200).send("Sensor data stored");
  } catch (error) {
    console.error("Error writing sensor data:", error);
    res.status(500).send("Internal error");
  }
});

// === GET /control : untuk ESP32 ambil data kontrol ===
app.get('/control', async (req, res) => {
  try {
    const snapshot = await db.ref("kontrol").once('value');
    res.status(200).json(snapshot.val());
  } catch (error) {
    console.error("Error reading control:", error);
    res.status(500).send("Internal error");
  }
});

// === POST /control : untuk ubah nilai kontrol manual (misalnya dari frontend) ===
app.post('/control', async (req, res) => {
  const { azimuth, tilting } = req.body;

  if (typeof azimuth !== 'number' || typeof tilting !== 'number') {
    return res.status(400).send("Invalid payload");
  }

  try {
    await db.ref("kontrol").set({
      azimuth,
      tilting,
      timestamp: Date.now()
    });
    res.status(200).send("Kontrol updated");
  } catch (error) {
    console.error("Error writing control:", error);
    res.status(500).send("Internal error");
  }
});

// === Start server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bridge server running on port ${PORT}`);
});
