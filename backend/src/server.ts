import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import clientesRouter from './routes/clientes';
import pool from './services/db';

// FIX: Explicitly type `app` as `Express` to ensure correct type inference for its methods.
const app: Express = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // Permite requisições de origens diferentes (nosso frontend)
app.use(express.json()); // Habilita o parsing de body em JSON
app.use(express.urlencoded({ extended: true }));

// Rota de Health Check para verificar a saúde do servidor e do DB
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        // Tenta pegar um cliente do pool para verificar a conexão com o DB
        const client = await pool.connect();
        client.release(); // Libera o cliente de volta para o pool imediatamente
        res.status(200).json({ 
            status: 'ok', 
            message: 'Backend is running and database connection is successful.' 
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            message: 'Backend is running, but database connection failed.',
            error: error instanceof Error ? error.message : 'Unknown DB error'
        });
    }
});


// Rotas da API
app.use('/api/clientes', clientesRouter);
// ... futuras rotas para /api/usuarios, /api/visitas etc.


app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
