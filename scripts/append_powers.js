const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../1st Powers Input.csv');
const newItems = [
    'Senses,Sensory,1,1,None,Personal,Permanent,"One or more of your senses are improved or you have additional sensory abilities.","Allocate ranks to options (Accurate, Acute, Analytical, Awareness, Darkvision, etc.).",,',
    'Shapeshift,General,1,8,Free,Personal,Sustained,"You can take the form of any creature or object.","Variable 2 (traits of assumed form) plus Morph (visual appearance).",,',
    'Shrinking,Power,1,2,Free,Personal,Sustained,"You can decrease your size.","Each rank reduces size rank by 1. Provides bonuses to Dodge/Parry and Stealth.","Normal Strength, Growth Punch",',
    'Speed,Movement,1,1,Free,Personal,Sustained,"You can move faster than normal.","Speed rank equals effect rank.",,',
    'Summon,Power,1,2,Standard,Close,Sustained,"You can call an independent character to your side.","Summoned minion has (rank x 15) power points.","Active, Heroic, Mental Link, Multiple Minions, Sacrifice",',
    'Swimming,Movement,1,1,Free,Personal,Sustained,"You can move through the water faster than normal.","Water speed rank equals effect rank.",,',
    'Telekinesis,Control,1,2,Standard,Ranged,Sustained,"You can move objects at a distance with your mind.","Equivalent to Move Object power.","Damaging, Perception, Precise",',
    'Telepathy,Sensory,1,2,Standard,Perception,Sustained,"You can communicate mentally and read minds.","Combination of Mind Reading and Communication (Mental).",,',
    'Teleport,Movement,1,2,Move,Personal,Instant,"You can move instantly from one point to another.","Rank 1 = 60ft, Rank 10 = 1000 miles.","Accurate, Portal, Turnabout",',
    'Transform,Control,1,2,Standard,Close,Continuous,"You can change one type of thing into another.","Rank 1 transforms 1 lb. Rank 10 transforms 400 lbs.","Increased Mass, Perception, Ranged",',
    'Variable,General,1,7,Standard,Personal,Sustained,"You can change your traits at will to suit your needs.","Allocate (rank x 5) power points to any traits fitting descriptors.","Action (Free or Move), Affects Others",',
    'Weather Control,Control,1,2,Standard,Perception,Sustained,"You can manipulate the weather in your area.","Environment effect (Cold, Heat, Impede Movement, Visibility).",,'
];

const currentContent = fs.readFileSync(csvPath, 'utf8');
const updatedContent = currentContent + '\n' + newItems.join('\n');
fs.writeFileSync(csvPath, updatedContent);
console.log('Successfully added the final 12 powers to the CSV.');
