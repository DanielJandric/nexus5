// 🚀 Ticket System v3.0 Static - JavaScript Engine
// Système de gestion de tickets immobiliers avec IA locale

class TicketSystem {
    constructor() {
        this.tickets = this.loadTickets();
        this.currentUser = this.loadCurrentUser();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleData();
        this.updateDashboard();
        this.renderTickets();
        this.updateUserInterface();
    }

    // 💾 Gestion des données locales
    loadTickets() {
        const stored = localStorage.getItem('tickets');
        return stored ? JSON.parse(stored) : [];
    }

    saveTickets() {
        localStorage.setItem('tickets', JSON.stringify(this.tickets));
        this.updateDashboard();
    }

    loadCurrentUser() {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : {
            id: 'admin',
            name: 'Administrateur',
            role: 'admin',
            permissions: ['all']
        };
    }

    saveCurrentUser() {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }

    // 📊 Données de démonstration
    loadSampleData() {
        if (this.tickets.length === 0) {
            this.tickets = [
                {
                    id: 1,
                    title: "Fuite robinet cuisine",
                    description: "Le robinet de la cuisine fuit depuis ce matin",
                    category: "Plomberie",
                    priority: 4,
                    status: "en_cours",
                    created_at: "2025-06-05",
                    tenant: "Marie Dupont",
                    apartment: "2A"
                },
                {
                    id: 2,
                    title: "Panne électrique salon",
                    description: "Plus d'électricité dans le salon depuis hier soir",
                    category: "Électricité",
                    priority: 5,
                    status: "assigne",
                    created_at: "2025-06-04",
                    tenant: "Jean Martin",
                    apartment: "1B"
                },
                {
                    id: 3,
                    title: "Chauffage défaillant",
                    description: "Les radiateurs ne chauffent plus dans la chambre",
                    category: "Chauffage",
                    priority: 4,
                    status: "nouveau",
                    created_at: "2025-06-05",
                    tenant: "Sophie Dubois",
                    apartment: "3C"
                },
                {
                    id: 4,
                    title: "Serrure bloquée",
                    description: "Impossible d'ouvrir la porte d'entrée avec la clé",
                    category: "Serrurerie",
                    priority: 3,
                    status: "resolu",
                    created_at: "2025-06-03",
                    tenant: "Paul Moreau",
                    apartment: "1A"
                },
                {
                    id: 5,
                    title: "Ascenseur en panne",
                    description: "L'ascenseur est bloqué entre le 2ème et 3ème étage",
                    category: "Autre",
                    priority: 5,
                    status: "en_cours",
                    created_at: "2025-06-05",
                    tenant: "Système",
                    apartment: "Commun"
                }
            ];
            this.saveTickets();
        }
    }

    // 🤖 Intelligence Artificielle locale
    classifyTicket(text) {
        const lowerText = text.toLowerCase();
        
        // Catégories et mots-clés
        const categories = {
            'Plomberie': ['fuite', 'eau', 'robinet', 'douche', 'wc', 'toilette', 'évier', 'lavabo', 'tuyau', 'canalisation'],
            'Électricité': ['électrique', 'courant', 'panne', 'disjoncteur', 'prise', 'interrupteur', 'lumière', 'éclairage', 'court-circuit'],
            'Chauffage': ['chauffage', 'radiateur', 'froid', 'chaudière', 'température', 'thermostat', 'climatisation'],
            'Serrurerie': ['serrure', 'clé', 'porte', 'verrou', 'fermeture', 'ouverture', 'bloqué'],
            'Ascenseur': ['ascenseur', 'monte-charge', 'coincé', 'bloqué', 'étage'],
            'Nettoyage': ['nettoyage', 'ménage', 'saleté', 'poubelle', 'ordure'],
            'Sécurité': ['sécurité', 'alarme', 'intrusion', 'vol', 'vandalisme'],
            'Autre': []
        };

        let bestCategory = 'Autre';
        let maxScore = 0;
        let confidence = 60;

        // Analyse des mots-clés
        for (const [category, keywords] of Object.entries(categories)) {
            if (category === 'Autre') continue;
            
            let score = 0;
            for (const keyword of keywords) {
                if (lowerText.includes(keyword)) {
                    score += keyword.length; // Mots plus longs = plus de poids
                }
            }
            
            if (score > maxScore) {
                maxScore = score;
                bestCategory = category;
                confidence = Math.min(95, 70 + score * 3);
            }
        }

        // Détection de priorité
        let priority = 3;
        const urgencyKeywords = ['urgent', 'urgence', 'immédiat', 'critique', 'danger', 'fuite', 'panne', 'bloqué', 'coincé'];
        const lowPriorityKeywords = ['petit', 'mineur', 'léger', 'quand possible'];

        for (const keyword of urgencyKeywords) {
            if (lowerText.includes(keyword)) {
                priority = Math.min(5, priority + 1);
                confidence += 5;
            }
        }

        for (const keyword of lowPriorityKeywords) {
            if (lowerText.includes(keyword)) {
                priority = Math.max(1, priority - 1);
            }
        }

        // Temps estimé basé sur la priorité et catégorie
        const timeEstimates = {
            5: "1-2 heures",
            4: "2-4 heures", 
            3: "4-8 heures",
            2: "1-2 jours",
            1: "2-5 jours"
        };

        return {
            category: bestCategory,
            priority: priority,
            confidence: Math.min(95, confidence),
            estimatedTime: timeEstimates[priority],
            recommendations: [
                `Intervention ${priority >= 4 ? 'prioritaire' : 'standard'} requise`,
                `Catégorie: ${bestCategory}`,
                `Confiance: ${confidence}%`,
                `Temps estimé: ${timeEstimates[priority]}`
            ]
        };
    }

