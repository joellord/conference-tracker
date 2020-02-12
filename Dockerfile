# production environment
FROM node:10
ENV PORT 3000
EXPOSE 3000
# ENV DB_CONN_STRING mysql://xtyqpwqtsuun3fw8:xw000ljd19irc493@icopoghru9oezxh8.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/pnm79xb34yxo94c7
ENV DB_CONN_STRING mysql://root:root@database:3306/conftracker
ENV DOMAIN conf-tracker.auth0.com
ENV AUDIENCE http://conf-tracker.com
WORKDIR /server
COPY ./server/package.json /server/package.json
RUN npm install --silent
COPY ./server /server

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
# RUN npm install react-scripts@3.0.1 -g --silent
COPY ./tracker /app
RUN rm -rf /app/node_modules
RUN npm install 
RUN npm run build

WORKDIR /server
ENV UI_BUILD /app/dist

CMD ["npm", "start"]
# FROM node:10
# WORKDIR /server
# ENV PORT 3000
# EXPOSE 3000
# #ENV DB_CONN_STRING mysql://xtyqpwqtsuun3fw8:xw000ljd19irc493@icopoghru9oezxh8.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/pnm79xb34yxo94c7
# ENV DB_CONN_STRING mysql://root:root@localhost:3306/conftracker
# ENV DOMAIN conf-tracker.auth0.com
# ENV AUDIENCE http://conf-tracker.com
# ENV UI_BUILD /app/dist
# COPY ./server/package*.json ./
# RUN ["npm", "install"]
# COPY . .
# # WORKDIR /client
# # COPY ./tracker/* ./
# # RUN ["npm", "install"]
# # RUN ["npm", "run", "build"]
# # RUN ["/bin/bash", "mkdir /server/dist && cp -r ./dist/* /server/dist"]

# WORKDIR /app
# ENV PATH /app/node_modules/.bin:$PATH
# COPY ./tracker/package.json /app/package.json
# RUN npm install
# RUN npm install react-scripts@3.0.1 -g
# COPY ./tracker/* /app/
# RUN npm run build

# WORKDIR /server
# CMD ["npm", "start"]