import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import clientesRouter from './routes/clientes';
import pool from './services/db';

const app: Express = express();
const PORT = process.env.PORT || 4000;

console.log('🚀 [SERVER] Iniciando servidor Express...');
console.log('📋 [CONFIG] Variáveis de ambiente:');
console.log(`   - PORT: ${PORT}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use('/api/clientes', clientesRouter);

// Rotas de Health Check e Teste
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const client = await pool.connect();
        client.release();
        res.status(200).json({ 
            status: 'ok', 
            message: 'Backend is running and database connection is successful.',
            timestamp: new Date().toISOString(),
            port: PORT
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            message: 'Backend is running, but database connection failed.',
            error: error instanceof Error ? error.message : 'Unknown DB error',
            timestamp: new Date().toISOString(),
            port: PORT
        });
    }
});

app.get('/api/test', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Backend API está funcionando!',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Middleware de tratamento de erros global
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`💥 [ERROR] Erro interno do servidor: ${error.message}`);
    console.error(`   - Stack: ${error.stack}`);
    
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log('🎉 [SERVER] Servidor iniciado com sucesso!');
    console.log(`🌐 [SERVER] Backend rodando em http://localhost:${PORT}`);
});
