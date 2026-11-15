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
      { id: 'sec-no-click', text: "Tell them not to click any links, open attachments or give out their password" },
      { id: 'sec-report', text: 'Report it to the security team using the official process' },
      { id: 'sec-preserve', text: "Don't delete the message. Write down who sent it and when" },
      { id: 'sec-clicked', text: 'Ask if they clicked anything or typed a password. If yes, contact Security right away' },
      { id: 'sec-route', text: 'Offer the proper way to get access instead of sharing a password' },
    ],
    caution: "Never ask for or accept a user's password, even to help.",
    escalateTo: 'the Security team',
  },
  {
    id: 'network',
    name: 'Network / internet',
    keywords: [
      'network', 'wifi', 'wi-fi', 'internet', 'dns', 'vpn', 'server', 'telemetry', 'connection',
      'connect', 'no signal', 'ping', 'website', 'web page', 'ethernet', 'proxy', 'shared drive',
      'link down', 'packet loss',
    ],
    checks: [
      { id: 'net-scope', text: 'Check who is affected: one person, one area, or everyone?' },
      { id: 'net-physical', text: 'Check the network cable is plugged in, or Wi-Fi is connected' },
      { id: 'net-ipconfig', text: 'Check the computer has a network address (run: ipconfig /all)' },
      { id: 'net-ping', text: 'Test it can reach the router, then the internet (run: ping)' },
      { id: 'net-nslookup', text: "Test the website's name can be looked up (run: nslookup)" },
      { id: 'net-ip-vs-name', text: 'Try the site by its number address instead of its name' },
      { id: 'net-flushdns', text: 'Clear the saved web addresses and try again (run: ipconfig /flushdns)' },
      { id: 'net-proxy', text: 'Check the VPN and proxy settings' },
    ],
    escalateTo: 'the Network team',
  },
  {
    id: 'email',
    name: 'Email',
    keywords: ['email', 'e-mail', 'outlook', 'inbox', 'outbox', 'mailbox', 'calendar', 'meeting invite'],
    checks: [
      { id: 'mail-scope', text: 'Is it one email, or all email?' },
      { id: 'mail-connected', text: 'Check Outlook says "Connected" at the bottom of the window' },
      { id: 'mail-outbox', text: 'Look in the Outbox for a stuck (large) email' },
      { id: 'mail-plain', text: 'Send a simple test email with no attachment' },
      { id: 'mail-webmail', text: 'Try email in the web browser. If that works, the problem is on this computer' },
      { id: 'mail-error', text: 'Write down the exact error message (take a screenshot)' },
    ],
    caution: "Don't delete their Outlook settings (profile) as a first step.",
    escalateTo: 'the Email team',
  },
  {
    id: 'account',
    name: 'Login / password',
    keywords: [
      'password', 'locked out', 'locked', 'lockout', 'login', 'log in', 'sign in', 'signin',
      'mfa', 'authenticator', 'account', 'expired', 'forgot',
    ],
    checks: [
      { id: 'acc-verify', text: 'First, confirm the person is who they say they are (official process)' },
      { id: 'acc-ad', text: 'Check the account: locked, switched off, or password expired?' },
      { id: 'acc-reset', text: 'Unlock it, or reset the password so they choose a new one when they log in' },
      { id: 'acc-mfa', text: 'Set up two-step sign-in (MFA) again if needed' },
      { id: 'acc-devices', text: 'If it keeps locking: an old password may be saved on their phone or another device' },
    ],
    caution: 'Always confirm who they are before unlocking or resetting anything.',
    escalateTo: 'the Accounts team',
  },
  {
    id: 'display',
    name: 'Screen / dock',
    keywords: [
      'monitor', 'screen', 'display', 'dock', 'docking', 'usb-c', 'thunderbolt', 'hdmi',
      'displayport', 'second monitor', 'no signal', 'flickering',
    ],
    checks: [
      { id: 'dock-undocked', text: 'Does the laptop screen work without the dock?' },
      { id: 'dock-power', text: 'Is the dock switched on (light on)?' },
      { id: 'dock-port', text: 'Is the cable in the right port (USB-C / Thunderbolt)?' },
      { id: 'dock-input', text: 'Is the monitor set to the right input (its HDMI / DisplayPort button)?' },
      { id: 'dock-known-good', text: 'Swap in a cable or dock you know works' },
      { id: 'dock-firmware', text: 'Install the approved dock and screen updates' },
    ],
    escalateTo: 'the Desktop Support team',
  },
  {
    id: 'printer',
    name: 'Printer',
    keywords: ['printer', 'print', 'printing', 'toner', 'paper jam', 'print queue', 'scanner'],
    checks: [
      { id: 'prn-scope', text: 'Is it one person, or everyone using this printer?' },
      { id: 'prn-status', text: 'Is the printer on, with paper and toner, and no error on its screen?' },
      { id: 'prn-queue', text: 'Cancel any stuck print jobs' },
      { id: 'prn-spooler', text: 'Restart the printing service on the computer (Print Spooler)' },
      { id: 'prn-driver', text: 'Check or reinstall the approved printer software (driver)' },
      { id: 'prn-test', text: 'Print a test page' },
    ],
    escalateTo: 'the Desktop Support team',
  },
  {
    id: 'slow-pc',
    name: 'Slow computer',
    keywords: ['slow', 'sluggish', 'freezing', 'frozen', 'hanging', 'laggy', 'takes ages', 'overheating', 'fan'],
    checks: [
      { id: 'pc-uptime', text: 'Restart the computer if it has not been restarted recently' },
      { id: 'pc-taskmgr', text: 'Open Task Manager: is something using all the processor, memory or disk?' },
      { id: 'pc-space', text: 'Check free disk space' },
      { id: 'pc-updates', text: 'Check for waiting updates' },
      { id: 'pc-startup', text: 'Check which apps start by themselves when the computer turns on' },
      { id: 'pc-av', text: 'Run an approved virus scan' },
      { id: 'pc-hw', text: 'Check for hardware trouble: is it very hot, or the fan very loud?' },
    ],
    escalateTo: 'the Desktop Support team',
  },
  {
    id: 'software',
    name: 'New software',
    keywords: ['install', 'software', 'application', 'app', 'licence', 'license', 'program', 'download', 'upgrade'],
    requestsOnly: true,
    checks: [
      { id: 'sw-approved', text: 'Is it on the approved software list?' },
      { id: 'sw-existing', text: 'Does an approved tool already do the job?' },
      { id: 'sw-request', text: "Raise a software request (needs the manager's OK)" },
    ],
    caution: 'Only approved software. Never give out admin rights so they can install it themselves.',
    escalateTo: 'the Software team',
  },
  {
    id: 'general',
    name: 'Other / app problem',
    keywords: [],
    checks: [
      { id: 'gen-scope', text: 'Check who is affected: one person, one area, or everyone?' },
      { id: 'gen-error', text: 'Write down the exact error message (take a screenshot)' },
      { id: 'gen-when', text: 'When did it start, and did anything change?' },
      { id: 'gen-restart', text: 'Close and reopen the app, then restart the computer' },
      { id: 'gen-known', text: 'Check whether there is a known problem or outage' },
    ],
    escalateTo: 'the App Support team',
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
