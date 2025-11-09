import { DataSource } from 'typeorm';
import dataSource from '../../data-source';

// Import seeders
import { UserSeeder } from './user.seeder';

async function runSeeds() {
    console.log('Starting database seeding...');

    let connection: DataSource | null = null;

    try {
        // Initialize the database connection
        connection = await dataSource.initialize();
        console.log('Database connection initialized');

        // Run seeders
        console.log('Running seeders...');

        // Add your seeders here
        await new UserSeeder(connection).run();

        console.log('Seeding completed successfully');

    } catch (error) {
        console.error('Error during database seeding:', error);
        throw error;
    } finally {
        if (connection && connection.isInitialized) {
            await connection.destroy();
            console.log('Database connection closed');
        }
    }
}

// Execute the seeding function
runSeeds()
    .then(() => {
        console.log('Database seeding process completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Database seeding process failed:', error);
        process.exit(1);
    });
