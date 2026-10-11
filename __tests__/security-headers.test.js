const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const cheerio = require('cheerio');

// The Content-Security-Policy that CloudFront sends lives in infra/security-headers.yaml.
// A browser refuses anything the policy does not list, so these tests check the built site
// against it: a post that embeds a frame or links an image from a new address fails here
// rather than quietly breaking for readers.

const PUBLIC_DIR = path.join(__dirname, '../public');
const TEMPLATE = path.join(__dirname, '../infra/security-headers.yaml');

// The policy in the template, as { directive: [sources] }.
function readPolicy() {
  const template = fs.readFileSync(TEMPLATE, 'utf-8');
  const match = template.match(/ContentSecurityPolicy: >-\n([\s\S]*?)\n\s*Override:/);
  if (!match) {
    throw new Error(`No Content-Security-Policy found in ${TEMPLATE}`);
  }
  const policy = {};
  match[1].split(';')
    .map(part => part.trim().split(/\s+/))
    .filter(([name]) => name)
    .forEach(([name, ...sources]) => { policy[name] = sources; });
  return policy;
}

// Whether the policy lets a page on siteOrigin load url under the given directive.
// Covers the kinds of source this policy uses: 'self', 'none', schemes (data:) and
// https://host or https://*.host.
function allows(policy, directive, url, siteOrigin) {
  // form-action does not fall back to default-src: without it, any target is allowed.
  if (directive === 'form-action' && !policy[directive]) return true;
  const sources = policy[directive] || policy['default-src'] || [];

  let target;
  try {
    target = new URL(url, `${siteOrigin}/`);
  } catch (e) {
    return false;
  }

  return sources.some(source => {
    if (source === "'self'") return target.origin === siteOrigin;
    if (source.startsWith("'")) return false; // 'none', 'unsafe-inline': no address matches
    if (/^[a-z][a-z0-9+.-]*:$/.test(source)) return target.protocol === source;
    const host = source.match(/^(https?):\/\/(\*\.)?([^/:*]+)$/);
    if (!host) return false;
    if (target.protocol !== `${host[1]}:`) return false;
    return host[2] ? target.hostname.endsWith(`.${host[3]}`) : target.hostname === host[3];
  });
}

// What a page can load, and the directive that governs it.
const RESOURCES = [
  ['script[src]', 'src', 'script-src'],
  ['link[rel~="stylesheet"][href]', 'href', 'style-src'],
  ['link[rel~="preload"][as="font"][href]', 'href', 'font-src'],
  ['link[rel~="icon"][href]', 'href', 'img-src'],
  ['img[src]', 'src', 'img-src'],
  ['img[srcset], source[srcset]', 'srcset', 'img-src'],
  ['video[poster]', 'poster', 'img-src'],
  ['iframe[src], frame[src]', 'src', 'frame-src'],
  ['video[src], audio[src], video source[src], audio source[src], track[src]', 'src', 'media-src'],
  ['object[data]', 'data', 'object-src'],
  ['embed[src]', 'src', 'object-src'],
  ['form[action]', 'action', 'form-action'],
];

describe('Security Headers Tests', () => {
  let policy;
  let htmlFiles = [];
  let siteOrigin;

  beforeAll(async () => {
    if (!fs.existsSync(PUBLIC_DIR)) {
      throw new Error(
        `Public directory not found at ${PUBLIC_DIR}. Please run 'hugo' to build the site first.`
      );
    }
    policy = readPolicy();
    htmlFiles = await glob('**/*.html', { cwd: PUBLIC_DIR });

    // The address the site was built for ('self' in the policy), from the home page.
    const home = cheerio.load(fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf-8'));
    siteOrigin = new URL(home('link[rel="canonical"]').attr('href')).origin;
  });

  test('the policy should keep its strict baseline', () => {
    expect(policy['default-src']).toEqual(["'self'"]);
    expect(policy['object-src']).toEqual(["'none'"]);
    expect(policy['base-uri']).toEqual(["'self'"]);
    expect(policy['frame-ancestors']).toEqual(["'self'"]);

    // Scripts come from named hosts only: never a whole scheme or every host.
    const tooBroad = policy['script-src'].filter(source => /^(\*|https?:|data:|blob:)$/.test(source));
    expect(tooBroad).toEqual([]);
  });

  test('the check should tell allowed addresses from refused ones', () => {
    const site = 'https://www.softwarependula.net';
    expect(allows(policy, 'script-src', '/js/site.js', site)).toBe(true);
    expect(allows(policy, 'script-src', 'https://www.googletagmanager.com/gtag/js?id=G-1', site)).toBe(true);
    expect(allows(policy, 'script-src', 'https://example.com/script.js', site)).toBe(false);
    expect(allows(policy, 'script-src', 'https://googletagmanager.com.example.com/x.js', site)).toBe(false);
    expect(allows(policy, 'img-src', 'https://example.com/picture.png', site)).toBe(false);
    expect(allows(policy, 'frame-src', 'https://www.youtube.com/embed/abc', site)).toBe(true);
    expect(allows(policy, 'frame-src', '/about/', site)).toBe(false);
    expect(allows(policy, 'media-src', '/videos/a/b.mp4', site)).toBe(true);
    expect(allows(policy, 'form-action', 'https://example.com/subscribe', site)).toBe(false);
  });

  test('every page should only load what the policy allows', () => {
    const refused = [];

    htmlFiles.forEach(file => {
      const $ = cheerio.load(fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf-8'));

      RESOURCES.forEach(([selector, attribute, directive]) => {
        $(selector).each((i, elem) => {
          const value = ($(elem).attr(attribute) || '').trim();
          // srcset is a list of "address size" pairs; the others hold one address.
          const urls = attribute === 'srcset'
            ? value.split(',').map(part => part.trim().split(/\s+/)[0])
            : [value];

          urls.filter(Boolean).forEach(url => {
            if (!allows(policy, directive, url, siteOrigin)) {
              refused.push({ file, directive, url });
            }
          });
        });
      });
    });

    if (refused.length > 0) {
      console.log('\nThe Content-Security-Policy in infra/security-headers.yaml would block:');
      refused.forEach(({ file, directive, url }) => {
        console.log(`  ${file}: ${url} (${directive})`);
      });
      console.log('Host the file on this site, or add its address to that directive and ' +
        'apply the policy to staging and then live (see "Security headers" in CLAUDE.md).');
    }

    expect(refused).toEqual([]);
  });
});