    // 💬 Chatbot IA local
    generateChatResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        const responses = {
            // Urgences
            'coincé|ascenseur|bloqué|urgence': {
                response: 'URGENCE ! Si vous êtes coincé dans l\'ascenseur, appuyez sur le bouton d\'alarme rouge. Je contacte immédiatement les secours. Restez calme, de l\'aide arrive !',
                confidence: 95,
                intent: 'emergency'
            },
            
            // Problèmes techniques
            'fuite|plomberie|eau|robinet': {
                response: 'Je comprends que vous avez un problème de plomberie. Pouvez-vous me dire dans quelle pièce se trouve le problème ? En attendant, fermez l\'arrivée d\'eau si possible.',
                confidence: 90,
                intent: 'plumbing_issue'
            },
            
            'électricité|panne|courant|électrique': {
                response: 'Pour un problème électrique, vérifiez d\'abord le disjoncteur dans votre tableau électrique. Si le problème persiste, je vais créer une demande urgente pour un technicien.',
                confidence: 88,
                intent: 'electrical_issue'
            },
            
            'chauffage|froid|radiateur|température': {
                response: 'Problème de chauffage détecté. Vérifiez que les radiateurs ne sont pas obstrués par des meubles. Je programme une intervention technique prioritaire.',
                confidence: 85,
                intent: 'heating_issue'
            },
            
            // Politesse
            'merci|remercie|merci beaucoup': {
                response: 'Je vous en prie ! N\'hésitez pas si vous avez d\'autres questions. Je suis là 24h/24 pour vous aider avec tous vos problèmes immobiliers.',
                confidence: 95,
                intent: 'gratitude'
            },
            
            'salut|bonjour|hello|bonsoir': {
                response: 'Bonjour ! Je suis votre assistant IA pour la gestion immobilière. Comment puis-je vous aider aujourd\'hui ? Décrivez-moi votre problème.',
                confidence: 95,
                intent: 'greeting'
            },
            
            // Informations
            'comment|aide|help|info': {
                response: 'Je peux vous aider avec tous vos problèmes immobiliers : plomberie, électricité, chauffage, serrurerie, etc. Décrivez simplement votre problème et je vous guiderai.',
                confidence: 90,
                intent: 'help_request'
            }
        };

        // Recherche de correspondance
        for (const [pattern, data] of Object.entries(responses)) {
            if (new RegExp(pattern, 'i').test(lowerMessage)) {
                return {
                    success: true,
                    response: data.response,
                    confidence: data.confidence,
                    intent: data.intent
                };
            }
        }

