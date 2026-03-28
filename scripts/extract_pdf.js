const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('MnM_Powers_Only.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('extracted_powers.txt', data.text);
    console.log('PDF extracted to extracted_powers.txt');
}).catch(err => {
    console.error(err);
});
