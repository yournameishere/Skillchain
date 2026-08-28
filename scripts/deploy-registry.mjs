import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import solc from 'solc';
import { ContractFactory, JsonRpcProvider, Wallet } from 'ethers';

const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const privateKey = process.env.OG_PRIVATE_KEY;
if (!privateKey) throw new Error('OG_PRIVATE_KEY is required. Pass it through the environment, never commit it.');
const issuerAddress = process.env.ISSUER_ADDRESS;
if (!issuerAddress) throw new Error('ISSUER_ADDRESS is required.');

const source = await fs.readFile(path.resolve('contracts/SkillCredentialRegistry.sol'), 'utf8');
const input = {
  language: 'Solidity',
  sources: { 'SkillCredentialRegistry.sol': { content: source } },
  settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } },
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = output.errors?.filter((item) => item.severity === 'error') || [];
if (errors.length) throw new Error(errors.map((item) => item.formattedMessage).join('\n'));
const artifact = output.contracts['SkillCredentialRegistry.sol'].SkillCredentialRegistry;
const provider = new JsonRpcProvider(rpcUrl, 16602, { staticNetwork: true });
const wallet = new Wallet(privateKey, provider);
console.log(`Deploying SkillCredentialRegistry from ${wallet.address} to 0G Galileo...`);
const factory = new ContractFactory(artifact.abi, artifact.evm.bytecode.object, wallet);
const contract = await factory.deploy(issuerAddress);
await contract.waitForDeployment();
const address = await contract.getAddress();
console.log(`Registry deployed at ${address}`);
console.log(`Explorer: https://chainscan-galileo.0g.ai/address/${address}`);
await fs.writeFile(path.resolve('registry-address.json'), JSON.stringify({ address, chainId: 16602, rpcUrl }, null, 2));
