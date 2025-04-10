#!/usr/bin/env node

import { Command } from 'commander';
import { AwsAssume, configure, validateConfigFile, performReset } from './AwsAssume';
import { getVersion } from './config/version';
import { SelectionMenu, ConfirmationDialog } from './utils/configCollector'; 
import { greenText, yellowText } from './utils/formatting';
import { switchToSession } from './utils/configParserUtil';
import * as config from './config';

// Create a new instance of AwsAssume
const awsAssume = new AwsAssume();

// Create a new Command instance
const program = new Command();

// Setup program metadata
program
  .name('aws-sessions-switcher')
  .description('A tool to help switching between multiple AWS environments easy and seamless')
  .version(getVersion());

// Global options
program
  .option('-l, --list', 'Lists all the role assumptions that you can make');

// Configure command
program
  .command('configure')
  .description('Configure aws-sessions-switcher for initial run')
  .action(async () => {
    await configure();
  });

// Projects command with subcommands
const projectsCommand = program
  .command('projects')
  .description('Manage project configurations');

projectsCommand
  .command('add')
  .description('Add a new project configuration')
  .action(async () => {
    await awsAssume.addProject();
  });

projectsCommand
  .command('delete')
  .requiredOption('-n, --project-name <name>', 'Name of the project to be deleted')
  .description('Delete a project configuration')
  .action(async (options) => {
    const confirm = new ConfirmationDialog(
      `Are you sure you want to delete project: [${options.projectName}]?`
    );
    const answer = await confirm.getAnswer();
    if (answer) {
      awsAssume.deleteProject(options.projectName);
    }
  });

projectsCommand
  .command('ls')
  .description('List all configured projects')
  .action(() => {
    awsAssume.listProjects();
  });

// By default, list projects if no subcommand specified
projectsCommand.action(() => {
  awsAssume.listProjects();
});

// Environments commands
const envCommands = ['env', 'environments'].map(cmdName => {
  const cmd = program
    .command(cmdName)
    .description('Manage environment configurations');

  cmd
    .command('add')
    .description('Add a new environment to a project')
    .requiredOption('-n, --project-name <name>', 'Name of the project in which an environment needs to be added')
    .action(() => {
      console.log(yellowText('Not supported currently. It will be available in later versions...'));
    });

  cmd
    .command('delete')
    .description('Delete an environment from a project')
    .requiredOption('-n, --project-name <name>', 'Name of the project in which an environment needs to be deleted')
    .requiredOption('-e, --env-name <name>', 'Name of the environment to delete')
    .action(() => {
      console.log(yellowText('Not supported currently. It will be available in later versions...'));
    });

  cmd
    .option('-n, --project-name <name>', 'Name of the project')
    .action((options) => {
      if (options.projectName) {
        awsAssume.listProjectEnvironments(options.projectName);
      } else {
        awsAssume.listAllEnvironments();
      }
    });

  return cmd;
});

// Sessions command
const sessionsCommand = program
  .command('sessions')
  .description('Manage AWS sessions');

sessionsCommand
  .command('switch')
  .description('Switch between active AWS sessions')
  .action(async () => {
    const sessions = awsAssume.getActiveSessions('', false);
    const selectionMenu = new SelectionMenu(sessions);
    const selectedSession = await selectionMenu.getAnswer();
    switchToSession(selectedSession);
  });

sessionsCommand
  .option('-n, --project-name <name>', 'Name of the project')
  .action((options) => {
    awsAssume.getActiveSessions(options.projectName || '');
  });

// Reset command
program
  .command('reset')
  .description('Reset all configurations')
  .action(async () => {
    await performReset();
  });

// Dynamically add project commands
function addDynamicProjectCommands() {
  try {
    validateConfigFile();
    
    // Get a list of configured projects
    const projects = awsAssume.listProjects(false, false);

    // For each project, create a command with subcommands for environments
    for (const project of projects) {
      const projectCmd = program.command(project);
      const envs = awsAssume.listProjectEnvironments(project, false);

      for (const env of envs) {
        const envCmd = projectCmd.command(env);
        const roles = awsAssume.listRoles(project, env, false);

        for (const role of roles) {
          envCmd.command(role)
            .action(async () => {
              await awsAssume.assumeRole(project, env, role);
            });
        }

        // If no role specified, show available roles
        envCmd.action(() => {
          awsAssume.listRoles(project, env, true);
        });
      }

      // If no environment specified, show available environments
      projectCmd.action(() => {
        awsAssume.listProjectEnvironments(project);
      });
    }
  } catch (error) {
    // If configuration file not found, don't add dynamic commands
  }
}

// Add dynamic commands for configured projects
addDynamicProjectCommands();

// Default action - list assumptions
program.action((cmd) => {
  if (cmd.list || !process.argv.slice(2).length) {
    try {
      validateConfigFile();
      const allConfig = awsAssume.getAllProjectsConfig();
      
      const configDetails = Object.entries(allConfig).map(([, details]) => {
        return {
          ...details,
          command: `aws-sessions-switcher ${details.project_name} ${details.project_environment} ${details.role_name}`
        };
      });
      
      const headers = ['assumptions', 'command_to_run'];
      const rows = configDetails.map(details => [
        `${details.project_name}/${details.project_environment}/${details.role_name}`,
        details.command
      ]);
      
      if (rows.length > 0) {
        require('./utils/formatting').printTable(headers, rows);
      } else {
        console.log(yellowText('No AWS role assumptions configured. Run `aws-sessions-switcher configure` to set up.'));
      }
    } catch (error) {
      // Handle configuration error
    }
  }
});

// Parse command line arguments
program.parse();
