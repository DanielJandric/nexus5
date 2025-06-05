require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Ordre correct
app.use(express.static('public'));
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/ai/chat', async (req, res) => {
  const { message, context = [] } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: 't-3.5-turbo',
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
      error: 'Erreur côté serveur IA.',
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${port}`);
});
