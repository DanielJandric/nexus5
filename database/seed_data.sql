-- Données de test pour le système de gestion de tickets
-- Version: 1.0
-- Date: 2025-06-05

-- Insertion des catégories de tickets
INSERT INTO ticket_categories (id, name, description, color, icon, priority_weight, estimated_hours) VALUES
(uuid_generate_v4(), 'Plomberie', 'Problèmes de plomberie, fuites, canalisations', '#3B82F6', 'fas fa-tint', 4, 2.5),
(uuid_generate_v4(), 'Électricité', 'Problèmes électriques, pannes, installations', '#EF4444', 'fas fa-bolt', 5, 3.0),
(uuid_generate_v4(), 'Chauffage', 'Chauffage, climatisation, ventilation', '#F59E0B', 'fas fa-thermometer-half', 4, 4.0),
(uuid_generate_v4(), 'Serrurerie', 'Serrures, portes, fenêtres, sécurité', '#8B5CF6', 'fas fa-key', 3, 1.5),
(uuid_generate_v4(), 'Peinture', 'Peinture, décoration, finitions', '#10B981', 'fas fa-paint-brush', 2, 6.0),
(uuid_generate_v4(), 'Ménage', 'Nettoyage, entretien général', '#6B7280', 'fas fa-broom', 1, 2.0),
(uuid_generate_v4(), 'Jardinage', 'Espaces verts, jardins, extérieurs', '#22C55E', 'fas fa-leaf', 2, 4.0),
(uuid_generate_v4(), 'Menuiserie', 'Bois, meubles, aménagements', '#92400E', 'fas fa-hammer', 3, 5.0),
(uuid_generate_v4(), 'Ascenseur', 'Ascenseurs, monte-charges', '#DC2626', 'fas fa-elevator', 5, 2.0);

