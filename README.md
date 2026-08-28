# SkillChain

SkillChain turns practical software work into portable, verifiable proof. A learner chooses a focused challenge, submits code or notes, receives an evidence-based rubric report, and claims a credential anchored to the 0G Galileo testnet. A public verifier can inspect the credential directly from the registry.

Live app: https://skillchain-sigma.vercel.app  
Registry: [SkillCredentialRegistry on Galileo ChainScan](https://chainscan-galileo.0g.ai/address/0x5b8c1A2a465300a78C2299fa63aBa6aA538E3bE0)

## Product flow

1. Connect an injected EVM wallet. SkillChain requests 0G Galileo (chain ID `16602`) and can add the network when needed. A clearly labelled demo wallet is available for exploring the UI; demo credentials never pretend to be on-chain.
2. Pick Solidity, React, or AI Agents and choose a difficulty.
3. Paste a solution, upload a small source artifact (50 KB maximum), or add a repository reference.
4. The server runs deterministic checks and, when configured, asks the 0G Compute Router for a strict JSON review. Every response includes a signed assessment proof.
5. The server authorizes a short-lived claim for the assessment subject. The connected wallet submits the transaction to `SkillCredentialRegistry`; source code is never written on-chain.
6. Share `/?verify=SC-...`. Public verification reads the deployed registry and shows wallet, score, issuer, issue time, and revocation state.

## Architecture

- `src/main.jsx` — responsive React product flow and wallet UX.
- `src/styles.css` — restrained, tokenized visual system (ink, bone, amber; no gradients).
- `api/evaluate.js` — server-only evaluation, validation, rate limiting, and HMAC proof.
- `api/authorize.js` — verifies the HMAC proof and signs a domain-bound, 10-minute authorization.
- `api/verify.js` — read-only public verification against 0G Galileo.
- `contracts/SkillCredentialRegistry.sol` — on-chain source of truth; claims require the trusted issuer signature and only the owner can revoke.
- `scripts/` — deployment, smoke tests, and secret generation helpers.

## Local development

```bash
npm install
npm run dev
npm run build
```

Copy `.env.example` to `.env.local`. Never commit private keys or API keys. The browser only receives `VITE_REGISTRY_ADDRESS`; issuer and signing secrets remain server-side.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_REGISTRY_ADDRESS` | Vercel + build | Deployed registry address (public). |
| `ISSUER_PRIVATE_KEY` | Vercel production only | Fresh issuer key used by `/api/authorize`. |
| `ASSESSMENT_SECRET` | Vercel production only | HMAC key binding an evaluation to wallet and submission hash. |
| `OG_API_KEY` | Optional Vercel secret | 0G Compute testnet Router key. Missing/rejected keys use a labelled deterministic rubric. |
| `OG_MODEL` | Optional Vercel secret | Router model override; defaults to `qwen2.5-omni`. |

## Deploy

For the registry, provide a funded Galileo deployer and issuer in a local shell or CI secret store:

```bash
set OG_PRIVATE_KEY=...
set ISSUER_ADDRESS=0x...
npm run deploy:registry
npm run smoke:registry
```

Set the printed address as `VITE_REGISTRY_ADDRESS`, then deploy the web app with `npx vercel --prod --scope qwdxqws-projects`. Run `npm run smoke:api` against the production URL after each release. `vercel.json` supplies security headers and a restrictive content-security policy.

## Trust and safety

The registry binds credential ID, subject wallet, skill, level, score, submission fingerprint, deadline, and issuer into a signed authorization. The user wallet still signs the final transaction. Deadlines prevent replay; unauthorized issuers are rejected; verification is read-only and revocation is explicit.

The fallback evaluator is intentionally transparent rather than pretending to be AI. Add a valid Galileo Router key from the official 0G Compute setup to enable AI review; testnet and mainnet keys are separate. The supplied key was rejected by the Router and is not stored by this deployment.

## Status and known boundaries

Production is deployed on 0G Galileo and Vercel. Demo credentials are local-only; real credentials are authoritative on-chain. Account recovery, off-chain repository fetching, and a persistent credential indexer are future features, not hidden behavior.
