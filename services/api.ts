import type { UsuarioTecnico, Cliente, UserRole } from '../types';

const API_BASE_URL = '/api'; // Rota relativa para o proxy reverso (Nginx) lidar

// --- Camada de Simulação (In-memory) para Usuários ---
// Será substituída quando a API de usuários for implementada no backend.
let USERS: UsuarioTecnico[] = [
    { id: 1, nome: 'Admin Teste', email: 'admin@inside.local', role: 'ADM', setor: 'Administração' },
    { id: 2, nome: 'Ronaldo Costa', email: 'ronaldo.costa@inside.local', role: 'Padrão', setor: 'Técnico' },
    { id: 3, nome: 'Jane Doe', email: 'jane.doe@inside.local', role: 'Padrão', setor: 'Suporte N1' },
];
let nextUserId = USERS.length + 1;
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- Funções da API Real ---

/**
 * Verifica a saúde do servidor backend.
 * @returns {Promise<boolean>} Retorna `true` se o servidor estiver online.
 */
export const checkApiHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error("Falha na verificação de saúde da API:", error);
        return false;
    }
};

/**
 * GET /api/clientes
 * Busca todos os clientes do backend real.
 */
export const fetchClients = async (): Promise<Cliente[]> => {
    console.log("API: Buscando clientes do backend...");
    const response = await fetch(`${API_BASE_URL}/clientes`);
    if (!response.ok) {
        const errorData = await response.text();
        console.error("Erro ao buscar clientes:", errorData);
        throw new Error('Falha ao buscar clientes do servidor.');
    }
    return response.json();
};


// --- Funções da API Simulada (para Usuários) ---

/**
 * GET /api/users (Simulado)
 * Busca todos os usuários.
 */
export const fetchUsers = async (): Promise<UsuarioTecnico[]> => {
    console.log("API_MOCK: Buscando todos os usuários...");
    await delay(500); // Simula latência da rede
    return [...USERS];
};

/**
 * POST /api/users (Simulado)
 * Cria um novo usuário.
 */
export const createUser = async (userData: Omit<UsuarioTecnico, 'id'>): Promise<UsuarioTecnico> => {
    console.log("API_MOCK: Criando usuário...", userData);
    await delay(400);
    const newUser: UsuarioTecnico = {
        ...userData,
        id: nextUserId++,
    };
    USERS.push(newUser);
    return newUser;
};

/**
 * PUT /api/users/:id (Simulado)
 * Atualiza um usuário existente.
 */
export const updateUser = async (userData: UsuarioTecnico): Promise<UsuarioTecnico> => {
    console.log("API_MOCK: Atualizando usuário...", userData);
    await delay(400);
    const userIndex = USERS.findIndex(u => u.id === userData.id);
    if (userIndex === -1) {
        throw new Error("User not found");
    }
    USERS[userIndex] = userData;
    return userData;
};

// Futuramente, você adicionaria aqui as funções para gerenciar visitas e anotações:
// export const fetchVisits = async (): Promise<VisitaTecnica[]> => { ... };
// export const createVisit = async (visitData: Omit<VisitaTecnica, 'id'>): Promise<VisitaTecnica> => { ... };
// etc.
