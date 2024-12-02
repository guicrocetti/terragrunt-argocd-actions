const core = require('@actions/core');
const github = require('@actions/github');
const path = require('path');
const fs = require('fs');

// Detecta módulos que seguem o padrão esperado
function detectChangedModules(workingDir, projectId, environment) {
  const folder = fs.readdir('.', { withFileTypes: true })
  core.info(`${JSON.stringify(folder)}`)

  const basePath = path.join(workingDir, projectId);
  const modules = [];

  function scanDirectory(directory, level = 1) {
    const items = fs.readdirSync(directory, { withFileTypes: true });
    for (const item of items) {
      if (item.name.startsWith('_')) continue;

      const fullPath = path.join(directory, item.name);
      if (item.isDirectory()) {
        if (level === 2 && item.name.endsWith(`-${environment}`)) {
          modules.push(fullPath);
        } else if (level < 2) {
          scanDirectory(fullPath, level + 1);
        }
      }
    }
  }

  scanDirectory(basePath);
  return modules;
}

// Identifica as diferenças entre duas versões do módulo
function findEnvModules(modules, targetBranchModules) {
  const result = {
    modules: [],
    destroyModules: [],
  };

  for (const modulePath of modules) {
    const moduleName = path.basename(modulePath);
    console.log(targetBranchModules)
    const targetPath = targetBranchModules.find((target) => path.basename(target) === moduleName);

    if (!targetPath) {
      // O módulo não existe na branch de destino
      result.modules.push(modulePath);
      continue;
    }

    // Comparar os arquivos do módulo
    const currentFiles = getFilesInModule(modulePath);
    const targetFiles = getFilesInModule(targetPath);

    const missingFiles = targetFiles.filter((file) => !currentFiles.includes(file));
    if (missingFiles.length > 0) {
      result.destroyModules.push(modulePath);
    }

    // Adicionar os arquivos restantes para aplicar
    const remainingFiles = currentFiles.filter((file) => !missingFiles.includes(file));
    if (remainingFiles.length > 0) {
      result.modules.push(modulePath);
    }
  }

  return result;
}

// Obtém a lista de arquivos em um módulo
function getFilesInModule(modulePath) {
  if (!fs.existsSync(modulePath)) {
    return [];
  }

  const files = [];
  function scanFiles(directory) {
    const items = fs.readdirSync(directory, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(directory, item.name);
      if (item.isDirectory()) {
        scanFiles(fullPath);
      } else {
        files.push(path.relative(modulePath, fullPath));
      }
    }
  }

  scanFiles(modulePath);
  return files;
}

// Encontra módulos destruídos ou ausentes
function findDestroyedModules(modulePath, targetPath) {
  const currentFiles = getFilesInModule(modulePath);
  const targetFiles = getFilesInModule(targetPath);

  const missingFiles = targetFiles.filter((file) => !currentFiles.includes(file));
  return missingFiles.length > 0;
}

module.exports = {
  detectChangedModules,
  findEnvModules,
  findDestroyedModules,
};
