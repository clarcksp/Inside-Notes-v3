import { Router } from 'express';
import {
    getAllClientes,
    getClienteById,
    createCliente,
    updateCliente,
    deleteCliente
} from '../controllers/clientesController';

const router = Router();

// Define as rotas do CRUD para o recurso 'clientes'
router.get('/', getAllClientes);
router.get('/:id', getClienteById);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

export default router;
