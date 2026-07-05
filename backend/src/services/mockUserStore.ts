import bcrypt from 'bcrypt';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  waiverSigned: boolean;
  isAdmin: boolean;
  createdAt: Date;
}

class MockUserStore {
  private users: Map<string, UserRecord> = new Map();
  private nextId = 1;

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserRecord> {
    // Check if user exists
    const existing = await this.findUserByEmail(data.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user: UserRecord = {
      id: `user_${this.nextId++}`,
      name: data.name,
      email: data.email,
      passwordHash,
      waiverSigned: false,
      isAdmin: false,
      createdAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  async verifyPassword(user: UserRecord, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) || null;
  }

  async setWaiverSigned(id: string, waiverSigned: boolean): Promise<UserRecord | null> {
    const user = await this.getUserById(id);

    if (!user) {
      return null;
    }

    const updatedUser = {
      ...user,
      waiverSigned,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }
}

export default new MockUserStore();
