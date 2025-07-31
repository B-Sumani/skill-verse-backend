const {
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
} = require('../utils/algorand');

/**
 * Generate a new Algorand account
 * @route POST /api/algorand/account/generate
 */
const generateNewAccount = async (req, res) => {
  try {
    const account = generateAccount();
    
    res.status(201).json({
      success: true,
      data: {
        address: account.address,
        mnemonic: account.mnemonic,
        network: ALGORAND_NETWORK
      },
      message: 'Account generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get account information
 * @route GET /api/algorand/account/:address
 */
const getAccount = async (req, res) => {
  try {
    const { accountAddress } = req.params;
    
    if (!isValidAddress(accountAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Algorand address'
      });
    }
    
    const accountInfo = await getAccountInfo(accountAddress);
    const balance = await getAccountBalance(accountAddress);
    const assets = await getAccountAssets(accountAddress);
    
    res.status(200).json({
      success: true,
      data: {
        address: accountAddress,
        balance: {
          microAlgos: balance,
          algos: microAlgosToAlgos(balance)
        },
        assets,
        accountInfo
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Send Algo transaction
 * @route POST /api/algorand/transaction/send
 */
const sendTransaction = async (req, res) => {
  try {
    const { fromAddress, toAddress, amount, privateKey, note } = req.body;
    
    // Validate required fields
    if (!fromAddress || !toAddress || !amount || !privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fromAddress, toAddress, amount, privateKey'
      });
    }
    
    // Validate addresses
    if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Algorand address'
      });
    }
    
    // Convert amount to microAlgos if needed
    const amountInMicroAlgos = amount <= 1000000 ? amount : algosToMicroAlgos(amount);
    
    const result = await sendAlgoTransaction(
      fromAddress,
      toAddress,
      amountInMicroAlgos,
      privateKey,
      note || ''
    );
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Transaction sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create a new Algorand Standard Asset
 * @route POST /api/algorand/asset/create
 */
const createNewAsset = async (req, res) => {
  try {
    const { creatorAddress, privateKey, assetParams } = req.body;
    
    if (!creatorAddress || !privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: creatorAddress, privateKey'
      });
    }
    
    if (!isValidAddress(creatorAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid creator address'
      });
    }
    
    const result = await createAsset(creatorAddress, privateKey, assetParams || {});
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Asset created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Transfer an Algorand Standard Asset
 * @route POST /api/algorand/asset/transfer
 */
const transferAssetTokens = async (req, res) => {
  try {
    const { fromAddress, toAddress, assetId, amount, privateKey } = req.body;
    
    if (!fromAddress || !toAddress || !assetId || !amount || !privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fromAddress, toAddress, assetId, amount, privateKey'
      });
    }
    
    if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Algorand address'
      });
    }
    
    const result = await transferAsset(fromAddress, toAddress, assetId, amount, privateKey);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Asset transferred successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get asset information
 * @route GET /api/algorand/asset/:assetId
 */
const getAsset = async (req, res) => {
  try {
    const { assetId } = req.params;
    
    if (!assetId || isNaN(assetId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid asset ID'
      });
    }
    
    const assetInfo = await getAssetInfo(parseInt(assetId));
    
    res.status(200).json({
      success: true,
      data: assetInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get account's asset holdings
 * @route GET /api/algorand/account/:address/assets
 */
const getAccountAssetHoldings = async (req, res) => {
  try {
    const { accountAddress } = req.params;
    
    if (!isValidAddress(accountAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Algorand address'
      });
    }
    
    const assets = await getAccountAssets(accountAddress);
    
    res.status(200).json({
      success: true,
      data: {
        address: accountAddress,
        assets
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Validate Algorand address
 * @route POST /api/algorand/validate-address
 */
const validateAddress = async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }
    
    const isValid = isValidAddress(address);
    
    res.status(200).json({
      success: true,
      data: {
        address,
        isValid
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get wallet information
 * @route GET /api/algorand/wallet
 */
const getWalletInfo = async (req, res) => {
  try {
    const walletAccount = getWalletAccount();
    const balance = await getAccountBalance(walletAccount.address);
    const assets = await getAccountAssets(walletAccount.address);
    
    res.status(200).json({
      success: true,
      data: {
        address: walletAccount.address,
        balance: {
          microAlgos: balance,
          algos: microAlgosToAlgos(balance)
        },
        assets,
        nftAssetId: NFT_ASSET_ID || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get account from mnemonic
 * @route POST /api/algorand/account/from-mnemonic
 */
const getAccountFromMnemonicController = async (req, res) => {
  try {
    const { mnemonic } = req.body;
    
    if (!mnemonic) {
      return res.status(400).json({
        success: false,
        message: 'Mnemonic is required'
      });
    }
    
    const account = getAccountFromMnemonic(mnemonic);
    const balance = await getAccountBalance(account.address);
    const assets = await getAccountAssets(account.address);
    
    res.status(200).json({
      success: true,
      data: {
        address: account.address,
        balance: {
          microAlgos: balance,
          algos: microAlgosToAlgos(balance)
        },
        assets
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get network information
 * @route GET /api/algorand/network
 */
const getNetworkInfo = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        network: ALGORAND_NETWORK,
        description: ALGORAND_NETWORK === 'testnet' 
          ? 'Algorand Testnet - Use for development and testing'
          : 'Algorand Mainnet - Production network',
        nftAssetId: NFT_ASSET_ID || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
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
}; 