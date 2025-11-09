import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// You'll need to import your user entity
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';

export class UserSeeder {
    constructor(private connection: DataSource) { }

    async run(): Promise<void> {
        console.log('>> Running user seeder...');

        // Get the repository
        const userRepository = this.connection.getRepository(User);

        // Hash the default password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash('Admin123!', salt);

        // Create admin user if not exists
        const adminExists = await userRepository.findOne({ where: { email: 'admin@example.com' } });

        if (!adminExists) {
            const admin = userRepository.create({
                email: 'admin@example.com',
                firstName: 'Admin',
                lastName: 'User',
                password: hashedPassword,
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                emailVerified: true,
            });

            await userRepository.save(admin);
            console.log('Admin user created');
        } else {
            console.log('Admin user already exists, skipping');
        }

        console.log('User seeding completed');
    }
}
