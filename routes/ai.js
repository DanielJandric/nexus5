const express = require('express');
const OpenAI = require('openai');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Configuration OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fonction de classification IA (fallback si OpenAI indisponible)
function classifyTicketFallback(description) {
  const desc = description.toLowerCase();
  
  // Mots-clés par catégorie
  const categories = {
    'Plomberie': {
      keywords: ['fuite', 'eau', 'robinet', 'wc', 'douche', 'évier', 'canalisation', 'plomberie'],
      priority: 4,
      urgency: 'high',
      estimatedTime: '1-3 heures',
      specialist: 'Plombier'
    },
    'Électricité': {
      keywords: ['électrique', 'prise', 'lumière', 'courant', 'disjoncteur', 'ampoule', 'électricité'],
      priority: 4,
      urgency: 'high',
      estimatedTime: '1-2 heures',
      specialist: 'Électricien'
    },
    'Chauffage': {
      keywords: ['chauffage', 'chaudière', 'radiateur', 'froid', 'température', 'chaud'],
      priority: 4,
      urgency: 'high',
      estimatedTime: '2-4 heures',
      specialist: 'Chauffagiste'
    },
    'Serrurerie': {
      keywords: ['porte', 'serrure', 'clé', 'ferme', 'bloqué', 'serrurerie'],
      priority: 3,
      urgency: 'medium',
      estimatedTime: '1-2 heures',
      specialist: 'Serrurier'
    },
    'Peinture': {
      keywords: ['peinture', 'mur', 'plafond', 'tache', 'écaillé'],
      priority: 2,
      urgency: 'low',
      estimatedTime: '2-6 heures',
      specialist: 'Peintre'
    },
    'Ménage': {
      keywords: ['nettoyage', 'ménage', 'sale', 'poussière'],
      priority: 2,
      urgency: 'low',
      estimatedTime: '1-3 heures',
      specialist: 'Agent d\'entretien'
    }
  };

  let bestMatch = {
    category: 'Général',
    priority: 3,
    urgency: 'medium',
    estimatedTime: '1-2 heures',
    specialist: 'Technicien',
    confidence: 0.5
  };

  // Recherche de correspondances
  for (const [category, data] of Object.entries(categories)) {
    let score = 0;
    for (const keyword of data.keywords) {
      if (desc.includes(keyword)) {
        score += 1;
      }
    }
    
    const confidence = Math.min(score / data.keywords.length + 0.3, 0.95);
    
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        category,
        priority: data.priority,
        urgency: data.urgency,
        estimatedTime: data.estimatedTime,
        specialist: data.specialist,
        confidence
      };
    }
  }

  // Détection d'urgence
  const urgentKeywords = ['urgent', 'danger', 'sécurité', 'inondation', 'feu', 'gaz'];
  if (urgentKeywords.some(keyword => desc.includes(keyword))) {
    bestMatch.priority = 5;
    bestMatch.urgency = 'critical';
    bestMatch.estimatedTime = '< 1 heure';
    bestMatch.category = 'Urgent';
  }

  return bestMatch;
}

