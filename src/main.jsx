import React, { useEffect, useMemo, useState } from 'react';
import { BrowserProvider, Contract, keccak256, toUtf8Bytes } from 'ethers';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Check, ChevronDown, CircleHelp,
  ClipboardCheck, Code2, Copy, ExternalLink, FileArchive, GitFork, GraduationCap,
  LayoutDashboard, Link2, LoaderCircle, LockKeyhole, LogOut, Menu, Network,
  Plus, Search, ShieldCheck, Sparkles, Trophy, UploadCloud, WalletCards, X,
} from 'lucide-react';
import './styles.css';

const NETWORK = {
  chainId: '0x40da', // 16602, 0G Galileo testnet
  chainName: '0G Galileo Testnet',
  rpcUrls: ['https://evmrpc-testnet.0g.ai'],
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  blockExplorerUrls: ['https://chainscan-galileo.0g.ai'],
};
const REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS || '';
const REGISTRY_ABI = ['function claimCredential(bytes32 credentialId,string skill,string level,uint16 score,bytes32 submissionHash,uint64 deadline,bytes signature)'];

const SKILLS = [
  { id: 'solidity', name: 'Solidity', category: 'Smart contracts', icon: '◇', accent: 'amber', description: 'Build secure, gas-aware contracts.' },
  { id: 'react', name: 'React', category: 'Frontend', icon: '◌', accent: 'blue', description: 'Ship resilient product interfaces.' },
  { id: 'ai-agents', name: 'AI Agents', category: 'Applied AI', icon: '✦', accent: 'ink', description: 'Design useful, reliable agent loops.' },
];

const DIFFICULTIES = [
  { id: 'beginner', label: 'Beginner', detail: 'Foundations', minutes: '25 min' },
  { id: 'intermediate', label: 'Intermediate', detail: 'Production patterns', minutes: '45 min' },
  { id: 'advanced', label: 'Advanced', detail: 'Security and edge cases', minutes: '60 min' },
];

const CHALLENGES = {
  solidity: {
    title: 'Build a token vesting contract',
    summary: 'Implement cliff and linear release logic for an ERC-20 allocation. The contract should be safe to use in production and easy to test.',
    requirements: ['Cliff before any release', 'Linear release after the cliff', 'Revocation with a clear event', 'Tests for edge cases and access control'],
    starter: `// Paste your solution here\n// Include the contract and tests in your submission.\n\npragma solidity ^0.8.24;\n\ncontract VestingVault {\n    // Your implementation\n}`,
  },
  react: {
    title: 'Ship an accessible activity feed',
    summary: 'Build a responsive activity feed that handles loading, empty, error, and pagination states without layout shift.',
    requirements: ['Keyboard navigable interactions', 'Explicit loading and error states', 'Responsive at 320px', 'Component-level tests'],
    starter: `// Paste your solution here\n// Include the component and tests in your submission.\n\nexport function ActivityFeed() {\n  return null\n}`,
  },
  'ai-agents': {
    title: 'Design a grounded support agent',
    summary: 'Create an agent loop that answers from a provided knowledge base, cites its source, and escalates when confidence is low.',
    requirements: ['Ground every answer in retrieved context', 'Cite source chunks', 'Escalate uncertain requests', 'Include adversarial test cases'],
    starter: `# Paste your solution notes or code here\n# Include prompts, tools, and evaluation cases.`,
  },
};

const STORAGE_KEY = 'skillchain.credentials.v1';
const PROFILE_KEY = 'skillchain.profile.v1';

function shortAddress(value = '') {
  return value ? `${value.slice(0, 6)}…${value.slice(-4)}` : '';
}

function readLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function scoreSubmission({ source, difficulty, skill }) {
  const length = source.trim().length;
  const base = Math.min(98, 70 + Math.floor(length / 160));
  const difficultyBump = difficulty === 'advanced' ? 2 : difficulty === 'intermediate' ? 1 : 0;
  const skillBump = skill === 'solidity' && /reentr|access|event|test/i.test(source) ? 4 : 0;
  const final = Math.max(62, Math.min(98, base + difficultyBump + skillBump));
  return {
    final,
    dimensions: [
      ['Correctness', Math.min(99, final + 1)],
      ['Security', Math.min(99, final + (skill === 'solidity' ? 2 : 0))],
      ['Architecture', Math.max(55, final - 2)],
      ['Testing', Math.min(98, final + (/test/i.test(source) ? 2 : -1))],
      ['Efficiency', Math.max(55, final - 4)],
    ],
  };
}

