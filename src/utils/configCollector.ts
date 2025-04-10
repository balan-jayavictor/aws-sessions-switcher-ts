import inquirer from 'inquirer';
import { notEmpty, numbersOnly } from './validators';

/**
 * Classes for collecting configuration inputs from the user
 */

interface ProjectEnvironmentConfig {
  project_name: string;
  project_environment: string;
  role_arn: string;
  role_name: string;
  mfa_required: boolean;
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
    const answers = await inquirer.prompt(this.questions);
    return answers as ProjectEnvironmentConfig;
  }

  async getSessionToSwitch(choices: string[]): Promise<string> {
    const question = {
      type: 'list',
      name: 'session',
      message: 'Select session to switch to:',
      choices
    };
    const answers = await inquirer.prompt([question]);
    return answers.session as string;
  }
}

export class ConfirmationDialog {
  constructor(private question: string) {}

  async getAnswer(): Promise<boolean> {
    try {
      const answers = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmation',
        message: this.question,
        default: false
      }]);
      return answers.confirmation;
    } catch (error) {
      console.error('Error in confirmation dialog:', error);
      return false;
    }
  }
}

export class InputDialog {
  constructor(private question: string) {}

  async getAnswer(): Promise<string> {
    try {
      const answers = await inquirer.prompt([{
        type: 'input',
        name: 'value',
        message: this.question,
        default: '',
        validate: numbersOnly
      }]);
      return answers.value;
    } catch (error) {
      console.error('Error in input dialog:', error);
      return '';
    }
  }
}

export class SelectionMenu {
  constructor(private choices: string[]) {}

  private prepareList(): { name: string, value: string }[] {
    return this.choices.map(x => ({ name: x, value: x }));
  }

  async getAnswer(): Promise<string | null> {
    try {
      const answers = await inquirer.prompt([{
        type: 'list',
        message: 'Select a session to switch to',
        name: 'switch_to_session',
        choices: this.prepareList(),
        validate: (answer: string) => 
          answer.length === 0 ? 'You must choose at least one option.' : true
      }]);

      return answers.switch_to_session;
    } catch (error) {
      console.error('Error in selection menu:', error);
      return null;
    }
  }
}
