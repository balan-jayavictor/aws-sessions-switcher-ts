import * as fs from 'fs';
import * as path from 'path';
import ConfigParser from 'configparser';
import { errorLog, isSessionExpired } from './formatting.js';
import * as config from '../config/index.js';

/**
 * Utilities for parsing and manipulating configuration files
 */

function configToString(configParser: ConfigParser): string {
  return configParser.sections().map(section => {
    const items = configParser.items(section);
    return `[${section}]\n${Object.entries(items).map(([k, v]) => `${k} = ${v}`).join('\n')}`;
  }).join('\n\n');
}

export function replaceConfigSection(fileName: string, sectionName: string, sectionValue: Record<string, string>): void {
  try {
    const configParser = new ConfigParser();
    configParser.read(fileName);
    configParser.sections();
    
    // Add or update the section
    configParser.addSection(sectionName);
    Object.entries(sectionValue).forEach(([key, value]) => {
      configParser.set(sectionName, key, value);
    });
    
    // Write back to file
    fs.writeFileSync(fileName, configToString(configParser));
  } catch (error) {
    errorLog(`There was a problem reading or parsing file: ${fileName}`, false);
    throw error;
  }
}

export function getAwsCredsParser(): ConfigParser {
  const configParser = new ConfigParser();
  try {
    configParser.read(config.AWS_CREDS_PATH);
    return configParser;
  } catch (error) {
    errorLog(`There was a problem reading or parsing your credentials file: ${config.AWS_CREDS_PATH}`, false);
    throw error;
  }
}

export function getAwsAssumeConfigParser(): ConfigParser {
  const configParser = new ConfigParser();
  try {
    // Check if file exists, if not create an empty file
    if (!fs.existsSync(config.AWS_ASSUME_CONFIG_PATH)) {
      const dirPath = path.dirname(config.AWS_ASSUME_CONFIG_PATH);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(config.AWS_ASSUME_CONFIG_PATH, '');
    }
    
    configParser.read(config.AWS_ASSUME_CONFIG_PATH);
    return configParser;
  } catch (error) {
    errorLog(`There was a problem reading or parsing your config file: ${config.AWS_ASSUME_CONFIG_PATH}`, false);
    throw error;
  }
}

export function replaceAwsAssumeConfig(configParserWithNewConfig: ConfigParser): void {
  try {
    fs.writeFileSync(config.AWS_ASSUME_CONFIG_PATH, configToString(configParserWithNewConfig));
  } catch (error) {
    errorLog(`Failed to write to config file: ${config.AWS_ASSUME_CONFIG_PATH}`, false);
    throw error;
  }
}

export function getAllProjects(): Record<string, config.ProjectEnvironmentConfig> {
  const configParser = getAwsAssumeConfigParser();
  // Read only the project configuration, excluding the sessions
  const sections = configParser.sections();
  const projects: Record<string, config.ProjectEnvironmentConfig> = {};
  
  for (const section of sections) {
    if (!section.startsWith('session-')) {
      const items = configParser.items(section);
      // Convert mfa_required string to boolean if necessary
      items.mfa_required = String(items.mfa_required === 'true');
      
      projects[section] = items as unknown as config.ProjectEnvironmentConfig;
    }
  }
  
  return projects;
}

export function getAllActiveSessions(): Record<string, config.SessionCredentials> {
  const configParser = getAwsAssumeConfigParser();
  const sections = configParser.sections();
  const allSessions: Record<string, config.SessionCredentials> = {};
  
  for (const section of sections) {
    if (section.startsWith('session-')) {
      const items = configParser.items(section);
      const sessionDetails = items as unknown as config.SessionCredentials;
      
      if (!isSessionExpired(sessionDetails)) {
        allSessions[section] = sessionDetails;
      } else {
        // Remove expired sessions
        configParser.removeSection(section);
        replaceAwsAssumeConfig(configParser);
      }
    }
  }
  
  return allSessions;
}

export function switchToSession(sessionName: string | null): void {
  if (!sessionName) {
    errorLog('No session name provided', false);
    return;
  }
  
  const allSessions = getAllActiveSessions();
  if (!allSessions[sessionName]) {
    errorLog(`Session ${sessionName} unavailable`, false);
    return;
  }
  
  // Replace the default profile in the AWS_CREDS file
  const creds = Object.fromEntries(
    Object.entries(allSessions[sessionName]).map(([k, v]) => [k, String(v)])
  );
  replaceConfigSection(config.AWS_CREDS_PATH, 'default', creds);
  console.log(`INFO: Switched to => \x1b[32m${sessionName}\x1b[0m`);
}

export function isSessionUsableInAwsCreds(sessionDetails: config.SessionCredentials): boolean {
  try {
    const awsCredsConfig = getAwsCredsParser();
    const awsCredsSections = awsCredsConfig.sections();
    
    if (awsCredsSections.includes('default')) {
      const defaultItems = awsCredsConfig.items('default');
      
      // Compare key properties to determine if they're the same session
      return (
        defaultItems.aws_access_key_id === sessionDetails.aws_access_key_id &&
        defaultItems.aws_secret_access_key === sessionDetails.aws_secret_access_key &&
        defaultItems.aws_session_token === sessionDetails.aws_session_token
      );
    }
    return false;
  } catch (error) {
    return false;
  }
}
