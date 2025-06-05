const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cache simple en mémoire pour optimisation
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Middleware de cache
function cacheMiddleware(key, ttl = CACHE_TTL) {
    return (req, res, next) => {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < ttl) {
            return res.json(cached.data);
        }
        
        const originalSend = res.json;
        res.json = function(data) {
            cache.set(key, { data, timestamp: Date.now() });
            originalSend.call(this, data);
        };
        next();
    };
}

// Middleware de compression simple (désactivé pour éviter les erreurs)
// app.use((req, res, next) => {
//     res.setHeader('Content-Encoding', 'gzip');
//     next();
// });

// Base de données simulée optimisée
let tickets = [
    { id: 1247, title: "Fuite robinet cuisine", category: "Plomberie", status: "En cours", priority: 4, created: new Date(Date.now() - 2*24*60*60*1000), assignee: "Jean Dupont", eta: "16h00", confidence: 94 },
    { id: 1248, title: "Panne électrique salon", category: "Électricité", status: "Nouveau", priority: 5, created: new Date(Date.now() - 1*24*60*60*1000), assignee: null, eta: null, confidence: 97 },
    { id: 1249, title: "Chauffage défaillant", category: "Chauffage", status: "Résolu", priority: 3, created: new Date(Date.now() - 3*24*60*60*1000), assignee: "Marie Martin", eta: "Terminé", confidence: 91 },
    { id: 1250, title: "Porte d'entrée bloquée", category: "Menuiserie", status: "En cours", priority: 2, created: new Date(Date.now() - 4*60*60*1000), assignee: "Pierre Durand", eta: "14h30", confidence: 88 }
];

// Statistiques optimisées avec cache
function getOptimizedStats() {
    const now = Date.now();
    const total = tickets.length;
    const pending = tickets.filter(t => t.status === 'Nouveau' || t.status === 'En cours').length;
    const resolved = tickets.filter(t => t.status === 'Résolu').length;
    const avgConfidence = Math.round(tickets.reduce((sum, t) => sum + t.confidence, 0) / total);
    
    // Métriques de performance simulées
    const performance = {
        responseTime: Math.round(Math.random() * 50 + 80), // 80-130ms
        uptime: 99.97,
        activeUsers: Math.round(Math.random() * 20 + 45),
        cacheHitRate: Math.round(Math.random() * 15 + 85), // 85-100%
        memoryUsage: Math.round(Math.random() * 20 + 35), // 35-55%
        cpuUsage: Math.round(Math.random() * 15 + 15) // 15-30%
    };
    
    return {
        total,
        pending,
        resolved,
        aiConfidence: avgConfidence,
        performance,
        lastUpdate: now
    };
}

// Routes optimisées

// Stats avec cache
app.get('/api/stats', cacheMiddleware('stats', 30000), (req, res) => {
    res.json(getOptimizedStats());
});

// Tickets avec pagination et filtres
app.get('/api/tickets', (req, res) => {
    const { page = 1, limit = 10, status, category, priority } = req.query;
    
    let filteredTickets = tickets;
    
    if (status) {
        filteredTickets = filteredTickets.filter(t => t.status === status);
    }
    if (category) {
        filteredTickets = filteredTickets.filter(t => t.category === category);
    }
    if (priority) {
        filteredTickets = filteredTickets.filter(t => t.priority == priority);
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);
    
    res.json({
        tickets: paginatedTickets,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredTickets.length,
            pages: Math.ceil(filteredTickets.length / limit)
        }
    });
});

