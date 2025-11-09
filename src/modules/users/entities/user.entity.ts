import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
    BeforeInsert,
    BeforeUpdate,
    OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    BANNED = 'banned',
    PENDING = 'pending',
}

export enum AuthProvider {
    LOCAL = 'local',
    GOOGLE = 'google',
    GITHUB = 'github',
    FACEBOOK = 'facebook',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    firstName: string;

    @Column({ length: 100 })
    lastName: string;

    @Column({ length: 255, nullable: true })
    avatar: string;

    @Index({ unique: true })
    @Column({ length: 255, unique: true })
    email: string;

    @Exclude()
    @Column({ length: 255, nullable: true })
    password: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.PENDING,
    })
    status: UserStatus;

    @Column({
        type: 'enum',
        enum: AuthProvider,
        default: AuthProvider.LOCAL,
    })
    provider: AuthProvider;

    @Column({ nullable: true })
    providerId: string;

    @Column({ type: 'json', nullable: true })
    providerData: any;

    @Column({ default: false })
    emailVerified: boolean;

    @Column({ nullable: true })
    emailVerificationToken: string;

    @Column({ nullable: true })
    passwordResetToken: string;

    @Column({ nullable: true })
    passwordResetExpires: Date;

    @Column({ nullable: true })
    twoFactorSecret: string;

    @Column({ default: false })
    twoFactorEnabled: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password && this.wasPasswordUpdated()) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }

    // Helper method to check if password was updated
    private wasPasswordUpdated(): boolean {
        // Hash always starts with $2b$ for bcrypt
        return this.password !== null && !this.password.startsWith('$2b$');
    }

    // Helper method to check password
    async comparePassword(candidatePassword: string): Promise<boolean> {
        if (!this.password) {
            return Promise.resolve(false);
        }
        return await bcrypt.compare(candidatePassword, this.password);
    }    // Helper method to get full name
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    // Method to convert to a response object (remove sensitive data)
    toResponse() {
        const { password, emailVerificationToken, passwordResetToken, passwordResetExpires, twoFactorSecret, ...responseUser } = this;
        return responseUser;
    }
}
