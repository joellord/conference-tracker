# conference-tracker

> A Conference tracker to be used by the Auth0 team

## Requirements

* Nodemon (npm install -g nodemon)

## Setup

``` bash
# run server
nodemon ./server

# run the client
cd ./tracker
npm start
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Database
The date is stored on mLabs.  Connection string is not shared in this repo.

## Docker stuff

### Front end
Build container:

`podman build -t joellord/ctrkr-front --build-arg clientId=wSC1eR3087oo6wKt43TsNtWpbANLVBK8 --build-arg domain=conf-tracker.auth0.com --build-arg audience=http://conf-tracker.com .
`

Run container

`podman run --rm --name front -d -p 8080:80 joellord/ctrkr-front`