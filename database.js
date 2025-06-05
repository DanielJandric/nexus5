const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration de la base de données
const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.MAX_CONNECTIONS) || 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Pool de connexions
let pool;

// Initialiser le pool de connexions
function initializePool() {
    if (!pool) {
        pool = new Pool(dbConfig);
        
        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
        
        pool.on('connect', () => {
            console.log('✅ Connected to PostgreSQL database');
        });
    }
    return pool;
}

// Fonction pour exécuter une requête
async function query(text, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
}

// Fonction pour exécuter une transaction
async function transaction(queries) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const results = [];
        
        for (const { text, params } of queries) {
            const result = await client.query(text, params);
            results.push(result);
        }
        
        await client.query('COMMIT');
        return results;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Initialiser la base de données
async function initializeDatabase() {
    try {
        console.log('🔄 Initializing PostgreSQL database...');
        
        // Initialiser le pool
        initializePool();
        
        // Lire et exécuter le schéma
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await query(schema);
            console.log('✅ Database schema created');
        }
        
        // Lire et exécuter les données de test
        const seedPath = path.join(__dirname, 'seed_data.sql');
        if (fs.existsSync(seedPath)) {
            const seedData = fs.readFileSync(seedPath, 'utf8');
            await query(seedData);
            console.log('✅ Seed data inserted');
        }
        
        console.log('🎉 Database initialization completed');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

// Health check de la base de données
async function healthCheck() {
    try {
        const result = await query('SELECT NOW() as current_time, version() as version');
        return {
            status: 'healthy',
            timestamp: result.rows[0].current_time,
            version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
            connections: {
                total: pool.totalCount,
                idle: pool.idleCount,
                waiting: pool.waitingCount
            }
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
}

// Requêtes pour les tickets
const ticketQueries = {
    // Obtenir tous les tickets avec pagination
    async getAll(limit = 50, offset = 0, filters = {}) {
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        
        if (filters.status) {
            whereClause += ` AND t.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }
        
        if (filters.category_id) {
            whereClause += ` AND t.category_id = $${paramIndex}`;
            params.push(filters.category_id);
            paramIndex++;
        }
        
        if (filters.priority) {
            whereClause += ` AND t.priority = $${paramIndex}`;
            params.push(filters.priority);
            paramIndex++;
        }
        
        const queryText = `
            SELECT 
                t.*,
                c.name as category_name,
                c.color as category_color,
                u.first_name || ' ' || u.last_name as created_by_name,
                a.first_name || ' ' || a.last_name as assigned_to_name,
                p.name as property_name,
                un.unit_number
            FROM tickets t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN users a ON t.assigned_to = a.id
            LEFT JOIN units un ON t.unit_id = un.id
            LEFT JOIN properties p ON un.property_id = p.id
            ${whereClause}
            ORDER BY t.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        params.push(limit, offset);
        const result = await query(queryText, params);
        return result.rows;
    },
    
    // Obtenir un ticket par ID
    async getById(id) {
        const queryText = `
            SELECT 
                t.*,
                c.name as category_name,
                c.color as category_color,
                u.first_name || ' ' || u.last_name as created_by_name,
                a.first_name || ' ' || a.last_name as assigned_to_name,
                p.name as property_name,
                un.unit_number
            FROM tickets t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN users a ON t.assigned_to = a.id
            LEFT JOIN units un ON t.unit_id = un.id
            LEFT JOIN properties p ON un.property_id = p.id
            WHERE t.id = $1
        `;
        
        const result = await query(queryText, [id]);
        return result.rows[0];
    },
    
    // Créer un nouveau ticket
    async create(ticketData) {
        const queryText = `
            INSERT INTO tickets (
                title, description, category_id, priority, status,
                created_by, unit_id, estimated_hours, ai_confidence
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        
        const params = [
            ticketData.title,
            ticketData.description,
            ticketData.category_id,
            ticketData.priority || 3,
            ticketData.status || 'nouveau',
            ticketData.created_by,
            ticketData.unit_id,
            ticketData.estimated_hours,
            ticketData.ai_confidence
        ];
        
        const result = await query(queryText, params);
        return result.rows[0];
    },
    
    // Mettre à jour un ticket
    async update(id, updates) {
        const setClause = [];
        const params = [];
        let paramIndex = 1;
        
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                setClause.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }
        
        if (setClause.length === 0) {
            throw new Error('No fields to update');
        }
        
        setClause.push(`updated_at = NOW()`);
        params.push(id);
        
        const queryText = `
            UPDATE tickets 
            SET ${setClause.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await query(queryText, params);
        return result.rows[0];
    },
    
    // Supprimer un ticket
    async delete(id) {
        const queryText = 'DELETE FROM tickets WHERE id = $1 RETURNING *';
        const result = await query(queryText, [id]);
        return result.rows[0];
    }
};

// Requêtes pour les statistiques
const statsQueries = {
    // Obtenir les statistiques générales
    async getGeneral() {
        const queries = [
            'SELECT COUNT(*) as total FROM tickets',
            'SELECT COUNT(*) as pending FROM tickets WHERE status IN (\'nouveau\', \'en_cours\')',
            'SELECT COUNT(*) as resolved FROM tickets WHERE status = \'resolu\'',
            'SELECT AVG(ai_confidence) as avg_confidence FROM tickets WHERE ai_confidence IS NOT NULL',
            'SELECT COUNT(*) as today FROM tickets WHERE DATE(created_at) = CURRENT_DATE',
            'SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours FROM tickets WHERE resolved_at IS NOT NULL'
        ];
        
        const results = await Promise.all(queries.map(q => query(q)));
        
        return {
            total_tickets: parseInt(results[0].rows[0].total),
            pending_tickets: parseInt(results[1].rows[0].pending),
            resolved_tickets: parseInt(results[2].rows[0].resolved),
            ai_confidence: Math.round(parseFloat(results[3].rows[0].avg_confidence || 0) * 100) / 100,
            tickets_today: parseInt(results[4].rows[0].today),
            avg_resolution_hours: Math.round(parseFloat(results[5].rows[0].avg_resolution_hours || 0) * 100) / 100
        };
    },
    
    // Obtenir les statistiques par catégorie
    async getByCategory() {
        const queryText = `
            SELECT 
                c.name,
                c.color,
                COUNT(t.id) as count,
                AVG(t.priority) as avg_priority
            FROM categories c
            LEFT JOIN tickets t ON c.id = t.category_id
            GROUP BY c.id, c.name, c.color
            ORDER BY count DESC
        `;
        
        const result = await query(queryText);
        return result.rows;
    },
    
    // Obtenir l'évolution des tickets sur 7 jours
    async getWeeklyTrend() {
        const queryText = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as created,
                COUNT(CASE WHEN status = 'resolu' THEN 1 END) as resolved
            FROM tickets
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        `;
        
        const result = await query(queryText);
        return result.rows;
    }
};

// Requêtes pour les utilisateurs
const userQueries = {
    // Obtenir tous les utilisateurs
    async getAll() {
        const queryText = `
            SELECT id, email, first_name, last_name, role, created_at
            FROM users
            ORDER BY created_at DESC
        `;
        
        const result = await query(queryText);
        return result.rows;
    },
    
    // Obtenir un utilisateur par email
    async getByEmail(email) {
        const queryText = 'SELECT * FROM users WHERE email = $1';
        const result = await query(queryText, [email]);
        return result.rows[0];
    },
    
    // Créer un nouvel utilisateur
    async create(userData) {
        const queryText = `
            INSERT INTO users (email, password_hash, first_name, last_name, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, first_name, last_name, role, created_at
        `;
        
        const params = [
            userData.email,
            userData.password_hash,
            userData.first_name,
            userData.last_name,
            userData.role || 'locataire'
        ];
        
        const result = await query(queryText, params);
        return result.rows[0];
    }
};

// Fermer le pool de connexions
async function closePool() {
    if (pool) {
        await pool.end();
        console.log('🔌 Database pool closed');
    }
}

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down gracefully...');
    await closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down gracefully...');
    await closePool();
    process.exit(0);
});

module.exports = {
    initializeDatabase,
    healthCheck,
    ticketQueries,
    statsQueries,
    userQueries,
    query,
    transaction,
    closePool
};

