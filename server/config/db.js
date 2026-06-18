import dns from 'dns';
// Only override DNS locally (fixes McAfee/router DNS quirks). Cloud providers have proper DNS.
if (process.env.NODE_ENV !== 'production') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    dns.setDefaultResultOrder('ipv4first');
}

import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            family: 4,
        });
        console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error('✗ MongoDB connection error:', err.message);
        process.exit(1);
    }
};

export default connectDB;