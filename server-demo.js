const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Données de démonstration
let tickets = [
  {
    id: 1,
    title: "Fuite d'eau dans la salle de bain",
    description: "Il y a une fuite d'eau sous le lavabo de la salle de bain principale",
    category: "Plomberie",
    priority: 4,
    status: "En cours",
    createdAt: new Date().toISOString(),
    estimatedTime: "2-3 heures",
    confidence: 92
  },
  {
    id: 2,
    title: "Problème de chauffage",
    description: "Le radiateur du salon ne chauffe plus depuis hier",
    category: "Chauffage",
    priority: 5,
    status: "Nouveau",
    createdAt: new Date().toISOString(),
    estimatedTime: "1-2 heures",
    confidence: 88
  }
];

let nextId = 3;

// Simulation IA de classification
function classifyTicket(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  
  // Règles de classification simples
  if (text.includes('fuite') || text.includes('robinet') || text.includes('eau')) {
    return {
      category: 'Plomberie',
      priority: 4,
      estimatedTime: '2-3 heures',
      confidence: 92,
      recommendations: ['Couper l\'arrivée d\'eau', 'Contacter plombier d\'urgence']
    };
  }
  
  if (text.includes('chauffage') || text.includes('radiateur') || text.includes('chaudière')) {
    return {
      category: 'Chauffage',
      priority: 5,
      estimatedTime: '1-2 heures',
      confidence: 88,
      recommendations: ['Vérifier thermostat', 'Contrôler pression chaudière']
    };
  }
  
  if (text.includes('électricité') || text.includes('panne') || text.includes('lumière')) {
    return {
      category: 'Électricité',
      priority: 4,
      estimatedTime: '1 heure',
      confidence: 85,
      recommendations: ['Vérifier disjoncteur', 'Contrôler fusibles']
    };
  }
  
  if (text.includes('porte') || text.includes('fenêtre') || text.includes('serrure')) {
    return {
      category: 'Menuiserie',
      priority: 2,
      estimatedTime: '30 minutes',
      confidence: 78,
      recommendations: ['Lubrifier mécanisme', 'Ajuster gonds']
    };
  }
  
  // Catégorie par défaut
  return {
    category: 'Maintenance générale',
    priority: 3,
    estimatedTime: '1 heure',
    confidence: 65,
    recommendations: ['Évaluation sur site nécessaire']
  };
}

// Routes API
app.get('/api/tickets', (req, res) => {
  res.json({
    success: true,
    data: tickets,
    total: tickets.length
  });
});

app.post('/api/tickets', (req, res) => {
  const { title, description } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({
      success: false,
      error: 'Titre et description requis'
    });
  }
  
  // Classification IA
  const aiResult = classifyTicket(title, description);
  
  const newTicket = {
    id: nextId++,
    title,
    description,
    category: aiResult.category,
    priority: aiResult.priority,
    status: 'Nouveau',
    createdAt: new Date().toISOString(),
    estimatedTime: aiResult.estimatedTime,
    confidence: aiResult.confidence,
    recommendations: aiResult.recommendations
  };
  
  tickets.push(newTicket);
  
  res.json({
    success: true,
    data: newTicket,
    message: `Ticket créé et classifié automatiquement en "${aiResult.category}" avec ${aiResult.confidence}% de confiance`
  });
});

app.post('/api/ai/classify', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({
      success: false,
      error: 'Texte requis pour classification'
    });
  }
  
  const result = classifyTicket('', text);
  
  res.json({
    success: true,
    data: result
  });
});

app.get('/api/stats', (req, res) => {
  const stats = {
    totalTickets: tickets.length,
    newTickets: tickets.filter(t => t.status === 'Nouveau').length,
    inProgressTickets: tickets.filter(t => t.status === 'En cours').length,
    completedTickets: tickets.filter(t => t.status === 'Terminé').length,
    averageConfidence: Math.round(tickets.reduce((sum, t) => sum + t.confidence, 0) / tickets.length) || 0
  };
  
  res.json({
    success: true,
    data: stats
  });
});

