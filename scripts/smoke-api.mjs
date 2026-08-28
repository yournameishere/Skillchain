import { AbiCoder, Contract, JsonRpcProvider, getBytes, keccak256, toUtf8Bytes, verifyMessage } from 'ethers';

const appUrl = 'https://skillchain-sigma.vercel.app';
sdf
const registryAddress = '0x5b8c1A2a465300a78C2299fa63aBa6aA538E3bE0';
const subject = '0x10ac9924a78051BdD770978740C5084205cdB628';
const source = 'pragma solidity ^0.8.24; contract Smoke { address public owner; constructor(){owner=msg.sender;} function ping() external pure returns(bool){return true;} }';
const evaluationResponse = await fetch(`${appUrl}/api/evaluate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source, skill: 'solidity', difficulty: 'advanced', github: '', fileName: '', subject }) });
const report = await evaluationResponse.json();
if (!evaluationResponse.ok || !report.assessmentProof) throw new Error(`Evaluation API failed: ${JSON.stringify(report)}`);
const credentialId = `SC-SMOKE-${Date.now()}`;
const authorizationResponse = await fetch(`${appUrl}/api/authorize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credentialId, subject, skill: 'solidity', difficulty: 'advanced', level: 'Foundational', score: report.final, dimensions: report.dimensions, submissionHash: report.submissionHash, assessmentProof: report.assessmentProof }) });
const authorization = await authorizationResponse.json();
if (!authorizationResponse.ok) throw new Error(`Authorization API failed: ${JSON.stringify(authorization)}`);
const encoded = AbiCoder.defaultAbiCoder().encode(['address','uint256','bytes32','address','string','string','uint16','bytes32','uint64'], [registryAddress, 16602, keccak256(toUtf8Bytes(credentialId)), subject, 'solidity', 'Foundational', report.final, `0x${report.submissionHash}`, authorization.deadline]);
const signer = verifyMessage(getBytes(keccak256(encoded)), authorization.signature);
const registry = new Contract(registryAddress, ['function trustedIssuer() view returns (address)'], new JsonRpcProvider('https://evmrpc-testnet.0g.ai', 16602, { staticNetwork: true }));
const trustedIssuer = await registry.trustedIssuer();
if (signer.toLowerCase() !== trustedIssuer.toLowerCase()) throw new Error('Authorization signature does not match the registry issuer.');
console.log(`API smoke test passed with ${report.engine}; authorization signer ${signer}`);
