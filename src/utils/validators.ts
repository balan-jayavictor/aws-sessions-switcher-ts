/**
 * Input validators for CLI prompts
 */

export function genericTextValidator(input: string): boolean | string {
  if (!input || input.trim().length === 0) {
    return 'This field cannot be empty';
  }
  return true;
}

export function notEmpty(input: string): boolean | string {
  return genericTextValidator(input);
}

export function numbersOnly(input: string): boolean | string {
  if (!input || input.trim().length === 0) {
    return 'This field cannot be empty';
  }
  if (!/^\d+$/.test(input)) {
    return 'This field should only contain numeric characters';
  }
  return true;
}
