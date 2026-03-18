const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../1st Powers Input.csv');
const newItems = [
    'Nullify,Control,1,1,Standard,Ranged,Instant,"You can counter a particular descriptor or group of effects.","Opposed check: your Nullify rank vs target\'s effect rank.","Area, Broad, Perception, Simultaneous",',
    'Power-Lifting,Power,1,1,None,Personal,Permanent,"You have additional Strength for the purpose of lifting and carrying only.","Strength rank for lifting equals Power-Lifting rank.",,',
    'Protection,Defense,1,1,None,Personal,Permanent,"You have a protective layer that grants you a bonus to Toughness.","Toughness bonus equals Protection rank.","Impervious, Sustained","Noticeable"',
    'Quickness,General,1,1,Free,Personal,Sustained,"You can perform routine tasks much faster than normal.","Time rank for tasks is reduced by Quickness rank.","Physical, Mental",',
    'Regeneration,Power,1,1,None,Personal,Permanent,"You recover from damage much faster than normal.","Recover one Bruised condition per rank every 10 rounds.","Persistent",',
    'Remote Sensing,Sensory,1,2,Standard,Perception,Sustained,"You can perceive your surroundings from a distance.","Rank determines distance (Rank 1 = 60ft, Rank 10 = 1000 miles).","Dimensional, Subtle","Feedback, Noticeable"'
];

const currentContent = fs.readFileSync(csvPath, 'utf8');
const updatedContent = currentContent + '\n' + newItems.join('\n');
fs.writeFileSync(csvPath, updatedContent);
console.log('Successfully added 6 more powers to the CSV.');
