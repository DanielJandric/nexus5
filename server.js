require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// ✅ Initialisation correcte et unique d’OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middlewares
app.use(cors());
app.use(express.json());

// Route de l'IA
app.post('/api/ai/chat', async (req, res) => {
  const { message, context = [] } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [...context, { role: 'user', content: message }],
    });

    res.json({
      success: true,
      response: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error('Erreur OpenAI:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération avec OpenAI.',
    });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${port}`);
});
