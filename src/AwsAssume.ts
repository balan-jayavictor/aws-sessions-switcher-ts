import * as fs from 'fs';
import * as path from 'path';
import { DateTime } from 'luxon';
import ConfigParser from 'configparser';
import * as config from './config/index.js';
import { ProjectEnvironmentConfig, SessionCredentials } from './config/index.js';
import * as awsClient from './utils/awsClient.js';
import * as configParserUtil from './utils/configParserUtil.js';
import * as configCollector from './utils/configCollector.js';
import { 
  infoLog, 
  errorLog, 
  greenText, 
  yellowText, 
  printTable, 
  getSessionRow, 
  getRemainingTime 
} from './utils/formatting.js';

/**
 * Main class for AWS Session Switching functionality
 */
export class AwsAssume {
  private allProjectsConfig: Record<string, ProjectEnvironmentConfig> = {};
  private allActiveSessions: Record<string, SessionCredentials> = configParserUtil.getAllActiveSessions();

  constructor() {
    if (fs.existsSync(config.AWS_ASSUME_CONFIG_PATH)) {
      this.allProjectsConfig = configParserUtil.getAllProjects();
    }
  }

  /**
   * Get all projects configuration
   */
  getAllProjectsConfig(): Record<string, ProjectEnvironmentConfig> {
    return this.allProjectsConfig;
  }

  /**
   * List all configured projects
   */
  listProjects(printable = true, validateConfiguration = true): string[] {
    if (validateConfiguration) {
      validateConfigFile();
    }

    const projects: string[] = [];
    
    for (const [, details] of Object.entries(this.allProjectsConfig)) {
      if (details.project_name && !projects.includes(details.project_name)) {
        if (printable) {
          console.log(greenText(`- ${details.project_name}`));
        }
        projects.push(details.project_name);
      }
    }
    
    return projects;
  }

  /**
   * List environments for a specific project
   */
  listProjectEnvironments(projectName: string, printable = true): string[] {
    validateConfigFile();
    
    const projectEnvs: string[] = [];
    
    for (const [, details] of Object.entries(this.allProjectsConfig)) {
      if (details.project_name && projectName === details.project_name) {
        projectEnvs.push(details.project_environment);
        if (printable) {
          console.log(greenText(`- ${details.project_environment}`));
        }
      }
    }
    
    return projectEnvs;
  }

  /**
   * List all environments across all projects
   */
  listAllEnvironments(printable = true, withProjectPrefix = true): void {
    validateConfigFile();
    
    for (const [, details] of Object.entries(this.allProjectsConfig)) {
      const prefix = withProjectPrefix ? `${details.project_name}-` : '';
      if (printable) {
        console.log(greenText(`- ${prefix}${details.project_environment}`));
      }
    }
  }

  /**
   * List available roles for a project environment
   */
  listRoles(projectName: string, environment: string, printable = false): string[] {
    validateConfigFile();
    
    const roles: string[] = [];
    
    for (const [, details] of Object.entries(this.allProjectsConfig)) {
      if (
        details.project_name && 
        projectName === details.project_name && 
        environment === details.project_environment
      ) {
        roles.push(details.role_name);
        if (printable) {
          infoLog(`${details.role_name} => ${details.role_arn}`);
        }
      }
    }
    
    return roles;
  }

  /**
   * Add a new project configuration
   */
  async addProject(): Promise<void> {
    validateConfigFile();
    await configure('a', false);
  }

  /**
   * Delete a project configuration
   */
  deleteProject(projectName: string): void {
    validateConfigFile();
    
    const configs = { ...this.allProjectsConfig };
    
    for (const cfg in configs) {
      if (cfg.includes(projectName)) {
        delete this.allProjectsConfig[cfg];
      }
    }

    const writer = new ConfigParser();
    
    for (const [name, value] of Object.entries(this.allProjectsConfig)) {
      writer.addSection(name);
      Object.entries(value).forEach(([key, val]) => {
        writer.set(name, key, String(val));
      });
    }
    
    configParserUtil.replaceAwsAssumeConfig(writer);
  }

  /**
   * Assume an AWS role
   */
  async assumeRole(projectName: string, environment: string, role: string): Promise<void> {
    const projectConfig = this.allProjectsConfig[`${projectName}-${environment}`];
    
    infoLog(`Attempting to assume role: "${role}" using ARN: "${projectConfig.role_arn}" on project: ${projectName}`);
    
    const sessionName = `session-${projectName}-${environment}`;
    const options = [
      ['aws_access_key_id', 'AccessKeyId'],
      ['aws_secret_access_key', 'SecretAccessKey'],
      ['aws_session_token', 'SessionToken'],
      ['aws_security_token', 'SessionToken'],
    ];

    let sessionCreds;
    
    if (projectConfig.mfa_required === true || projectConfig.mfa_required === 'True') {
      const mfaDialog = new configCollector.InputDialog(
        `MFA TOKEN for device ${projectConfig.mfa_device_arn}`
      );
      const mfaToken = await mfaDialog.getAnswer();
      sessionCreds = await awsClient.getStsCredentials(projectName, projectConfig, mfaToken, sessionName);
    } else {
      sessionCreds = await awsClient.getStsCredentialsWithoutMfa(projectName, projectConfig, sessionName);
    }

    if (!sessionCreds?.Credentials) {
      errorLog('Failed to obtain session credentials');
      return;
    }

    const newSession: Record<string, string> = {};
    
    const creds = sessionCreds.Credentials as Record<string, any>;
    options.forEach(([k, v]) => {
      newSession[k] = creds?.[v] || '';
    });
    
    // Format expiration timestamp
    newSession['expiration'] = DateTime.fromJSDate(
      sessionCreds.Credentials.Expiration as Date
    ).toFormat('yyyy-MM-dd HH:mm:ss');
    
    configParserUtil.replaceConfigSection(config.AWS_ASSUME_CONFIG_PATH, sessionName, newSession);
    configParserUtil.replaceConfigSection(config.AWS_CREDS_PATH, 'default', newSession);
    
    console.log(greenText('- SUCCESS!'));
  }

