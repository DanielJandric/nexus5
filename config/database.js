const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test de connexion
pool.on('connect', () => {
  console.log('✅ Connexion à la base de données établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur de connexion à la base de données:', err);
});

// Fonction pour initialiser la base de données
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Création des tables
    await client.query(`
      -- Table des utilisateurs
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'locataire',
        phone VARCHAR(20),
        building_id INTEGER,
        apartment_number VARCHAR(10),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      -- Table des bâtiments
      CREATE TABLE IF NOT EXISTS buildings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        postal_code VARCHAR(10) NOT NULL,
        manager_id INTEGER,
        total_apartments INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      -- Table des tickets
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100),
        priority INTEGER DEFAULT 3,
        urgency VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'nouveau',
        estimated_time VARCHAR(50),
        actual_time VARCHAR(50),
        cost DECIMAL(10,2),
        user_id INTEGER NOT NULL,
        building_id INTEGER,
        apartment_number VARCHAR(10),
        assigned_to INTEGER,
        ai_confidence DECIMAL(5,2),
        ai_analysis JSONB,
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (building_id) REFERENCES buildings(id)
      );
    `);

    await client.query(`
      -- Table des commentaires
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        comment TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await client.query(`
      -- Table des notifications
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        ticket_id INTEGER,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id)
      );
    `);

    await client.query(`
      -- Table des catégories IA
      CREATE TABLE IF NOT EXISTS ai_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        keywords JSONB DEFAULT '[]',
        default_priority INTEGER DEFAULT 3,
        estimated_time VARCHAR(50),
        specialist_type VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insertion des données de base
    await client.query(`
      INSERT INTO ai_categories (name, description, keywords, default_priority, estimated_time, specialist_type) 
      VALUES 
        ('Plomberie', 'Problèmes liés à l''eau, canalisations, robinets', '["fuite", "eau", "robinet", "wc", "douche", "évier", "canalisation"]', 4, '1-3 heures', 'Plombier'),
        ('Électricité', 'Problèmes électriques, prises, éclairage', '["électrique", "prise", "lumière", "courant", "disjoncteur", "ampoule"]', 4, '1-2 heures', 'Électricien'),
        ('Chauffage', 'Problèmes de chauffage, chaudière, radiateurs', '["chauffage", "chaudière", "radiateur", "froid", "température"]', 4, '2-4 heures', 'Chauffagiste'),
        ('Serrurerie', 'Problèmes de portes, serrures, clés', '["porte", "serrure", "clé", "ferme", "bloqué"]', 3, '1-2 heures', 'Serrurier'),
        ('Peinture', 'Problèmes de peinture, murs, plafonds', '["peinture", "mur", "plafond", "tache", "écaillé"]', 2, '2-6 heures', 'Peintre'),
        ('Ménage', 'Nettoyage, entretien général', '["nettoyage", "ménage", "sale", "poussière"]', 2, '1-3 heures', 'Agent d''entretien'),
        ('Jardinage', 'Espaces verts, jardins, plantes', '["jardin", "plante", "herbe", "arbre", "taille"]', 2, '2-4 heures', 'Jardinier'),
        ('Général', 'Autres problèmes non classifiés', '["autre", "divers", "général"]', 3, '1-2 heures', 'Technicien'),
        ('Urgent', 'Problèmes nécessitant une intervention immédiate', '["urgent", "danger", "sécurité", "inondation"]', 5, '< 1 heure', 'Intervention d''urgence')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Création des index pour les performances
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
      CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    `);

    console.log('✅ Base de données initialisée avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Fonction pour obtenir des statistiques
async function getDatabaseStats() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM tickets) as total_tickets,
        (SELECT COUNT(*) FROM tickets WHERE status = 'nouveau') as new_tickets,
        (SELECT COUNT(*) FROM tickets WHERE status = 'en_cours') as active_tickets,
        (SELECT COUNT(*) FROM tickets WHERE status = 'resolu') as resolved_tickets
    `);
    
    return result.rows[0];
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initializeDatabase,
  getDatabaseStats
};

