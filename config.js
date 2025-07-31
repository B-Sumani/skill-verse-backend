require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Algorand Configuration
  algorand: {
    network: process.env.ALGOD_ENDPOINT?.includes('testnet') ? 'testnet' : 'mainnet',
    server: process.env.ALGOD_ENDPOINT || 'https://testnet-api.algonode.cloud',
    port: 443,
    token: process.env.ALGOD_TOKEN || '',
    walletMnemonic: process.env.WALLET_MNEMONIC || '',
    nftAssetId: process.env.NFT_ASSET_ID || ''
  },
  
  // Database Configuration
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/skill-verse'
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://swayamsevakapi.onrender.com',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },
  
  // LiveKit Configuration
  livekit: {
    apiKey: process.env.LIVEKIT_API_KEY || '',
    apiSecret: process.env.LIVEKIT_API_SECRET || '',
    wsUrl: process.env.LIVEKIT_WS_URL || 'wss://your-livekit-url',
    defaultCallDuration: parseInt(process.env.LIVEKIT_DEFAULT_DURATION) || 15 // minutes
  }
};

module.exports = config;
