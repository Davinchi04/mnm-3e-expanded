const fs = require('fs-extra');
const path = require('path');

const manifestPath = path.join(__dirname, '../mnm-3e-expanded/module.json');
const packagePath = path.join(__dirname, '../package.json');

async function syncAndBump() {
  try {
    const manifest = await fs.readJson(manifestPath);
    const pkg = await fs.readJson(packagePath);

    const versionParts = manifest.version.split('.');
    
    // Increment the PATCH version (the 3rd number)
    versionParts[2] = parseInt(versionParts[2]) + 1;
    
    const newVersion = versionParts.join('.');
    
    manifest.version = newVersion;
    pkg.version = newVersion;
    
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    await fs.writeJson(packagePath, pkg, { spaces: 2 });
    
    console.log(`Successfully synced and bumped version to ${newVersion}`);
    
    // Automatically stage the changed files
    const { execSync } = require('child_process');
    execSync(`git add "${manifestPath}" "${packagePath}"`);
    
  } catch (err) {
    console.error('Failed to update versions:', err);
    process.exit(1);
  }
}

syncAndBump();
