// This file is so that the footer on the loading page
// will automatically update when building the app.
// This is so I can be lazy and not have to bother manually updating it.
// Dev script adds build time at end.


const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const pkg = require('./package.json')
const htmlPath = path.join(__dirname, 'src', 'main', 'windows', 'main', 'index.html');

const version = pkg.version;
const date = new Date().toLocaleDateString('en-US',{ 
    year: 'numeric',
    month: 'long',
    day: 'numeric'});

const time = new Date().toLocaleTimeString();

let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(
    /<p id="footer">.*?<\/p>/,
    `<p id="footer">PPLaunch v${version}-dev &nbsp; | &nbsp; ${date} &nbsp; | &nbsp; ${time}</p>`
);

fs.writeFileSync(htmlPath, html);
console.log('Updated Footer:',
    chalk.blue("version") + "=" + version,
    chalk.blue("date") + "=" + date,
    chalk.black("time") + "=" + time);