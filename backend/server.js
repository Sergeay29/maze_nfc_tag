const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Première route de test
app.get('/', (req, res) => {
  res.send('Serveur Node.js démarré avec succès !');
});

app.listen(PORT, () => {
  console.log(`Le serveur écoute sur http://localhost:${PORT}`);
});