async function evaluateSubmission(assessment) {
  if (import.meta.env.DEV) return scoreSubmission(assessment);
  const response = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: assessment.source, skill: assessment.skill, difficulty: assessment.difficulty, github: assessment.github, fileName: assessment.fileName, subject: assessment.subject || 'demo' }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error || 'Evaluation failed.');
  return payload;
}

async function hashSubmission(value) {
  try {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  } catch { return `local-${value.length}-${Date.now()}`; }
}

function App() {
  const [page, setPage] = useState(() => new URLSearchParams(window.location.search).has('verify') ? 'verify' : 'overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [wallet, setWallet] = useState(() => readLocal(PROFILE_KEY, { address: '', demo: false }));
  const [toast, setToast] = useState('');
  const [credentials, setCredentials] = useState(() => readLocal(STORAGE_KEY, []));
  const [assessment, setAssessment] = useState(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials)); }, [credentials]);
  useEffect(() => { localStorage.setItem(PROFILE_KEY, JSON.stringify(wallet)); }, [wallet]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 3600); return () => clearTimeout(id); }, [toast]);
  useEffect(() => {
    if (!window.ethereum?.on) return undefined;
    const handleAccounts = (accounts) => setWallet((current) => ({ ...current, address: accounts?.[0] || '', demo: false }));
    const handleChain = (chainId) => setWallet((current) => ({ ...current, chainId }));
    window.ethereum.on('accountsChanged', handleAccounts);
    window.ethereum.on('chainChanged', handleChain);
    Promise.all([
      window.ethereum.request({ method: 'eth_accounts' }),
      window.ethereum.request({ method: 'eth_chainId' }),
    ]).then(([accounts, chainId]) => {
      if (accounts?.[0]) setWallet({ address: accounts[0], demo: false, chainId });
    }).catch(() => {});
    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccounts);
      window.ethereum.removeListener?.('chainChanged', handleChain);
    };
  }, []);

  const notify = (message) => setToast(message);

  async function connectWallet() {
    if (!window.ethereum) {
      setWallet({ address: '0xDEMO000000000000000000000000000000000000', demo: true, chainId: NETWORK.chainId });
      notify('Demo wallet enabled. Install an EVM wallet to claim on 0G.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: NETWORK.chainId }] });
      } catch (switchError) {
        if (switchError?.code === 4902) {
          await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [NETWORK] });
        } else throw switchError;
      }
      setWallet({ address: accounts[0], demo: false, chainId: NETWORK.chainId });
      notify('Wallet connected to 0G Galileo.');
    } catch (error) { notify(error?.message || 'Wallet connection cancelled.'); }
  }

  function startAssessment(skill, difficulty) {
    setAssessment({ skill, difficulty, source: CHALLENGES[skill].starter, fileName: '', github: '', stage: 'setup' });
    setPage('challenge');
  }

  function beginClaim(report) {
    setAssessment((current) => ({ ...current, stage: 'claiming', report }));
  }

  function saveCredential(credential) {
    setCredentials((items) => [credential, ...items.filter((item) => item.id !== credential.id)]);
    setAssessment(null);
    setPage('credentials');
    notify(credential.demo ? 'Credential saved in demo mode.' : 'Credential anchored on 0G Galileo.');
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'assessments', label: 'Assessments', icon: ClipboardCheck },
    { id: 'credentials', label: 'Credentials', icon: BadgeCheck },
    { id: 'verify', label: 'Verify a credential', icon: ShieldCheck },
    { id: 'learn', label: 'How it works', icon: BookOpen },
  ];

  const networkStatus = !wallet.address ? 'Wallet not connected' : wallet.demo ? 'Demo mode' : wallet.chainId === NETWORK.chainId ? 'Testnet connected' : 'Switch to Galileo';

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
      <div className="brand"><div className="brand-mark">SC</div><span>skillchain</span></div>
      <div className="sidebar-section-label">Workspace</div>
      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => { setPage(id); setMobileNav(false); }}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{id === 'credentials' && credentials.length > 0 && <span className="nav-count">{credentials.length}</span>}</button>)}
      </nav>
      <div className="sidebar-spacer" />
      <div className="network-card"><div className={`network-dot ${wallet.address && (wallet.demo || wallet.chainId === NETWORK.chainId) ? '' : 'offline'}`} /><div><strong>0G Galileo</strong><span>{networkStatus}</span></div><ChevronDown size={14} /></div>
      <button className="support-link" onClick={() => notify('Support is coming soon. For now, join the 0G builder community.') }><CircleHelp size={16} />Help center</button>
      <div className="sidebar-footer">SkillChain MVP <span>v1.0</span></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <main className="main-content">
      <header className="topbar">
        <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
        <div className="crumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{navItems.find((item) => item.id === page)?.label || 'Challenge'}</strong></div>
        <div className="topbar-actions">
          {wallet.address ? <button className="wallet-button connected" onClick={() => { setWallet({ address: '', demo: false, chainId: '' }); notify('Wallet disconnected from SkillChain.'); }}><span className="wallet-status" />{shortAddress(wallet.address)}<LogOut size={14} /></button> : <button className="wallet-button" onClick={connectWallet}><WalletCards size={16} />Connect wallet</button>}
        </div>
      </header>
      <div className="page-wrap">
        {page === 'overview' && <Overview credentials={credentials} wallet={wallet} onStart={() => setPage('assessments')} onVerify={() => setPage('verify')} />}
        {page === 'assessments' && <Assessments onStart={startAssessment} completed={credentials} />}
        {page === 'challenge' && assessment && <Challenge assessment={assessment} wallet={wallet} onUpdate={setAssessment} onBack={() => setPage('assessments')} onEvaluate={(next) => { setAssessment(next); setPage('evaluation'); }} />}
        {page === 'evaluation' && assessment && <Evaluation assessment={assessment} onDone={(report) => { setAssessment({ ...assessment, report, stage: 'report' }); setPage('report'); }} />}
        {page === 'report' && assessment?.report && <Report assessment={assessment} wallet={wallet} onClaim={beginClaim} onBack={() => setPage('overview')} />}
        {page === 'credentials' && <Credentials credentials={credentials} onVerify={() => setPage('verify')} onStart={() => setPage('assessments')} />}
        {page === 'verify' && <Verify credentials={credentials} notify={notify} />}
        {page === 'learn' && <Learn notify={notify} />}
        {assessment?.stage === 'claiming' && <ClaimModal assessment={assessment} wallet={wallet} onClose={() => setAssessment({ ...assessment, stage: 'report' })} onSaved={saveCredential} notify={notify} />}
      </div>
    </main>
    {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
  </div>;
}