        // Réponse par défaut
        return {
            success: true,
            response: 'Je comprends votre préoccupation. Laissez-moi vous aider avec cela. Pouvez-vous me donner plus de détails sur le problème que vous rencontrez ?',
            confidence: 75,
            intent: 'general_inquiry'
        };
    }

    // 📊 Mise à jour du dashboard
    updateDashboard() {
        const total = this.tickets.length;
        const pending = this.tickets.filter(t => ['nouveau', 'en_cours', 'assigne'].includes(t.status)).length;
        const resolved = this.tickets.filter(t => t.status === 'resolu').length;
        
        // Calcul confiance IA moyenne
        const avgConfidence = 94; // Simulation basée sur les classifications

        document.getElementById('totalTickets').textContent = total;
        document.getElementById('pendingTickets').textContent = pending;
        document.getElementById('resolvedTickets').textContent = resolved;
        document.getElementById('aiConfidence').textContent = avgConfidence + '%';
    }

    // 🎨 Rendu des tickets
    renderTickets() {
        const tbody = document.getElementById('ticketsTableBody');
        const statusFilter = document.getElementById('statusFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        let filteredTickets = this.tickets.filter(ticket => {
            const matchesStatus = !statusFilter || ticket.status === statusFilter;
            const matchesCategory = !categoryFilter || ticket.category === categoryFilter;
            const matchesSearch = !searchTerm || 
                ticket.title.toLowerCase().includes(searchTerm) ||
                ticket.description.toLowerCase().includes(searchTerm);
            
            return matchesStatus && matchesCategory && matchesSearch;
        });

        tbody.innerHTML = filteredTickets.map(ticket => `
            <tr>
                <td>#${ticket.id}</td>
                <td>${ticket.title}</td>
                <td><span class="category-badge">${ticket.category}</span></td>
                <td><span class="priority-badge priority-${ticket.priority}">${ticket.priority}/5</span></td>
                <td><span class="status-badge status-${ticket.status}">${this.getStatusLabel(ticket.status)}</span></td>
                <td>${ticket.created_at}</td>
            </tr>
        `).join('');
    }

    getStatusLabel(status) {
        const labels = {
            'nouveau': 'Nouveau',
            'en_cours': 'En cours',
            'assigne': 'Assigné',
            'resolu': 'Résolu'
        };
        return labels[status] || status;
    }

    // 👤 Gestion des utilisateurs
    updateUserInterface() {
        const userSelector = document.getElementById('userSelector');
        const currentUserDisplay = document.getElementById('currentUser');
        
        const users = {
            admin: { name: 'Administrateur', role: 'admin' },
            tenant: { name: 'Marie Locataire', role: 'tenant' },
            tech: { name: 'Paul Technicien', role: 'tech' }
        };

        currentUserDisplay.textContent = users[this.currentUser.id].name;
        userSelector.value = this.currentUser.id;
    }

    switchUser(userId) {
        const users = {
            admin: { id: 'admin', name: 'Administrateur', role: 'admin', permissions: ['all'] },
            tenant: { id: 'tenant', name: 'Marie Locataire', role: 'tenant', permissions: ['create', 'view_own'] },
            tech: { id: 'tech', name: 'Paul Technicien', role: 'tech', permissions: ['view', 'update', 'assign'] }
        };

        this.currentUser = users[userId];
        this.saveCurrentUser();
        this.updateUserInterface();
        
        // Notification du changement
        this.showNotification(`Connecté en tant que ${this.currentUser.name}`, 'success');
    }

    // 🔧 Gestion des événements
    setupEventListeners() {
        // Changement d'utilisateur
        document.getElementById('userSelector').addEventListener('change', (e) => {
            this.switchUser(e.target.value);
        });

        // Formulaire nouveau ticket
        document.getElementById('newTicketForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTicket();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    // 🎫 Création de ticket
    createTicket() {
        const title = document.getElementById('ticketTitle').value;
        const description = document.getElementById('ticketDescription').value;

        if (!title || !description) {
            this.showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        // Classification IA
        const aiResult = this.classifyTicket(description);
        
        const newTicket = {
            id: this.tickets.length + 1,
            title: title,
            description: description,
            category: aiResult.category,
            priority: aiResult.priority,
            status: 'nouveau',
            created_at: new Date().toISOString().split('T')[0],
            tenant: this.currentUser.name,
            apartment: this.currentUser.role === 'tenant' ? '2A' : 'Admin'
        };

        this.tickets.push(newTicket);
        this.saveTickets();
        this.renderTickets();
        
        // Fermer modal et réinitialiser formulaire
        this.closeModal('newTicketModal');
        document.getElementById('newTicketForm').reset();
        
        // Notification avec résultat IA
        this.showNotification(
            `Ticket créé ! IA: ${aiResult.category}, Priorité: ${aiResult.priority}/5, Confiance: ${aiResult.confidence}%`,
            'success'
        );
    }

    // 🧪 Test IA
    testAIClassification() {
        const text = document.getElementById('aiTestText').value;
        if (!text) {
            this.showNotification('Veuillez saisir un texte à analyser', 'error');
            return;
        }

        const result = this.classifyTicket(text);
        
        document.getElementById('aiResultContent').innerHTML = `
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-top: 10px;">
                <div><strong>Catégorie:</strong> ${result.category}</div>
                <div><strong>Priorité:</strong> ${result.priority}/5</div>
                <div><strong>Confiance:</strong> ${result.confidence}%</div>
                <div><strong>Temps estimé:</strong> ${result.estimatedTime}</div>
                <div style="margin-top: 10px;"><strong>Recommandations:</strong></div>
                <ul style="margin-left: 20px;">
                    ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
        
        document.getElementById('aiTestResult').style.display = 'block';
    }

    // 🌤️ Météo
    showWeather() {
        // Simulation météo réaliste
        const weatherData = {
            location: 'Zurich',
            temperature: Math.floor(Math.random() * 10) + 15, // 15-25°C
            condition: ['ensoleillé', 'nuageux', 'couvert', 'pluvieux'][Math.floor(Math.random() * 4)],
            humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
            wind: Math.floor(Math.random() * 15) + 5 // 5-20 km/h
        };

        document.getElementById('weatherLocation').textContent = weatherData.location;
        document.getElementById('weatherTemp').textContent = weatherData.temperature + '°C';
        document.getElementById('weatherCondition').textContent = weatherData.condition;
        document.getElementById('weatherWind').textContent = weatherData.wind + ' km/h';
        document.getElementById('weatherHumidity').textContent = weatherData.humidity + '%';

        this.openModal('weatherModal');
    }

    // 🔄 Actualisation
    refreshTickets() {
        this.renderTickets();
        this.updateDashboard();
        this.showNotification('Données actualisées', 'success');
    }

    // 🔍 Filtrage
    filterTickets() {
        this.renderTickets();
    }

    // 🚪 Navigation
    navigateTo(page) {
        // Mise à jour navigation active
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Simulation navigation (dans une vraie SPA, on changerait de page)
        const pages = {
            dashboard: 'Dashboard Administrateur',
            tenant: 'Portail Locataire',
            analytics: 'Analytics Avancés',
            chatbot: 'Assistant IA',
            notifications: 'Centre de Notifications'
        };

        document.querySelector('.header h1').textContent = pages[page];
        this.showNotification(`Navigation vers ${pages[page]}`, 'info');

        // Dans une vraie application, on chargerait le contenu de la page
        if (page === 'chatbot') {
            this.openChatbot();
        }
    }

    // 💬 Chatbot
    openChatbot() {
        // Simulation ouverture chatbot
        this.showNotification('Chatbot IA activé - Posez votre question !', 'info');
    }

    // 🔔 Notifications
    showNotification(message, type = 'info') {
        // Notification navigateur si supporté
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Ticket System', { body: message });
        }

        // Notification visuelle
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 📱 Modals
    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // 📤 Export/Import données
    exportData() {
        const data = {
            tickets: this.tickets,
            currentUser: this.currentUser,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-system-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Données exportées avec succès', 'success');
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.tickets = data.tickets || [];
                this.saveTickets();
                this.renderTickets();
                this.updateDashboard();
                this.showNotification('Données importées avec succès', 'success');
            } catch (error) {
                this.showNotification('Erreur lors de l\'import', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// 🚀 Fonctions globales pour les événements HTML
let ticketSystem;

function openNewTicketModal() {
    ticketSystem.openModal('newTicketModal');
}

function openAITestModal() {
    ticketSystem.openModal('aiTestModal');
}

function showWeather() {
    ticketSystem.showWeather();
}

function testAIClassification() {
    ticketSystem.testAIClassification();
}

function refreshTickets() {
    ticketSystem.refreshTickets();
}

function filterTickets() {
    ticketSystem.filterTickets();
}

function closeModal(modalId) {
    ticketSystem.closeModal(modalId);
}

// 🎬 Initialisation
document.addEventListener('DOMContentLoaded', () => {
    ticketSystem = new TicketSystem();
    
    // Demander permission notifications
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Styles d'animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('🚀 Ticket System v3.0 Static - Initialisé avec succès !');
});

