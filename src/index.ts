// Export the main functionality
import { AwsAssume, configure, validateConfigFile, performReset } from './AwsAssume';
import * as configParserUtil from './utils/configParserUtil';
import * as awsClient from './utils/awsClient';
import * as formatting from './utils/formatting';
import * as validators from './utils/validators';
import { ConfigCollector, ConfirmationDialog, InputDialog, SelectionMenu } from './utils/configCollector';
import { getVersion } from './config/version';

// Export the main class and functions
export {
  AwsAssume,
  configure,
  validateConfigFile,
  performReset,
  configParserUtil,
  awsClient,
  formatting,
  validators,
  ConfigCollector,
  ConfirmationDialog,
  InputDialog,
  SelectionMenu,
  getVersion
};

// Export types
export * from './config';
