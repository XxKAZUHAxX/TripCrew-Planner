import mongoose from 'mongoose';

export async function connectDB(uri: string | undefined): Promise<mongoose.Connection> {
    if (!uri) {
        throw new Error('MONGODB_URI is not defined');
    }
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log('MongoDB connected');
    return mongoose.connection;
}
