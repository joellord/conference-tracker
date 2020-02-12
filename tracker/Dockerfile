FROM nginx:1.17
COPY ./nginx.conf /etc/nginx/nginx.conf
WORKDIR /code
COPY ./dist .
EXPOSE 8080:8080
# CMD ["nginx", "-g", "daemon off;"]
      # post:
      #   execNewPod:
      #     command:
      #       - /bin/sh
      #       - '-c'
      #       - hostname && sleep 2 && sed -i 's/app_conf/'$APP_CONF'/g' /etc/nginx/nginx.conf && sleep 2 && nginx -g daemon off;
      #   failurePolicy: ignore