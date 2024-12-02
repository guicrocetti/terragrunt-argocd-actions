const core = require('@actions/core');
const { detectChangedModules, findEnvModules } = require('./action');


async function run() {
  try {
    const workingDir = core.getInput('working_dir');
    const projectId = core.getInput('project_id');
    const environment = core.getInput('environment');

    const targetBranch = core.getInput('target_branch');
    core.info('Starting Terragrunt-ArgoCD Action');
    core.info(`Working Directory: ${workingDir}`);
    core.info(`Project ID: ${projectId}`);
    core.info(`Environment: ${environment}`);

    const changedModules = detectChangedModules(workingDir, projectId, environment);

    const diff = findEnvModules(changedModules, targetBranch);

    console.log('Modules to apply:', diff.modules);
    console.log('Modules to destroy:', diff.destroyModules);

    core.setOutput('modules', JSON.stringify(diff.modules));
    core.setOutput('destroyModules', JSON.stringify(diff.destroyModules));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
