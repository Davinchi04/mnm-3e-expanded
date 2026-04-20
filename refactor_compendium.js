const fs = require('fs');
const path = require('path');

// Construct the absolute path to compendium.json
// This assumes the script is run from the root of the project,
// and the path provided in the context is the correct base.
const compendiumFilePath = path.resolve('C:', 'Users', 'alexs', 'Projects', 'MnM AI Compendiums', 'compendium.json');

// Translations for specific keys
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

try {
    // Read the JSON file
    const fileContent = fs.readFileSync(compendiumFilePath, 'utf8');
    let compendiumData = JSON.parse(fileContent);

    // Helper function to process an array of items
    const processItems = (items) => {
        items.forEach(item => {
            if (item.system) {
                // 1. Transform 'system.description' and 'system.notes' from strings to objects with a 'value' key
                if (typeof item.system.description === 'string') {
                    item.system.description = { "value": item.system.description };
                }
                if (typeof item.system.notes === 'string') {
                    item.system.notes = { "value": item.system.notes };
                }

                // 2. Apply translations for specific key values
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
    };

    // Check the root structure of compendium.json
    if (Array.isArray(compendiumData)) {
        // Case 1: compendium.json is a root array of items
        processItems(compendiumData);
    } else if (compendiumData && Array.isArray(compendiumData.items)) {
        // Case 2: compendium.json is an object with an 'items' array
        processItems(compendiumData.items);
    } else {
        console.error("Error: compendium.json is not in an expected format. Expected a root array or an object with an 'items' array.");
        process.exit(1);
    }

    // Stringify the modified data with pretty printing (2-space indentation)
    const updatedFileContent = JSON.stringify(compendiumData, null, 2);

    // Write the modified JSON back to the file
    fs.writeFileSync(compendiumFilePath, updatedFileContent, 'utf8');

    console.log('compendium.json successfully modified.');

} catch (error) {
    console.error('An error occurred during the refactoring process:', error);
    process.exit(1); // Exit with a non-zero code to indicate failure
}