function PageHeader({ eyebrow, title, children }) { return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1></div>{children}</div>; }

function Overview({ credentials, wallet, onStart, onVerify }) {
  const average = credentials.length ? Math.round(credentials.reduce((sum, c) => sum + c.score, 0) / credentials.length) : 0;
  return <div className="page-content"><PageHeader eyebrow="Your proof of work" title={wallet.address ? 'Good to see you back.' : 'Prove what you can do.'}><button className="button primary" onClick={onStart}><Plus size={17} />Start an assessment</button></PageHeader>
    <section className="hero-panel"><div className="hero-copy"><div className="hero-kicker"><Sparkles size={15} /> Practical assessments on 0G</div><h2>Credentials that carry<br /><em>evidence.</em></h2><p>Complete a real challenge, get a transparent evaluation, and anchor the result to your wallet.</p><button className="button dark" onClick={onStart}>Choose a skill <ArrowRight size={16} /></button></div><div className="hero-diagram" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="diagram-core"><Network size={25} /><span>0G</span></div><div className="diagram-node node-a"><Code2 size={17} /><span>Work</span></div><div className="diagram-node node-b"><ShieldCheck size={17} /><span>Proof</span></div><div className="diagram-node node-c"><Link2 size={17} /><span>Verify</span></div></div></section>
    <div className="section-heading"><div><div className="eyebrow">At a glance</div><h2>Your progress</h2></div><button className="text-button" onClick={onVerify}>Verify a credential <ArrowRight size={15} /></button></div>
    <section className="stats-grid"><Stat label="Verified credentials" value={credentials.length} note={credentials.length ? 'Anchored on 0G' : 'Start your first proof'} icon={BadgeCheck} /><Stat label="Average score" value={average ? `${average}/100` : 'Not yet'} note={average ? 'Across your credentials' : 'No assessments yet'} icon={Trophy} /><Stat label="Skills in progress" value={credentials.length ? '1' : '0'} note="Keep building your proof" icon={BookOpen} /></section>
    <section className="lower-grid"><div className="panel activity-panel"><div className="panel-title"><h3>Recent activity</h3><span>{credentials.length ? `${credentials.length} credential${credentials.length > 1 ? 's' : ''}` : 'Nothing here yet'}</span></div>{credentials.length ? credentials.slice(0, 3).map((credential) => <CredentialRow key={credential.id} credential={credential} />) : <EmptyState icon={ClipboardCheck} title="Your first assessment starts here" copy="Choose a practical challenge and turn your work into a credential." action="Browse assessments" onClick={onStart} />}</div><div className="panel quick-panel"><div className="panel-title"><h3>How it works</h3></div><Step number="01" title="Choose a challenge" copy="Pick the skill and difficulty that match your next proof point." /><Step number="02" title="Submit your work" copy="Upload a repository or paste a focused solution with context." /><Step number="03" title="Claim your credential" copy="The report is anchored on 0G for anyone to verify." /></div></section>
  </div>;
}

