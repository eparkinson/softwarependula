# Software Pendula - Agent Configuration Guide

## Project Overview

Software Pendula is a personal blog built with Hugo, a static site generator. The blog focuses on software development, architecture, and technology topics.

**Owner**: Elroy Parkinson  
**Email**: elroy.parkinson@gmail.com  
**Website**: https://www.softwarependula.net  
**Staging**: https://staging.softwarependula.net

## Technology Stack

### Core Technologies
- **Hugo**: v0.79.1 - Static site generator
- **Theme**: Hugo Dusk theme (default-dark color scheme)
- **Language**: Go (Hugo templates)
- **Web Server**: Nginx (stable-alpine)
- **Container**: Docker multi-stage build

### Infrastructure
- **Cloud Platform**: AWS (Amazon Web Services)
- **Storage**: AWS S3 buckets
  - Live: `s3://bz-build-repository/live/www.softwarependula.net`
  - Staging: `s3://staging.softwarependula.net`
- **CDN**: AWS CloudFront (Distribution ID: E3TETIEU2CNJME)
- **CI/CD**: GitHub Actions
- **Region**: us-east-1

## Repository Structure

```
/
├── .github/workflows/       # CI/CD pipeline definitions
├── .aws/                   # AWS configuration files
├── archetypes/             # Hugo content templates
├── content/                # Blog content (markdown files)
│   ├── post/              # Blog posts
│   ├── news/              # News digest entries
│   └── about.md           # About page
├── layouts/               # Custom Hugo templates
├── static/                # Static assets (images, CSS, JS)
├── themes/hugo-dusk/      # Hugo Dusk theme
├── config.toml            # Hugo configuration
├── Dockerfile             # Multi-stage Docker build
└── README.md              # Project documentation
```

## Build & Deployment

### Local Development
```bash
# Install Hugo
sudo apt-get install hugo

# Run development server
hugo server

# Build for production
hugo --minify --enableGitInfo
```

### Docker Build
```bash
# Build Docker image
docker build -t softwarependula .

# The Dockerfile performs a two-stage build:
# 1. Hugo compilation (Alpine + Hugo 0.79.1)
# 2. Nginx serving (nginx:stable-alpine)
```

### Deployment Workflows

#### Staging Deployment
- **Trigger**: Push to `main` branch
- **Workflow**: `.github/workflows/aws-deploy-staging.yml`
- **Process**:
  1. Install Hugo
  2. Build with `--baseURL "https://staging.softwarependula.net"`
  3. Sync to S3 staging bucket
  4. Invalidate CloudFront cache

#### Production Deployment
- **Trigger**: Manual workflow dispatch
- **Workflow**: `.github/workflows/aws-deploy-live.yml`
- **Process**:
  1. Install Hugo
  2. Build with default baseURL
  3. Sync to S3 production bucket

## Configuration

### Hugo Configuration (`config.toml`)
- **Base URL**: https://www.softwarependula.net
- **Language**: en-US
- **Theme**: hugo-dusk with default-dark colors
- **Pagination**: 3 posts per page
- **Syntax Highlighting**: Fruity theme with Chroma
- **Comments**: Disqus (shortname: software-pendula)
- **Features**: RobotsTXT, Emoji support, GitInfo enabled

### Menu Structure
1. Posts (`/post/`) - Weight: -120
2. News (`/news/`) - Weight: -115
3. Tags (`/tags/`) - Weight: -110

### Social Links
- GitHub: eparkinson
- Twitter: @ElroyParkinson
- LinkedIn: elroy-parkinson-13b61a8

## Content Guidelines

### Blog Posts
- Location: `content/post/`
- Format: Markdown with front matter
- Front matter fields:
  - `title`: Post title
  - `tags`: Array of tags
  - `date`: Publication date (YYYY-MM-DD)

### News Entries
- Location: `content/news/YYYYMM/`
- Format: Daily news digest format
- Organized by year-month folders

## Key Features

1. **Static Site Generation**: Fast, secure, and SEO-friendly
2. **Dark Theme**: Hugo Dusk with default-dark color scheme
3. **Responsive Design**: Mobile-friendly layout
4. **Syntax Highlighting**: Code blocks with Fruity theme (via Chroma)
5. **Git Integration**: Automatic Git info in posts
6. **Comments**: Disqus integration
7. **Social Integration**: Twitter, LinkedIn, GitHub links
8. **RSS/Atom Feeds**: Automatic generation
9. **SEO Optimization**: Canonical URLs, robots.txt, sitemap

## Maintenance Tasks

### Adding a New Blog Post
```bash
hugo new post/my-new-post.md
# Edit content/post/my-new-post.md
# Commit and push to trigger staging deployment
```

### Adding News Entries
```bash
hugo new news/YYYYMM/YYYY-MM-DD.md
# Edit content/news/YYYYMM/YYYY-MM-DD.md
# Commit and push
```

### Updating Theme
```bash
cd themes/hugo-dusk
git pull origin master
```

## Environment Variables & Secrets

### Required GitHub Secrets
- `AWS_ACCESS_KEY_ID`: AWS credentials for S3 deployment
- `AWS_SECRET_ACCESS_KEY`: AWS credentials for S3 deployment

### Docker Environment Variables
- `NGINX_HOST`: www.softwarependula.net

## Testing & Quality Assurance

### Pre-deployment Checks
1. Build succeeds locally: `hugo --minify --enableGitInfo`
2. Links are valid
3. Syntax highlighting works correctly
4. Theme renders properly
5. No Hugo warnings or errors

### Post-deployment Verification
1. Check staging site: https://staging.softwarependula.net
2. Verify content appears correctly
3. Test responsive design
4. Validate CloudFront cache invalidation
5. Confirm live deployment after manual trigger

## Troubleshooting

### Common Issues
1. **Hugo version mismatch**: Ensure Hugo 0.79.1 is used
2. **Theme not found**: Check git submodule status
3. **S3 sync failures**: Verify AWS credentials
4. **CloudFront cache**: May take 5-15 minutes to invalidate
5. **Base URL issues**: Check config.toml and build flags

### Debugging
```bash
# Verbose Hugo build
hugo --verbose --debug

# Check Hugo version
hugo version

# Validate config
hugo config
```

## Additional Resources

- Hugo Documentation: https://gohugo.io/documentation/
- Hugo Dusk Theme: https://themes.gohugo.io/hugo-dusk/
- AWS S3 Static Hosting: https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html
- CloudFront Documentation: https://docs.aws.amazon.com/cloudfront/

## Project History

- **2013**: Blog started on Google Blogger platform
- **2021**: Migrated to self-hosted Hugo on Google Cloud Run
- **Current**: Deployed on AWS S3 + CloudFront

## Author Information

**Elroy Parkinson**
- Solutions Architect with 20 year's experience as an IT professional
- MSc Computer Science (Nelson Mandela Metropolitan University)
- MBA (Charles Sturt University)
- Location: Johannesburg, South Africa
- Focus: Cloud Architecture, Kubernetes, Agile, Spring Boot microservices
- Side Project: Chat-Leads.net (AI chatbots for sales leads)

## Published Work
- Parkinson E & Warren PR (1995) - Graph colouring techniques
- Parkinson E & Warren PR (1996) - Examination timetabling

---
*Last Updated: 2026-01-02*
