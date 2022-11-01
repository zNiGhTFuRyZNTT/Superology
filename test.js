const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'videos/anal');

// console.log(dir);
fs.readdir('./videos/anal/', (err, files) => {
  console.log(files);
});