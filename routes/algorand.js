const express = require('express');
const router = express.Router();
const {
  generateNewAccount,
  getAccount,
  getWalletInfo,
  getAccountFromMnemonicController,
  sendTransaction,
  createNewAsset,
  transferAssetTokens,
  getAsset,
  getAccountAssetHoldings,
  validateAddress,
  getNetworkInfo
} = require('../controllers/algorandController');

// Account routes
router.post('/account/generate', generateNewAccount);
router.get('/account/:accountAddress', getAccount);
router.get('/account/:accountAddress/assets', getAccountAssetHoldings);
router.post('/account/from-mnemonic', getAccountFromMnemonicController);

// Wallet routes
router.get('/wallet', getWalletInfo);

// Transaction routes
router.post('/transaction/send', sendTransaction);

// Asset routes
router.post('/asset/create', createNewAsset);
router.post('/asset/transfer', transferAssetTokens);
router.get('/asset/:assetId', getAsset);

// Utility routes
router.post('/validate-address', validateAddress);
router.get('/network', getNetworkInfo);

module.exports = router; 