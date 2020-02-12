docker run -p 3306:3306 -d --name database --rm joellord/conftracker-db
docker run --rm --name conftracker -d --link database -p 3000:3000 joellord/conftracker
docker run --name myadmin -d --rm --link database:db -p 8888:80 phpmyadmin/phpmyadmin
