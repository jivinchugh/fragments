# fragments

1. **How to run lint**  
   npm init @eslint/config@latest  
   Need to install the following packages:  
   @eslint/create-config@1.3.1

✔ How would you like to use ESLint? · problems  
 ✔ What type of modules does your project use? · commonjs  
 ✔ Which framework does your project use? · none  
 ✔ Does your project use TypeScript? · javascript  
 ✔ Where does your code run? · node  
 slint, globals, @eslint/js  
 ✔ Would you like to install them now? · No / Yes  
 ✔ Which package manager do you want to use? · npm

Once done, to check if there is any issues, run  
 `npm audit fix`

Add a lint script to your package.json  
"scripts": {  
 "test": "echo \"Error: no test specified\" && exit 1",  
 "lint": "eslint \"./src/\*_/_.js\""  
 },

2. **PINO SETUP**  
   Install by running the command  
   `npm install --save pino pino-pretty pino-http`

   Then create and configure Pino Logger instance in `src/logger.js`

```
// src/logger.js

// Use `info` as our standard log level if not specified
const options = { level: process.env.LOG_LEVEL || 'info' };

// If we're doing `debug` logging, make the logs easier to read
if (options.level === 'debug') {
  // https://github.com/pinojs/pino-pretty
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  };
}

// Create and export a Pino Logger instance:
// https://getpino.io/#/docs/api?id=logger
module.exports = require('pino')(options);
```

3. **Server Startup Scripts**  
   Add some npm scripts to package.json in order to automatically start our server. The start script runs our server normally; dev runs it via nodemon, which watches the src/\*\* folder for any changes, restarting the server whenever something is updated; debug is the same as dev but also starts the node inspector on port 9229, so that you can attach a debugger (e.g., VSCode):

```
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1",
  "lint": "eslint \"./src/**/*.js\"",
  "start": "node src/server.js",
  "dev": "cross-env LOG_LEVEL=debug nodemon ./src/server.js --watch src",
  "debug": "cross-env LOG_LEVEL=debug nodemon --inspect=0.0.0.0:9229 ./src/server.js --watch src"
},
```

**Makesure, for windows, add "cross-env"**

This project uses Pino for structured logging. The logger is configured in `src/logger.js` and logs all HTTP requests and server events in JSON format.

**Project Structure**  
*src/: All source code goes here.  
*app.js: Initializes the Express server and middleware.  
*logger.js: Configures the Pino logger for structured logging.  
*server.js: Entry point of the server.  
\*.vscode/: VSCode configuration files for debugging.
