import { input, confirm, select } from '@inquirer/prompts';
import { notEmpty, numbersOnly } from './validators.js';

/**
 * Classes for collecting configuration inputs from the user
 */

interface ProjectEnvironmentConfig {
  project_name: string;
  project_environment: string;
  role_arn: string;
  role_name: string;
  mfa_required: boolean;
  mfa_device_arn?: string;
  mfa_device_session_duration?: string;
}

export class ConfigCollector {

  async collect(): Promise<ProjectEnvironmentConfig> {
    const result: Partial<ProjectEnvironmentConfig> = {};
    
    // Project name
    result.project_name = await input({
      message: 'Enter project name:',
      validate: notEmpty
    });

    // Project environment
    result.project_environment = await input({
      message: 'Environment id:',
      validate: notEmpty
    });

    // Role ARN
    result.role_arn = await input({
      message: 'Role ARN:',
      validate: notEmpty
    });
    
    // Role name
    result.role_name = await input({
      message: 'Role name (friendly name):',
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
