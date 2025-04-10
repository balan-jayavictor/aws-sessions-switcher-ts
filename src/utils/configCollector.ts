import { input, confirm, select } from '@inquirer/prompts';
import { notEmpty, numbersOnly } from './validators.js';

/**
 * Classes for collecting configuration inputs from the user
 */

interface ProjectEnvironmentConfig {
  project_name: string;
  project_environment?: string;
  region: string;
  aws_account_id: string;
  role_arn?: string;
  role_name: string;
  mfa_required: boolean;
  mfa_device_arn?: string;
  mfa_device_session_duration?: string;
}

export class ConfigCollector {
  private questions = [
    {
      type: 'input',
      name: 'project_name',
      message: 'Project name:',
      validate: notEmpty
    },
    {
      type: 'input',
      name: 'project_environment',
      message: 'Environment name:',
      validate: notEmpty
    },
    {
      type: 'input',
      name: 'role_arn',
      message: 'Role ARN:',
      validate: notEmpty
    },
    {
      type: 'input',
      name: 'role_name',
      message: 'Role name:',
      validate: notEmpty
    },
    {
      type: 'confirm',
      name: 'mfa_required',
      message: 'MFA required?',
      default: false
    }
  ];

  async collect(): Promise<ProjectEnvironmentConfig> {
    const result: Partial<ProjectEnvironmentConfig> = {};
    
    // Project name
    result.project_name = await input({
      message: 'Enter project name:',
      validate: notEmpty
    });
    
    // AWS region
    result.region = await input({
      message: 'AWS region:',
      default: 'us-east-1',
      validate: notEmpty
    });
    
    // Account ID
    result.aws_account_id = await input({
      message: 'AWS account ID:',
      validate: numbersOnly
    });
    
    // Role name
    result.role_name = await input({
      message: 'Role name:',
      default: 'OrganizationAccountAccessRole',
      validate: notEmpty
    });
    
    // MFA required
    result.mfa_required = await confirm({
      message: 'MFA required:',
      default: false
    });
    
    // MFA device ARN (only if MFA is required)
    if (result.mfa_required) {
      result.mfa_device_arn = await input({
        message: 'MFA device ARN:',
        validate: notEmpty
      });
      
      result.mfa_device_session_duration = await input({
        message: 'Session duration in seconds? (Default: 3600)',
        default: '3600',
        validate: numbersOnly
      });
    }
    
    return result as ProjectEnvironmentConfig;
  }

  async getSessionToSwitch(choices: string[]): Promise<string> {
    return await select({
      message: 'Select session to switch to:',
      choices: choices.map(choice => ({ value: choice, name: choice }))
    });
  }
}

export class ConfirmationDialog {
  private defaultValue: boolean;
  constructor(private question: string, defaultValue: boolean = false) {
    this.defaultValue = defaultValue;
  }

  async getAnswer(): Promise<boolean> {
    try {
      return await confirm({
        message: this.question,
        default: this.defaultValue
      });
    } catch (error) {
      console.error('Error confirming choice:', error);
      return false;
    }
  }
}

export class InputDialog {
  private defaultValue: string;
  private validator: (input: string) => true | string;
  constructor(private question: string, defaultValue: string = '', validator: (input: string) => true | string = () => true) {
    this.defaultValue = defaultValue;
    this.validator = validator;
  }

  async getAnswer(): Promise<string> {
    try {
      return await input({
        message: this.question,
        default: this.defaultValue,
        validate: this.validator
      });
    } catch (error) {
      console.error('Error getting input:', error);
      return '';
    }
  }
}

export class SelectionMenu {
  constructor(private choices: string[]) {}

  private prepareList() {
    return this.choices.map(choice => ({
      name: choice,
      value: choice
    }));
  }

  async getAnswer(): Promise<string | null> {
    try {
      return await select({
        message: 'Select a session to switch to',
        choices: this.prepareList()
      });
    } catch (error) {
      console.error('Error getting selection:', error);
      return null;
    }
  }
}