// Servir l'interface HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📱 Interface: http://localhost:${PORT}`);
  console.log(`🤖 API: http://localhost:${PORT}/api`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
});


// Route pour le chatbot intelligent
app.post('/api/chatbot', (req, res) => {
    const { message, context = [], userId = 'user1' } = req.body;
    
    try {
        // Simulation d'un chatbot IA intelligent
        const response = processIntelligentChat(message, context);
        
        res.json({
            success: true,
            response: response.message,
            intent: response.intent,
            confidence: response.confidence,
            actions: response.actions,
            escalate: response.escalate,
            context: response.context
        });
    } catch (error) {
        console.error('Erreur chatbot:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur du chatbot',
            response: "Désolé, je rencontre un problème technique. Un agent va vous aider."
        });
    }
});

function processIntelligentChat(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Base de connaissances et intentions
    const intents = {
        greeting: {
            keywords: ['bonjour', 'salut', 'hello', 'bonsoir'],
            responses: [
                "Bonjour ! Je suis votre assistant intelligent. Comment puis-je vous aider aujourd'hui ?",
                "Salut ! Je suis là pour vous aider avec vos demandes de maintenance. Que puis-je faire pour vous ?",
                "Bonjour ! En quoi puis-je vous assister pour votre logement ?"
            ]
        },
        plumbing_issue: {
            keywords: ['fuite', 'robinet', 'eau', 'plomberie', 'douche', 'évier', 'wc', 'toilettes'],
            responses: [
                "Je comprends que vous avez un problème de plomberie. Pouvez-vous me dire où se situe exactement le problème ?",
                "Pour un problème de plomberie, je vais vous guider. Dans quelle pièce se trouve le problème ?"
            ],
            followUp: true
        },
        electrical_issue: {
            keywords: ['électricité', 'ampoule', 'prise', 'disjoncteur', 'lumière', 'éclairage'],
            responses: [
                "Je vois que vous avez un problème électrique. Par sécurité, avez-vous vérifié le disjoncteur ?",
                "Pour l'électricité, commençons par vérifier les éléments de base. Le problème concerne-t-il l'éclairage ou les prises ?"
            ],
            followUp: true
        },
        heating_issue: {
            keywords: ['chauffage', 'radiateur', 'froid', 'chaud', 'température', 'thermostat'],
            responses: [
                "Je comprends votre problème de chauffage. Avez-vous vérifié que le thermostat est bien réglé ?",
                "Pour le chauffage, vérifions ensemble. Tous les radiateurs sont-ils concernés ou seulement certains ?"
            ],
            followUp: true
        },
        urgent_issue: {
            keywords: ['urgent', 'urgence', 'grave', 'danger', 'inondation', 'gaz'],
            responses: [
                "Je comprends que c'est urgent. Je vais immédiatement alerter notre équipe d'intervention. En attendant, assurez-vous de votre sécurité.",
                "Situation d'urgence détectée. J'alerte immédiatement un technicien. Restez en sécurité."
            ],
            escalate: true,
            priority: 'critical'
        },
        status_inquiry: {
            keywords: ['statut', 'avancement', 'où en est', 'technicien', 'quand', 'délai'],
            responses: [
                "Je vais vérifier le statut de vos demandes en cours. Un instant...",
                "Laissez-moi consulter l'avancement de vos tickets..."
            ],
            action: 'check_status'
        },
        satisfaction: {
            keywords: ['merci', 'parfait', 'excellent', 'satisfait', 'content'],
            responses: [
                "Je suis ravi d'avoir pu vous aider ! N'hésitez pas si vous avez d'autres questions.",
                "Parfait ! Je reste disponible pour toute autre demande."
            ]
        },
        complaint: {
            keywords: ['mécontent', 'problème', 'pas content', 'insatisfait', 'réclamation'],
            responses: [
                "Je comprends votre mécontentement. Laissez-moi vous mettre en relation avec un responsable.",
                "Je prends note de votre insatisfaction. Un responsable va vous contacter rapidement."
            ],
            escalate: true
        }
    };
    
    // Détection d'intention
    let detectedIntent = 'unknown';
    let confidence = 0;
    
    for (const [intent, data] of Object.entries(intents)) {
        const matches = data.keywords.filter(keyword => lowerMessage.includes(keyword));
        const currentConfidence = matches.length / data.keywords.length;
        
        if (currentConfidence > confidence) {
            confidence = currentConfidence;
            detectedIntent = intent;
        }
    }
    
    // Génération de réponse
    let response = {
        intent: detectedIntent,
        confidence: Math.round(confidence * 100),
        escalate: false,
        actions: [],
        context: [...context, { user: message, timestamp: new Date().toISOString() }]
    };
    
    if (confidence > 0.3 && intents[detectedIntent]) {
        const intentData = intents[detectedIntent];
        response.message = intentData.responses[Math.floor(Math.random() * intentData.responses.length)];
        response.escalate = intentData.escalate || false;
        
        // Actions spécifiques selon l'intention
        if (intentData.action === 'check_status') {
            response.actions.push({
                type: 'show_tickets',
                data: getSimulatedTickets()
            });
        }
        
        if (detectedIntent === 'plumbing_issue') {
            response.actions.push({
                type: 'troubleshooting',
                steps: [
                    "1. Localisez la source de la fuite",
                    "2. Fermez l'arrivée d'eau si nécessaire",
                    "3. Placez un récipient sous la fuite",
                    "4. Si le problème persiste, je peux créer une demande d'intervention"
                ]
            });
        }
        
        if (detectedIntent === 'electrical_issue') {
            response.actions.push({
                type: 'troubleshooting',
                steps: [
                    "1. Vérifiez le disjoncteur principal",
                    "2. Testez d'autres prises/éclairages",
                    "3. Si le problème persiste, n'intervenez pas vous-même",
                    "4. Je peux faire intervenir un électricien"
                ]
            });
        }
        
    } else {
        // Réponse par défaut avec suggestions
        response.message = "Je ne suis pas sûr de comprendre votre demande. Pouvez-vous me donner plus de détails ? Je peux vous aider avec :";
        response.actions.push({
            type: 'suggestions',
            options: [
                "Problème de plomberie",
                "Problème électrique", 
                "Problème de chauffage",
                "Vérifier mes demandes",
                "Parler à un humain"
            ]
        });
    }
    
    return response;
}

