const algosdk = require('algosdk');
const config = require('../config');

// Algorand network configuration
const ALGORAND_NETWORK = config.algorand.network;
const ALGOD_ENDPOINT = config.algorand.server;
const ALGOD_TOKEN = config.algorand.token;
const WALLET_MNEMONIC = config.algorand.walletMnemonic;
const NFT_ASSET_ID = config.algorand.nftAssetId;

// Initialize Algorand client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_ENDPOINT, 443);

/**
 * Generate a new Algorand account
 * @returns {Object} Account object with address and mnemonic
 */
const generateAccount = () => {
  try {
    const account = algosdk.generateAccount();
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
    
    return {
      address: account.addr,
      mnemonic: mnemonic,
      privateKey: Buffer.from(account.sk).toString('base64')
    };
  } catch (error) {
    throw new Error(`Failed to generate account: ${error.message}`);
  }
};

/**
 * Get account from mnemonic
 * @param {string} mnemonic - 25-word mnemonic phrase
 * @returns {Object} Account object with address and private key
 */
const getAccountFromMnemonic = (mnemonic) => {
  try {
    const privateKey = algosdk.mnemonicToSecretKey(mnemonic);
    
    return {
      address: privateKey.addr,
      privateKey: Buffer.from(privateKey.sk).toString('base64')
    };
  } catch (error) {
    throw new Error(`Failed to get account from mnemonic: ${error.message}`);
  }
};

/**
 * Get wallet account (from environment mnemonic)
 * @returns {Object} Wallet account object
 */
const getWalletAccount = () => {
  if (!WALLET_MNEMONIC) {
    throw new Error('WALLET_MNEMONIC not configured in environment');
  }
  return getAccountFromMnemonic(WALLET_MNEMONIC);
};

/**
 * Get account information
 * @param {string} address - Algorand address
 * @returns {Object} Account information
 */
const getAccountInfo = async (address) => {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return accountInfo;
  } catch (error) {
    throw new Error(`Failed to get account info: ${error.message}`);
  }
};

/**
 * Get account balance
 * @param {string} address - Algorand address
 * @returns {number} Account balance in microAlgos
 */
const getAccountBalance = async (address) => {
  try {
    const accountInfo = await getAccountInfo(address);
    return accountInfo.amount;
  } catch (error) {
    throw new Error(`Failed to get account balance: ${error.message}`);
  }
};

/**
 * Send Algo transaction
 * @param {string} fromAddress - Sender address
 * @param {string} toAddress - Recipient address
 * @param {number} amount - Amount in microAlgos
 * @param {string} privateKey - Sender's private key (base64)
 * @param {string} note - Optional transaction note
 * @returns {Object} Transaction result
 */
const sendAlgoTransaction = async (fromAddress, toAddress, amount, privateKey, note = '') => {
  try {
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create transaction
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: fromAddress,
      to: toAddress,
      amount: amount,
      note: new Uint8Array(Buffer.from(note, 'utf8')),
      suggestedParams
    });
    
    // Sign transaction
    const privateKeyBuffer = Buffer.from(privateKey, 'base64');
    const signedTxn = txn.signTxn(privateKeyBuffer);
    
    // Submit transaction
    const txId = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId.txId, 4);
    
    return {
      txId: txId.txId,
      confirmedRound: confirmedTxn['confirmed-round'],
      status: 'success'
    };
  } catch (error) {
    throw new Error(`Failed to send transaction: ${error.message}`);
  }
};

/**
 * Create an Algorand Standard Asset (ASA)
 * @param {string} creatorAddress - Creator address
 * @param {string} privateKey - Creator's private key (base64)
 * @param {Object} assetParams - Asset parameters
 * @returns {Object} Asset creation result
 */
const createAsset = async (creatorAddress, privateKey, assetParams) => {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: creatorAddress,
      total: assetParams.total || 1000000,
      decimals: assetParams.decimals || 0,
      assetName: assetParams.name || 'MyAsset',
      unitName: assetParams.unitName || 'MA',
      assetURL: assetParams.url || '',
      manager: assetParams.manager || creatorAddress,
      reserve: assetParams.reserve || creatorAddress,
      freeze: assetParams.freeze || creatorAddress,
      clawback: assetParams.clawback || creatorAddress,
      suggestedParams
    });
    
    const privateKeyBuffer = Buffer.from(privateKey, 'base64');
    const signedTxn = txn.signTxn(privateKeyBuffer);
    
    const txId = await algodClient.sendRawTransaction(signedTxn).do();
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId.txId, 4);
    
    return {
      txId: txId.txId,
      assetId: confirmedTxn['asset-index'],
      status: 'success'
    };
  } catch (error) {
    throw new Error(`Failed to create asset: ${error.message}`);
  }
};

/**
 * Transfer an Algorand Standard Asset
 * @param {string} fromAddress - Sender address
 * @param {string} toAddress - Recipient address
 * @param {number} assetId - Asset ID
 * @param {number} amount - Amount to transfer
 * @param {string} privateKey - Sender's private key (base64)
 * @returns {Object} Transfer result
 */
const transferAsset = async (fromAddress, toAddress, assetId, amount, privateKey) => {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: fromAddress,
      to: toAddress,
      assetIndex: assetId,
      amount: amount,
      suggestedParams
    });
    
    const privateKeyBuffer = Buffer.from(privateKey, 'base64');
    const signedTxn = txn.signTxn(privateKeyBuffer);
    
    const txId = await algodClient.sendRawTransaction(signedTxn).do();
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId.txId, 4);
    
    return {
      txId: txId.txId,
      confirmedRound: confirmedTxn['confirmed-round'],
      status: 'success'
    };
  } catch (error) {
    throw new Error(`Failed to transfer asset: ${error.message}`);
  }
};

/**
 * Get asset information
 * @param {number} assetId - Asset ID
 * @returns {Object} Asset information
 */
const getAssetInfo = async (assetId) => {
  try {
    const assetInfo = await algodClient.getAssetByID(assetId).do();
    return assetInfo;
  } catch (error) {
    throw new Error(`Failed to get asset info: ${error.message}`);
  }
};

/**
 * Get account's asset holdings
 * @param {string} address - Account address
 * @returns {Array} Array of asset holdings
 */
const getAccountAssets = async (address) => {
  try {
    const accountInfo = await getAccountInfo(address);
    return accountInfo.assets || [];
  } catch (error) {
    throw new Error(`Failed to get account assets: ${error.message}`);
  }
};

/**
 * Check if address is valid
 * @param {string} address - Algorand address to validate
 * @returns {boolean} True if valid, false otherwise
 */
const isValidAddress = (address) => {
  try {
    return algosdk.isValidAddress(address);
  } catch (error) {
    return false;
  }
};

/**
 * Convert Algos to microAlgos
 * @param {number} algos - Amount in Algos
 * @returns {number} Amount in microAlgos
 */
const algosToMicroAlgos = (algos) => {
  return algos * 1000000;
};

/**
 * Convert microAlgos to Algos
 * @param {number} microAlgos - Amount in microAlgos
 * @returns {number} Amount in Algos
 */
const microAlgosToAlgos = (microAlgos) => {
  return microAlgos / 1000000;
};

module.exports = {
  generateAccount,
  getAccountFromMnemonic,
  getWalletAccount,
  getAccountInfo,
  getAccountBalance,
  sendAlgoTransaction,
  createAsset,
  transferAsset,
  getAssetInfo,
  getAccountAssets,
  isValidAddress,
  algosToMicroAlgos,
  microAlgosToAlgos,
  ALGORAND_NETWORK,
  NFT_ASSET_ID
}; 