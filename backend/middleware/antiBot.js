/**
 * TAEMRY FLUX - High-Grade Anti-Bot & Anti-Fake Security Middleware
 * Blocks automated headless bots, scrapers, spam scripts, and disposable temp emails.
 */

// Comprehensive blacklist of temporary, throwaway, and disposable email services
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'guerrillamail.info',
  'guerrillamail.biz',
  'yopmail.com',
  'yopmail.fr',
  'trashmail.com',
  'dispostable.com',
  'getnada.com',
  'burnermail.io',
  'fakeinbox.com',
  'throwawaymail.com',
  'inboxkitten.com',
  'mohmal.com',
  'crazymailing.com',
  'temp-mail.org',
  'fakemailgenerator.com',
  'emailfake.com',
  'generator.email',
  'mytemp.email',
  'nada.ltd',
  'nada.email',
  'tempail.com',
  'dropmail.me',
  'maildrop.cc',
  'disposablemail.com',
  'trashmail.net',
  'harakirimail.com',
  'mytempmail.com',
  'binkmail.com',
  'safetymail.info',
  'spamgourmet.com',
  'mailcatch.com',
  'spam4.me',
  'bccto.me',
  'chacuo.net',
  '0815.ru',
  '0-mail.com',
  '10minutemail.net',
  '20minutemail.com',
  'anonaddy.me',
  'duck.com'
]);

// Automation frameworks, headless browsers & scraping tools
const BOT_USER_AGENTS = [
  'puppeteer',
  'selenium',
  'phantomjs',
  'headlesschrome',
  'python-requests',
  'aiohttp',
  'scrapy',
  'httpclient',
  'wget',
  'go-http-client',
  'curl/',
  'axios/0.',
  'postmanruntime',
  'apache-httpclient',
  'java/',
  'libwww-perl',
  'node-fetch',
  'winhttp'
];

/**
 * Validates whether an email belongs to a known fake/disposable provider
 */
export const isDisposableEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return true; // Malformed email
  const domain = parts[1].trim();
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
};

/**
 * Checks if request header user-agent matches known bot/headless browser signatures
 */
export const isBotUserAgent = (userAgent) => {
  if (!userAgent || typeof userAgent !== 'string') return true; // Empty user agent is suspicious
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((botKeyword) => ua.includes(botKeyword));
};

// In-memory rate limiting map for bot flood protection: ip -> { count, windowStart }
const ipRateLimit = new Map();

/**
 * Express Middleware: Blocks Bots, automated scripts, honeypot traps, and disposable emails
 */
export const antiBotGuard = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // 1. Check User-Agent for known automation / headless scrapers
  // (Skip webhook endpoints like 3737 forwarder which might use simple HTTP client)
  if (!req.path.includes('/sms-webhook') && isBotUserAgent(userAgent)) {
    console.warn(`[AntiBot] Blocked bot user-agent: "${userAgent}" from IP: ${ip}`);
    return res.status(403).json({
      success: false,
      error: 'Access Denied',
      message: 'Automated script or bot activity detected. Access blocked for security.',
    });
  }

  // 2. Honeypot check: If hidden form fields are filled, it's an automated bot
  if (req.body) {
    if (req.body.hp_bot_trap || req.body.website_url_hp || req.body.honeypot) {
      console.warn(`[AntiBot] Honeypot triggered from IP: ${ip}`);
      return res.status(400).json({
        success: false,
        error: 'Bot Detected',
        message: 'Bot submission rejected.',
      });
    }

    // 3. Disposable / Temp Email Protection
    const emailToCheck = req.body.email || req.body.userEmail;
    if (emailToCheck && isDisposableEmail(emailToCheck)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Email Provider',
        message: 'Disposable and temporary email addresses are strictly prohibited. Please use a verified provider (Gmail, Yahoo, Outlook, etc.).',
      });
    }
  }

  // 4. IP Rapid Request Rate Limiter (Max 120 requests per minute per IP for sensitive API routes)
  const now = Date.now();
  const rate = ipRateLimit.get(ip) || { count: 0, windowStart: now };
  if (now - rate.windowStart > 60000) {
    rate.count = 0;
    rate.windowStart = now;
  }
  rate.count += 1;
  ipRateLimit.set(ip, rate);

  if (rate.count > 150) {
    return res.status(429).json({
      success: false,
      error: 'Rate Limit Exceeded',
      message: 'Too many requests from this IP. Please wait a moment before trying again.',
    });
  }

  next();
};

/**
 * Ad Human Velocity & Bot Guard: Prevents script bots from instantly clicking 200 ads in seconds
 */
const adClickLedger = new Map();

export const adBotGuard = (req, res, next) => {
  const uid = req.user?.uid || req.body?.uid || req.ip || 'anon';
  const now = Date.now();
  const userClicks = adClickLedger.get(uid) || { lastClickTime: 0, clickCountLastMinute: 0, minuteStart: now };

  // Reset 1-minute window
  if (now - userClicks.minuteStart > 60000) {
    userClicks.clickCountLastMinute = 0;
    userClicks.minuteStart = now;
  }

  // Human click velocity: A human cannot view ads faster than 1 per 2 seconds
  if (now - userClicks.lastClickTime < 1500) {
    return res.status(429).json({
      success: false,
      error: 'Velocity Limit',
      message: 'Suspiciously fast ad interaction detected. Human viewing timing enforced.',
    });
  }

  // Cap at 30 ads per minute max to prevent automated bot scripts
  if (userClicks.clickCountLastMinute >= 30) {
    return res.status(429).json({
      success: false,
      error: 'Ad Rhythm Exceeded',
      message: 'Maximum ad view pace reached. Please watch ads at normal human speed.',
    });
  }

  userClicks.lastClickTime = now;
  userClicks.clickCountLastMinute += 1;
  adClickLedger.set(uid, userClicks);

  next();
};