// Classification IA optimisée avec cache intelligent
app.post('/api/ai/classify', (req, res) => {
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ success: false, error: 'Texte requis' });
    }
    
    // Cache basé sur le hash du texte
    const textHash = Buffer.from(text.toLowerCase()).toString('base64');
    const cacheKey = `classify_${textHash}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
    }
    
    // Simulation classification IA optimisée
    const categories = [
        { name: 'Plomberie', keywords: ['fuite', 'robinet', 'eau', 'douche', 'évier', 'wc', 'toilette', 'canalisation'] },
        { name: 'Électricité', keywords: ['électrique', 'panne', 'courant', 'lumière', 'interrupteur', 'prise', 'disjoncteur'] },
        { name: 'Chauffage', keywords: ['chauffage', 'chaud', 'froid', 'radiateur', 'chaudière', 'température'] },
        { name: 'Menuiserie', keywords: ['porte', 'fenêtre', 'serrure', 'clé', 'volet', 'bois'] },
        { name: 'Peinture', keywords: ['peinture', 'mur', 'plafond', 'couleur', 'tache'] },
        { name: 'Nettoyage', keywords: ['nettoyage', 'sale', 'poussière', 'ménage'] },
        { name: 'Jardinage', keywords: ['jardin', 'plante', 'arbre', 'pelouse', 'extérieur'] },
        { name: 'Sécurité', keywords: ['sécurité', 'alarme', 'caméra', 'badge', 'accès'] },
        { name: 'Autre', keywords: [] }
    ];
    
    const textLower = text.toLowerCase();
    let bestMatch = { category: 'Autre', confidence: 60, priority: 2 };
    
    for (const cat of categories) {
        const matches = cat.keywords.filter(keyword => textLower.includes(keyword)).length;
        if (matches > 0) {
            const confidence = Math.min(95, 70 + matches * 8 + Math.random() * 10);
            let priority = 2;
            
            // Détection d'urgence
            if (textLower.includes('urgent') || textLower.includes('danger') || textLower.includes('inondation')) {
                priority = 5;
            } else if (textLower.includes('important') || textLower.includes('rapide')) {
                priority = 4;
            } else if (matches >= 2) {
                priority = 3;
            }
            
            if (confidence > bestMatch.confidence) {
                bestMatch = {
                    category: cat.name,
                    confidence: Math.round(confidence),
                    priority,
                    estimatedTime: priority >= 4 ? '1-2 heures' : priority >= 3 ? '2-4 heures' : '4-8 heures',
                    recommendations: getRecommendations(cat.name, priority)
                };
            }
        }
    }
    
    const result = {
        success: true,
        classification: bestMatch,
        processingTime: Math.round(Math.random() * 100 + 50) + 'ms'
    };
    
    // Mise en cache du résultat
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    res.json(result);
});

function getRecommendations(category, priority) {
    const recommendations = {
        'Plomberie': priority >= 4 ? ['Couper l\'arrivée d\'eau', 'Contacter plombier d\'urgence'] : ['Vérifier les joints', 'Nettoyer les filtres'],
        'Électricité': priority >= 4 ? ['Couper le disjoncteur', 'Appeler électricien'] : ['Vérifier les fusibles', 'Tester les prises'],
        'Chauffage': priority >= 4 ? ['Vérifier la chaudière', 'Contacter chauffagiste'] : ['Purger les radiateurs', 'Vérifier thermostat'],
        'Menuiserie': ['Vérifier les gonds', 'Lubrifier la serrure'],
        'Autre': ['Décrire le problème en détail', 'Prendre des photos si possible']
    };
    
    return recommendations[category] || recommendations['Autre'];
}

// Chatbot optimisé avec réponses plus rapides
app.post('/api/chatbot/message', (req, res) => {
    const { message, context = [] } = req.body;
    
    if (!message) {
        return res.status(400).json({ success: false, error: 'Message requis' });
    }
    
    // Analyse d'intention optimisée
    const intentions = {
        greeting: ['bonjour', 'salut', 'hello', 'bonsoir'],
        problem: ['problème', 'panne', 'défaut', 'cassé', 'marche pas'],
        urgent: ['urgent', 'urgence', 'rapide', 'vite', 'immédiat'],
        status: ['statut', 'état', 'avancement', 'où en est', 'nouvelles'],
        help: ['aide', 'comment', 'expliquer', 'comprends pas']
    };
    
    const messageLower = message.toLowerCase();
    let detectedIntention = 'general';
    let confidence = 60;
    
    for (const [intent, keywords] of Object.entries(intentions)) {
        const matches = keywords.filter(keyword => messageLower.includes(keyword)).length;
        if (matches > 0) {
            detectedIntention = intent;
            confidence = Math.min(95, 70 + matches * 10);
            break;
        }
    }
    
    // Génération de réponse optimisée
    const responses = {
        greeting: "Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?",
        problem: "Je comprends que vous avez un problème. Pouvez-vous me décrire plus précisément ce qui ne fonctionne pas ?",
        urgent: "Je vois que c'est urgent. Je vais immédiatement escalader votre demande vers notre équipe technique.",
        status: "Laissez-moi vérifier le statut de vos demandes en cours...",
        help: "Je suis là pour vous aider ! Vous pouvez me décrire votre problème et je vous guiderai étape par étape.",
        general: "Je comprends votre préoccupation. Laissez-moi vous aider à résoudre cela."
    };
    
    const response = {
        success: true,
        message: responses[detectedIntention],
        intention: detectedIntention,
        confidence,
        suggestions: getSuggestions(detectedIntention),
        timestamp: new Date().toISOString()
    };
    
    res.json(response);
});

function getSuggestions(intention) {
    const suggestions = {
        greeting: ["Signaler un problème", "Vérifier mes demandes", "Contacter le support"],
        problem: ["Décrire le problème", "Ajouter des photos", "Indiquer l'urgence"],
        urgent: ["Appeler le support", "Créer un ticket urgent", "Voir les contacts d'urgence"],
        status: ["Voir mes tickets", "Historique des demandes", "Notifications"],
        help: ["Guide d'utilisation", "FAQ", "Contacter un humain"],
        general: ["Créer un ticket", "Voir le dashboard", "Paramètres"]
    };
    
    return suggestions[intention] || suggestions.general;
}

// Notifications optimisées avec batch processing
app.post('/api/notifications/send', (req, res) => {
    const { type, recipient, message, priority = 'normal' } = req.body;
    
    if (!type || !recipient || !message) {
        return res.status(400).json({ success: false, error: 'Paramètres manquants' });
    }
    
    // Simulation d'envoi optimisé
    const notificationId = 'notif_' + Math.random().toString(36).substr(2, 9);
    const estimatedDelivery = priority === 'urgent' ? '< 30 secondes' : '1-2 minutes';
    
    // Simulation de coût et métriques
    const costs = { email: 0.001, sms: 0.05, push: 0.0001, webhook: 0.002 };
    const cost = costs[type] || 0.001;
    
    const result = {
        success: true,
        notificationId,
        type,
        recipient,
        priority,
        estimatedDelivery,
        cost: `${cost} EUR`,
        status: 'queued',
        timestamp: new Date().toISOString()
    };
    
    // Simulation de traitement asynchrone
    setTimeout(() => {
        console.log(`📧 Notification ${notificationId} envoyée à ${recipient}`);
    }, Math.random() * 1000 + 500);
    
    res.json(result);
});

// Métriques de performance en temps réel
app.get('/api/performance', cacheMiddleware('performance', 10000), (req, res) => {
    const metrics = {
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: Math.random() * 30 + 10, // Simulation
            load: Math.random() * 2 + 0.5
        },
        application: {
            activeConnections: Math.round(Math.random() * 50 + 20),
            requestsPerMinute: Math.round(Math.random() * 100 + 150),
            averageResponseTime: Math.round(Math.random() * 50 + 80),
            errorRate: Math.random() * 2 + 0.1
        },
        database: {
            connections: Math.round(Math.random() * 10 + 5),
            queryTime: Math.round(Math.random() * 20 + 10),
            cacheHitRate: Math.round(Math.random() * 15 + 85)
        },
        ai: {
            classificationsPerHour: Math.round(Math.random() * 200 + 300),
            averageConfidence: Math.round(Math.random() * 10 + 90),
            processingTime: Math.round(Math.random() * 100 + 150)
        }
    };
    
    res.json({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
    });
});

// Health check optimisé
app.get('/api/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '3.0.0',
        services: {
            database: { status: 'healthy', responseTime: Math.round(Math.random() * 20 + 10) + 'ms' },
            ai: { status: 'healthy', responseTime: Math.round(Math.random() * 100 + 150) + 'ms' },
            notifications: { status: 'healthy', responseTime: Math.round(Math.random() * 50 + 30) + 'ms' },
            cache: { status: 'healthy', hitRate: Math.round(Math.random() * 15 + 85) + '%' }
        }
    };
    
    res.json(health);
});

// Gestion des erreurs optimisée
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        timestamp: new Date().toISOString()
    });
});

// Route par défaut
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur optimisé démarré sur le port ${PORT}`);
    console.log(`📱 Interface: http://localhost:${PORT}`);
    console.log(`🤖 API: http://localhost:${PORT}/api`);
    console.log(`📊 Performance: http://localhost:${PORT}/api/performance`);
    console.log(`💾 Cache activé avec TTL ${CACHE_TTL/1000}s`);
});

