const builder = require('electron-builder');

const now = new Date();
const month = String(now.getMonth() + 1).padStart(2, '0');
const year = now.getFullYear();
const hours = String(now.getHours()).padStart(2, '0');
const mins = String(now.getMinutes()).padStart(2, '0');
const timestamp = `${month}${year}.${hours}${mins}`;

builder.build({
  config: {
    artifactName: `TFC-Public-Panel-Launcher-\${version}-dev.${timestamp}-\${os}-\${arch}.\${ext}`
  }
});