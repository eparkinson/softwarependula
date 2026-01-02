# Software Pendula

Nothing nuch to see here. This is the source code for my personal blog [Software Pendula](https://www.softwarependula.net/). 
It uses [Hugo](https://gohugo.io/) together with the [Hugo Dusk](https://themes.gohugo.io/hugo-dusk/) theme and it runs on [Google Cloud Run](https://cloud.google.com/run).

## Testing

This repository includes automated tests to check for:
- Broken internal links
- Missing pages (404 errors)
- JavaScript errors in HTML
- Basic HTML validation

### Running Tests

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the site with Hugo:
   ```bash
   hugo --minify --enableGitInfo
   ```

3. Run the tests:
   ```bash
   npm test
   ```

Or use the combined script:
```bash
npm run test:all
```
