# Austin 2040

## Installing the app development environment

- Install yarn, nodejs
- Setup the dependencies
  cd Musework
  yarn install

## Install Grunt CLI to build the production version of the files from source

yarn add grunt-cli
./node_modules/.bin/grunt

## Start up the server to serve the built files

yarn global add serve
serve -s . -l 3003
