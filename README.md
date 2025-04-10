# AWS Sessions Switcher

A TypeScript tool to help switching between multiple AWS environments easy and seamless. This tool allows you to configure and manage multiple AWS profiles, environments, and roles, making it easier to switch between different AWS credentials.

## Installation

```bash
# Using pnpm (recommended)
pnpm install -g aws-sessions-switcher

# Or using npm
npm install -g aws-sessions-switcher

# Or using yarn
yarn global add aws-sessions-switcher
```

## Features

- Configure and manage multiple AWS projects and environments
- Assume roles with or without MFA
- List available roles and environments
- Switch between active sessions
- Simple CLI interface

## Command Line Usage

### Configuration

Set up initial configuration:

```bash
aws-sessions-switcher configure
```

### List Role Assumptions

List all possible role assumptions:

```bash
aws-sessions-switcher --list
# or simply
aws-sessions-switcher
```

### Project Management

List all projects:

```bash
aws-sessions-switcher projects
```

Add a new project:

```bash
aws-sessions-switcher projects add
```

Delete a project:

```bash
aws-sessions-switcher projects delete --project-name <project-name>
```

### Environment Management

List all environments:

```bash
aws-sessions-switcher env
```

List environments for a specific project:

```bash
aws-sessions-switcher env --project-name <project-name>
```

### Session Management

List active sessions:

```bash
aws-sessions-switcher sessions
```

Switch between active sessions:

```bash
aws-sessions-switcher sessions switch
```

### Role Assumption

Assume a role (after configuration):

```bash
aws-sessions-switcher <project-name> <environment> <role-name>
```

### Reset Configuration

Reset all saved configuration:

```bash
aws-sessions-switcher reset
```

## Programmatic Usage

You can also use the library programmatically in your TypeScript or JavaScript code:

```typescript
import { AwsAssume, configure } from 'aws-sessions-switcher';

// Create an instance of AwsAssume
const awsAssume = new AwsAssume();

// List all projects
const projects = awsAssume.listProjects(true);

// Assume a role
await awsAssume.assumeRole('myProject', 'dev', 'admin');
```

## File Locations

- AWS Credentials: `~/.aws/credentials`
- AWS Sessions Switcher Config: `~/.aws/sessions_switcher`

## Environment Variables

- `AWS_SESSIONS_SWITCHER_CONFIG_FILENAME`: Override the default config filename (default: `sessions_switcher`)
- `DEBUG`: Enable debug logging

## Development

### Prerequisites

- Node.js (v14 or higher)
- pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/DEV-BALAN-JAYAVICTOR/aws-sessions-switcher.git
cd aws-sessions-switcher

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test
```

## License

MIT