function getSimulatedTickets() {
    return [
        {
            id: 1247,
            title: "Fuite robinet cuisine",
            status: "En cours",
            technician: "Jean Dupont",
            eta: "16h00"
        },
        {
            id: 1248,
            title: "Problème chauffage salon",
            status: "Assigné",
            priority: "Élevée"
        }
    ];
}


// Route pour les notifications
app.post('/api/notifications/send', (req, res) => {
    const { type, recipient, message, priority = 'normal', ticketId } = req.body;
    
    try {
        const notification = sendNotification(type, recipient, message, priority, ticketId);
        
        res.json({
            success: true,
            notification: notification,
            message: `Notification ${type} envoyée avec succès`
        });
    } catch (error) {
        console.error('Erreur notification:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'envoi de la notification'
        });
    }
});

// Route pour les webhooks entrants
app.post('/api/webhooks/garaio', (req, res) => {
    const { event, data, timestamp } = req.body;
    
    try {
        const result = processGaraioWebhook(event, data, timestamp);
        
        res.json({
            success: true,
            processed: result,
            message: 'Webhook Garaio traité avec succès'
        });
    } catch (error) {
        console.error('Erreur webhook Garaio:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du traitement du webhook'
        });
    }
});

// Route pour l'intégration Garaio REM
app.post('/api/integrations/garaio/sync', (req, res) => {
    const { action, data } = req.body;
    
    try {
        const result = syncWithGaraio(action, data);
        
        res.json({
            success: true,
            result: result,
            message: 'Synchronisation Garaio réussie'
        });
    } catch (error) {
        console.error('Erreur sync Garaio:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la synchronisation'
        });
    }
});

