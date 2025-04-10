// Export the main functionality
import { AwsAssume, configure, validateConfigFile, performReset } from './AwsAssume.js';
import * as configParserUtil from './utils/configParserUtil.js';
import * as awsClient from './utils/awsClient.js';
import * as formatting from './utils/formatting.js';
import * as validators from './utils/validators.js';
import { ConfigCollector, ConfirmationDialog, InputDialog, SelectionMenu } from './utils/configCollector.js';
import { getVersion } from './config/version.js';

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
export * from './config/index.js';
