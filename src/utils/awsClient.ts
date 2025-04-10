import { 
  STSClient, 
  AssumeRoleCommand, 
  AssumeRoleCommandInput 
} from '@aws-sdk/client-sts';
import { ProjectEnvironmentConfig } from '../config/index.js';
import { debugLog, errorLog, getBaseAwsProfileForProject } from './formatting.js';
import { getAwsCredsParser } from './configParserUtil.js';

/**
 * Utilities for interacting with AWS services
 */

interface BaseCredentials {
  key_id: string;
  access_key: string;
}

/**
 * Get base credentials for a project from AWS credentials file
 */
export function getBaseCredentialsForProject(projectName: string): BaseCredentials {
  const baseConfig = getAwsCredsParser();
  const baseProfileName = getBaseAwsProfileForProject(projectName);
  
  try {
    const sections = baseConfig.sections();
    if (!sections.includes(baseProfileName)) {
      errorLog(
        `Credentials for profile '[${baseProfileName}]' is missing. ` +
        `You must add this section to your AWS credentials file.`
      );
      process.exit(1);
    }
    
    const key_id = baseConfig.get(baseProfileName, 'aws_access_key_id');
    const access_key = baseConfig.get(baseProfileName, 'aws_secret_access_key');
    
    if (!key_id || !access_key) {
      errorLog(`Missing required credentials in profile '[${baseProfileName}]'`);
      process.exit(1);
    }
    
    return { key_id, access_key };
  } catch (error) {
    errorLog(`Error accessing credentials for profile '[${baseProfileName}]': ${error}`);
    process.exit(1);
  }
}

/**
 * Get STS credentials with MFA
 */
export async function getStsCredentials(
  projectName: string, 
  projectConfig: ProjectEnvironmentConfig, 
  mfaToken: string, 
  sessionName: string
) {
  try {
    const baseCredentials = getBaseCredentialsForProject(projectName);
    const stsClient = new STSClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: baseCredentials.key_id,
        secretAccessKey: baseCredentials.access_key
      }
    });

    const params: AssumeRoleCommandInput = {
      RoleArn: projectConfig.role_arn,
      RoleSessionName: sessionName,
      DurationSeconds: parseInt(projectConfig.mfa_device_session_duration || '3600'),
      SerialNumber: projectConfig.mfa_device_arn,
      TokenCode: mfaToken,
    };

    const command = new AssumeRoleCommand(params);
    const response = await stsClient.send(command);
    
    debugLog(`Response from STS service: ${JSON.stringify(response)}`);
    return response;
  } catch (error: any) {
    errorLog(`An error occurred while calling assume role: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Get STS credentials without MFA
 */
export async function getStsCredentialsWithoutMfa(
  projectName: string, 
  projectConfig: ProjectEnvironmentConfig, 
  sessionName: string
) {
  try {
    const baseCredentials = getBaseCredentialsForProject(projectName);
    const stsClient = new STSClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: baseCredentials.key_id,
        secretAccessKey: baseCredentials.access_key
      }
    });

    const params: AssumeRoleCommandInput = {
      RoleArn: projectConfig.role_arn,
      RoleSessionName: sessionName,
      DurationSeconds: parseInt(projectConfig.mfa_device_session_duration || '3600')
    };

    const command = new AssumeRoleCommand(params);
    const response = await stsClient.send(command);
    
    debugLog(`Response from STS service: ${JSON.stringify(response)}`);
    return response;
  } catch (error: any) {
    errorLog(`An error occurred while calling assume role: ${error.message}`);
    process.exit(1);
  }
}
