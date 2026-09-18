/**
 * TAEMRY FLUX - Adsterra Ad Units Configuration
 * 10 Verified Clean (Non-Adult) Adsterra Ads provided by Publisher
 * Mapped cleanly across 1 to 200 daily ads directory
 */

export const ADSTERRA_ADS = [
  {
    id: 1,
    unitNumber: 1,
    name: 'Adsterra Social Push & Display',
    type: 'social_bar',
    category: 'Cloud & Digital Services',
    description: 'Interactive social push & verified digital service showcase',
    scriptUrl: 'https://furydonkeypharmacy.com/50/ee/2b/50ee2b17435ac4365aaf09d8b78e37fc.js',
    fallbackKey: '348bec7e11d69dd8e00ad7abcfda220e',
    fallbackWidth: 300,
    fallbackHeight: 250,
  },
  {
    id: 2,
    unitNumber: 2,
    name: 'Adsterra Native Recommendation',
    type: 'native',
    category: 'Tech Innovations & AI',
    description: 'Dynamic sponsored content & multi-card native recommendation',
    containerId: 'container-5bf63e8d1e9ee1696072543170578631',
    scriptUrl: 'https://furydonkeypharmacy.com/5bf63e8d1e9ee1696072543170578631/invoke.js',
  },
  {
    id: 3,
    unitNumber: 3,
    name: 'Adsterra Interstitial & Display',
    type: 'popunder',
    category: 'Global Web Solutions',
    description: 'High-visibility verified sponsor showcase & interactive display',
    scriptUrl: 'https://furydonkeypharmacy.com/2b/a4/b6/2ba4b6afc951cd9b28a3e0adcf11169d.js',
    fallbackKey: '348bec7e11d69dd8e00ad7abcfda220e',
    fallbackWidth: 300,
    fallbackHeight: 250,
  },
  {
    id: 4,
    unitNumber: 4,
    name: 'Adsterra Verified SmartLink',
    type: 'direct_link',
    category: 'Featured Sponsor Portal',
    description: 'Direct verified partner portal & exclusive promotional offer',
    directUrl: 'https://furydonkeypharmacy.com/b29mwk6ib?key=03c488d12ea332855ab1f15328f24d96',
    fallbackKey: '348bec7e11d69dd8e00ad7abcfda220e',
    fallbackWidth: 300,
    fallbackHeight: 250,
  },
  {
    id: 5,
    unitNumber: 5,
    name: 'Adsterra Vertical Display (160x300)',
    type: 'banner',
    category: 'Financial Analytics & Tools',
    description: 'Sleek vertical responsive banner format (160x300)',
    key: '19c6652b849bbe396022bdb7f175d56f',
    width: 160,
    height: 300,
  },
  {
    id: 6,
    unitNumber: 6,
    name: 'Adsterra Skyscraper Display (160x600)',
    type: 'banner',
    category: 'Cybersecurity & Infrastructure',
    description: 'High-impact vertical tower skyscraper banner (160x600)',
    key: 'fd27a1814835fbff89ee0cb42fbae781',
    width: 160,
    height: 600,
  },
  {
    id: 7,
    unitNumber: 7,
    name: 'Adsterra Leaderboard Display (728x90)',
    type: 'banner',
    category: 'E-Commerce & Digital Marketplace',
    description: 'Wide horizontal leaderboard header banner (728x90)',
    key: '1927eacd8c0e1749c32ce23c1fa6024a',
    width: 728,
    height: 90,
  },
  {
    id: 8,
    unitNumber: 8,
    name: 'Adsterra Mobile Compact (320x50)',
    type: 'banner',
    category: 'Mobile Utilities & Apps',
    description: 'Optimized smartphone banner format (320x50)',
    key: 'cee7411858a8277e437923a67c7238b8',
    width: 320,
    height: 50,
  },
  {
    id: 9,
    unitNumber: 9,
    name: 'Adsterra Medium Rectangle (300x250)',
    type: 'banner',
    category: 'Decentralized Networks',
    description: 'Standard high-engagement display rectangle (300x250)',
    key: '348bec7e11d69dd8e00ad7abcfda220e',
    width: 300,
    height: 250,
  },
  {
    id: 10,
    unitNumber: 10,
    name: 'Adsterra Full Banner Display (468x60)',
    type: 'banner',
    category: 'Smart Web Systems',
    description: 'Mid-sized horizontal promotional banner (468x60)',
    key: 'f8a64be7a0f9f117ae6527aef89422ce',
    width: 468,
    height: 60,
  },
];

/**
 * Get the Adsterra ad config for any ad number (1 to 200)
 */
export function getAdsterraConfig(adNumber) {
  const index = (adNumber - 1) % ADSTERRA_ADS.length;
  return ADSTERRA_ADS[index];
}

/**
 * Generates sandboxed, isolated HTML for rendering any Adsterra ad inside an iframe srcDoc.
 * Using srcDoc ensures document.write calls inside Adsterra invoke.js run safely
 * without interrupting or overwriting the parent React application DOM.
 */
export function generateAdsterraHtml(adConfig) {
  if (!adConfig) return '';

  if (adConfig.type === 'banner') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_blank">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${adConfig.key}',
      'format' : 'iframe',
      'height' : ${adConfig.height},
      'width' : ${adConfig.width},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://furydonkeypharmacy.com/${adConfig.key}/invoke.js"></script>
</body>
</html>`;
  }

  if (adConfig.type === 'native') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_blank">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      min-height: 100%;
      background: transparent;
      padding: 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    #${adConfig.containerId} {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <div id="${adConfig.containerId}"></div>
  <script async="async" data-cfasync="false" src="${adConfig.scriptUrl}"></script>
</body>
</html>`;
  }

  if (adConfig.type === 'social_bar' || adConfig.type === 'popunder') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_blank">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <script src="${adConfig.scriptUrl}"></script>
  <script type="text/javascript">
    atOptions = {
      'key' : '${adConfig.fallbackKey || '348bec7e11d69dd8e00ad7abcfda220e'}',
      'format' : 'iframe',
      'height' : ${adConfig.fallbackHeight || 250},
      'width' : ${adConfig.fallbackWidth || 300},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://furydonkeypharmacy.com/${adConfig.fallbackKey || '348bec7e11d69dd8e00ad7abcfda220e'}/invoke.js"></script>
</body>
</html>`;
  }

  if (adConfig.type === 'direct_link') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_blank">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${adConfig.fallbackKey || '348bec7e11d69dd8e00ad7abcfda220e'}',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://furydonkeypharmacy.com/${adConfig.fallbackKey || '348bec7e11d69dd8e00ad7abcfda220e'}/invoke.js"></script>
</body>
</html>`;
  }

  return '';
}
