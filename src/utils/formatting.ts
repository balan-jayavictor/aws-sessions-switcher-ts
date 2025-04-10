// Use modern ESM import for chalk
import chalk from 'chalk';
import { DateTime } from 'luxon';

/**
 * Utility functions for text formatting and display
 */

export function greenText(text: string): string {
  return chalk.green(text);
}

export function redText(text: string): string {
  return chalk.red(text);
}

export function yellowText(text: string): string {
  return chalk.yellow(text);
}

export function infoLog(message: string): void {
  console.log(`INFO: ${message}`);
}

export function errorLog(message: string, exit = true): void {
  console.error(redText(`ERROR: ${message}`));
  if (exit) {
    process.exit(1);
  }
}

export function debugLog(message: string): void {
  if (process.env.DEBUG) {
    console.log(`DEBUG: ${message}`);
  }
}

export function getBaseAwsProfileForProject(projectName: string): string {
  return `aws-sessions-switcher-${projectName}`;
}

export function getRemainingTime(expirationTimestamp: string): string {
  const expiration = DateTime.fromFormat(expirationTimestamp, 'yyyy-MM-dd HH:mm:ss');
  const now = DateTime.now();
  
  if (expiration < now) {
    return 'Expired';
  }
  
  const diff = expiration.diff(now, ['hours', 'minutes', 'seconds']);
  return `${Math.floor(diff.hours)}h ${Math.floor(diff.minutes)}m ${Math.floor(diff.seconds)}s`;
}

export function isSessionExpired(sessionDetails: { expiration: string }): boolean {
  const expiration = DateTime.fromFormat(sessionDetails.expiration, 'yyyy-MM-dd HH:mm:ss');
  return expiration < DateTime.now();
}

export function getAssumptionRow(details: any): string[] {
  return [
    `${details.project_name}/${details.project_environment}/${details.role_name}`,
    details.command || ''
  ];
}

export function getSessionRow(sessionName: string, remainingTime: string, sessionDetails: any): string[] {
  const isDefault = sessionDetails.aws_access_key_id === process.env.AWS_ACCESS_KEY_ID;
  return [
    sessionName,
    remainingTime,
    isDefault ? 'Yes' : 'No'
  ];
}

// Table formatting
export function printTable(headers: string[], rows: string[][]): void {
  // Calculate column widths
  const colWidths = headers.map((header, index) => {
    const maxContentWidth = Math.max(
      header.length,
      ...rows.map(row => (row[index] || '').toString().length)
    );
    return maxContentWidth + 2; // Add padding
  });
  
  // Print headers
  console.log(
    headers.map((header, i) => 
      header.padEnd(colWidths[i])
    ).join(' | ')
  );
  
  // Print separator
  console.log(
    colWidths.map(width => 
      '-'.repeat(width)
    ).join('-+-')
  );
  
  // Print rows
  rows.forEach(row => {
    console.log(
      row.map((cell, i) => 
        (cell || '').toString().padEnd(colWidths[i])
      ).join(' | ')
    );
  });
}
