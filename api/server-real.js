const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();

// Configuration CORS pour Vercel
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configuration PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialisation base de données
async function initDatabase() {
    if (process.env.INIT_DB === 'true') {
        try {
            // Créer tables si elles n'existent pas
            await pool.query(`
                CREATE TABLE IF NOT EXISTS tickets (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    category VARCHAR(100),
                    priority INTEGER DEFAULT 3,
                    status VARCHAR(50) DEFAULT 'nouveau',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Insérer données de démo
            const existingTickets = await pool.query('SELECT COUNT(*) FROM tickets');
            if (parseInt(existingTickets.rows[0].count) === 0) {
                await pool.query(`
                    INSERT INTO tickets (title, description, category, priority, status) VALUES
                    ('Fuite robinet cuisine', 'Le robinet de la cuisine fuit depuis ce matin', 'Plomberie', 4, 'en_cours'),
                    ('Panne électrique salon', 'Plus d''électricité dans le salon depuis hier soir', 'Électricité', 5, 'assigné')
                `);
            }
        } catch (error) {
            console.log('Database init error (normal for first deploy):', error.message);
        }
    }
}

// Routes API
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

app.get('/tickets', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tickets ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/tickets', async (req, res) => {
    try {
        const { title, description } = req.body;
        
        // Classification IA simulée
        const categories = ['Plomberie', 'Électricité', 'Chauffage', 'Serrurerie', 'Autre'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const priority = Math.floor(Math.random() * 5) + 1;
        
        const result = await pool.query(
            'INSERT INTO tickets (title, description, category, priority) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, description, category, priority]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/ai/classify', (req, res) => {
    const { text } = req.body;
    
    // Classification IA simulée
    const categories = ['Plomberie', 'Électricité', 'Chauffage', 'Serrurerie', 'Climatisation', 'Ascenseur', 'Sécurité', 'Nettoyage', 'Autre'];
    
    let category = 'Autre';
    let priority = 3;
    let confidence = 75;
    
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('fuite') || lowerText.includes('eau') || lowerText.includes('robinet')) {
        category = 'Plomberie';
        priority = 4;
        confidence = 88;
    } else if (lowerText.includes('électrique') || lowerText.includes('courant') || lowerText.includes('panne')) {
        category = 'Électricité';
        priority = 5;
        confidence = 92;
    } else if (lowerText.includes('chauffage') || lowerText.includes('radiateur') || lowerText.includes('froid')) {
        category = 'Chauffage';
        priority = 4;
        confidence = 85;
    } else if (lowerText.includes('ascenseur') || lowerText.includes('coincé')) {
        category = 'Ascenseur';
        priority = 5;
        confidence = 95;
    }
    
    res.json({
        success: true,
        category,
        priority,
        confidence,
        estimatedTime: `${priority * 2}-${priority * 4} heures`,
        recommendations: [
            `Intervention ${priority >= 4 ? 'prioritaire' : 'standard'} requise`,
            `Catégorie: ${category}`,
            `Confiance: ${confidence}%`
        ]
    });
});

app.post('/ai/chat', (req, res) => {
    const { message } = req.body;
    
    const responses = {
        'coincé|ascenseur|bloqué': 'URGENCE ! Si vous êtes coincé dans l\'ascenseur, appuyez sur le bouton d\'alarme rouge. Je contacte immédiatement les secours. Restez calme, de l\'aide arrive !',
        'fuite|plomberie|eau': 'Je comprends que vous avez un problème de plomberie. Pouvez-vous me dire dans quelle pièce se trouve le problème ? En attendant, fermez l\'arrivée d\'eau si possible.',
        'électricité|panne|courant': 'Pour un problème électrique, vérifiez d\'abord le disjoncteur. Si le problème persiste, je vais créer une demande urgente pour un technicien.',
        'chauffage|froid|radiateur': 'Problème de chauffage détecté. Vérifiez que les radiateurs ne sont pas obstrués. Je programme une intervention technique prioritaire.',
        'merci|remercie': 'Je vous en prie ! N\'hésitez pas si vous avez d\'autres questions. Je suis là 24h/24 pour vous aider.',
        'salut|bonjour|hello': 'Bonjour ! Je suis votre assistant IA pour la gestion immobilière. Comment puis-je vous aider aujourd\'hui ?'
    };
    
    const lowerMessage = message.toLowerCase();
    let response = 'Je comprends votre préoccupation. Laissez-moi vous aider avec cela. Pouvez-vous me donner plus de détails ?';
    let confidence = 75;
    
    for (const [pattern, resp] of Object.entries(responses)) {
        if (new RegExp(pattern, 'i').test(lowerMessage)) {
            response = resp;
            confidence = 95;
            break;
        }
    }
    
    res.json({
        success: true,
        response,
        confidence,
        intent: 'general_inquiry'
    });
});

app.get('/weather', (req, res) => {
    // Simulation météo
    res.json({
        location: 'Zurich',
        temperature: 19,
        condition: 'couvert',
        humidity: 65,
        wind: 6,
        source: 'open-meteo'
    });
});

// Initialiser la base de données au démarrage
initDatabase();

// Export pour Vercel
module.exports = app;

