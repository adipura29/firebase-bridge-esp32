const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const app = express();
app.use(bodyParser.json());

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://YOUR_PROJECT.firebaseio.com" // ganti
});

const db = admin.database();

app.post('/update', (req, res) => {
  const { azimuth, tilting } = req.body;
  if (!azimuth || !tilting) {
    return res.status(400).send("Invalid payload");
  }

  db.ref("kontrol").set({
    azimuth,
    tilting,
    timestamp: Date.now()
  });

  res.send("Data received");
});

app.get('/control', async (req, res) => {
  const snapshot = await db.ref("kontrol").once('value');
  res.json(snapshot.val());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bridge server listening on port ${PORT}`);
});
