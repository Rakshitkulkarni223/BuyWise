import { Request, Response } from 'express';
import { asyncHandler, ok } from '../utils/http';
import { AuthService } from '../services/AuthService';
import { userRepository } from '../repositories/UserRepository';
import { registerSchema, loginSchema } from '../validators/schemas';

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const result = await AuthService.register(input);
    return ok(res, result, 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await AuthService.login(email, password);
    return ok(res, result);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await userRepository.findById(req.user!.sub);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return ok(res, user.toJSON());
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    // Stateless JWT: the client discards the token. Endpoint provided for parity.
    return ok(res, { message: 'Logged out' });
  }),
};