// Route de classification IA
router.post('/classify', authenticateToken, async (req, res) => {
  try {
    const { description, title = '' } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        error: 'Description requise pour la classification'
      });
    }

    const fullText = `${title} ${description}`.trim();
    let aiResult;

    try {
      // Tentative avec OpenAI GPT-4
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en gestion immobilière. Analyse les demandes de tickets et classifie-les selon ces catégories:
            - Plomberie (fuites, robinets, WC, canalisations)
            - Électricité (prises, éclairage, disjoncteurs)
            - Chauffage (chaudière, radiateurs, température)
            - Serrurerie (portes, serrures, clés)
            - Peinture (murs, plafonds, finitions)
            - Ménage (nettoyage, entretien)
            - Jardinage (espaces verts)
            - Général (autres)
            - Urgent (sécurité, danger immédiat)

            Réponds UNIQUEMENT avec un JSON valide contenant:
            {
              "category": "nom_categorie",
              "priority": 1-5,
              "urgency": "low|medium|high|critical",
              "estimatedTime": "durée estimée",
              "specialist": "type d'artisan",
              "confidence": 0.0-1.0,
              "reasoning": "explication courte"
            }`
          },
          {
            role: "user",
            content: fullText
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      const aiResponse = completion.choices[0].message.content.trim();
      
      try {
        aiResult = JSON.parse(aiResponse);
      } catch (parseError) {
        console.warn('Erreur parsing réponse OpenAI, utilisation du fallback');
        aiResult = classifyTicketFallback(fullText);
      }

    } catch (openaiError) {
      console.warn('OpenAI indisponible, utilisation du fallback:', openaiError.message);
      aiResult = classifyTicketFallback(fullText);
    }

    // Validation et nettoyage des résultats
    const result = {
      category: aiResult.category || 'Général',
      priority: Math.max(1, Math.min(5, parseInt(aiResult.priority) || 3)),
      urgency: ['low', 'medium', 'high', 'critical'].includes(aiResult.urgency) 
        ? aiResult.urgency 
        : 'medium',
      estimatedTime: aiResult.estimatedTime || '1-2 heures',
      specialist: aiResult.specialist || 'Technicien',
      confidence: Math.max(0, Math.min(1, parseFloat(aiResult.confidence) || 0.7)),
      reasoning: aiResult.reasoning || 'Classification automatique',
      timestamp: new Date().toISOString()
    };

    // Recommandations basées sur la catégorie
    const recommendations = {
      'Plomberie': 'Coupez l\'eau si possible et contactez immédiatement un plombier.',
      'Électricité': 'Vérifiez le disjoncteur et évitez de toucher aux installations.',
      'Chauffage': 'Vérifiez la pression de la chaudière et les radiateurs.',
      'Serrurerie': 'Évitez de forcer la serrure en attendant l\'intervention.',
      'Urgent': 'Intervention d\'urgence requise - contactez immédiatement les services.'
    };

    result.recommendations = recommendations[result.category] || 
      'Un technicien sera contacté pour résoudre ce problème.';

    res.json({
      success: true,
      classification: result,
      metadata: {
        model: aiResult.reasoning ? 'gpt-4' : 'fallback',
        processingTime: Date.now() - req.startTime || 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de la classification IA:', error);
    res.status(500).json({
      error: 'Erreur lors de la classification',
      fallback: classifyTicketFallback(req.body.description || '')
    });
  }
});

// Route pour obtenir les statistiques de l'IA
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        category,
        COUNT(*) as total_tickets,
        AVG(ai_confidence) as avg_confidence,
        AVG(priority) as avg_priority
      FROM tickets 
      WHERE ai_confidence IS NOT NULL
      GROUP BY category
      ORDER BY total_tickets DESC
    `);

    const globalStats = await pool.query(`
      SELECT 
        COUNT(*) as total_classified,
        AVG(ai_confidence) as overall_confidence,
        COUNT(CASE WHEN ai_confidence > 0.8 THEN 1 END) as high_confidence_count
      FROM tickets 
      WHERE ai_confidence IS NOT NULL
    `);

    res.json({
      categoryStats: stats.rows,
      globalStats: globalStats.rows[0],
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des stats IA:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// Route pour ré-analyser un ticket existant
router.post('/reanalyze/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Récupérer le ticket
    const ticketResult = await pool.query(
      'SELECT title, description FROM tickets WHERE id = $1',
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Ticket non trouvé'
      });
    }

    const ticket = ticketResult.rows[0];
    
    // Classifier à nouveau
    const classification = classifyTicketFallback(`${ticket.title} ${ticket.description}`);

    // Mettre à jour le ticket
    await pool.query(`
      UPDATE tickets 
      SET 
        category = $1,
        priority = $2,
        urgency = $3,
        estimated_time = $4,
        ai_confidence = $5,
        ai_analysis = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `, [
      classification.category,
      classification.priority,
      classification.urgency,
      classification.estimatedTime,
      classification.confidence,
      JSON.stringify(classification),
      ticketId
    ]);

    res.json({
      success: true,
      message: 'Ticket re-analysé avec succès',
      classification
    });

  } catch (error) {
    console.error('Erreur lors de la re-analyse:', error);
    res.status(500).json({
      error: 'Erreur lors de la re-analyse du ticket'
    });
  }
});

// Route de test de l'IA (sans authentification pour les démos)
router.post('/test', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        error: 'Description requise'
      });
    }

    const result = classifyTicketFallback(description);
    
    res.json({
      success: true,
      classification: result,
      note: 'Ceci est un test avec le système de fallback'
    });

  } catch (error) {
    console.error('Erreur lors du test IA:', error);
    res.status(500).json({
      error: 'Erreur lors du test'
    });
  }
});

module.exports = router;