function Learn({ notify }) {
  async function copyRegistry() {
    if (!REGISTRY_ADDRESS) return notify?.('Registry address is not configured.');
    try { await navigator.clipboard.writeText(REGISTRY_ADDRESS); notify?.('Registry address copied.'); } catch { notify?.(REGISTRY_ADDRESS); }
  }
  return <div className="page-content"><PageHeader eyebrow="A clear path to proof" title="How SkillChain works." /><div className="learn-hero"><div><div className="hero-kicker"><ShieldCheck size={15} /> Built for verifiable work</div><h2>Evidence first.<br /><em>Always shareable.</em></h2><p>SkillChain keeps the work private, makes the evaluation understandable, and puts only the proof record on 0G.</p></div><div className="learn-stamp"><span>0G</span><small>GALILEO<br />TESTNET</small></div></div><div className="learn-grid"><section className="panel learn-steps"><div className="panel-title"><h3>From submission to credential</h3><span>4 steps</span></div>{[['01','Choose a challenge','Start with one practical skill and a difficulty that matches your next proof point.'],['02','Submit evidence','Paste a solution, upload a small source file, or add a repository reference.'],['03','Review the report','Deterministic checks run first. Optional 0G Compute review is clearly labelled in the result.'],['04','Anchor and share','Your wallet signs the claim. Anyone can verify the resulting ID from the registry.']].map(([number,title,copy]) => <div className="learn-step" key={number}><span>{number}</span><div><h4>{title}</h4><p>{copy}</p></div></div>)}</section><aside className="learn-side"><div className="panel network-detail"><div className="eyebrow">Live network</div><h3>0G Galileo</h3><p>SkillChain is configured for the 0G Galileo testnet.</p><dl><div><dt>Chain ID</dt><dd>16602</dd></div><div><dt>Registry</dt><dd>{REGISTRY_ADDRESS ? `${REGISTRY_ADDRESS.slice(0, 8)}…${REGISTRY_ADDRESS.slice(-6)}` : 'Not configured'}</dd></div></dl><button className="button secondary full" onClick={copyRegistry}><Copy size={15} />Copy registry address</button><a className="text-button" href={NETWORK.blockExplorerUrls[0]} target="_blank" rel="noreferrer">Open ChainScan <ExternalLink size={14} /></a></div><div className="learn-note"><LockKeyhole size={17} /><div><strong>Your source stays private</strong><p>Only the score, skill, wallet, and submission fingerprint are anchored. The source itself never goes on-chain.</p></div></div></aside></div></div>;
}

function Stat({ label, value, note, icon: Icon }) { return <div className="stat-card"><div className="stat-icon"><Icon size={18} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>; }
function Step({ number, title, copy }) { return <div className="step"><div className="step-number">{number}</div><div><h4>{title}</h4><p>{copy}</p></div></div>; }
function EmptyState({ icon: Icon, title, copy, action, onClick }) { return <div className="empty-state"><div className="empty-icon"><Icon size={20} /></div><h3>{title}</h3><p>{copy}</p>{action && <button className="button secondary" onClick={onClick}>{action}<ArrowRight size={15} /></button>}</div>; }
function CredentialRow({ credential }) { return <div className="credential-row"><div className="credential-symbol">{credential.skill === 'Solidity' ? '◇' : credential.skill === 'React' ? '◌' : '✦'}</div><div className="credential-main"><strong>{credential.skill}</strong><span>{credential.level} · {credential.id}</span></div><div className="credential-score">{credential.score}<small>/100</small></div><BadgeCheck size={17} className="verified-icon" /></div>; }

