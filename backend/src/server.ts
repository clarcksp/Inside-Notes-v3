import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import clientesRouter from './routes/clientes';
import pool from './services/db';

// FIX: Explicitly type `app` as `Express` to ensure correct type inference for its methods.
const app: Express = express();
const PORT = process.env.PORT || 4000;

// =================================================================
// LOGGING MIDDLEWARE COMPLETO
// =================================================================

// Log de inicialização do servidor
console.log('🚀 [SERVER] Iniciando servidor Express...');
console.log('📋 [CONFIG] Variáveis de ambiente:');
console.log(`   - PORT: ${PORT}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   - PG_HOST: ${process.env.PG_HOST || 'não definido'}`);
console.log(`   - PG_DATABASE: ${process.env.PG_DATABASE || 'não definido'}`);

// Middleware de logging para todas as requisições
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
    
    // Log da resposta quando ela for enviada
    const originalSend = res.send;
    res.send = function(data) {
        console.log(`📤 [${timestamp}] RESPONSE ${res.statusCode} para ${method} ${url}`);
        console.log(`   - Content-Type: ${res.get('Content-Type') || 'não definido'}`);
        console.log(`   - Content-Length: ${res.get('Content-Length') || 'não definido'}`);
        return originalSend.call(this, data);
    };
    
    next();
});

// Middleware
console.log('🔧 [MIDDLEWARE] Configurando middlewares...');
app.use(cors()); // Permite requisições de origens diferentes (nosso frontend)
app.use(express.json()); // Habilita o parsing de body em JSON
app.use(express.urlencoded({ extended: true }));

console.log('✅ [MIDDLEWARE] Middlewares configurados com sucesso');

// Rota de Health Check para verificar a saúde do servidor e do DB
app.get('/api/health', async (req: Request, res: Response) => {
    console.log('🏥 [HEALTH] Verificando saúde do servidor e DB...');
    try {
        // Tenta pegar um cliente do pool para verificar a conexão com o DB
        const client = await pool.connect();
        client.release(); // Libera o cliente de volta para o pool imediatamente
        console.log('✅ [HEALTH] Conexão com DB bem-sucedida');
        res.status(200).json({ 
            status: 'ok', 
            message: 'Backend is running and database connection is successful.',
            timestamp: new Date().toISOString(),
            port: PORT
        });
    } catch (error) {
        console.error('❌ [HEALTH] Erro na conexão com DB:', error);
        res.status(503).json({
            status: 'error',
            message: 'Backend is running, but database connection failed.',
            error: error instanceof Error ? error.message : 'Unknown DB error',
            timestamp: new Date().toISOString(),
            port: PORT
        });
    }
});

// Rota de teste para verificar se o servidor está respondendo
app.get('/api/test', (req: Request, res: Response) => {
    console.log('🧪 [TEST] Rota de teste acessada');
    res.status(200).json({
        message: 'Backend API está funcionando!',
        timestamp: new Date().toISOString(),
        port: PORT,
        method: req.method,
        url: req.url
    });
});

// Rotas da API
console.log('🛣️ [ROUTES] Configurando rotas da API...');
app.use('/api/clientes', clientesRouter);
console.log('✅ [ROUTES] Rotas configuradas: /api/clientes');

// Middleware para capturar rotas não encontradas (404)
app.use('*', (req: Request, res: Response) => {
    const timestamp = new Date().toISOString();
    console.log(`❌ [404] Rota não encontrada: ${req.method} ${req.originalUrl}`);
    console.log(`   - Timestamp: ${timestamp}`);
    console.log(`   - IP: ${req.ip || 'unknown'}`);
    console.log(`   - User-Agent: ${req.get('User-Agent') || 'unknown'}`);
    
    res.status(404).json({
        error: 'Rota não encontrada',
        method: req.method,
        url: req.originalUrl,
        timestamp: timestamp,
        availableRoutes: [
            'GET /api/health',
            'GET /api/test',
            '/api/clientes/*'
        ]
    });
});

// Middleware de tratamento de erros global
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    console.error(`💥 [ERROR] Erro interno do servidor: ${error.message}`);
    console.error(`   - Stack: ${error.stack}`);
    console.error(`   - Timestamp: ${timestamp}`);
    console.error(`   - Request: ${req.method} ${req.originalUrl}`);
    
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
        timestamp: timestamp
    });
});

app.listen(PORT, () => {
    console.log('🎉 [SERVER] Servidor iniciado com sucesso!');
    console.log(`🌐 [SERVER] Backend rodando em http://localhost:${PORT}`);
    console.log('📋 [ROUTES] Rotas disponíveis:');
    console.log('   - GET /api/health - Verificação de saúde');
    console.log('   - GET /api/test - Teste de conectividade');
    console.log('   - /api/clientes/* - Rotas de clientes');
    console.log('🔍 [DEBUG] Logs detalhados ativados para todas as requisições');
});
