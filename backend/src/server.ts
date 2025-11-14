import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import clientesRouter from './routes/clientes';
import pool from './services/db';
import fs from 'fs';

const app: Express = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_PATH = path.resolve('/usr/src/frontend/dist');

console.log('🚀 [SERVER] Iniciando servidor Express...');
console.log('📋 [CONFIG] Variáveis de ambiente:');
console.log(`   - PORT: ${PORT}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   - Frontend Path: ${FRONTEND_PATH}`);

// Verifica se o diretório de frontend existe
if (!fs.existsSync(FRONTEND_PATH)) {
    console.error(`❌ [ERRO CRÍTICO] Diretório de frontend não encontrado: ${FRONTEND_PATH}`);
    console.error('Conteúdo do diretório /usr/src:');
    console.error(fs.readdirSync('/usr/src'));
}

// Middleware de logging detalhado
app.use((req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const userAgent = req.get('User-Agent') || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    console.log(`📥 [${timestamp}] ${method} ${url}`);
    console.log(`   - IP: ${ip}`);
    console.log(`   - User-Agent: ${userAgent}`);
    console.log(`   - Headers: ${JSON.stringify(req.headers, null, 2)}`);
    
    next();
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(FRONTEND_PATH));

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

// Rota para servir o index.html para todas as rotas do frontend (SPA)
app.get('*', (req: Request, res: Response) => {
    const indexPath = path.join(FRONTEND_PATH, 'index.html');
    console.log(`🌐 [FRONTEND] Tentando servir index.html: ${indexPath}`);
    
    // Log de debug para verificar conteúdo do diretório
    try {
        const files = fs.readdirSync(FRONTEND_PATH);
        console.log('📁 [DEBUG] Arquivos no diretório frontend:', files);
    } catch (err) {
        console.error('❌ [ERRO] Não foi possível listar arquivos:', err);
    }

    // Verifica se o arquivo index.html existe
    if (fs.existsSync(indexPath)) {
        console.log(`✅ [FRONTEND] Servindo index.html para rota: ${req.url}`);
        res.sendFile(indexPath);
    } else {
        console.error(`❌ [ERRO] index.html não encontrado em: ${indexPath}`);
        res.status(404).json({
            error: 'Frontend não encontrado',
            message: 'Arquivos do frontend não estão no local esperado',
            path: indexPath
        });
    }
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
    console.log(`📁 [SERVER] Servindo frontend de: ${FRONTEND_PATH}`);
});
