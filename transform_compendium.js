const fs = require('fs');
const filePath = 'C:/Users/alexs/Projects/MnM AI Compendiums/compendium.json';
const actionTranslations = {
    'standard': 'simple',
    'free': 'libre',
    'none': 'aucune',
    'full': 'complet',
    'move': 'mouvement'
};
const porteeTranslations = {
    'close': 'contact',
    'ranged': 'distance'
};
const dureeTranslations = {
    'sustained': 'soutenu',
    'continuous': 'continu'
};

let data;
try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
} catch (error) {
    console.error(`Error reading or parsing ${filePath}:`, error);
    process.exit(1);
}

// Access the 'powers' array directly
const powersArray = data.powers;

if (!Array.isArray(powersArray)) {
    console.error('Expected compendium.json to contain a "powers" array.');
    process.exit(1);
}

powersArray.forEach(item => {
    if (item.system) {
        // Transformation 1: String to Object for description and notes
        if (typeof item.system.description === 'string') {
            item.system.description = { value: item.system.description };
        }
        if (typeof item.system.notes === 'string') {
            item.system.notes = { value: item.system.notes };
        }

        // Transformation 2: Key Value Translation
        if (item.system.action && actionTranslations[item.system.action]) {
            item.system.action = actionTranslations[item.system.action];
        }
        if (item.system.portee && porteeTranslations[item.system.portee]) {
            item.system.portee = porteeTranslations[item.system.portee];
        }
        if (item.system.duree && dureeTranslations[item.system.duree]) {
            item.system.duree = dureeTranslations[item.system.duree];
        }
    }
});

try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    console.log(`Successfully transformed and saved ${filePath}`);
} catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    process.exit(1);
}
