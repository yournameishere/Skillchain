import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { Wallet } from 'ethers';

const issuer = Wallet.createRandom();
await fs.writeFile('.issuer-private-key', issuer.privateKey, { mode: 0o600 });
await fs.writeFile('.assessment-secret', crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
console.log(`Issuer address: ${issuer.address}`);
