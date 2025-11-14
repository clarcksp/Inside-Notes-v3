// FIX: Alias Request and Response to avoid potential name collisions with global types.
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { query } from '../services/db';

/**
 * GET /api/clientes
 * Lista todos os clientes, com suporte a busca por nome_fantasia.
 */
export const getAllClientes = async (req: ExpressRequest, res: ExpressResponse) => {
    const { search } = req.query;
    try {
        let sql = 'SELECT * FROM clientes ORDER BY nome_fantasia ASC';
        const params: string[] = [];
        
        if (search && typeof search === 'string') {
            sql = 'SELECT * FROM clientes WHERE nome_fantasia ILIKE $1 ORDER BY nome_fantasia ASC';
            params.push(`%${search}%`);
        }
        
        const { rows } = await query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching clientes:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET /api/clientes/:id
 * Retorna um cliente específico pelo seu ID.
 */
export const getClienteById = async (req: ExpressRequest, res: ExpressResponse) => {
    const { id } = req.params;
    try {
        const { rows, rowCount } = await query('SELECT * FROM clientes WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Cliente not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`Error fetching cliente with id ${id}:`, err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /api/clientes
 * Cria um novo cliente.
 */
export const createCliente = async (req: ExpressRequest, res: ExpressResponse) => {
    const { nome_fantasia, razao_social, cnpj } = req.body;
    if (!nome_fantasia) {
        return res.status(400).json({ error: 'O campo nome_fantasia é obrigatório.' });
    }
    try {
        const { rows } = await query(
            'INSERT INTO clientes (nome_fantasia, razao_social, cnpj) VALUES ($1, $2, $3) RETURNING *',
            [nome_fantasia, razao_social || null, cnpj || null]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating cliente:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * PUT /api/clientes/:id
 * Atualiza um cliente existente.
 */
export const updateCliente = async (req: ExpressRequest, res: ExpressResponse) => {
    const { id } = req.params;
    const { nome_fantasia, razao_social, cnpj } = req.body;
     if (!nome_fantasia) {
        return res.status(400).json({ error: 'O campo nome_fantasia é obrigatório.' });
    }
    try {
        const { rows, rowCount } = await query(
            'UPDATE clientes SET nome_fantasia = $1, razao_social = $2, cnpj = $3 WHERE id = $4 RETURNING *',
            [nome_fantasia, razao_social || null, cnpj || null, id]
        );
         if (rowCount === 0) {
            return res.status(404).json({ error: 'Cliente not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`Error updating cliente with id ${id}:`, err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * DELETE /api/clientes/:id
 * Exclui um cliente.
 */
export const deleteCliente = async (req: ExpressRequest, res: ExpressResponse) => {
    const { id } = req.params;
    try {
         const { rowCount } = await query('DELETE FROM clientes WHERE id = $1', [id]);
         if (rowCount === 0) {
            return res.status(404).json({ error: 'Cliente not found' });
        }
        res.status(204).send(); // Resposta de sucesso sem conteúdo
    } catch (err) {
        console.error(`Error deleting cliente with id ${id}:`, err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
