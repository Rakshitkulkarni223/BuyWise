import { userRepository } from '../repositories/UserRepository';
import { preferenceRepository } from '../repositories/PreferenceRepository';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/http';

export class AuthService {
  static async register(input: {
    name: string;
    email: string;
    password: string;
    businessType?: string;
  }) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new ApiError(409, 'An account with this email already exists');

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      businessType: input.businessType || 'general',
    });

    await preferenceRepository.upsert(user.id, {
      businessType: input.businessType || 'general',
    });

    return AuthService.issue(user);
  }

  static async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new ApiError(401, 'Invalid email or password');

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new ApiError(401, 'Invalid email or password');

    return AuthService.issue(user);
  }

  private static issue(user: any) {
    const token = signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    return { token, user: user.toJSON() };
  }
}
