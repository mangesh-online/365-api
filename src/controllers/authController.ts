import { Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { AppDataSource } from '../database.js';
import { User } from '../entities/User.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const userRepository = AppDataSource.getRepository(User);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const signup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const user = userRepository.create({
      email,
      name,
      password: hashedPassword,
      avatar: `https://ui-avatars.com/api/?name=${name}&background=10B981&color=fff`,
      plan: 'Free',
      xp: 0,
      level: 1,
    });

    const savedUser = await userRepository.save(user);
    const token = generateToken({ userId: savedUser.id, email: savedUser.email });

    res.status(201).json({
      token,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        avatar: savedUser.avatar,
        plan: savedUser.plan,
        xp: savedUser.xp,
        level: savedUser.level,
        role: savedUser.isAdmin ? 'admin' : 'user',
        isAdmin: savedUser.isAdmin,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!user.password) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    console.log('[LOGIN] User authenticated:', {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      role: user.isAdmin ? 'admin' : 'user'
    });

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        xp: user.xp,
        level: user.level,
        role: user.isAdmin ? 'admin' : 'user',
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userRepository.findOne({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      xp: user.xp,
      level: user.level,
      role: user.isAdmin ? 'admin' : 'user',
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const googleLogin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ error: 'Google credential is required' });
      return;
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: 'Invalid Google token' });
      return;
    }

    const { email, name, picture, sub: googleId } = payload;

    // Check if user exists
    let user = await userRepository.findOne({ 
      where: [
        { email },
        { googleId }
      ] 
    });

    if (!user) {
      // Create new user
      user = userRepository.create({
        email: email!,
        name: name || 'Google User',
        avatar: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=10B981&color=fff`,
        googleId,
        plan: 'Free',
        xp: 0,
        level: 1,
        password: '', // No password for Google users
      });
      user = await userRepository.save(user);
    } else if (!user.googleId) {
      // Link existing account with Google
      user.googleId = googleId;
      if (picture) user.avatar = picture;
      user = await userRepository.save(user);
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        xp: user.xp,
        level: user.level,
        joinDate: user.joinDate,
        role: user.isAdmin ? 'admin' : 'user',
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
};

export const updatePlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { plan } = req.body;

    if (!['Free', 'Monthly', 'Annual'].includes(plan)) {
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }

    const user = await userRepository.findOne({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.plan = plan;
    await userRepository.save(user);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      xp: user.xp,
      level: user.level,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
};
