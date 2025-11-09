import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
    driver: process.env.STORAGE_DRIVER || 's3', // 's3' or 'local'
    local: {
        uploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads',
    },
}));