  /**
   * Get all currently active sessions
   */
  getActiveSessions(projectName: string, printable = true): string[] {
    validateConfigFile();
    
    const sessions = this.allActiveSessions;
    const remainingTimes: Record<string, string> = {};
    
    for (const [sessionName, sessionDetails] of Object.entries(sessions)) {
      remainingTimes[sessionName] = getRemainingTime(sessionDetails.expiration);
    }
    
    if (Object.keys(remainingTimes).length === 0) {
      console.log(yellowText(
        '- No active sessions present. Run `aws-sessions-switcher -l` to see all possible role assumptions you can make'
      ));
      return [];
    } else {
      const headers = ['session_name', 'remaining_time', 'configured_to_be_used_with_aws_command'];
      const rows = Object.entries(remainingTimes).map(([sessionName, remainingTime]) => 
        getSessionRow(sessionName, remainingTime, sessions[sessionName])
      );
      
      if (printable) {
        printTable(headers, rows);
        console.log(
          `Note: If ${yellowText("`configured_to_be_used_with_aws_command`")} is False,\n` +
          `run ${greenText("`aws-sessions-switcher sessions switch`")} and select this session to activate it`
        );
      }
      
      return Object.keys(remainingTimes);
    }
  }
}

/**
 * Validate that the config file exists
 */
export function validateConfigFile(): void {
  if (!fs.existsSync(config.AWS_ASSUME_CONFIG_PATH)) {
    errorLog(`Could not locate configuration file at "${config.AWS_ASSUME_CONFIG_PATH}"`, false);
    infoLog("Run `aws-sessions-switcher configure` to create one");
    process.exit(1);
  }
}

/**
 * Configure a new project
 */
export async function configure(writeMode = 'w', checkFileExistence = true): Promise<void> {
  if (checkFileExistence && fs.existsSync(config.AWS_ASSUME_CONFIG_PATH)) {
    errorLog(
      'File already exists. ' +
      'Run `aws-sessions-switcher projects add` if you want to add a new project configuration. ' +
      'Type \'aws-sessions-switcher -h\' to see all the available sub-commands'
    );
    return;
  }
  
  const collector = new configCollector.ConfigCollector();
  const answers = await collector.collect();
  
  if (!answers) {
    return;
  }
  
  const cfgParser = new ConfigParser();
  cfgParser.addSection(`${answers.project_name}-${answers.project_environment}`);
  
  Object.entries(answers).forEach(([key, value]) => {
    cfgParser.set(`${answers.project_name}-${answers.project_environment}`, key, String(value));
  });
  
  // Ensure directory exists
  const dirPath = path.dirname(config.AWS_ASSUME_CONFIG_PATH);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  const configString = cfgParser.sections().map(section => {
    const items = cfgParser.items(section);
    return `[${section}]\n${Object.entries(items).map(([k, v]) => `${k} = ${v}`).join('\n')}`;
  }).join('\n\n');
  fs.writeFileSync(config.AWS_ASSUME_CONFIG_PATH, configString);
  
  console.log(yellowText(
    `Note: Make sure to put your security credentials under ` +
    `"aws-sessions-switcher-${answers.project_name}" ` +
    `section of your AWS Credentials`
  ));
}

/**
 * Reset the configuration file
 */
export async function performReset(): Promise<void> {
  if (fs.existsSync(config.AWS_ASSUME_CONFIG_PATH)) {
    try {
      const confirmationDialog = new configCollector.ConfirmationDialog(
        `This file => "${config.AWS_ASSUME_CONFIG_PATH}" will be deleted. ` +
        `Are you sure you want to perform a reset?: `
      );
      
      const answer = await confirmationDialog.getAnswer();
      
      if (answer) {
        fs.unlinkSync(config.AWS_ASSUME_CONFIG_PATH);
        infoLog(`The file "${config.AWS_ASSUME_CONFIG_PATH}" is deleted`);
      }
    } catch (error) {
      errorLog(`The file "${config.AWS_ASSUME_CONFIG_PATH}" could not be deleted`);
    }
  } else {
    errorLog(`The file "${config.AWS_ASSUME_CONFIG_PATH}" does not exist`);
  }
}
