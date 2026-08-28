import { Contract, JsonRpcProvider, keccak256, toUtf8Bytes } from 'ethers';
import { rateLimit } from './_rateLimit.js';

const RPC_URL = 'https://evmrpc-testnet.0g.ai';
const CHAIN_ID = 16602;
const REGISTRY_ABI = [
  'function getCredential(bytes32 credentialId) view returns ((address subject,string skill,string level,uint16 score,bytes32 submissionHash,uint64 issuedAt,address issuer,bool revoked))',
];

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  if (!rateLimit(request, 30)) return response.status(429).json({ error: 'Too many verification requests. Try again shortly.' });

  const id = String(request.query?.id || '').trim().toUpperCase();
  if (!/^SC-[A-Z0-9-]{4,48}$/.test(id)) {
    return response.status(400).json({ error: 'Enter a valid SkillChain credential ID.' });
  }

  const registryAddress = process.env.VITE_REGISTRY_ADDRESS;
  if (!registryAddress) return response.status(503).json({ error: 'Credential registry is not configured.' });

  try {
    const provider = new JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true });
    const registry = new Contract(registryAddress, REGISTRY_ABI, provider);
    const registryId = keccak256(toUtf8Bytes(id));
    const credential = await registry.getCredential(registryId);

    return response.status(200).json({
      id,
      registryId,
      wallet: credential.subject,
      skill: credential.skill,
      level: credential.level,
      score: Number(credential.score),
      submissionHash: credential.submissionHash,
      issuedAt: new Date(Number(credential.issuedAt) * 1000).toISOString(),
      issuer: credential.issuer,
      revoked: credential.revoked,
      demo: false,
      onchain: true,
    });
  } catch (error) {
    const missing = /credential (not found|missing)/i.test(`${error?.reason || ''} ${error?.shortMessage || ''}`);
    if (missing) return response.status(404).json({ error: 'Credential not found.' });
    console.error('Credential verification failed:', error?.shortMessage || error?.message || error);
    return response.status(502).json({ error: 'Could not read the 0G registry. Try again shortly.' });
  }
}
