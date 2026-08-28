import { createHmac, timingSafeEqual } from 'node:crypto';
import { AbiCoder, Wallet, getAddress, getBytes, keccak256, toUtf8Bytes } from 'ethers';
import { rateLimit } from './_rateLimit.js';

function safeEqual(left, right) {
  try { const a = Buffer.from(left, 'hex'); const b = Buffer.from(right, 'hex'); return a.length === b.length && timingSafeEqual(a, b); } catch { return false; }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  if (!rateLimit(request, 12)) return response.status(429).json({ error: 'Too many authorization requests. Try again shortly.' });
  const secret = process.env.ASSESSMENT_SECRET;
  const issuerKey = process.env.ISSUER_PRIVATE_KEY;
  const registryAddress = process.env.VITE_REGISTRY_ADDRESS;
  if (!secret || !issuerKey || !registryAddress) return response.status(503).json({ error: 'Credential authorization is not configured.' });
  try {
    const { credentialId, subject, skill, difficulty, score, dimensions, submissionHash, assessmentProof } = request.body || {};
    const final = Number(score);
    if (!credentialId || !skill || !Array.isArray(dimensions) || !/^[a-f0-9]{64}$/i.test(submissionHash || '') || final < 0 || final > 100) throw new Error('Invalid credential request.');
    const normalizedSubject = getAddress(subject);
    const canonical = JSON.stringify({ subject: normalizedSubject.toLowerCase(), skill: String(skill).toLowerCase(), difficulty, final, dimensions, submissionHash });
    const expected = createHmac('sha256', secret).update(canonical).digest('hex');
    if (!safeEqual(expected, assessmentProof)) throw new Error('Assessment proof is invalid.');
    const level = final >= 90 ? 'Advanced' : final >= 78 ? 'Intermediate' : 'Foundational';
    const registryId = keccak256(toUtf8Bytes(credentialId));
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const encoded = AbiCoder.defaultAbiCoder().encode(
      ['address','uint256','bytes32','address','string','string','uint16','bytes32','uint64'],
      [registryAddress, 16602, registryId, normalizedSubject, skill, level, final, `0x${submissionHash}`, deadline],
    );
    const digest = keccak256(encoded);
    const signature = await new Wallet(issuerKey).signMessage(getBytes(digest));
    return response.status(200).json({ registryId, signature, deadline });
  } catch (error) {
    return response.status(400).json({ error: error instanceof Error ? error.message : 'Authorization failed.' });
  }
}
