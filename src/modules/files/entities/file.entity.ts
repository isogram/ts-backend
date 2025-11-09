import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';

export enum FileAccessLevel {
    PUBLIC = 'public',
    PRIVATE = 'private',
}

@Entity('files')
export class FileEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    filename: string;

    @Column()
    originalName: string;

    @Column()
    size: number;

    @Column()
    mimeType: string;

    @Column()
    key: string;

    @Column({ nullable: true })
    bucket: string;

    @Column({ nullable: true })
    path: string;

    @Column({ nullable: true })
    url: string;

    @Column({
        type: 'enum',
        enum: FileAccessLevel,
        default: FileAccessLevel.PRIVATE,
    })
    accessLevel: FileAccessLevel;

    @Column({ type: 'uuid', nullable: true })
    @Index()
    userId: string | null;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