// Route pour le monitoring système
app.get('/api/monitoring/health', (req, res) => {
    const health = getSystemHealth();
    
    res.json({
        success: true,
        health: health,
        timestamp: new Date().toISOString()
    });
});

// Route pour les rapports automatisés
app.get('/api/reports/generate/:type', (req, res) => {
    const { type } = req.params;
    const { period = '7d' } = req.query;
    
    try {
        const report = generateReport(type, period);
        
        res.json({
            success: true,
            report: report,
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur génération rapport:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la génération du rapport'
        });
    }
});

// Fonctions de notifications
function sendNotification(type, recipient, message, priority, ticketId) {
    const notification = {
        id: Math.floor(Math.random() * 10000),
        type: type, // email, sms, push, webhook
        recipient: recipient,
        message: message,
        priority: priority,
        ticketId: ticketId,
        status: 'sent',
        sentAt: new Date().toISOString(),
        deliveredAt: null
    };
    
    // Simulation d'envoi selon le type
    switch (type) {
        case 'email':
            notification.details = simulateEmailSend(recipient, message, priority);
            break;
        case 'sms':
            notification.details = simulateSMSSend(recipient, message, priority);
            break;
        case 'push':
            notification.details = simulatePushSend(recipient, message, priority);
            break;
        case 'webhook':
            notification.details = simulateWebhookSend(recipient, message, priority);
            break;
    }
    
    // Simulation de délai de livraison
    setTimeout(() => {
        notification.status = 'delivered';
        notification.deliveredAt = new Date().toISOString();
    }, Math.random() * 3000 + 1000);
    
    return notification;
}

function simulateEmailSend(recipient, message, priority) {
    return {
        provider: 'SendGrid',
        messageId: 'msg_' + Math.random().toString(36).substr(2, 9),
        subject: priority === 'urgent' ? '🚨 URGENT - Nouvelle demande' : '📧 Nouvelle notification',
        template: priority === 'urgent' ? 'urgent_template' : 'standard_template',
        estimatedDelivery: '2-5 minutes'
    };
}

function simulateSMSSend(recipient, message, priority) {
    return {
        provider: 'Twilio',
        messageId: 'sms_' + Math.random().toString(36).substr(2, 9),
        segments: Math.ceil(message.length / 160),
        cost: '0.05 EUR',
        estimatedDelivery: '30 seconds'
    };
}

function simulatePushSend(recipient, message, priority) {
    return {
        provider: 'Firebase',
        messageId: 'push_' + Math.random().toString(36).substr(2, 9),
        platform: 'web',
        badge: priority === 'urgent' ? 'red' : 'blue',
        estimatedDelivery: 'immediate'
    };
}

function simulateWebhookSend(recipient, message, priority) {
    return {
        url: recipient,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: { message, priority, timestamp: new Date().toISOString() },
        estimatedDelivery: '1-2 seconds'
    };
}

// Fonctions d'intégration Garaio
function processGaraioWebhook(event, data, timestamp) {
    const processed = {
        event: event,
        processedAt: new Date().toISOString(),
        originalTimestamp: timestamp,
        actions: []
    };
    
    switch (event) {
        case 'tenant.updated':
            processed.actions.push('Mise à jour profil locataire');
            processed.actions.push('Synchronisation données contact');
            break;
        case 'property.maintenance':
            processed.actions.push('Création ticket automatique');
            processed.actions.push('Assignation technicien');
            break;
        case 'contract.signed':
            processed.actions.push('Activation accès portail');
            processed.actions.push('Envoi email bienvenue');
            break;
        case 'payment.received':
            processed.actions.push('Mise à jour statut paiement');
            processed.actions.push('Notification confirmation');
            break;
    }
    
    return processed;
}

