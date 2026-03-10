const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const jsDir = path.join(__dirname, 'js');

const dirs = [
  'core',
  'engine',
  'entities',
  'combat',
  'environment',
  'ui'
];

dirs.forEach(d => fs.mkdirSync(path.join(srcDir, d), { recursive: true }));

const fileMapping = {
  'main.js': 'core',
  'config.js': 'core',
  'game.js': 'engine',
  'input.js': 'engine',
  'player.js': 'entities',
  'enemy.js': 'entities',
  'chest.js': 'entities',
  'projectile.js': 'combat',
  'aoe.js': 'combat',
  'world.js': 'environment',
  'ui.js': 'ui'
};

const getImportPath = (fromModule, targetModule) => {
  const fromFolder = fileMapping[fromModule];
  const targetFolder = fileMapping[targetModule];
  
  if (!fromFolder || !targetFolder) {
      console.log(`Missing mapping for ${fromModule} or ${targetModule}`);
      return `./${targetModule}`;
  }
  
  if (fromFolder === targetFolder) {
      return `./${targetModule}`;
  }
  
  return `../${targetFolder}/${targetModule}`;
};

// Ler e atualizar cada arquivo
Object.entries(fileMapping).forEach(([fileName, folder]) => {
  const oldPath = path.join(jsDir, fileName);
  const newPath = path.join(srcDir, folder, fileName);
  
  if (fs.existsSync(oldPath)) {
      let content = fs.readFileSync(oldPath, 'utf8');
      
      // Update imports: "import { ... } from './target.js'" -> "import { ... } from '../newfolder/target.js'"
      const importRegex = /from\s+['"]\.\/([^'"]+)['"]/g;
      
      content = content.replace(importRegex, (match, targetModule) => {
          const newImport = getImportPath(fileName, targetModule);
          return `from '${newImport}'`;
      });
      
      fs.writeFileSync(newPath, content);
  }
});

// Update index.html
const indexHtmlPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    htmlContent = htmlContent.replace(/src="js\/main\.js"/g, 'src="/src/core/main.js"');
    fs.writeFileSync(indexHtmlPath, htmlContent);
}

console.log('Refactoring completed!');