function Assessments({ onStart, completed }) {
  const [skill, setSkill] = useState('solidity');
  const [difficulty, setDifficulty] = useState('advanced');
  return <div className="page-content"><PageHeader eyebrow="Practical assessments" title="Choose your next proof." /><div className="assessment-layout"><div className="panel setup-panel"><div className="setup-step"><span className="setup-index">1</span><div><h3>Choose a skill</h3><p>One focused challenge is better than a broad quiz.</p></div></div><div className="skill-grid">{SKILLS.map((item) => <button key={item.id} className={`skill-card ${skill === item.id ? 'selected' : ''}`} onClick={() => setSkill(item.id)}><span className={`skill-glyph ${item.accent}`}>{item.icon}</span><span className="skill-card-text"><strong>{item.name}</strong><small>{item.category}</small></span>{skill === item.id && <Check size={17} />}</button>)}</div><div className="setup-step"><span className="setup-index">2</span><div><h3>Set the difficulty</h3><p>Difficulty changes the depth of the rubric and hidden checks.</p></div></div><div className="difficulty-grid">{DIFFICULTIES.map((item) => <button key={item.id} className={`difficulty-card ${difficulty === item.id ? 'selected' : ''}`} onClick={() => setDifficulty(item.id)}><span><strong>{item.label}</strong><small>{item.detail}</small></span><small>{item.minutes}</small></button>)}</div><div className="assessment-preview"><div><span className="preview-label">You’ll work on</span><h3>{CHALLENGES[skill].title}</h3><p>{CHALLENGES[skill].summary}</p></div><button className="button primary" onClick={() => onStart(skill, difficulty)}>Start challenge <ArrowRight size={16} /></button></div></div><aside className="assessment-aside"><div className="aside-note"><LockKeyhole size={17} /><div><strong>Your work stays yours</strong><p>Only the evaluation artifact is anchored on 0G. Your source code is never put on-chain.</p></div></div><div className="aside-list"><div className="eyebrow">Your proof history</div>{completed.length ? completed.slice(0, 4).map((item) => <CredentialRow key={item.id} credential={item} />) : <p className="muted-copy">Complete a challenge to see your first credential here.</p>}</div></aside></div></div>;
}

function Challenge({ assessment, wallet, onUpdate, onEvaluate, onBack }) {
  const challenge = CHALLENGES[assessment.skill];
  const [tab, setTab] = useState('instructions');
  const [error, setError] = useState('');
  const update = (patch) => onUpdate({ ...assessment, ...patch });
  function submit() {
    if (!assessment.source.trim() && !assessment.github.trim() && !assessment.fileName) { setError('Add a solution, repository URL, or ZIP before submitting.'); return; }
    const subject = wallet?.address && !wallet.demo ? wallet.address.toLowerCase() : 'demo';
    setError(''); onEvaluate({ ...assessment, subject, stage: 'evaluating', submittedAt: Date.now() });
  }
  const duration = DIFFICULTIES.find((item) => item.id === assessment.difficulty)?.minutes || '45 min';
  const assessmentNumber = assessment.submittedAt ? String(assessment.submittedAt).slice(-5) : 'draft';
  return <div className="page-content"><div className="challenge-toolbar"><button className="back-button" onClick={onBack}><ArrowLeft size={16} />Assessments</button><div className="challenge-meta"><span className="status-chip">{assessment.difficulty}</span><span>{SKILLS.find((item) => item.id === assessment.skill)?.name}</span><span>{duration}</span></div></div><div className="challenge-heading"><div><div className="eyebrow">Challenge brief</div><h1>{challenge.title}</h1><p>{challenge.summary}</p></div><div className="challenge-id">Assessment<br /><strong>{assessmentNumber === 'draft' ? 'Draft' : `#${assessmentNumber}`}</strong></div></div><div className="challenge-workspace"><section className="editor-panel"><div className="editor-header"><div className="file-tab"><Code2 size={15} />solution.{assessment.skill === 'solidity' ? 'sol' : assessment.skill === 'react' ? 'tsx' : 'md'}</div><div className="editor-actions"><label className="upload-button"><UploadCloud size={15} />Upload source<input type="file" accept=".sol,.js,.jsx,.ts,.tsx,.py,.md,.txt" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 50000) { setError('Source files must be 50 KB or smaller.'); return; } update({ fileName: file.name, source: await file.text() }); setError(''); }} /></label>{assessment.fileName && <span className="file-name"><FileArchive size={14} />{assessment.fileName}</span>}</div></div><textarea className="code-input" value={assessment.source} onChange={(event) => update({ source: event.target.value })} spellCheck="false" aria-label="Solution editor" /><div className="editor-footer"><label className="github-field"><GitFork size={16} /><input value={assessment.github} onChange={(event) => update({ github: event.target.value })} placeholder="https://github.com/you/repository (optional)" /></label><button className="button primary" onClick={submit}>Submit for evaluation <ArrowRight size={16} /></button></div>{error && <div className="form-error" role="alert"><X size={15} />{error}</div>}</section><aside className="instructions-panel"><div className="tab-list" role="tablist"><button className={tab === 'instructions' ? 'active' : ''} onClick={() => setTab('instructions')}>Instructions</button><button className={tab === 'rubric' ? 'active' : ''} onClick={() => setTab('rubric')}>Rubric</button></div>{tab === 'instructions' ? <><div className="instruction-intro"><span className="live-dot" />Live challenge</div><h3>What good looks like</h3><p>We’ll look for a complete implementation, thoughtful trade-offs, and proof that you tested the sharp edges.</p><ul className="requirements">{challenge.requirements.map((req) => <li key={req}><Check size={15} />{req}</li>)}</ul><div className="hint-box"><Sparkles size={16} /><span>Tip: explain your decisions in comments. Clarity is part of the evaluation.</span></div></> : <Rubric />}</aside></div></div>;
}
function Rubric() { return <div className="rubric-list">{[['Correctness','40%'],['Security','25%'],['Architecture','15%'],['Testing','15%'],['Efficiency','5%']].map(([name, weight]) => <div className="rubric-row" key={name}><span>{name}</span><strong>{weight}</strong></div>)}<p className="muted-copy">Scores combine deterministic checks with a transparent AI review.</p></div>; }

