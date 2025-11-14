import { Pool } from 'pg';
import 'dotenv/config';

// FIX: Explicitly import `exit` from `process` to resolve TypeScript type errors.
import { exit } from 'process';

// Carrega as variáveis de ambiente
const { PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE } = process.env;

// Validação para garantir que todas as variáveis necessárias estão presentes
if (!PG_HOST || !PG_PORT || !PG_USER || !PG_PASSWORD || !PG_DATABASE) {
  console.error("FATAL ERROR: Missing required PostgreSQL environment variables.");
  console.error("Ensure .env file is created with PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE");
  exit(1);
}

const pool = new Pool({
  host: PG_HOST,
  port: parseInt(PG_PORT, 10),
  user: PG_USER,
  password: PG_PASSWORD,
  database: PG_DATABASE,
  // Configurações adicionais para robustez em produção
  max: 20, // máximo de clientes no pool
  idleTimeoutMillis: 30000, // fecha clientes ociosos após 30s
  connectionTimeoutMillis: 2000, // tempo de espera para uma nova conexão
});

pool.on('connect', () => {
  console.log('Successfully connected to the PostgreSQL database!');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  exit(-1);
});

// Exporta uma função de query para ser usada em toda a aplicação
export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
