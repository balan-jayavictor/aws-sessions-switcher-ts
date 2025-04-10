import * as os from 'os';
import * as path from 'path';
import { getVersion } from './version';

/**
 * Configuration constants for aws-sessions-switcher
 */

// Path configurations
export const AWS_CREDS_PATH = path.join(os.homedir(), '.aws', 'credentials');
export const AWS_ASSUME_CONFIG_PATH = path.join(
  os.homedir(), 
  '.aws', 
  process.env.AWS_SESSIONS_SWITCHER_CONFIG_FILENAME || 'sessions_switcher'
);
export const AWS_ASSUME_BASE_CREDENTIALS_IDENTIFIER_PREFIX = 'aws-sessions-switcher-';
export const EXPIRATION_TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// Action types
export const ACTION = 'action';
export const SUB_ACTION = 'sub_action';
export const ACTION_LIST_ASSUMPTIONS = 'list_assumptions';
export const ACTION_ENVIRONMENT = ['env', 'environments'];
export const ACTION_LIST = 'ls';
export const ACTION_ADD = 'add';
export const ACTION_DELETE = 'delete';
export const ACTION_CONFIGURE = 'configure';
export const ACTION_PROJECT = 'projects';
export const ACTION_RESET = 'reset';
export const ACTION_SESSIONS = 'sessions';
export const ACTION_SWITCH = 'switch';

// Variable names
export const VAR_PROJECT_NAME = 'project_name';
export const LONG_VAR_PROJECT_NAME = '--project-name';
export const SHORT_VAR_PROJECT_NAME = '-n';
export const SHORT_VAR_ENV_NAME = '-e';
export const LONG_VAR_ENV_NAME = '--env-name';

// Subcommands mapping
export const SUB_COMMANDS = {
  CFGR: ACTION_CONFIGURE,
  PRJ: ACTION_PROJECT,
  SESSIONS: ACTION_SESSIONS,
  ENV: ACTION_ENVIRONMENT[0],
  SHORT_ENV: ACTION_ENVIRONMENT[1],
  LIST: ACTION_LIST,
  ADD: ACTION_ADD,
  DEL: ACTION_DELETE,
  RST: ACTION_RESET,
  SWT: ACTION_SWITCH,
};

export const PROJECT_SUB_COMMANDS = {
  LIST: ACTION_LIST,
  ADD: ACTION_ADD,
  DELETE: ACTION_DELETE,
};

// Version information
export { getVersion };

// Type definitions for project configurations
export interface BaseCredentials {
  key_id: string;
  access_key: string;
}

export interface ProjectEnvironmentConfig {
  project_name: string;
  project_environment: string;
  role_arn: string;
  role_name: string;
  mfa_required: boolean | string;
  mfa_device_arn?: string;
  mfa_device_session_duration?: string;
}

export interface SessionCredentials {
  aws_access_key_id: string;
  aws_secret_access_key: string;
  aws_session_token: string;
  aws_security_token: string;
  expiration: string;
}
