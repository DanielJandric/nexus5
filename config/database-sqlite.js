const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Configuration SQLite pour la démo
const dbPath = path.join(__dirname, '..', 'demo.db');
const db = new sqlite3.Database(dbPath);

// Fonction pour initialiser la base de données SQLite
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Table des utilisateurs
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          role TEXT DEFAULT 'locataire',
          phone TEXT,
          building_id INTEGER,
          apartment_number TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Table des tickets
      db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT,
          priority INTEGER DEFAULT 3,
          urgency TEXT DEFAULT 'medium',
          status TEXT DEFAULT 'nouveau',
          estimated_time TEXT,
          actual_time TEXT,
          cost REAL,
          user_id INTEGER NOT NULL,
          building_id INTEGER,
          apartment_number TEXT,
          assigned_to INTEGER,
          ai_confidence REAL,
          ai_analysis TEXT,
          attachments TEXT DEFAULT '[]',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          resolved_at DATETIME
        )
      `);

      // Table des catégories IA
      db.run(`
        CREATE TABLE IF NOT EXISTS ai_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          keywords TEXT DEFAULT '[]',
          default_priority INTEGER DEFAULT 3,
          estimated_time TEXT,
          specialist_type TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insertion des données de base
      db.run(`
        INSERT OR IGNORE INTO ai_categories (name, description, keywords, default_priority, estimated_time, specialist_type) 
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
      `);

      // Créer un utilisateur de démo
      db.run(`
        INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, role) 
        VALUES ('demo@example.com', '$2a$12$demo.hash', 'Demo', 'User', 'admin')
      `);

      // Créer quelques tickets de démo
      db.run(`
        INSERT OR IGNORE INTO tickets (title, description, category, priority, status, user_id, apartment_number, ai_confidence) 
        VALUES 
          ('Fuite d''eau dans la salle de bain', 'Il y a une fuite sous l''évier de la salle de bain', 'Plomberie', 4, 'nouveau', 1, 'A101', 0.95),
          ('Prise électrique ne fonctionne plus', 'La prise de la cuisine ne fonctionne plus depuis hier', 'Électricité', 3, 'en_cours', 1, 'B205', 0.88),
          ('Radiateur ne chauffe pas', 'Le radiateur du salon reste froid malgré le chauffage allumé', 'Chauffage', 4, 'nouveau', 1, 'C302', 0.92)
      `);

      console.log('✅ Base de données SQLite initialisée avec succès');
      resolve();
    });
  });
}

// Fonction pour exécuter une requête
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ rows: [{ id: this.lastID, changes: this.changes }] });
      });
    }
  });
}

// Fonction pour obtenir des statistiques
async function getDatabaseStats() {
  try {
    const result = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM tickets) as total_tickets,
        (SELECT COUNT(*) FROM tickets WHERE status = 'nouveau') as new_tickets,
        (SELECT COUNT(*) FROM tickets WHERE status = 'en_cours') as active_tickets,
        (SELECT COUNT(*) FROM tickets WHERE status = 'resolu') as resolved_tickets
    `);
    
    return result.rows[0];
  } catch (error) {
    console.error('Erreur stats:', error);
    return {
      total_users: 0,
      total_tickets: 0,
      new_tickets: 0,
      active_tickets: 0,
      resolved_tickets: 0
    };
  }
}

module.exports = {
  query,
  initializeDatabase,
  getDatabaseStats
};

