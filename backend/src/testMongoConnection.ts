import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

function buildDirectUriFromAtlasSrv(uri: string): string | null {
    if (!uri.startsWith('mongodb+srv://')) {
        return null;
    }

    try {
        const withoutScheme = uri.substring('mongodb+srv://'.length);
        const atIndex = withoutScheme.indexOf('@');
        if (atIndex === -1) {
            return null;
        }

        const auth = withoutScheme.substring(0, atIndex);
        const hostAndParams = withoutScheme.substring(atIndex + 1);
        const slashIndex = hostAndParams.indexOf('/');
        const host = slashIndex === -1 ? hostAndParams : hostAndParams.substring(0, slashIndex);
        const queryIndex = host.indexOf('?');
        const cleanHost = queryIndex === -1 ? host : host.substring(0, queryIndex);

        return `mongodb://${auth}@${cleanHost}/?authSource=admin&tls=true`;
    } catch {
        return null;
    }
}

async function testConnection() {
    const uri = process.env.DATABASE_URL as string | undefined;
    if (!uri) {
        console.error('No DATABASE_URL found in environment');
        process.exit(1);
    }

    try {
        console.log('Testing MongoDB connection (will not print URI)...');
        mongoose.set('debug', false);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000, connectTimeoutMS: 30000 });
        console.log('MongoDB connection successful (SRV)');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err: any) {
        console.error('SRV connection failed — summary:');
        if (err.name) console.error('Error name:', err.name);
        if (err.message) console.error('Message:', err.message);
        if (err.stack) console.error('Stack:', err.stack);

        // Try direct connection to a single replica (non-SRV)
        try {
            console.log('\nAttempting direct connection to a single replica (non-SRV)...');
            const directUri = buildDirectUriFromAtlasSrv(uri) || uri;

            console.log('Trying direct connect (will not print URI)...');
            await mongoose.connect(directUri, { serverSelectionTimeoutMS: 15000, connectTimeoutMS: 15000 });
            console.log('MongoDB direct connection successful');
            await mongoose.disconnect();
            process.exit(0);
        } catch (err2: any) {
            console.error('Direct connection failed — summary:');
            if (err2.name) console.error('Error name:', err2.name);
            if (err2.message) console.error('Message:', err2.message);
            if (err2.stack) console.error('Stack:', err2.stack);
            process.exit(1);
        }
    }
}

testConnection();
