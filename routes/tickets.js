const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Middleware d'authentification pour toutes les routes tickets
router.use(authenticateToken);

// Obtenir tous les tickets (avec pagination et filtres)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      priority, 
      userId,
      buildingId 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Construction dynamique de la requête avec filtres
    if (status) {
      whereConditions.push(`t.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (category) {
      whereConditions.push(`t.category = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }

    if (priority) {
      whereConditions.push(`t.priority = $${paramIndex}`);
      queryParams.push(parseInt(priority));
      paramIndex++;
    }

    if (userId) {
      whereConditions.push(`t.user_id = $${paramIndex}`);
      queryParams.push(parseInt(userId));
      paramIndex++;
    }

    if (buildingId) {
      whereConditions.push(`t.building_id = $${paramIndex}`);
      queryParams.push(parseInt(buildingId));
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Requête principale avec jointures
    const query = `
      SELECT 
        t.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        b.name as building_name,
        b.address as building_address,
        assigned.first_name || ' ' || assigned.last_name as assigned_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN buildings b ON t.building_id = b.id
      LEFT JOIN users assigned ON t.assigned_to = assigned.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(query, queryParams);

    // Compter le total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tickets t
      ${whereClause}
    `;

    const countResult = await pool.query(
      countQuery, 
      queryParams.slice(0, -2) // Enlever limit et offset
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      tickets: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Obtenir un ticket spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        t.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        b.name as building_name,
        b.address as building_address,
        assigned.first_name || ' ' || assigned.last_name as assigned_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN buildings b ON t.building_id = b.id
      LEFT JOIN users assigned ON t.assigned_to = assigned.id
      WHERE t.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Ticket non trouvé' 
      });
    }

    // Récupérer les commentaires
    const commentsQuery = `
      SELECT 
        tc.*,
        u.first_name || ' ' || u.last_name as author_name,
        u.role as author_role
      FROM ticket_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.ticket_id = $1
      ORDER BY tc.created_at ASC
    `;

    const commentsResult = await pool.query(commentsQuery, [id]);

    const ticket = {
      ...result.rows[0],
      comments: commentsResult.rows
    };

    res.json(ticket);

  } catch (error) {
    console.error('Erreur lors de la récupération du ticket:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Créer un nouveau ticket
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority = 3,
      buildingId,
      apartmentNumber
    } = req.body;

    // Validation des données
    if (!title || !description) {
      return res.status(400).json({ 
        error: 'Titre et description sont requis' 
      });
    }

    if (title.length > 255) {
      return res.status(400).json({ 
        error: 'Le titre ne peut pas dépasser 255 caractères' 
      });
    }

    // Créer le ticket
    const result = await pool.query(
      `INSERT INTO tickets (
        title, description, category, priority, user_id, 
        building_id, apartment_number, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'nouveau')
      RETURNING *`,
      [
        title,
        description,
        category,
        parseInt(priority),
        req.user.userId,
        buildingId ? parseInt(buildingId) : null,
        apartmentNumber
      ]
    );

    const ticket = result.rows[0];

    // Créer une notification pour les administrateurs
    await pool.query(
      `INSERT INTO notifications (user_id, ticket_id, type, title, message)
       SELECT id, $1, 'nouveau_ticket', $2, $3
       FROM users WHERE role IN ('admin', 'gestionnaire')`,
      [
        ticket.id,
        'Nouveau ticket créé',
        `Un nouveau ticket "${title}" a été créé par ${req.user.email}`
      ]
    );

    res.status(201).json({
      message: 'Ticket créé avec succès',
      ticket
    });

  } catch (error) {
    console.error('Erreur lors de la création du ticket:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Mettre à jour un ticket
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      priority,
      status,
      assignedTo,
      estimatedTime,
      actualTime,
      cost
    } = req.body;

    // Vérifier que le ticket existe
    const existingTicket = await pool.query(
      'SELECT * FROM tickets WHERE id = $1',
      [id]
    );

    if (existingTicket.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Ticket non trouvé' 
      });
    }

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      values.push(parseInt(priority));
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;

      // Si le statut est "résolu", ajouter la date de résolution
      if (status === 'resolu') {
        updates.push(`resolved_at = CURRENT_TIMESTAMP`);
      }
    }

    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex}`);
      values.push(assignedTo ? parseInt(assignedTo) : null);
      paramIndex++;
    }

    if (estimatedTime !== undefined) {
      updates.push(`estimated_time = $${paramIndex}`);
      values.push(estimatedTime);
      paramIndex++;
    }

    if (actualTime !== undefined) {
      updates.push(`actual_time = $${paramIndex}`);
      values.push(actualTime);
      paramIndex++;
    }

    if (cost !== undefined) {
      updates.push(`cost = $${paramIndex}`);
      values.push(parseFloat(cost));
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        error: 'Aucune donnée à mettre à jour' 
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE tickets 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Ticket mis à jour avec succès',
      ticket: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du ticket:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Ajouter un commentaire à un ticket
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, isInternal = false } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Le commentaire ne peut pas être vide' 
      });
    }

    // Vérifier que le ticket existe
    const ticketExists = await pool.query(
      'SELECT id FROM tickets WHERE id = $1',
      [id]
    );

    if (ticketExists.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Ticket non trouvé' 
      });
    }

    // Ajouter le commentaire
    const result = await pool.query(
      `INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, req.user.userId, comment.trim(), isInternal]
    );

    // Mettre à jour la date de modification du ticket
    await pool.query(
      'UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.status(201).json({
      message: 'Commentaire ajouté avec succès',
      comment: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Supprimer un ticket (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier les permissions (seuls les admins peuvent supprimer)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Permission insuffisante' 
      });
    }

    const result = await pool.query(
      'UPDATE tickets SET status = \'supprime\', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Ticket non trouvé' 
      });
    }

    res.json({
      message: 'Ticket supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du ticket:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  }
});

module.exports = router;

