import { User } from '../models/User';

export class UserRepository {
  findByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase().trim() });
  }

  findById(id: string) {
    return User.findById(id);
  }

  create(data: { name: string; email: string; passwordHash: string; role?: string; businessType?: string }) {
    return User.create({ ...data, email: data.email.toLowerCase().trim() });
  }
}

export const userRepository = new UserRepository();
