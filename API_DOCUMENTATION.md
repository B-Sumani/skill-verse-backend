# Skill Verse API Documentation

## 🔐 Authentication Endpoints

### Signup
**POST** `/api/auth/signup`

Create a new user account with the required information.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "confirmPassword": "securepassword123",
  "skillToTeach": "JavaScript",
  "skillToLearn": "Python",
  "linkedin": "https://linkedin.com/in/johndoe" // optional
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "skills": ["JavaScript"],
        "interests": ["Python"],
        "linkedin": "https://linkedin.com/in/johndoe"
      },
      "algorandAddress": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

**Validation Rules:**
- All fields except `linkedin` are required
- Password must be at least 6 characters
- Passwords must match
- Email must be valid format
- Username must be unique

---

### Signin
**POST** `/api/auth/signin`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "skills": ["JavaScript"],
        "interests": ["Python"],
        "linkedin": "https://linkedin.com/in/johndoe"
      },
      "algorandAddress": null,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

---

### Get Current User
**GET** `/api/auth/me`

Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "skills": ["JavaScript"],
        "interests": ["Python"],
        "linkedin": "https://linkedin.com/in/johndoe"
      },
      "algorandAddress": null,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Logout
**POST** `/api/auth/logout`

Logout user (client-side token removal).

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Refresh Token
**POST** `/api/auth/refresh-token`

Refresh JWT token.

**Request Body:**
```json
{
  "token": "current_jwt_token"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new_jwt_token"
  }
}
```

---

## ⚡ Algorand Blockchain Endpoints

### Generate Account
**POST** `/api/algorand/account/generate`

Generate a new Algorand account.

**Response (Success - 201):**
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

### Get Wallet Info
**GET** `/api/algorand/wallet`

Get wallet information from environment mnemonic.

**Response (Success - 200):**
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
    "nftAssetId": null
  }
}
```

### Send Transaction
**POST** `/api/algorand/transaction/send`

Send ALGO transaction.

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

### Create Asset
**POST** `/api/algorand/asset/create`

Create Algorand Standard Asset.

**Request Body:**
```json
{
  "creatorAddress": "ABC123...",
  "privateKey": "base64-encoded-private-key",
  "assetParams": {
    "name": "MyToken",
    "unitName": "MTK",
    "total": 1000000,
    "decimals": 6
  }
}
```

---

## 🔧 Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "All required fields must be provided"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Conflict Error (409)
```json
{
  "success": false,
  "message": "User with this email or username already exists"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Failed to register user",
  "error": "Error details (development only)"
}
```

---

## 🔒 Authentication

### JWT Token Usage
Include the JWT token in the Authorization header:
```
Authorization: Bearer your_jwt_token_here
```

### Token Expiration
- Default expiration: 7 days
- Configurable in environment variables
- Use refresh token endpoint to get new token

---

## 📝 Usage Examples

### Frontend Integration

**Signup:**
```javascript
const signup = async (userData) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  return response.json();
};
```

**Signin:**
```javascript
const signin = async (email, password) => {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};
```

**Authenticated Request:**
```javascript
const getProfile = async (token) => {
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};
```

---

## 🚀 Getting Started

1. **Set up environment variables:**
   ```bash
   cp env.template .env
   # Edit .env with your values
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **Test the API:**
   ```bash
   curl http://localhost:5000/api/health
   ```

---

## 📚 Additional Resources

- [JWT Documentation](https://jwt.io/)
- [Algorand SDK Documentation](https://developer.algorand.org/docs/sdks/javascript/)
- [bcrypt Documentation](https://github.com/dcodeIO/bcrypt.js/) 