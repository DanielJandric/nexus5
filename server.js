require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

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

  } catch (err) {
    console.error('Erreur OpenAI:', err);
    res.json({
      success: false,
      error: 'Erreur lors de la génération OpenAI.',
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${port}`);
});