-- Insertion des utilisateurs de test
INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone) VALUES
-- Administrateurs
(uuid_generate_v4(), 'admin@ticketsystem.ch', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjWZpjpWy', 'Jean', 'Dupont', 'admin', '+41 79 123 45 67'),
(uuid_generate_v4(), 'manager@ticketsystem.ch', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjWZpjpWy', 'Marie', 'Martin', 'manager', '+41 79 234 56 78'),

-- Techniciens
(uuid_generate_v4(), 'tech1@ticketsystem.ch', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjWZpjpWy', 'Pierre', 'Müller', 'technician', '+41 79 345 67 89'),
(uuid_generate_v4(), 'tech2@ticketsystem.ch', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjWZpjpWy', 'Anna', 'Schmidt', 'technician', '+41 79 456 78 90'),
(uuid_generate_v4(), 'tech3@ticketsystem.ch', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjWZpjpWy', 'Marco', 'Rossi', 'technician', '+41 79 567 89 01'),

-- Locataires
(uuid_generate_v4(), 'marie.locataire@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjWZpjpWy', 'Marie', 'Dubois', 'tenant', '+41 79 678 90 12'),
(uuid_generate_v4(), 'paul.resident@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjWZpjpWy', 'Paul', 'Leroy', 'tenant', '+41 79 789 01 23'),
(uuid_generate_v4(), 'sophie.tenant@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjWZpjpWy', 'Sophie', 'Bernard', 'tenant', '+41 79 890 12 34'),
(uuid_generate_v4(), 'lucas.habitant@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjWZpjpWy', 'Lucas', 'Moreau', 'tenant', '+41 79 901 23 45'),
(uuid_generate_v4(), 'emma.locataire@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjWZpjpWy', 'Emma', 'Petit', 'tenant', '+41 79 012 34 56');

-- Insertion des propriétés
INSERT INTO properties (id, name, address, city, postal_code, latitude, longitude, property_type, total_units, manager_id) VALUES
(uuid_generate_v4(), 'Résidence Les Jardins', 'Rue des Jardins 15', 'Zurich', '8001', 47.3769, 8.5417, 'apartment', 24, (SELECT id FROM users WHERE email = 'manager@ticketsystem.ch')),
(uuid_generate_v4(), 'Immeuble Lac Léman', 'Avenue du Lac 42', 'Genève', '1201', 46.2044, 6.1432, 'apartment', 18, (SELECT id FROM users WHERE email = 'manager@ticketsystem.ch')),
(uuid_generate_v4(), 'Résidence Moderne', 'Bahnhofstrasse 123', 'Zurich', '8001', 47.3686, 8.5391, 'apartment', 32, (SELECT id FROM users WHERE email = 'admin@ticketsystem.ch')),
(uuid_generate_v4(), 'Villa Bellevue', 'Chemin de Bellevue 7', 'Lausanne', '1003', 46.5197, 6.6323, 'house', 1, (SELECT id FROM users WHERE email = 'admin@ticketsystem.ch'));

-- Insertion des unités (appartements)
WITH property_jardins AS (SELECT id FROM properties WHERE name = 'Résidence Les Jardins'),
     property_leman AS (SELECT id FROM properties WHERE name = 'Immeuble Lac Léman'),
     property_moderne AS (SELECT id FROM properties WHERE name = 'Résidence Moderne'),
     property_villa AS (SELECT id FROM properties WHERE name = 'Villa Bellevue'),
     tenant_marie AS (SELECT id FROM users WHERE email = 'marie.locataire@email.com'),
     tenant_paul AS (SELECT id FROM users WHERE email = 'paul.resident@email.com'),
     tenant_sophie AS (SELECT id FROM users WHERE email = 'sophie.tenant@email.com'),
     tenant_lucas AS (SELECT id FROM users WHERE email = 'lucas.habitant@email.com'),
     tenant_emma AS (SELECT id FROM users WHERE email = 'emma.locataire@email.com')

INSERT INTO units (id, property_id, unit_number, floor, rooms, area_sqm, rent_amount, tenant_id, lease_start_date, lease_end_date, is_occupied) VALUES
-- Résidence Les Jardins
(uuid_generate_v4(), (SELECT id FROM property_jardins), 'A101', 1, 3.5, 85.5, 1850.00, (SELECT id FROM tenant_marie), '2024-01-01', '2025-12-31', true),
(uuid_generate_v4(), (SELECT id FROM property_jardins), 'A102', 1, 2.5, 65.0, 1450.00, (SELECT id FROM tenant_paul), '2024-03-01', '2025-02-28', true),
(uuid_generate_v4(), (SELECT id FROM property_jardins), 'A201', 2, 4.5, 105.0, 2200.00, (SELECT id FROM tenant_sophie), '2023-09-01', '2025-08-31', true),
(uuid_generate_v4(), (SELECT id FROM property_jardins), 'A202', 2, 3.5, 85.5, 1850.00, NULL, NULL, NULL, false),
(uuid_generate_v4(), (SELECT id FROM property_jardins), 'A301', 3, 3.5, 85.5, 1850.00, (SELECT id FROM tenant_lucas), '2024-06-01', '2026-05-31', true),

-- Immeuble Lac Léman
(uuid_generate_v4(), (SELECT id FROM property_leman), 'B101', 1, 2.5, 70.0, 1650.00, (SELECT id FROM tenant_emma), '2024-02-01', '2025-01-31', true),
(uuid_generate_v4(), (SELECT id FROM property_leman), 'B201', 2, 3.5, 90.0, 1950.00, NULL, NULL, NULL, false),
(uuid_generate_v4(), (SELECT id FROM property_leman), 'B301', 3, 4.5, 110.0, 2400.00, NULL, NULL, NULL, false),

-- Résidence Moderne
(uuid_generate_v4(), (SELECT id FROM property_moderne), 'C101', 1, 1.5, 45.0, 1200.00, NULL, NULL, NULL, false),
(uuid_generate_v4(), (SELECT id FROM property_moderne), 'C201', 2, 2.5, 65.0, 1500.00, NULL, NULL, NULL, false),

-- Villa Bellevue
(uuid_generate_v4(), (SELECT id FROM property_villa), 'VILLA', 0, 6.5, 180.0, 3500.00, NULL, NULL, NULL, false);

-- Insertion des tickets de test
WITH categories AS (
    SELECT 
        (SELECT id FROM ticket_categories WHERE name = 'Plomberie') as plomberie,
        (SELECT id FROM ticket_categories WHERE name = 'Électricité') as electricite,
        (SELECT id FROM ticket_categories WHERE name = 'Chauffage') as chauffage,
        (SELECT id FROM ticket_categories WHERE name = 'Serrurerie') as serrurerie,
        (SELECT id FROM ticket_categories WHERE name = 'Peinture') as peinture,
        (SELECT id FROM ticket_categories WHERE name = 'Ménage') as menage
),
users_ref AS (
    SELECT 
        (SELECT id FROM users WHERE email = 'marie.locataire@email.com') as marie,
        (SELECT id FROM users WHERE email = 'paul.resident@email.com') as paul,
        (SELECT id FROM users WHERE email = 'sophie.tenant@email.com') as sophie,
        (SELECT id FROM users WHERE email = 'lucas.habitant@email.com') as lucas,
        (SELECT id FROM users WHERE email = 'tech1@ticketsystem.ch') as tech1,
        (SELECT id FROM users WHERE email = 'tech2@ticketsystem.ch') as tech2,
        (SELECT id FROM users WHERE email = 'tech3@ticketsystem.ch') as tech3
),
properties_ref AS (
    SELECT 
        (SELECT id FROM properties WHERE name = 'Résidence Les Jardins') as jardins,
        (SELECT id FROM properties WHERE name = 'Immeuble Lac Léman') as leman
),
units_ref AS (
    SELECT 
        (SELECT id FROM units WHERE unit_number = 'A101') as a101,
        (SELECT id FROM units WHERE unit_number = 'A102') as a102,
        (SELECT id FROM units WHERE unit_number = 'A201') as a201,
        (SELECT id FROM units WHERE unit_number = 'B101') as b101
)

INSERT INTO tickets (
    id, title, description, category_id, priority, status, urgency,
    tenant_id, property_id, unit_id, assigned_to,
    ai_category_confidence, ai_priority_suggestion, ai_estimated_hours,
    ai_classification_data, reported_at, assigned_at, started_at
) VALUES
-- Tickets résolus
(uuid_generate_v4(), 
 'Fuite robinet cuisine', 
 'Le robinet de la cuisine fuit depuis ce matin, il y a de l''eau partout sur le sol. Urgent !',
 (SELECT plomberie FROM categories), 4, 'résolu', 'élevée',
 (SELECT marie FROM users_ref), (SELECT jardins FROM properties_ref), (SELECT a101 FROM units_ref), (SELECT tech1 FROM users_ref),
 92.5, 4, 2.5,
 '{"category": "Plomberie", "confidence": 92.5, "keywords": ["fuite", "robinet", "eau"], "urgency_detected": true}',
 CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days 18 hours', CURRENT_TIMESTAMP - INTERVAL '2 days 16 hours'),

(uuid_generate_v4(),
 'Panne électrique salon',
 'Plus d''électricité dans le salon depuis hier soir. Les prises ne fonctionnent plus.',
 (SELECT electricite FROM categories), 5, 'résolu', 'critique',
 (SELECT paul FROM users_ref), (SELECT jardins FROM properties_ref), (SELECT a102 FROM units_ref), (SELECT tech2 FROM users_ref),
 96.8, 5, 3.0,
 '{"category": "Électricité", "confidence": 96.8, "keywords": ["électricité", "prises", "panne"], "urgency_detected": true}',
 CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '1 day 20 hours', CURRENT_TIMESTAMP - INTERVAL '1 day 18 hours'),

-- Tickets en cours
(uuid_generate_v4(),
 'Chauffage insuffisant',
 'Le chauffage ne chauffe pas assez dans le salon et la chambre. Température max 16°C.',
 (SELECT chauffage FROM categories), 3, 'en_cours', 'normale',
 (SELECT sophie FROM users_ref), (SELECT jardins FROM properties_ref), (SELECT a201 FROM units_ref), (SELECT tech1 FROM users_ref),
 88.2, 3, 4.0,
 '{"category": "Chauffage", "confidence": 88.2, "keywords": ["chauffage", "température", "froid"], "urgency_detected": false}',
 CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '18 hours', CURRENT_TIMESTAMP - INTERVAL '16 hours'),

(uuid_generate_v4(),
 'Serrure porte d''entrée bloquée',
 'La serrure de la porte d''entrée de l''immeuble est difficile à tourner, parfois elle se bloque complètement.',
 (SELECT serrurerie FROM categories), 4, 'assigné', 'élevée',
 (SELECT lucas FROM users_ref), (SELECT jardins FROM properties_ref), NULL, (SELECT tech3 FROM users_ref),
 91.3, 4, 1.5,
 '{"category": "Serrurerie", "confidence": 91.3, "keywords": ["serrure", "bloquée", "porte"], "urgency_detected": true}',
 CURRENT_TIMESTAMP - INTERVAL '12 hours', CURRENT_TIMESTAMP - INTERVAL '8 hours', NULL),

-- Tickets nouveaux
(uuid_generate_v4(),
 'Tache d''humidité plafond',
 'Une tache d''humidité est apparue au plafond de la salle de bain, elle s''agrandit.',
 (SELECT plomberie FROM categories), 3, 'nouveau', 'normale',
 (SELECT marie FROM users_ref), (SELECT jardins FROM properties_ref), (SELECT a101 FROM units_ref), NULL,
 85.7, 3, 3.0,
 '{"category": "Plomberie", "confidence": 85.7, "keywords": ["humidité", "plafond", "salle de bain"], "urgency_detected": false}',
 CURRENT_TIMESTAMP - INTERVAL '6 hours', NULL, NULL),

(uuid_generate_v4(),
 'Peinture écaillée couloir',
 'La peinture du couloir s''écaille par endroits, ce n''est pas très esthétique.',
 (SELECT peinture FROM categories), 2, 'nouveau', 'faible',
 (SELECT paul FROM users_ref), (SELECT jardins FROM properties_ref), (SELECT a102 FROM units_ref), NULL,
 94.1, 2, 6.0,
 '{"category": "Peinture", "confidence": 94.1, "keywords": ["peinture", "écaillée", "esthétique"], "urgency_detected": false}',
 CURRENT_TIMESTAMP - INTERVAL '4 hours', NULL, NULL),

(uuid_generate_v4(),
 'Nettoyage après déménagement',
 'L''appartement B101 nécessite un nettoyage complet après le départ du locataire.',
 (SELECT menage FROM categories), 2, 'nouveau', 'normale',
 (SELECT emma FROM users_ref), (SELECT leman FROM properties_ref), (SELECT b101 FROM units_ref), NULL,
 97.2, 2, 4.0,
 '{"category": "Ménage", "confidence": 97.2, "keywords": ["nettoyage", "déménagement", "complet"], "urgency_detected": false}',
 CURRENT_TIMESTAMP - INTERVAL '2 hours', NULL, NULL),

(uuid_generate_v4(),
 'Problème évacuation douche',
 'L''eau ne s''évacue plus correctement dans la douche, elle stagne et met très longtemps à partir.',
 (SELECT plomberie FROM categories), 3, 'nouveau', 'normale',
 (SELECT sophie FROM users_ref), (SELECT jardins FROM properties_ref), (SELECT a201 FROM units_ref), NULL,
 89.4, 3, 2.0,
 '{"category": "Plomberie", "confidence": 89.4, "keywords": ["évacuation", "douche", "stagne"], "urgency_detected": false}',
 CURRENT_TIMESTAMP - INTERVAL '1 hour', NULL, NULL);

-- Insertion des commentaires
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, comment_type) VALUES
(uuid_generate_v4(), 
 (SELECT id FROM tickets WHERE title = 'Fuite robinet cuisine'), 
 (SELECT id FROM users WHERE email = 'tech1@ticketsystem.ch'),
 'Intervention effectuée. Remplacement du joint défectueux. Problème résolu.',
 'resolution'),

(uuid_generate_v4(),
 (SELECT id FROM tickets WHERE title = 'Panne électrique salon'),
 (SELECT id FROM users WHERE email = 'tech2@ticketsystem.ch'),
 'Disjoncteur défaillant remplacé. Installation vérifiée et sécurisée.',
 'resolution'),

(uuid_generate_v4(),
 (SELECT id FROM tickets WHERE title = 'Chauffage insuffisant'),
 (SELECT id FROM users WHERE email = 'tech1@ticketsystem.ch'),
 'Purge des radiateurs en cours. Vérification de la pression du circuit.',
 'comment'),

(uuid_generate_v4(),
 (SELECT id FROM tickets WHERE title = 'Serrure porte d''entrée bloquée'),
 (SELECT id FROM users WHERE email = 'tech3@ticketsystem.ch'),
 'Intervention prévue demain matin à 9h. Apport du matériel nécessaire.',
 'comment');

-- Insertion des notifications
INSERT INTO notifications (id, user_id, ticket_id, type, title, message, channels, is_read) VALUES
(uuid_generate_v4(),
 (SELECT id FROM users WHERE email = 'marie.locataire@email.com'),
 (SELECT id FROM tickets WHERE title = 'Fuite robinet cuisine'),
 'ticket_resolved',
 'Ticket résolu',
 'Votre demande concernant la fuite du robinet de cuisine a été résolue.',
 '["email", "push"]',
 true),

(uuid_generate_v4(),
 (SELECT id FROM users WHERE email = 'sophie.tenant@email.com'),
 (SELECT id FROM tickets WHERE title = 'Chauffage insuffisant'),
 'ticket_assigned',
 'Technicien assigné',
 'Un technicien a été assigné à votre demande concernant le chauffage.',
 '["email", "sms"]',
 false),

(uuid_generate_v4(),
 (SELECT id FROM users WHERE email = 'lucas.habitant@email.com'),
 (SELECT id FROM tickets WHERE title = 'Serrure porte d''entrée bloquée'),
 'ticket_assigned',
 'Intervention programmée',
 'Une intervention est programmée pour demain concernant la serrure.',
 '["email", "push"]',
 false);

-- Insertion des métriques analytics
INSERT INTO analytics_metrics (metric_name, metric_value, metric_type, dimensions, recorded_at) VALUES
('tickets_created_daily', 3, 'counter', '{"date": "2025-06-05"}', CURRENT_TIMESTAMP),
('tickets_resolved_daily', 2, 'counter', '{"date": "2025-06-05"}', CURRENT_TIMESTAMP),
('avg_resolution_time_hours', 18.5, 'gauge', '{"period": "last_7_days"}', CURRENT_TIMESTAMP),
('ai_classification_accuracy', 91.2, 'gauge', '{"period": "last_30_days"}', CURRENT_TIMESTAMP),
('tenant_satisfaction_score', 4.6, 'gauge', '{"scale": "1_to_5", "period": "last_month"}', CURRENT_TIMESTAMP),
('technician_utilization_rate', 78.3, 'gauge', '{"period": "current_week"}', CURRENT_TIMESTAMP);

-- Mise à jour des compteurs de séquence
SELECT setval(pg_get_serial_sequence('tickets', 'id'), (SELECT MAX(id) FROM tickets));

-- Vérification des données insérées
SELECT 'Catégories créées: ' || COUNT(*) FROM ticket_categories;
SELECT 'Utilisateurs créés: ' || COUNT(*) FROM users;
SELECT 'Propriétés créées: ' || COUNT(*) FROM properties;
SELECT 'Unités créées: ' || COUNT(*) FROM units;
SELECT 'Tickets créés: ' || COUNT(*) FROM tickets;
SELECT 'Commentaires créés: ' || COUNT(*) FROM ticket_comments;
SELECT 'Notifications créées: ' || COUNT(*) FROM notifications;