function Evaluation({ assessment, onDone }) {
  const stages = ['Static checks', 'Test runner', 'Security analysis', 'Quality review'];
  const [active, setActive] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(() => setActive((current) => Math.min(stages.length - 1, current + 1)), 900);
    evaluateSubmission(assessment).then((report) => {
      if (cancelled) return;
      clearInterval(timer);
      setActive(stages.length - 1);
      setTimeout(() => { if (!cancelled) onDone(report); }, 500);
    }).catch((reason) => {
      if (cancelled) return;
      clearInterval(timer);
      setError(reason?.message || 'Evaluation failed.');
    });
    return () => { cancelled = true; clearInterval(timer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="page-content evaluation-page"><div className="evaluation-intro"><div className="eyebrow">Assessment in progress</div><h1>Reading your work.</h1><p>SkillChain runs deterministic checks first, then asks 0G Compute for an evidence-based review.</p></div><div className="evaluation-card"><div className="pipeline">{stages.map((stage, index) => <div className={`pipeline-step ${index < active ? 'done' : ''} ${index === active && !error ? 'current' : ''}`} key={stage}><div className="pipeline-icon">{index < active ? <Check size={16} /> : index === active && !error ? <LoaderCircle size={16} className="spin" /> : <span>{index + 1}</span>}</div><span>{stage}</span></div>)}</div>{error ? <div className="form-error" role="alert"><X size={15} />{error}</div> : <div className="evaluation-foot"><span><span className="live-dot" />{stages[active]} running</span><span>{Math.round(((active + 1) / stages.length) * 100)}%</span></div>}</div><div className="evaluation-note"><ShieldCheck size={18} /><div><strong>Evidence over vibes</strong><p>Every score dimension is backed by a check, a test result, or a review note in your final report.</p></div></div></div>;
}

function Report({ assessment, onClaim, onBack }) { const report = assessment.report; const level = report.final >= 90 ? 'Advanced' : report.final >= 78 ? 'Intermediate' : 'Foundational'; return <div className="page-content"><button className="back-button" onClick={onBack}><ArrowLeft size={16} />Overview</button><div className="report-header"><div><div className="eyebrow">Assessment report</div><h1>Your work is <em>verified.</em></h1><p>Here’s the evidence behind your result. You can claim it as a credential on 0G.</p></div><div className="score-lockup"><strong>{report.final}</strong><span>/100</span></div></div><div className="report-grid"><section className="panel score-panel"><div className="score-title"><div><span className="preview-label">{SKILLS.find((item) => item.id === assessment.skill)?.name} · {assessment.difficulty} · {report.engine || 'SkillChain rubric'}</span><h2>{level}</h2></div><BadgeCheck size={28} /></div><div className="dimension-list">{report.dimensions.map(([name, score]) => <div className="dimension" key={name}><div><span>{name}</span><strong>{score}</strong></div><div className="meter"><span style={{ width: `${score}%` }} /></div></div>)}</div></section><aside className="panel claim-panel"><div className="claim-icon"><Trophy size={20} /></div><h3>Make it verifiable</h3><p>Anchor this result with a wallet signature. The credential stores your score, assessment, and submission fingerprint.</p><button className="button primary full" onClick={() => onClaim(report)}><Link2 size={16} />Claim credential</button><span className="claim-foot"><LockKeyhole size={13} />No source code goes on-chain</span></aside></div><div className="report-callout"><Sparkles size={17} /><span><strong>{report.degraded ? 'Evaluation note:' : 'One useful next step:'}</strong> {report.degraded ? report.summary : 'Add tests around the edge cases called out in your review to raise your confidence before your next assessment.'}</span></div></div>; }

function ClaimModal({ assessment, wallet, onClose, onSaved, notify }) {
  const [status, setStatus] = useState('ready');
  const [txHash, setTxHash] = useState('');
  const skill = SKILLS.find((item) => item.id === assessment.skill);
  async function claim() {
    setStatus('signing');
    try {
      let hash = '';
      const submissionHash = assessment.report.submissionHash || await hashSubmission(assessment.source || assessment.fileName || assessment.github);
      const level = assessment.report.final >= 90 ? 'Advanced' : assessment.report.final >= 78 ? 'Intermediate' : 'Foundational';
      const credentialId = `SC-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
      if (wallet.address && !wallet.demo && window.ethereum) {
        if (assessment.subject && assessment.subject.toLowerCase() !== wallet.address.toLowerCase()) {
          throw new Error('This assessment belongs to another wallet. Retake it after connecting the intended wallet.');
        }
        if (!REGISTRY_ADDRESS) throw new Error('Credential registry is not configured for this deployment.');
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const registry = new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
        const authorizationResponse = await fetch('/api/authorize', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentialId, subject: wallet.address, skill: skill.name, difficulty: assessment.difficulty, level, score: assessment.report.final, dimensions: assessment.report.dimensions, submissionHash, assessmentProof: assessment.report.assessmentProof }),
        });
        const authorization = await authorizationResponse.json();
        if (!authorizationResponse.ok) throw new Error(authorization?.error || 'Credential authorization failed.');
        const transaction = await registry.claimCredential(authorization.registryId, skill.name, level, assessment.report.final, `0x${submissionHash}`, authorization.deadline, authorization.signature);
        const receipt = await transaction.wait();
        hash = receipt.hash;
      } else {
        hash = `demo-${crypto.randomUUID()}`;
      }
      setTxHash(hash); setStatus('success');
      const credential = { id: credentialId, skill: skill.name, level, score: assessment.report.final, txHash: hash, submissionHash, registryId: wallet.address && !wallet.demo ? keccak256(toUtf8Bytes(credentialId)) : '', demo: wallet.demo || !wallet.address, issuedAt: new Date().toISOString(), wallet: wallet.address || 'Demo wallet' };
      setTimeout(() => onSaved(credential), 650);
    } catch (error) { setStatus('error'); notify(error?.message || 'Transaction was rejected.'); }
  }
  return <div className="modal-scrim"><div className="claim-modal"><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>{status === 'ready' && <><div className="modal-icon"><Link2 size={21} /></div><div className="eyebrow">Claim credential</div><h2>Put your proof on 0G.</h2><p>Your wallet will sign a small transaction that anchors this assessment result. You can verify it from anywhere.</p><div className="claim-summary"><span>{skill.name} · {assessment.difficulty}</span><strong>{assessment.report.final}/100</strong></div><button className="button primary full" onClick={claim}>Sign and anchor <ArrowRight size={16} /></button><span className="claim-foot"><LockKeyhole size={13} />Connected wallet: {wallet.address ? shortAddress(wallet.address) : 'Demo mode'}</span></>}{status === 'signing' && <div className="modal-state"><LoaderCircle className="spin" size={28} /><h2>Waiting for your signature.</h2><p>Confirm the transaction in your wallet to finish anchoring.</p></div>}{status === 'success' && <div className="modal-state success-state"><div className="modal-icon"><Check size={22} /></div><h2>Credential anchored.</h2><p>Your result is now ready to share and verify.</p>{txHash && !txHash.startsWith('demo-') && <a href={`${NETWORK.blockExplorerUrls[0]}/tx/${txHash}`} target="_blank" rel="noreferrer">View on ChainScan <ExternalLink size={14} /></a>}</div>}{status === 'error' && <div className="modal-state"><div className="modal-icon error"><X size={22} /></div><h2>Couldn’t anchor this time.</h2><p>Check that your wallet is on 0G Galileo and try again.</p><button className="button secondary" onClick={() => setStatus('ready')}>Try again</button></div>}</div></div>;
}

function Credentials({ credentials, onVerify, onStart }) { return <div className="page-content"><PageHeader eyebrow="Your on-chain proof" title="Credentials."><button className="button secondary" onClick={onVerify}><Search size={16} />Verify one</button></PageHeader>{credentials.length ? <div className="credential-grid">{credentials.map((credential) => <CredentialCard key={credential.id} credential={credential} />)}</div> : <div className="panel empty-wrap"><EmptyState icon={BadgeCheck} title="No credentials yet" copy="Complete a practical assessment and claim your first verifiable skill credential." action="Browse assessments" onClick={onStart} /></div>}<p className="page-footnote"><LockKeyhole size={14} />Credentials store a proof record. Your source code remains private.</p></div>; }
function CredentialCard({ credential }) { const date = new Date(credential.issuedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); return <article className="credential-card"><div className="credential-card-top"><span className="credential-mark">{credential.skill === 'Solidity' ? '◇' : credential.skill === 'React' ? '◌' : '✦'}</span><BadgeCheck size={19} /></div><div className="eyebrow">Verified skill</div><h2>{credential.skill}</h2><div className="credential-level">{credential.level}</div><div className="credential-score-large">{credential.score}<small>/100</small></div><div className="credential-card-meta"><span>Issued {date}</span><span>{credential.id}</span></div><a className="card-link" href={credential.txHash.startsWith('demo-') ? undefined : `${NETWORK.blockExplorerUrls[0]}/tx/${credential.txHash}`} target="_blank" rel="noreferrer" onClick={(event) => credential.txHash.startsWith('demo-') && event.preventDefault()}>{credential.txHash.startsWith('demo-') ? 'Demo anchor' : 'View on ChainScan'} <ExternalLink size={14} /></a></article>; }

function Verify({ credentials, notify }) {
  const initialQuery = new URLSearchParams(window.location.search).get('verify') || '';
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function verifyCredential(rawId) {
    const id = rawId.trim().toUpperCase();
    if (!id) { setError('Enter a credential ID first.'); return; }
    setQuery(id); setSearched(true); setLoading(true); setError(''); setResult(null);
    window.history.replaceState({}, '', `?verify=${encodeURIComponent(id)}`);
    const local = credentials.find((item) => item.id.toUpperCase() === id);
    if (local?.demo) { setResult(local); setLoading(false); return; }
    try {
      const response = await fetch(`/api/verify?id=${encodeURIComponent(id)}`);
      const payload = await response.json();
      if (response.status === 404) setResult(null);
      else if (!response.ok) throw new Error(payload?.error || 'Verification failed.');
      else setResult(payload);
    } catch (reason) { setError(reason?.message || 'Could not verify this credential.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (initialQuery) verifyCredential(initialQuery); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function submit(event) { event.preventDefault(); verifyCredential(query); }
  async function copyLink() {
    const link = `${window.location.origin}/?verify=${encodeURIComponent(query)}`;
    try { await navigator.clipboard.writeText(link); notify?.('Verification link copied.'); } catch { notify?.(link); }
  }
  return <div className="page-content"><PageHeader eyebrow="Public verification" title="Check a credential." /><div className="verify-layout"><section className="panel verify-panel"><div className="verify-intro"><div className="verify-icon"><ShieldCheck size={23} /></div><h2>Does this proof hold up?</h2><p>Verification reads the deployed 0G registry, so anyone can check the same result.</p></div><form onSubmit={submit} className="verify-form"><label htmlFor="credential-id">Credential ID</label><div className="input-with-button"><input id="credential-id" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SC-12345678" autoComplete="off" /><button className="button primary" type="submit" disabled={loading}>{loading ? <LoaderCircle size={16} className="spin" /> : <Search size={16} />}{loading ? 'Checking' : 'Verify'}</button></div></form>{error && <div className="form-error" role="alert"><X size={15} />{error}</div>}{searched && !loading && !error && (result ? <VerificationResult credential={result} onCopy={copyLink} /> : <div className="verify-result not-found"><X size={19} /><div><strong>No credential found</strong><p>Check the ID and try again. IDs are case-insensitive.</p></div></div>)}</section><aside className="verify-aside"><div className="eyebrow">What gets verified</div>{['Credential exists', 'Wallet ownership', 'Assessment result', 'Anchor status'].map((item) => <div className="verify-check" key={item}><Check size={15} />{item}</div>)}<a href={NETWORK.blockExplorerUrls[0]} target="_blank" rel="noreferrer" className="text-button">Open ChainScan <ExternalLink size={14} /></a></aside></div></div>;
}
function VerificationResult({ credential, onCopy }) { const revoked = Boolean(credential.revoked); return <div className={`verify-result ${revoked ? 'revoked' : ''}`}><div className="result-badge">{revoked ? <X size={17} /> : <Check size={17} />}</div><div className="result-content"><div className="result-top"><div><span className="eyebrow">{revoked ? 'Revoked credential' : 'Verified credential'}</span><h3>{credential.skill} · {credential.level}</h3></div><strong>{credential.score}/100</strong></div><div className="result-details"><span><small>Credential</small>{credential.id}</span><span><small>Wallet</small>{shortAddress(credential.wallet)}</span><span><small>Anchor</small>{credential.demo ? 'Demo mode' : revoked ? 'Revoked on 0G' : '0G Galileo'}</span></div><button className="copy-button" onClick={onCopy}><Copy size={14} />Copy verification link</button></div></div>; }

createRoot(document.getElementById('root')).render(<App />);
