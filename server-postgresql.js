const express = require('express');
const path = require('path');
const cors = require('cors');
const { initializeDatabase, healthCheck, ticketQueries, statsQueries, userQueries } = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Variables globales pour le cache
let cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Middleware de cache simple
function cacheMiddleware(duration = CACHE_TTL) {
    return (req, res, next) => {
        const key = req.originalUrl;
        const cached = cache.get(key);
        
        if (cached && (Date.now() - cached.timestamp) < duration) {
            return res.json(cached.data);
        }
        
        res.sendResponse = res.json;
        res.json = (body) => {
            cache.set(key, {
                data: body,
                timestamp: Date.now()
            });
            res.sendResponse(body);
        };
        
        next();
    };
}

// Initialisation de la base de données au démarrage
async function startServer() {
    try {
        console.log('🚀 Starting Ticket System Server v3.0-postgresql...');
        
        // Initialiser la base de données
        if (process.env.INIT_DB === 'true') {
            await initializeDatabase();
        }
        
        // Vérifier la connexion
        const dbHealth = await healthCheck();
        console.log('📊 Database status:', dbHealth);
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`🌐 Access: http://localhost:${PORT}`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Routes API

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const dbHealth = await healthCheck();
        res.json({
            status: 'healthy',
            version: '3.0-postgresql',
            timestamp: new Date().toISOString(),
            database: dbHealth,
            cache_size: cache.size
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Statistiques du dashboard
app.get('/api/stats', cacheMiddleware(2 * 60 * 1000), async (req, res) => {
    try {
        const overview = await statsQueries.getOverview();
        const categories = await statsQueries.getCategoryStats();
        const performance = await statsQueries.getPerformanceMetrics();
        
        res.json({
            overview: {
                total_tickets: parseInt(overview.total_tickets) || 0,
                open_tickets: parseInt(overview.open_tickets) || 0,
                resolved_tickets: parseInt(overview.resolved_tickets) || 0,
                closed_tickets: parseInt(overview.closed_tickets) || 0,
                avg_priority: parseFloat(overview.avg_priority) || 3.0,
                ai_confidence: parseFloat(overview.avg_ai_confidence) || 90.0,
                active_tenants: parseInt(overview.active_tenants) || 0,
                active_technicians: parseInt(overview.active_technicians) || 0
            },
            categories,
            performance: {
                avg_resolution_hours: parseFloat(performance.avg_resolution_hours) || 24.0,
                resolved_count: parseInt(performance.resolved_count) || 0,
                on_time_rate: performance.on_time_resolutions && performance.resolved_count 
                    ? (parseInt(performance.on_time_resolutions) / parseInt(performance.resolved_count) * 100)
                    : 85.0,
                ai_accuracy: parseFloat(performance.ai_accuracy) || 92.0
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Liste des tickets
app.get('/api/tickets', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            category_id: req.query.category,
            tenant_id: req.query.tenant,
            assigned_to: req.query.technician,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };
        
        const tickets = await ticketQueries.list(filters);
        res.json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// Créer un ticket
app.post('/api/tickets', async (req, res) => {
    try {
        const {
            title, description, category, priority = 3, urgency = 'normale',
            tenant_email = 'marie.locataire@email.com', // Default pour demo
            property_id, unit_id, location_details
        } = req.body;
        
        // Simulation de classification IA
        const aiClassification = await simulateAIClassification(title + ' ' + description);
        
        // Trouver l'utilisateur locataire
        const tenant = await userQueries.getByEmail(tenant_email);
        if (!tenant) {
            return res.status(400).json({ error: 'Tenant not found' });
        }
        
        // Trouver la catégorie par nom
        const categoryResult = await query('SELECT id FROM ticket_categories WHERE name = $1', [category]);
        const category_id = categoryResult.rows[0]?.id;
        
        if (!category_id) {
            return res.status(400).json({ error: 'Category not found' });
        }
        
        // Propriété par défaut (Résidence Les Jardins)
        const defaultProperty = await query('SELECT id FROM properties WHERE name = $1', ['Résidence Les Jardins']);
        const final_property_id = property_id || defaultProperty.rows[0]?.id;
        
        const ticketData = {
            title,
            description,
            category_id,
            priority: aiClassification.priority || priority,
            urgency,
            tenant_id: tenant.id,
            property_id: final_property_id,
            unit_id,
            location_details,
            ai_classification_data: aiClassification
        };
        
        const newTicket = await ticketQueries.create(ticketData);
        
        // Invalider le cache
        cache.clear();
        
        res.status(201).json({
            success: true,
            ticket: newTicket,
            ai_classification: aiClassification
        });
        
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

// Classification IA
app.post('/api/ai/classify', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const classification = await simulateAIClassification(text);
        res.json(classification);
        
    } catch (error) {
        console.error('Error in AI classification:', error);
        res.status(500).json({ error: 'Classification failed' });
    }
});

// Météo temps réel
app.get('/api/weather/:city', cacheMiddleware(10 * 60 * 1000), async (req, res) => {
    try {
        const { city } = req.params;
        
        // Géocodage de la ville
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`, {
            headers: { 'User-Agent': 'TicketSystem/1.0' }
        });
        const geoData = await geoResponse.json();
        
        if (!geoData.length) {
            return res.status(404).json({ error: 'City not found' });
        }
        
        const { lat, lon } = geoData[0];
        
        // Données météo Open-Meteo
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`);
        const weatherData = await weatherResponse.json();
        
        const current = weatherData.current_weather;
        
        res.json({
            city: city,
            temperature: Math.round(current.temperature),
            condition: getWeatherCondition(current.weathercode),
            wind_speed: Math.round(current.windspeed),
            humidity: weatherData.hourly.relative_humidity_2m[0] || 65,
            source: 'open-meteo',
            cache_hit: false
        });
        
    } catch (error) {
        console.error('Weather API error:', error);
        res.status(500).json({ error: 'Weather data unavailable' });
    }
});

// Géolocalisation
app.get('/api/geocode/:address', cacheMiddleware(60 * 60 * 1000), async (req, res) => {
    try {
        const { address } = req.params;
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`, {
            headers: { 'User-Agent': 'TicketSystem/1.0' }
        });
        const data = await response.json();
        
        if (!data.length) {
            return res.status(404).json({ error: 'Address not found' });
        }
        
        const result = data[0];
        res.json({
            address: result.display_name,
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            confidence: parseFloat(result.importance) * 100,
            source: 'nominatim'
        });
        
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ error: 'Geocoding failed' });
    }
});

// Test des intégrations
app.get('/api/integrations/test', async (req, res) => {
    try {
        const results = {
            weather: { status: 'testing', message: 'Testing weather API...' },
            geocoding: { status: 'testing', message: 'Testing geocoding API...' },
            database: { status: 'testing', message: 'Testing database connection...' }
        };
        
        // Test météo
        try {
            const weatherTest = await fetch('https://api.open-meteo.com/v1/forecast?latitude=47.3769&longitude=8.5417&current_weather=true');
            if (weatherTest.ok) {
                results.weather = { status: 'success', message: 'Weather API operational' };
            } else {
                results.weather = { status: 'error', message: 'Weather API unavailable' };
            }
        } catch (error) {
            results.weather = { status: 'error', message: error.message };
        }
        
        // Test géocodage
        try {
            const geoTest = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=Zurich&limit=1', {
                headers: { 'User-Agent': 'TicketSystem/1.0' }
            });
            if (geoTest.ok) {
                results.geocoding = { status: 'success', message: 'Geocoding API operational' };
            } else {
                results.geocoding = { status: 'error', message: 'Geocoding API unavailable' };
            }
        } catch (error) {
            results.geocoding = { status: 'error', message: error.message };
        }
        
        // Test base de données
        try {
            const dbTest = await healthCheck();
            if (dbTest.status === 'healthy') {
                results.database = { status: 'success', message: 'Database operational' };
            } else {
                results.database = { status: 'error', message: 'Database unhealthy' };
            }
        } catch (error) {
            results.database = { status: 'error', message: error.message };
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            overall_status: Object.values(results).every(r => r.status === 'success') ? 'success' : 'partial',
            results
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Integration test failed' });
    }
});

// Fonctions utilitaires

async function simulateAIClassification(text) {
    const categories = {
        'plomberie': { keywords: ['fuite', 'robinet', 'eau', 'canalisation', 'douche', 'évier', 'wc', 'toilette', 'évacuation'], priority: 4 },
        'électricité': { keywords: ['électrique', 'prise', 'lumière', 'disjoncteur', 'panne', 'courant'], priority: 5 },
        'chauffage': { keywords: ['chauffage', 'radiateur', 'température', 'froid', 'chaud', 'thermostat'], priority: 4 },
        'serrurerie': { keywords: ['serrure', 'clé', 'porte', 'fenêtre', 'bloqué', 'fermeture'], priority: 3 },
        'peinture': { keywords: ['peinture', 'mur', 'écaillé', 'couleur', 'décoration'], priority: 2 },
        'ménage': { keywords: ['nettoyage', 'propre', 'sale', 'déménagement', 'entretien'], priority: 2 },
        'jardinage': { keywords: ['jardin', 'plante', 'herbe', 'arbre', 'extérieur'], priority: 2 },
        'menuiserie': { keywords: ['bois', 'meuble', 'placard', 'étagère', 'réparation'], priority: 3 }
    };
    
    const textLower = text.toLowerCase();
    let bestMatch = { category: 'Général', confidence: 50, priority: 3 };
    
    for (const [category, data] of Object.entries(categories)) {
        const matches = data.keywords.filter(keyword => textLower.includes(keyword)).length;
        if (matches > 0) {
            const confidence = Math.min(95, 60 + matches * 15);
            if (confidence > bestMatch.confidence) {
                bestMatch = {
                    category: category.charAt(0).toUpperCase() + category.slice(1),
                    confidence,
                    priority: data.priority
                };
            }
        }
    }
    
    // Détection d'urgence
    const urgentKeywords = ['urgent', 'critique', 'danger', 'inondation', 'gaz', 'électrocution'];
    const isUrgent = urgentKeywords.some(keyword => textLower.includes(keyword));
    
    if (isUrgent) {
        bestMatch.priority = Math.min(5, bestMatch.priority + 1);
        bestMatch.confidence = Math.min(98, bestMatch.confidence + 10);
    }
    
    return {
        category: bestMatch.category,
        confidence: bestMatch.confidence,
        priority: bestMatch.priority,
        estimated_hours: 2 + Math.random() * 4,
        recommendations: [
            `Catégorie détectée: ${bestMatch.category}`,
            `Priorité suggérée: ${bestMatch.priority}/5`,
            isUrgent ? 'Intervention urgente recommandée' : 'Intervention dans les délais normaux'
        ],
        keywords_detected: Object.values(categories).flat().filter(k => textLower.includes(k)),
        urgency_detected: isUrgent
    };
}

function getWeatherCondition(code) {
    const conditions = {
        0: 'ensoleillé',
        1: 'principalement ensoleillé',
        2: 'partiellement nuageux',
        3: 'couvert',
        45: 'brouillard',
        48: 'brouillard givrant',
        51: 'bruine légère',
        53: 'bruine modérée',
        55: 'bruine dense',
        61: 'pluie légère',
        63: 'pluie modérée',
        65: 'pluie forte',
        71: 'neige légère',
        73: 'neige modérée',
        75: 'neige forte',
        95: 'orage'
    };
    
    return conditions[code] || 'conditions variables';
}

// Import de la fonction query pour les requêtes directes
const { query } = require('./database/database');

// Démarrage du serveur
startServer();

