import { matchKeywords } from './rules';
import type { CategoryId, KnowledgeArticle, TicketType } from './types';

/**
 * First-line knowledge base. Order matters: if two categories match the same
 * number of keywords, the one listed first wins. Security is first on purpose.
 */
export const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'security',
    name: 'Security',
    keywords: [
      'phishing', 'suspicious', 'scam', 'clicked a link', 'clicked the link', 'share my password',
      'share password', 'shared my password', 'asked for my password', 'asking for my password',
      'password sharing', 'malware', 'virus', 'hacked', 'fake email',
    ],
    checks: [
      { id: 'sec-no-click', text: "Tell the user not to click links, open attachments or share credentials" },
      { id: 'sec-report', text: 'Report it through the approved security reporting process' },
      { id: 'sec-preserve', text: "Keep the evidence: don't delete the message, note sender and time" },
      { id: 'sec-clicked', text: 'Ask if anything was clicked or entered. If yes, escalate to Security now' },
      { id: 'sec-route', text: 'Offer the approved access route instead of sharing a password' },
    ],
    caution: "Never ask for or accept a user's password, even to help.",
    escalateTo: 'Information Security team',
  },
  {
    id: 'network',
    name: 'Network / DNS',
    keywords: [
      'network', 'wifi', 'wi-fi', 'internet', 'dns', 'vpn', 'server', 'telemetry', 'connection',
      'connect', 'no signal', 'ping', 'website', 'web page', 'ethernet', 'proxy', 'shared drive',
      'link down', 'packet loss',
    ],
    checks: [
      { id: 'net-scope', text: 'Confirm scope: one user, one area, or everyone?' },
      { id: 'net-physical', text: 'Check the network cable is seated or Wi-Fi is connected' },
      { id: 'net-ipconfig', text: 'Run ipconfig /all: valid IP, gateway and DNS servers?' },
      { id: 'net-ping', text: 'Ping the gateway, then an external IP' },
      { id: 'net-nslookup', text: 'Run nslookup on the failing host name' },
      { id: 'net-ip-vs-name', text: 'Try the site by IP address vs by name' },
      { id: 'net-flushdns', text: 'Run ipconfig /flushdns and retry' },
      { id: 'net-proxy', text: 'Check proxy and VPN settings/state' },
    ],
    escalateTo: 'Network team (2nd line)',
  },
  {
    id: 'email',
    name: 'Email / Outlook',
    keywords: ['email', 'e-mail', 'outlook', 'inbox', 'outbox', 'mailbox', 'calendar', 'meeting invite'],
    checks: [
      { id: 'mail-scope', text: 'Is it one message or all mail?' },
      { id: 'mail-connected', text: 'Outlook status bar shows "Connected"' },
      { id: 'mail-outbox', text: 'Check the Outbox for a stuck (large) item' },
      { id: 'mail-plain', text: 'Send a plain test email with no attachment' },
      { id: 'mail-webmail', text: 'Check webmail / Teams to separate client vs service' },
      { id: 'mail-error', text: 'Note the exact error message (screenshot)' },
    ],
    caution: "Don't delete the Outlook profile as a first step.",
    escalateTo: 'Messaging / M365 team (2nd line)',
  },
  {
    id: 'account',
    name: 'Account / lockout',
    keywords: [
      'password', 'locked out', 'locked', 'lockout', 'login', 'log in', 'sign in', 'signin',
      'mfa', 'authenticator', 'account', 'expired', 'forgot',
    ],
    checks: [
      { id: 'acc-verify', text: 'Verify identity using the approved process first' },
      { id: 'acc-ad', text: 'Check AD: locked, disabled or expired?' },
      { id: 'acc-reset', text: 'Unlock, or reset with "change at next login"' },
      { id: 'acc-mfa', text: 'Re-register MFA if needed' },
      { id: 'acc-devices', text: 'If it keeps locking: check old saved passwords on phone/other devices' },
    ],
    caution: 'Identity verification comes before any unlock or reset.',
    escalateTo: 'Identity & Access team (2nd line)',
  },
  {
    id: 'display',
    name: 'Dock / display',
    keywords: [
      'monitor', 'screen', 'display', 'dock', 'docking', 'usb-c', 'thunderbolt', 'hdmi',
      'displayport', 'second monitor', 'no signal', 'flickering',
    ],
    checks: [
      { id: 'dock-undocked', text: 'Does the laptop work undocked?' },
      { id: 'dock-power', text: 'Dock has power (light on)' },
      { id: 'dock-port', text: 'Cable seated in the correct USB-C / Thunderbolt port' },
      { id: 'dock-input', text: 'Monitor set to the right input source' },
      { id: 'dock-known-good', text: 'Swap in a known-good cable / dock' },
      { id: 'dock-firmware', text: 'Apply the approved dock firmware / display driver update' },
    ],
    escalateTo: 'Desktop Support (2nd line)',
  },
  {
    id: 'printer',
    name: 'Printer',
    keywords: ['printer', 'print', 'printing', 'toner', 'paper jam', 'print queue', 'scanner'],
    checks: [
      { id: 'prn-scope', text: 'One user or everyone on this printer?' },
      { id: 'prn-status', text: 'Printer online: paper, toner, any error on the panel?' },
      { id: 'prn-queue', text: 'Clear stuck jobs from the queue' },
      { id: 'prn-spooler', text: 'Restart the Print Spooler service' },
      { id: 'prn-driver', text: 'Check / reinstall the approved driver' },
      { id: 'prn-test', text: 'Print a test page' },
    ],
    escalateTo: 'Desktop Support (2nd line)',
  },
  {
    id: 'slow-pc',
    name: 'Slow PC',
    keywords: ['slow', 'sluggish', 'freezing', 'frozen', 'hanging', 'laggy', 'takes ages', 'overheating', 'fan'],
    checks: [
      { id: 'pc-uptime', text: 'Check uptime and restart if it has not been rebooted' },
      { id: 'pc-taskmgr', text: 'Task Manager: CPU, RAM and disk usage' },
      { id: 'pc-space', text: 'Check free disk space' },
      { id: 'pc-updates', text: 'Check for pending updates' },
      { id: 'pc-startup', text: 'Review startup apps' },
      { id: 'pc-av', text: 'Run an approved AV scan' },
      { id: 'pc-hw', text: 'Check hardware health and thermals' },
    ],
    escalateTo: 'Desktop Support (2nd line)',
  },
  {
    id: 'software',
    name: 'Software install request',
    keywords: ['install', 'software', 'application', 'app', 'licence', 'license', 'program', 'download', 'upgrade'],
    requestsOnly: true,
    checks: [
      { id: 'sw-approved', text: 'Is it on the approved software list?' },
      { id: 'sw-existing', text: 'Does an approved tool already do the job?' },
      { id: 'sw-request', text: 'Raise a software request (with manager approval)' },
    ],
    caution: 'Only approved software. No admin rights given out to install.',
    escalateTo: 'Software Packaging / Licensing team',
  },
  {
    id: 'general',
    name: 'General / application',
    keywords: [],
    checks: [
      { id: 'gen-scope', text: 'Confirm scope: one user, one area, or everyone?' },
      { id: 'gen-error', text: 'Capture the exact error message / screenshot' },
      { id: 'gen-when', text: 'When did it start, and did anything change?' },
      { id: 'gen-restart', text: 'Close and reopen the app, then restart the device' },
      { id: 'gen-known', text: 'Check for known issues or outages' },
    ],
    escalateTo: 'Application Support (2nd line)',
  },
];

export function getArticle(id: CategoryId): KnowledgeArticle {
  const article = KNOWLEDGE_BASE.find((a) => a.id === id);
  if (!article) throw new Error(`Unknown category: ${id}`);
  return article;
}

/**
 * Pick the category whose keywords match the description most often.
 * Request-only categories (software install) are skipped for incidents,
 * so "CAD app crashed" isn't filed as an install request.
 */
export function detectCategory(
  description: string,
  type?: TicketType,
): { article: KnowledgeArticle; matched: string[] } {
  let best: { article: KnowledgeArticle; matched: string[] } = { article: getArticle('general'), matched: [] };
  for (const article of KNOWLEDGE_BASE) {
    if (article.requestsOnly && type === 'Incident') continue;
    const matched = matchKeywords(description, article.keywords);
    if (matched.length > best.matched.length) best = { article, matched };
  }
  return best;
}
