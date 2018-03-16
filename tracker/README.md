# conference-tracker

> A Conference tracker to be used by the Auth0 team

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Google Cloud Platform DB
Start the proxy with
``` bash
./cloud_sql_proxy -instances="conference-tracker:us-central1:conference-tracker"=tcp:3306
```
