import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAllResources, getResourceById, createResource } from '../controllers/resourceController.js';

const router = Router();

// Get all resources
router.get('/', getAllResources);

// Get resource by id
router.get('/:id', getResourceById);

// Create resource (admin/auth)
router.post('/', authMiddleware, createResource);

export default router;
