const core = require('@actions/core');
const { detectChangedModules, validateTerragruntPlan, generateTerragruntConfig } = require('./action');

async function run() {
    try {
        const workingDir = core.getInput('working_dir');
        const projectId = core.getInput('project_id');
        const environment = core.getInput('environment');

        core.info('Starting Terragrunt-ArgoCD Action');
        core.info(`Working Directory: ${workingDir}`);
        core.info(`Project ID: ${projectId}`);
        core.info(`Environment: ${environment}`);

        const changedModules = detectChangedModules(workingDir, projectId, environment);
        const validationResults = validateTerragruntPlan(changedModules);
        const config = generateTerragruntConfig(changedModules);

        core.setOutput('modules', changedModules);
        core.setOutput('validation', validationResults);
        core.setOutput('config', config);

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
