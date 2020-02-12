FROM mysql:5.7
EXPOSE 3306
COPY ./init.sql /docker-entrypoint-initdb.d
ENV MYSQL_ROOT_PASSWORD root
VOLUME /my/own/datadir:/var/lib/mysql
