# Start with CentOS
# FROM centos/httpd-24-centos7
FROM nginx:alpine

# Install NodeJS
# USER root
# RUN curl -sL https://rpm.nodesource.com/setup_10.x | bash -
# RUN yum install -y nodejs
RUN apk add --update nodejs npm

# Test NodeJs
RUN node -v

# Copy files
COPY nginx.conf /etc/nginx/nginx.conf
WORKDIR /app
COPY . ./

# Argument and ENV vars
ARG clientId
ARG domain
ARG audience
ARG api

ENV CLIENTID=$clientId
ENV DOMAIN=$domain
ENV AUDIENCE=$audience
ENV API=$api
ENV NGINX_PORT=8080

# Replace files
RUN sed -i 's/ARG_CLIENT_ID/'$CLIENTID'/g' ./src/utils/credentials.js
RUN sed -i 's/ARG_DOMAIN/'$DOMAIN'/g' ./src/utils/credentials.js
RUN sed -i 's|ARG_AUDIENCE|'$AUDIENCE'|g' ./src/utils/credentials.js
RUN sed -i 's/ARG_API/'$API'/g' ./src/utils/credentials.js

# Create build
RUN npm install
RUN npm run build

# Copy to httpd folder
RUN cp -r /app/dist/* /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]

# stage: 1
# FROM node:12-alpine as build
# WORKDIR /app
# COPY . ./

# ARG clientId
# ARG domain
# ARG audience
# ARG api

# ENV CLIENTID=$clientId
# ENV DOMAIN=$domain
# ENV AUDIENCE=$audience
# ENV API=$api

# RUN sed -i 's/ARG_CLIENT_ID/'$CLIENTID'/g' ./src/utils/credentials.js
# RUN sed -i 's/ARG_DOMAIN/'$DOMAIN'/g' ./src/utils/credentials.js
# RUN sed -i 's|ARG_AUDIENCE|'$AUDIENCE'|g' ./src/utils/credentials.js
# RUN sed -i 's/ARG_API/'$API'/g' ./src/utils/credentials.js

# RUN npm install
# RUN npm run build

# # stage: 2 — the production environment
# FROM centos/httpd-24-centos7
# #RUN rm /etc/nginx/conf.d/default.conf
# #COPY --from=build /app/nginx.conf /etc/nginx/conf.d/vueapp.conf
# #RUN chmod 777 /etc/nginx/conf.d/default.conf
# #RUN chmod -R 777 /var/cache/nginx
# COPY --from=build /app/dist /var/www/

# #CMD ["nginx", "-g", "daemon off;"]
