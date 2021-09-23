FROM alpine:latest AS build

# The Hugo version
ARG VERSION=0.79.1

ADD https://github.com/gohugoio/hugo/releases/download/v${VERSION}/hugo_${VERSION}_Linux-64bit.tar.gz /hugo.tar.gz
RUN tar -zxvf hugo.tar.gz
RUN /hugo version

# We add git to the build stage, because Hugo needs it with --enableGitInfo
RUN apk add --no-cache git

# The source files are copied to /site
COPY . /site
RUN chmod -R 777 /site
WORKDIR /site

# And then we just run Hugo
RUN /hugo --minify --enableGitInfo

# stage 2
FROM nginx:stable-alpine

WORKDIR /usr/share/nginx/html/

# Clean the default public folder
RUN rm -fr * .??*

ENV NGINX_HOST "www.softwarependula.net"

COPY --from=build /site/public /usr/share/nginx/html
RUN chmod -R 777 /usr/share/nginx