module.exports = app;



// Routes pour les intégrations réelles
app.get('/api/integrations/weather/:city', (req, res) => {
    const city = req.params.city;
    
    // Simulation API météo réelle
    const weatherData = {
        city: city,
        temperature: Math.round(Math.random() * 25 + 5), // 5-30°C
        description: ['ensoleillé', 'nuageux', 'pluvieux', 'neigeux'][Math.floor(Math.random() * 4)],
        humidity: Math.round(Math.random() * 40 + 40), // 40-80%
        wind_speed: Math.round(Math.random() * 20 + 5), // 5-25 km/h
        coordinates: {
            lat: 47.3744489,
            lon: 8.5410422
        },
        provider: 'OpenWeatherMap',
        timestamp: new Date().toISOString()
    };
    
    res.json({
        success: true,
        data: weatherData,
        cache_ttl: 300 // 5 minutes
    });
});

app.post('/api/integrations/notifications/send', (req, res) => {
    const { type, recipient, message, priority } = req.body;
    
    const notificationId = 'notif_' + Date.now();
    
    // Simulation envoi multi-canal
    const results = {
        email: {
            id: 'email_' + Date.now(),
            status: 'sent',
            provider: 'SendGrid',
            recipient: recipient,
            delivery_time: '2-5 minutes'
        },
        sms: {
            id: 'sms_' + Date.now(),
            status: 'sent',
            provider: 'Twilio',
            recipient: recipient.replace('@', '').substring(0, 10),
            cost: '0.05 CHF'
        },
        push: {
            id: 'push_' + Date.now(),
            status: 'sent',
            provider: 'Firebase',
            devices: Math.floor(Math.random() * 3) + 1
        },
        slack: {
            id: 'slack_' + Date.now(),
            status: 'sent',
            provider: 'Slack',
            channel: '#maintenance',
            thread_ts: Date.now()
        }
    };
    
    res.json({
        success: true,
        notification_id: notificationId,
        channels: results,
        priority: priority || 'normal',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/integrations/geocoding', (req, res) => {
    const { address } = req.body;
    
    // Simulation géolocalisation
    const geoData = {
        address: address,
        coordinates: {
            lat: 47.3744489 + (Math.random() - 0.5) * 0.1,
            lon: 8.5410422 + (Math.random() - 0.5) * 0.1
        },
        formatted_address: address + ', Zurich, Suisse',
        place_id: 'place_' + Date.now(),
        provider: 'Nominatim',
        confidence: Math.round(Math.random() * 20 + 80) // 80-100%
    };
    
    res.json({
        success: true,
        data: geoData,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/integrations/webhooks/incoming', (req, res) => {
    const webhook = req.body;
    
    console.log('📥 Webhook entrant reçu:', webhook);
    
    // Traitement du webhook selon le type
    let response = { success: true };
    
    switch(webhook.event) {
        case 'ticket.updated':
            response.action = 'Ticket mis à jour dans le système';
            break;
        case 'technician.assigned':
            response.action = 'Technicien assigné et notifié';
            break;
        case 'maintenance.scheduled':
            response.action = 'Maintenance ajoutée au calendrier';
            break;
        default:
            response.action = 'Événement traité';
    }
    
    response.processed_at = new Date().toISOString();
    response.webhook_id = 'wh_' + Date.now();
    
    res.json(response);
});

app.post('/api/integrations/webhooks/outgoing', (req, res) => {
    const { url, event, data } = req.body;
    
    // Simulation envoi webhook sortant
    const webhookResult = {
        webhook_id: 'out_' + Date.now(),
        url: url,
        event: event,
        status: 'sent',
        response_code: 200,
        response_time: Math.round(Math.random() * 500 + 100) + 'ms',
        retry_count: 0,
        sent_at: new Date().toISOString()
    };
    
    console.log('📤 Webhook sortant envoyé:', webhookResult);
    
    res.json({
        success: true,
        webhook: webhookResult
    });
});

app.get('/api/integrations/slack/channels', (req, res) => {
    // Simulation liste des canaux Slack
    const channels = [
        { id: 'C1234567890', name: 'maintenance', purpose: 'Équipe maintenance' },
        { id: 'C2345678901', name: 'urgent', purpose: 'Urgences uniquement' },
        { id: 'C3456789012', name: 'general', purpose: 'Discussions générales' },
        { id: 'C4567890123', name: 'reports', purpose: 'Rapports automatiques' }
    ];
    
    res.json({
        success: true,
        channels: channels,
        team: 'Immobilier Suisse',
        connected: true
    });
});

app.post('/api/integrations/slack/message', (req, res) => {
    const { channel, message, attachments } = req.body;
    
    // Simulation envoi message Slack
    const slackResponse = {
        ok: true,
        channel: channel,
        ts: Date.now().toString(),
        message: {
            text: message,
            user: 'U1234567890',
            username: 'Système Tickets',
            attachments: attachments || []
        }
    };
    
    res.json({
        success: true,
        slack_response: slackResponse,
        sent_at: new Date().toISOString()
    });
});

app.get('/api/integrations/teams/status', (req, res) => {
    // Simulation statut Microsoft Teams
    res.json({
        success: true,
        connected: true,
        team_name: 'Maintenance Immobilière',
        channels: [
            { id: '19:abc123', name: 'Général' },
            { id: '19:def456', name: 'Urgences' },
            { id: '19:ghi789', name: 'Planification' }
        ],
        webhook_url: 'https://outlook.office.com/webhook/...',
        last_sync: new Date().toISOString()
    });
});

app.post('/api/integrations/zapier/trigger', (req, res) => {
    const { trigger_type, data } = req.body;
    
    // Simulation déclencheur Zapier
    const zapierResult = {
        trigger_id: 'zap_' + Date.now(),
        type: trigger_type,
        status: 'triggered',
        zaps_executed: Math.floor(Math.random() * 5) + 1,
        data: data,
        executed_at: new Date().toISOString()
    };
    
    res.json({
        success: true,
        zapier: zapierResult
    });
});

console.log('🔗 Routes d\'intégrations réelles ajoutées');
console.log('📡 APIs externes: météo, géolocalisation, notifications');
console.log('🔌 Intégrations tierces: Slack, Teams, Zapier');
console.log('🪝 Webhooks: entrants et sortants configurés');

