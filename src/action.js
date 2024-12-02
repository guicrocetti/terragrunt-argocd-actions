const core = require('@actions/core');
const github = require('@actions/github');
const path = require('path');
const fs = require('fs');

function detectChangedModules(workingDir, projectId, environment) {
  const basePath = path.join(workingDir, projectId);
  const modules = [];

  const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
  // const octokit = github.getOctokit(GITHUB_TOKEN);

  const { context = {} } = github
  const { pull_request } = context.payload;

  console.log(`Pull Request Number:`, pull_request);
  

  function scanDirectory(directory) {
    const items = fs.readdirSync(directory, { withFileTypes: true });

    core.info(`ITEMS >>>>>>>>> ${JSON.stringify(items)}`);
    
    for (const item of items) {
      const fullPath = path.join(directory, item.name);

      core.info(`fullPath >>>>>>> ${fullPath}`);
      
      if (item.isDirectory()) {
        if (item.name.endsWith(`-${environment}`)) {
          modules.push(fullPath);
        } else {
          scanDirectory(fullPath);
        }
      }
    }
  }

  scanDirectory(basePath);
  core.info(`MODULES >>>>>>> ${JSON.stringify(modules)}`);
  return modules;
}

function validateTerragruntPlan(modules) {
  const results = [];
  
  for (const module of modules) {
    const planPath = path.join(module, 'terragrunt.hcl');
    if (fs.existsSync(planPath)) {
      const content = fs.readFileSync(planPath, 'utf8');
      results.push({
        module: module,
        valid: true,
        content: content
      });
    }
  }
  
  return results;
}

function generateTerragruntConfig(modules) {
  return modules.map(module => ({
    path: module,
    config: {
      terragrunt: {
        include: {
          path: findParentConfig(module)
        }
      }
    }
  }));
}

function findParentConfig(modulePath) {
  let currentPath = path.dirname(modulePath);
  while (currentPath !== '/') {
    const configPath = path.join(currentPath, 'terragrunt.hcl');
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    currentPath = path.dirname(currentPath);
  }
  return null;
}

module.exports = {
  detectChangedModules,
  validateTerragruntPlan,
  generateTerragruntConfig
};