function syncWithGaraio(action, data) {
    const sync = {
        action: action,
        syncId: 'sync_' + Math.random().toString(36).substr(2, 9),
        startedAt: new Date().toISOString(),
        status: 'in_progress'
    };
    
    switch (action) {
        case 'export_tickets':
            sync.details = {
                endpoint: 'https://api.garaio-rem.ch/v1/tickets',
                method: 'POST',
                recordsToSync: tickets.length,
                mapping: {
                    'id': 'external_id',
                    'title': 'subject',
                    'category': 'maintenance_type',
                    'priority': 'urgency_level'
                }
            };
            break;
        case 'import_tenants':
            sync.details = {
                endpoint: 'https://api.garaio-rem.ch/v1/tenants',
                method: 'GET',
                expectedRecords: 150,
                mapping: {
                    'tenant_id': 'id',
                    'name': 'full_name',
                    'email': 'contact_email',
                    'property_id': 'apartment_id'
                }
            };
            break;
        case 'sync_properties':
            sync.details = {
                endpoint: 'https://api.garaio-rem.ch/v1/properties',
                method: 'GET',
                expectedRecords: 45,
                mapping: {
                    'property_id': 'id',
                    'address': 'full_address',
                    'type': 'property_type',
                    'manager': 'property_manager'
                }
            };
            break;
    }
    
    // Simulation de progression
    setTimeout(() => {
        sync.status = 'completed';
        sync.completedAt = new Date().toISOString();
        sync.summary = {
            processed: sync.details.recordsToSync || sync.details.expectedRecords,
            success: Math.floor((sync.details.recordsToSync || sync.details.expectedRecords) * 0.95),
            errors: Math.floor((sync.details.recordsToSync || sync.details.expectedRecords) * 0.05)
        };
    }, 3000);
    
    return sync;
}

// Fonctions de monitoring
function getSystemHealth() {
    return {
        status: 'healthy',
        uptime: '2h 15m 30s',
        version: '2.1.0',
        environment: 'production',
        services: {
            database: {
                status: 'healthy',
                connections: 12,
                responseTime: '15ms'
            },
            ai_service: {
                status: 'healthy',
                requests: 1247,
                accuracy: '96.8%',
                responseTime: '250ms'
            },
            notification_service: {
                status: 'healthy',
                sent: 89,
                delivered: 87,
                failed: 2,
                deliveryRate: '97.8%'
            },
            garaio_integration: {
                status: 'healthy',
                lastSync: '10 minutes ago',
                syncSuccess: '100%',
                responseTime: '450ms'
            }
        },
        metrics: {
            cpu_usage: '23%',
            memory_usage: '45%',
            disk_usage: '12%',
            network_io: '1.2 MB/s'
        },
        alerts: [
            {
                level: 'info',
                message: 'Pic de trafic détecté (+15% vs moyenne)',
                timestamp: new Date(Date.now() - 5*60*1000).toISOString()
            }
        ]
    };
}

// Fonctions de rapports
function generateReport(type, period) {
    const report = {
        type: type,
        period: period,
        generatedAt: new Date().toISOString()
    };
    
    switch (type) {
        case 'tickets':
            report.data = {
                total: 158,
                new: 23,
                in_progress: 18,
                resolved: 117,
                categories: {
                    'Plomberie': 45,
                    'Électricité': 32,
                    'Chauffage': 28,
                    'Menuiserie': 21,
                    'Autres': 32
                },
                avgResolutionTime: '2.7 hours',
                satisfactionScore: 4.8
            };
            break;
        case 'performance':
            report.data = {
                aiAccuracy: '96.8%',
                autoResolutionRate: '34%',
                avgResponseTime: '250ms',
                systemUptime: '99.9%',
                notificationDelivery: '97.8%'
            };
            break;
        case 'integration':
            report.data = {
                garaioSyncs: 24,
                successRate: '100%',
                dataTransferred: '2.3 MB',
                avgSyncTime: '450ms',
                lastError: null
            };
            break;
    }
    
    return report;
}

