# SkillChain

SkillChain turns practical software work into portable, verifiable proof. A learner chooses a focused challenge, submits code or technical notes, receives an evidence-based rubric report, and claims a credential anchored to the 0G Galileo testnet. Anyone can independently verify a real credential from the deployed registry.

Live app: https://skillchain-sigma.vercel.app  
Registry: [SkillCredentialRegistry on Galileo ChainScan](https://chainscan-galileo.0g.ai/address/0x5b8c1A2a465300a78C2299fa63aBa6aA538E3bE0)

## What SkillChain is

SkillChain is a proof-of-skill platform for developers and technical builders. Traditional profiles usually show what someone says they know. SkillChain focuses on what they can demonstrate through practical work.

Each credential connects four pieces of evidence:

- A focused, practical challenge.
- A scored assessment report with a visible rubric.
- A fingerprint of the submitted work without publishing the source code.
- An on-chain record connected to the learner's wallet.

The result is a portable credential that a recruiter, community, collaborator, or protocol can verify instead of trusting a screenshot or self-reported badge.

## Why SkillChain matters

Certificates and profile claims can be difficult to validate. They often prove attendance rather than practical ability. SkillChain is designed around evidence: complete a task, understand the evaluation, connect the result to a wallet, and make the proof independently verifiable.

The product keeps the learner in control. Submitted source remains private, demo activity is clearly labelled, deterministic fallback results never pretend to be AI output, and the on-chain registry remains the source of truth for real credentials.

## Who it is for

- Developers who want credible proof of Solidity, React, AI agent, and future technical skills.
- Recruiters and teams that need a fast way to validate practical ability.
- Learning communities that want project-based credentials rather than completion certificates.
- Hackathons and contributor programs that need transparent achievement records.
- Protocols and DAOs that want wallet-native proof before assigning work, roles, or access.

## What the app does today

- Connects an injected EVM wallet and configures 0G Galileo automatically.
- Provides a clearly labelled demo mode for users without a wallet.
- Offers Solidity, React, and AI Agent assessment tracks.
- Supports beginner, intermediate, and advanced difficulty levels.
- Accepts pasted solutions, uploaded source files, and repository references.
- Runs deterministic assessment checks and supports optional 0G Compute review.
- Displays correctness, security, architecture, testing, and efficiency scores.
- Produces a signed, wallet-bound assessment authorization.
- Anchors real credentials through `SkillCredentialRegistry` on 0G Galileo.
- Keeps submitted source code private and stores only its fingerprint on-chain.
- Provides public, registry-backed credential verification.
- Creates shareable verification links using `/?verify=SC-...`.
- Detects revoked credentials and displays their status clearly.
- Saves the user's local credential history for convenient access.
- Includes focused Overview, Assessments, Challenge, Report, Credentials, Verification, and How It Works experiences.

## Product flow

1. Connect an injected EVM wallet. SkillChain requests 0G Galileo, chain ID `16602`, and can add the network when needed. A clearly labelled demo wallet is available for exploring the interface.
2. Pick Solidity, React, or AI Agents and choose a difficulty.
3. Paste a solution, upload a source file of up to 50 KB, or add a repository reference.
4. The server runs deterministic checks and, when configured, asks the 0G Compute Router for a strict JSON review. Every accepted response includes a signed assessment proof.
5. Review the complete score breakdown and evidence summary.
6. The server authorizes a short-lived claim for the assessed wallet. The connected wallet submits the transaction to `SkillCredentialRegistry`; source code is never written on-chain.
7. Share `/?verify=SC-...`. Public verification reads the deployed registry and displays the wallet, score, issuer, issue time, and revocation state.

## August 2026 release update

This release moved SkillChain from a visual prototype to a working testnet product.

### Product and UX

- Reworked the interface into focused page-level experiences instead of placing every feature on one screen.
- Added a dedicated How It Works page with the assessment journey, privacy explanation, network information, and registry utility.
- Refined desktop, tablet, and mobile layouts.
- Kept the visual system to a restrained ink, bone, and amber palette with no gradients.
- Added consistent empty, loading, success, error, revoked, connected, disconnected, and demo states.
- Added keyboard focus indicators, reduced-motion support, responsive navigation, and accessible form labels.
- Added a custom SkillChain favicon and improved page metadata.
- Added a working utility for copying the deployed registry address.

### Assessment and credential flow

- Implemented practical challenge selection and difficulty controls.
- Added source upload, editor, repository reference, staged evaluation, and score report flows.
- Bound every production assessment proof to the intended wallet and submission fingerprint.
- Added short-lived credential authorizations to prevent unauthorized or stale claims.
- Added transaction confirmation handling before saving credentials locally.
- Added public on-chain verification instead of relying on one browser's local storage.
- Added shareable verification URLs and explicit credential revocation display.
- Added wallet account and network change detection.

### Smart contract and 0G deployment

- Built and deployed `SkillCredentialRegistry` to 0G Galileo.
- Restricted credential issuance to authorizations signed by the trusted issuer.
- Added score validation, deadline validation, replay protection, issuer management, and credential revocation.
- Deployed the production web application to Vercel.
- Added deployment, secret-generation, registry smoke-test, and production API smoke-test scripts.

### Security and production hardening

- Moved private assessment and issuer secrets to server-only environment variables.
- Added HMAC assessment proofs and constant-time proof comparison.
- Added input limits, wallet validation, score validation, and best-effort API rate limiting.
- Added a restrictive content-security policy, frame protection, content-type protection, referrer policy, and permissions policy.
- Added a transparent deterministic fallback when 0G Compute is unavailable instead of presenting fallback output as AI-generated.
- Completed production builds, browser checks, API smoke tests, and dependency auditing with no reported production dependency vulnerabilities.

## Product roadmap

The roadmap is organized into waves so each stage creates a useful product improvement without depending on every later feature. Future items are plans, not claims about current functionality.

### Wave 3 — Testnet foundation (completed)

- Practical assessments and transparent rubric reports.
- Wallet connection and 0G Galileo network switching.
- Trusted-issuer credential authorizations.
- On-chain credential claims and revocation support.
- Public credential verification and shareable links.
- Responsive production UI, Vercel deployment, security headers, and smoke testing.

### Wave 4 — Better evaluation and developer experience

- Connect a valid 0G Compute Galileo Router key for live AI-assisted review.
- Add executable sandboxed tests for supported challenge types.
- Fetch and inspect approved public repository submissions safely.
- Add assessment drafts, autosave, resume, retry, and submission history.
- Expand the challenge library with backend, Rust, Python, data, security, and zero-knowledge tracks.
- Add richer evidence notes explaining why each rubric score was awarded.


- Create public developer profiles with verified credentials and skill summaries.
- Add an indexed credential explorer so credentials can be discovered without knowing the ID.
- Add credential filtering, sorting, search, and downloadable proof summaries.
- Add learner progress views, skill paths, and private improvement recommendations.
- Support profile sharing with human-readable usernames while keeping wallets authoritative.

### Wave 5 — Organizations and assessment operations

- Let verified organizations create private or public challenge collections.
- Add reviewer roles, moderation queues, disputes, and appeal workflows.
- Add organization dashboards for invitations, candidate comparisons, and credential policies.
- Support team-issued credentials with multisignature or role-based issuer administration.
- Add notifications for completed evaluations, issued credentials, expiring invitations, and revocations.

- Provide a documented verification API and SDK for third-party applications.
- Add optional token-gated roles, contributor access, bounties, and reputation integrations.
- Add decentralized or redundant metadata storage for richer credential evidence.
- Commission an independent smart-contract and application security audit.
- Introduce multisignature ownership, key rotation procedures, monitoring, backups, and incident response.
- Complete load testing, abuse prevention, privacy review, and legal policy work before considering a 0G mainnet release.

## Product principles

- Evidence over self-reported claims.
- Public verification without exposing private source code.
- Clear labels for demo, deterministic, AI-assisted, on-chain, and revoked states.
- Simple focused pages instead of a crowded all-in-one interface.
- One authoritative on-chain record with understandable off-chain context.
- Security and transparency before growth features.

## Architecture

- `src/main.jsx` — responsive React product flow and wallet UX.
- `src/styles.css` — tokenized visual system using ink, bone, and amber without gradients.
- `api/evaluate.js` — server-only evaluation, validation, rate limiting, and HMAC proof generation.
- `api/authorize.js` — verifies the HMAC proof and signs a domain-bound, 10-minute authorization.
- `api/verify.js` — read-only public verification against 0G Galileo.
- `api/_rateLimit.js` — best-effort serverless request limiting.
- `contracts/SkillCredentialRegistry.sol` — on-chain source of truth; claims require the trusted issuer signature and only the owner can revoke.
- `scripts/` — deployment, secret generation, and production smoke-test helpers.
- `vercel.json` — Vercel build configuration and application security headers.

## Trust and safety model

The registry binds the credential ID, subject wallet, skill, level, score, submission fingerprint, deadline, and issuer into a signed authorization. The user wallet still signs the final transaction. Expiring authorizations reduce replay risk, unauthorized issuers are rejected, verification is read-only, and revocation is explicit.

The fallback evaluator is intentionally transparent rather than pretending to be AI. Add a valid Galileo Router key from the official 0G Compute setup to enable AI-assisted review. Testnet and mainnet keys are separate. The previously supplied Router key was rejected and is not stored by this deployment.

Demo credentials are local-only and clearly labelled. Real credentials are authoritative on-chain. Private keys and assessment secrets must remain in server-side or CI secret stores and must never use a `VITE_` prefix.

## Local development

```bash
npm install
npm run dev
npm run build
```

Copy `.env.example` to `.env.local`. Never commit private keys or API keys. The browser only receives `VITE_REGISTRY_ADDRESS`; issuer and signing secrets remain server-side.

## Environment variables

| Variable | Location | Purpose |
| --- | --- | --- |
| `VITE_REGISTRY_ADDRESS` | Vercel and frontend build | Deployed registry address. This value is public. |
| `ISSUER_PRIVATE_KEY` | Vercel production only | Fresh issuer key used by `/api/authorize`. |
| `ASSESSMENT_SECRET` | Vercel production only | HMAC key binding an evaluation to its wallet and submission hash. |
| `OG_API_KEY` | Optional Vercel secret | 0G Compute testnet Router key. Missing or rejected keys use a labelled deterministic rubric. |
| `OG_MODEL` | Optional Vercel secret | Router model override; defaults to `qwen2.5-omni`. |
| `OG_PRIVATE_KEY` | Local shell or CI only | Funded deployer used by the registry deployment script. |
| `ISSUER_ADDRESS` | Local shell or CI | Initial trusted issuer and registry owner address. |

## Available commands

```bash
npm run dev
npm run build
npm run generate:secrets
npm run deploy:registry
npm run smoke:registry
npm run smoke:api
```

## Deploy the registry

Provide a funded Galileo deployer and issuer through a local shell or CI secret store:

```bash
set OG_PRIVATE_KEY=...
set ISSUER_ADDRESS=0x...
npm run deploy:registry
npm run smoke:registry
```

Set the printed address as `VITE_REGISTRY_ADDRESS` before deploying the web application.

## Deploy the web application

Configure `VITE_REGISTRY_ADDRESS`, `ISSUER_PRIVATE_KEY`, and `ASSESSMENT_SECRET` as production environment variables, then deploy:

```bash
npx vercel --prod --scope qwdxqws-projects
npm run smoke:api
```

Run the production smoke test after every deployment. `vercel.json` supplies the security headers and restrictive content-security policy.

## Current status and known boundaries

SkillChain is deployed on 0G Galileo and Vercel. Its primary testnet journey—assessment, report, signed authorization, wallet claim, and registry verification—is implemented.

The following capabilities are not currently presented as finished features:

- Live 0G Compute review until a valid Galileo Router key is configured.
- Persistent server-side profiles and credential indexing.
- Automated execution of untrusted submitted code.
- Repository fetching and analysis.
- Organization accounts, reviewers, disputes, and notifications.
- Mainnet deployment or an independent external security audit.

These boundaries are addressed in the roadmap above.
