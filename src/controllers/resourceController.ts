import { Response } from 'express';
import { AppDataSource } from '../database.js';
import { Resource } from '../entities/Resource.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const resourceRepo = AppDataSource.getRepository(Resource);

export const getAllResources = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resources = await resourceRepo.find({ order: { createdAt: 'DESC' } });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
};

export const getResourceById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const r = await resourceRepo.findOne({ where: { id } });
    if (!r) return res.status(404).json({ error: 'Resource not found' });
    res.json(r);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
};

export const createResource = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, type, category, description, previewContent, audioSrc } = req.body;
    const resource = resourceRepo.create({ title, type, category, description, previewContent, audioSrc });
    const saved = await resourceRepo.save(resource);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create resource' });
  }
};
