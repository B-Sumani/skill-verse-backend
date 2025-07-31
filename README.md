# Skill Verse Backend - Algorand Integration

This backend provides a comprehensive API for Algorand blockchain operations, including account management, transactions, and asset creation.

## 🚀 Features

- **Account Management**: Generate new Algorand accounts
- **Transaction Handling**: Send ALGO transactions between addresses
- **Asset Operations**: Create and transfer Algorand Standard Assets (ASAs)
- **Account Information**: Get account balances and asset holdings
- **Address Validation**: Validate Algorand addresses
- **Network Support**: Testnet and Mainnet support

## 📦 Installation

```bash
npm install
```

## 🔧 Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Algorand Configuration
ALGORAND_NETWORK=testnet
ALGORAND_SERVER=https://testnet-api.algonode.cloud
ALGORAND_PORT=443
ALGORAND_TOKEN=

# For mainnet, use:
# ALGORAND_NETWORK=mainnet
# ALGORAND_SERVER=https://mainnet-api.algonode.cloud
```

## 🏃‍♂️ Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📡 API Endpoints

### Account Operations

#### Generate New Account
```http
POST /api/algorand/account/generate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "ABC123...",
    "mnemonic": "word1 word2 word3...",
    "network": "testnet"
  },
  "message": "Account generated successfully"
}
```

#### Get Account Information
```http
GET /api/algorand/account/:address
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "ABC123...",
    "balance": {
      "microAlgos": 1000000,
      "algos": 1.0
    },
    "assets": [...],
    "accountInfo": {...}
  }
}
```

#### Get Account Assets
```http
GET /api/algorand/account/:address/assets
```

### Transaction Operations

#### Send ALGO Transaction
```http
POST /api/algorand/transaction/send
```

**Request Body:**
```json
{
  "fromAddress": "ABC123...",
  "toAddress": "XYZ789...",
  "amount": 1000000,
  "privateKey": "base64-encoded-private-key",
  "note": "Optional transaction note"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txId": "transaction-id",
    "confirmedRound": 12345,
    "status": "success"
  },
  "message": "Transaction sent successfully"
}
```

### Asset Operations

#### Create New Asset
```http
POST /api/algorand/asset/create
```

**Request Body:**
```json
{
  "creatorAddress": "ABC123...",
  "privateKey": "base64-encoded-private-key",
  "assetParams": {
    "name": "MyToken",
    "unitName": "MTK",
    "total": 1000000,
    "decimals": 6,
    "url": "https://example.com/metadata.json"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txId": "transaction-id",
    "assetId": 12345,
    "status": "success"
  },
  "message": "Asset created successfully"
}
```

#### Transfer Asset
```http
POST /api/algorand/asset/transfer
```

**Request Body:**
```json
{
  "fromAddress": "ABC123...",
  "toAddress": "XYZ789...",
  "assetId": 12345,
  "amount": 100,
  "privateKey": "base64-encoded-private-key"
}
```

#### Get Asset Information
```http
GET /api/algorand/asset/:assetId
```

### Utility Operations

#### Validate Address
```http
POST /api/algorand/validate-address
```

**Request Body:**
```json
{
  "address": "ABC123..."
}
```

#### Get Network Information
```http
GET /api/algorand/network
```

## 🔧 Utility Functions

The backend includes several utility functions for Algorand operations:

- `generateAccount()`: Generate new Algorand account
- `getAccountInfo(address)`: Get account information
- `getAccountBalance(address)`: Get account balance
- `sendAlgoTransaction(from, to, amount, privateKey, note)`: Send ALGO transaction
- `createAsset(creator, privateKey, params)`: Create new ASA
- `transferAsset(from, to, assetId, amount, privateKey)`: Transfer ASA
- `getAssetInfo(assetId)`: Get asset information
- `isValidAddress(address)`: Validate Algorand address
- `algosToMicroAlgos(algos)`: Convert Algos to microAlgos
- `microAlgosToAlgos(microAlgos)`: Convert microAlgos to Algos

## 🌐 Network Configuration

The API supports both Testnet and Mainnet:

- **Testnet**: Default for development and testing
- **Mainnet**: For production use

Configure the network in your `.env` file.

## 🔒 Security Notes

- Private keys are handled securely and should be transmitted over HTTPS
- The API validates all addresses before processing
- Error handling provides detailed feedback for debugging
- All transactions are confirmed before returning results

## 📝 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## 🧪 Testing

Test the API endpoints using tools like Postman or curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Generate account
curl -X POST http://localhost:5000/api/algorand/account/generate

# Get network info
curl http://localhost:5000/api/algorand/network
```

## 📚 Dependencies

- `algosdk`: Algorand JavaScript SDK
- `express`: Web framework
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License. 