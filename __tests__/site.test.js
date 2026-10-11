const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { glob } = require('glob');
const cheerio = require('cheerio');

// Configuration
const PUBLIC_DIR = path.join(__dirname, '../public');

// Helper function to determine if a URL is an internal link
function isInternalLink(url) {
  if (!url) return false;
  return !url.startsWith('http://') && 
         !url.startsWith('https://') && 
         !url.startsWith('//') && 
         !url.startsWith('mailto:') && 
         !url.startsWith('#') &&
         !url.startsWith('data:');
}

describe('Static Site Tests', () => {
  let htmlFiles = [];

  beforeAll(async () => {
    // Check if public directory exists
    if (!fs.existsSync(PUBLIC_DIR)) {
      throw new Error(
        `Public directory not found at ${PUBLIC_DIR}. Please run 'hugo' to build the site first.`
      );
    }

    // Find all HTML files in public directory
    htmlFiles = await glob('**/*.html', { cwd: PUBLIC_DIR });
    
    if (htmlFiles.length === 0) {
      throw new Error('No HTML files found in public directory');
    }
  });

  describe('Page Existence Tests', () => {
    test('should have at least one HTML file', () => {
      expect(htmlFiles.length).toBeGreaterThan(0);
    });

    test('should have index.html', () => {
      const hasIndex = htmlFiles.some(file => file === 'index.html');
      expect(hasIndex).toBe(true);
    });

    test('should have 404.html page', () => {
      const has404 = htmlFiles.some(file => file.includes('404'));
      expect(has404).toBe(true);
    });
  });

  describe('Broken Links Tests', () => {
    let allLinks = [];
    let internalLinks = [];
    let publicFiles = [];

    beforeAll(async () => {
      // Get all files in public directory (not just HTML)
      const allPublicFiles = await glob('**/*', { 
        cwd: PUBLIC_DIR,
        nodir: true 
      });
      publicFiles = allPublicFiles.map(f => '/' + f.replace(/\\/g, '/'));
      
      // Also add directory indices
      const dirs = await glob('**/', { cwd: PUBLIC_DIR });
      dirs.forEach(dir => {
        publicFiles.push('/' + dir);
        publicFiles.push('/' + dir + 'index.html');
      });

      // Extract all internal links from HTML files
      htmlFiles.forEach(file => {
        const filePath = path.join(PUBLIC_DIR, file);
        const html = fs.readFileSync(filePath, 'utf-8');
        const $ = cheerio.load(html);

        // Find all href attributes
        $('a[href]').each((i, elem) => {
          const href = $(elem).attr('href');
          allLinks.push({ file, href });

          // Check if it's an internal link
          if (isInternalLink(href)) {
            internalLinks.push({ file, href });
          }
        });

        // Find all src attributes (images, scripts)
        $('[src]').each((i, elem) => {
          const src = $(elem).attr('src');
          if (isInternalLink(src)) {
            internalLinks.push({ file, href: src });
          }
        });

        // Find CSS links
        $('link[href]').each((i, elem) => {
          const href = $(elem).attr('href');
          if (isInternalLink(href)) {
            internalLinks.push({ file, href });
          }
        });
      });
    });

    test('should have some links', () => {
      expect(allLinks.length).toBeGreaterThan(0);
    });

    test('should not have broken internal links', () => {
      const brokenLinks = [];

      internalLinks.forEach(({ file, href }) => {
        // Normalize the link
        let normalizedHref = href.split('#')[0].split('?')[0]; // Remove hash and query params
        
        if (!normalizedHref) return; // Skip empty hrefs (anchor-only links)

        // Make it absolute if relative
        if (!normalizedHref.startsWith('/')) {
          const fileDir = path.dirname('/' + file);
          normalizedHref = path.join(fileDir, normalizedHref).replace(/\\/g, '/');
        }

        // Check various possible paths
        const possiblePaths = [
          normalizedHref,
          normalizedHref + '/index.html',
          normalizedHref.replace(/\/$/, '') + '/index.html',
          normalizedHref.replace(/\/$/, ''),
          normalizedHref + '.html'
        ];

        const exists = possiblePaths.some(p => {
          const filePath = path.join(PUBLIC_DIR, p);
          return fs.existsSync(filePath) || publicFiles.includes(p);
        });

        if (!exists) {
          brokenLinks.push({ file, href, normalizedHref });
        }
      });

      if (brokenLinks.length > 0) {
        console.log('\nBroken links found:');
        brokenLinks.forEach(({ file, href, normalizedHref }) => {
          console.log(`  ${file}: ${href} (resolved to ${normalizedHref})`);
        });
      }

      expect(brokenLinks).toEqual([]);
    });
  });

  describe('JavaScript Error Tests', () => {
    test('should not have inline JavaScript with common error patterns', () => {
      const errorPatterns = [
        /console\.error\(/,
        /throw new Error\(/,
        /undefined is not/,
        /cannot read property.*undefined/i,
      ];

      const filesWithErrors = [];

      htmlFiles.forEach(file => {
        const filePath = path.join(PUBLIC_DIR, file);
        const html = fs.readFileSync(filePath, 'utf-8');
        const $ = cheerio.load(html);

        // Check inline scripts
        $('script').each((i, elem) => {
          const scriptContent = $(elem).html();
          if (scriptContent) {
            errorPatterns.forEach(pattern => {
              if (pattern.test(scriptContent)) {
                filesWithErrors.push({
                  file,
                  pattern: pattern.toString(),
                  snippet: scriptContent.substring(0, 100)
                });
              }
            });
          }
        });
      });

      expect(filesWithErrors).toEqual([]);
    });

    test('should have valid script tags with proper src attributes', () => {
      const invalidScripts = [];

      htmlFiles.forEach(file => {
        const filePath = path.join(PUBLIC_DIR, file);
        const html = fs.readFileSync(filePath, 'utf-8');
        const $ = cheerio.load(html);

        $('script[src]').each((i, elem) => {
          const src = $(elem).attr('src');
          
          // Check for obviously malformed src attributes
          if (!src || src.trim() === '' || src === 'undefined' || src === 'null') {
            invalidScripts.push({ file, src });
          }
        });
      });

      if (invalidScripts.length > 0) {
        console.log('\nInvalid script tags found:');
        invalidScripts.forEach(({ file, src }) => {
          console.log(`  ${file}: src="${src}"`);
        });
      }

      expect(invalidScripts).toEqual([]);
    });

    test('should not have broken external script references in HTML', () => {
      const suspiciousScripts = [];

      htmlFiles.forEach(file => {
        const filePath = path.join(PUBLIC_DIR, file);
        const html = fs.readFileSync(filePath, 'utf-8');
        const $ = cheerio.load(html);

        $('script[src]').each((i, elem) => {
          const src = $(elem).attr('src');
          
          // Check for local scripts that don't exist
          if (isInternalLink(src)) {
            const scriptPath = path.join(PUBLIC_DIR, src.startsWith('/') ? src.substring(1) : src);
            if (!fs.existsSync(scriptPath)) {
              suspiciousScripts.push({ file, src });
            }
          }
        });
      });

      if (suspiciousScripts.length > 0) {
        console.log('\nMissing local script files:');
        suspiciousScripts.forEach(({ file, src }) => {
          console.log(`  ${file}: ${src}`);
        });
      }

      expect(suspiciousScripts).toEqual([]);
    });
  });

  describe('Analytics Tests', () => {
    const loadsAnalytics = html => html.includes('googletagmanager.com/gtag/js');

    // Runs the Analytics script of the built home page against a stand-in document, clicks
    // the given target, and returns the events that the click put in the Analytics queue.
    function eventsAfterClick(target) {
      const html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf-8');
      const $ = cheerio.load(html);
      const script = $('script:not([src])').toArray()
        .map(elem => $(elem).html())
        .find(content => content.includes('gtag('));

      const listeners = [];
      const sandbox = {
        document: {
          addEventListener: (type, listener) => { if (type === 'click') listeners.push(listener); }
        }
      };
      sandbox.window = sandbox;
      vm.createContext(sandbox);
      vm.runInContext(script, sandbox);

      listeners.forEach(listener => listener({ target }));
      return JSON.parse(JSON.stringify(sandbox.dataLayer.map(args => Array.from(args))))
        .filter(args => args[0] === 'event');
    }

    // A clicked element inside a link to the given address.
    function insideLinkTo(href) {
      const { protocol, hostname } = new URL(href);
      return { closest: () => ({ protocol, hostname }) };
    }

    test('every page that loads Analytics should report contact clicks', () => {
      const pagesWithoutListener = [];
      let pagesWithAnalytics = 0;

      htmlFiles.forEach(file => {
        const html = fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf-8');
        if (!loadsAnalytics(html)) return;

        pagesWithAnalytics++;
        if (!html.includes('contact_click')) {
          pagesWithoutListener.push(file);
        }
      });

      expect(pagesWithAnalytics).toBeGreaterThan(0);
      expect(pagesWithoutListener).toEqual([]);
    });

    test.each([
      ['mailto:someone@example.com', 'email'],
      ['tel:+27110000000', 'phone'],
      ['https://wa.me/27110000000', 'whatsapp'],
      ['https://api.whatsapp.com/send?phone=27110000000', 'whatsapp'],
    ])('a click on a %s link should send contact_click with method %s', (href, method) => {
      expect(eventsAfterClick(insideLinkTo(href))).toEqual([
        ['event', 'contact_click', { method }]
      ]);
    });

    test('other clicks should send no event', () => {
      expect(eventsAfterClick(insideLinkTo('https://github.com/eparkinson'))).toEqual([]);
      expect(eventsAfterClick({ closest: () => null })).toEqual([]);
      // A target without closest() must not throw either.
      expect(eventsAfterClick({})).toEqual([]);
    });
  });

  describe('HTML Validation Tests', () => {
    test('all HTML files should have valid basic structure', () => {
      const invalidFiles = [];

      htmlFiles.forEach(file => {
        const filePath = path.join(PUBLIC_DIR, file);
        const html = fs.readFileSync(filePath, 'utf-8');
        const $ = cheerio.load(html);

        const issues = [];

        // Check for basic HTML structure (lenient for partials)
        if (!file.includes('partial')) {
          if ($('html').length === 0 && html.includes('<!DOCTYPE')) {
            issues.push('Missing <html> tag');
          }
        }

        if (issues.length > 0) {
          invalidFiles.push({ file, issues });
        }
      });

      if (invalidFiles.length > 0) {
        console.log('\nHTML validation issues:');
        invalidFiles.forEach(({ file, issues }) => {
          console.log(`  ${file}:`);
          issues.forEach(issue => console.log(`    - ${issue}`));
        });
      }

      expect(invalidFiles).toEqual([]);
    });

    test('all pages should have a title', () => {
      const pagesWithoutTitle = [];

      htmlFiles.forEach(file => {
        // Skip partial files
        if (file.includes('partial')) return;

        const filePath = path.join(PUBLIC_DIR, file);
        const html = fs.readFileSync(filePath, 'utf-8');
        const $ = cheerio.load(html);

        const title = $('title').text();
        if (!title || title.trim() === '') {
          pagesWithoutTitle.push(file);
        }
      });

      if (pagesWithoutTitle.length > 0) {
        console.log('\nPages without title:');
        pagesWithoutTitle.forEach(file => console.log(`  ${file}`));
      }

      expect(pagesWithoutTitle).toEqual([]);
    });
  });
});
