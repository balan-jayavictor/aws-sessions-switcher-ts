import inquirer from 'inquirer';
import { genericTextValidator, notEmpty, numbersOnly } from './validators';
import { ProjectEnvironmentConfig } from '../config';

/**
 * Classes for collecting configuration inputs from the user
 */

export class ConfigCollector {
  private questions = [
    {
      type: 'input',
      name: 'project_name',
      message: 'What\'s the project name?',
      validate: genericTextValidator
    },
    {
      type: 'input',
      name: 'project_environment',
      message: 'Type the environment identifier?',
      validate: genericTextValidator
    },
    {
      type: 'input',
      name: 'role_arn',
      message: 'Type the ARN of the AWS Role, you want to assume?'
    },
    {
      type: 'input',
      name: 'role_name',
      message: 'Give a name to this role:',
      validate: genericTextValidator
    },
    {
      type: 'confirm',
      name: 'mfa_required',
      message: 'Is MFA Required?',
      default: false
    },
    {
      type: 'input',
      name: 'mfa_device_arn',
      message: 'Type the ARN of the MFA device?',
      when: (answers: any) => answers.mfa_required,
      validate: notEmpty
    },
    {
      type: 'input',
      name: 'mfa_device_session_duration',
      message: 'Session duration in seconds? (Default: 3600)',
      default: '3600',
      when: (answers: any) => answers.mfa_required,
      validate: numbersOnly
    }
  ];

  async collect(): Promise<ProjectEnvironmentConfig | null> {
    try {
      return await inquirer.prompt(this.questions);
    } catch (error) {
      console.error('Error collecting configuration:', error);
      return null;
    }
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
        validate: (answer: string[]) => 
          answer.length === 0 ? 'You must choose at least one option.' : true
      }]);

      return answers.switch_to_session;
    } catch (error) {
      console.error('Error in selection menu:', error);
      return null;
    }
  }
}
