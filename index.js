const fs = require('fs');
const solc = require('solc');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;

const CONTRACT_NAME = '<CONTRACT_NAME>';
const DOCUMENT_TITLE = '<DOCUMENT_TITLE>';
const DOCUMENT_URL = '<DOCUMENT_URL>';
const ACCOUNT_ADDRESS = '<ACCOUNT_ADDRESS>';
const PRIVATE_KEY = '<PRIVATE_KEY>';
const WEB3_PROVIDER_URL = '<WEB3_PROVIDER_URL>';

const web3 = new Web3(WEB3_PROVIDER_URL);

(async function() {
  const rawCodeFs = fs.readFileSync(`${__dirname}/${CONTRACT_NAME}.sol`);
  const rawcode = rawCodeFs.toString();

  const input = {
    language: 'Solidity',
    sources: { [`${CONTRACT_NAME}`]: { content: rawcode } },
    settings: { outputSelection: { '*': { '*': ['*'] } } }
  };

  const contractBytecode = JSON.parse(solc.compile(JSON.stringify(input))).contracts[`${CONTRACT_NAME}`][`${CONTRACT_NAME}`].evm.bytecode.object;

  const encodedParameters = web3.eth.abi.encodeParameters(
    [ 'string', 'string'],
    [DOCUMENT_TITLE, DOCUMENT_URL]
  ).slice(2);
  const bytecodeWithEncodedParameters = contractBytecode + encodedParameters;

  const nonce = await web3.eth.getTransactionCount(ACCOUNT_ADDRESS);
  const gasPrice = await web3.eth.getGasPrice();
  const gasLimit = await web3.eth.estimateGas({ bytecodeWithEncodedParameters });
  const privateKey = Buffer.from(PRIVATE_KEY, 'hex');

  const txObject = {
    nonce: web3.utils.toHex(nonce),
    gasLimit: web3.utils.toHex(gasLimit),
    gasPrice: web3.utils.toHex(gasPrice),
    data: `0x${bytecodeWithEncodedParameters}`,
    chainId: 3
  };

  const tx = new Tx(txObject);
  tx.sign(privateKey);

  const serializedTx = tx.serialize();
  const raw = '0x' + serializedTx.toString('hex');

  const txReceipt = await web3.eth.sendSignedTransaction(raw);
  console.log('Contract Address:', txReceipt.contractAddress);
  console.log('Transaction Hash:', txReceipt.transactionHash);
})();
