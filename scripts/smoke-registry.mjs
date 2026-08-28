import fs from 'node:fs/promises';
import process from 'node:process';
import { AbiCoder, Contract, JsonRpcProvider, Wallet, getBytes, keccak256, toUtf8Bytes } from 'ethers';

const subjectKey = process.env.OG_PRIVATE_KEY;
if (!subjectKey) throw new Error('OG_PRIVATE_KEY is required.');
const issuerKey = (await fs.readFile('.issuer-private-key', 'utf8')).trim();
const { address } = JSON.parse(await fs.readFile('registry-address.json', 'utf8'));
const provider = new JsonRpcProvider(process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai', 16602, { staticNetwork: true });
const subject = new Wallet(subjectKey, provider);
const issuer = new Wallet(issuerKey);
const registry = new Contract(address, [
  'function claimCredential(bytes32,string,string,uint16,bytes32,uint64,bytes)',
  'function getCredential(bytes32) view returns ((address subject,string skill,string level,uint16 score,bytes32 submissionHash,uint64 issuedAt,address issuer,bool revoked))',
], subject);
const credentialId = keccak256(toUtf8Bytes(`skillchain-v2-smoke-${Date.now()}`));
const submissionHash = keccak256(toUtf8Bytes('SkillChain authorized smoke test'));
const deadline = Math.floor(Date.now() / 1000) + 600;
const encoded = AbiCoder.defaultAbiCoder().encode(
  ['address','uint256','bytes32','address','string','string','uint16','bytes32','uint64'],
  [address, 16602, credentialId, subject.address, 'Solidity', 'Foundational', 77, submissionHash, deadline],
);
const signature = await issuer.signMessage(getBytes(keccak256(encoded)));
const transaction = await registry.claimCredential(credentialId, 'Solidity', 'Foundational', 77, submissionHash, deadline, signature);
await transaction.wait();
const credential = await registry.getCredential(credentialId);
if (credential.subject.toLowerCase() !== subject.address.toLowerCase() || credential.issuer.toLowerCase() !== issuer.address.toLowerCase() || Number(credential.score) !== 77) throw new Error('Authorized registry smoke test failed.');
console.log(`Authorized registry smoke test passed: ${transaction.hash}`);
console.log(`Explorer: https://chainscan-galileo.0g.ai/tx/${transaction.hash}`);
