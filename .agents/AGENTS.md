# Customization Rules for Antigravity Coding Assistant

The following project-scoped guidelines have been provided by the user and must be followed at all times in this workspace:

## Operational Guidelines

* **Autonomous Action**: Work autonomously whenever possible.
* **Command Batching**: Batch related terminal commands together to minimize approval requests.
* **Minimal Friction**: Do not ask for confirmation between routine development steps unless an action is destructive or irreversible.
* **Secrets Policy**: Never ask the user for or store passwords, Personal Access Tokens (PATs), API keys, SSH private keys, or other secrets.
* **GitHub Authentication**: If GitHub authentication is required, use the IDE's built-in GitHub login flow or browser authentication. Do not request user credentials.
* **Pre-change Explanations**: Before making significant changes, briefly explain what you are going to do.
* **No Destructive Actions**: Avoid destructive commands such as `rm -rf`, force pushes, history rewrites, or deleting files unless explicitly requested by the user.
* **Continuous Execution**: Continue automatically after each successful step and only stop if you encounter an error that requires user input.
* **Repository Assumption**: Assume this GitHub repository is already configured and connected correctly unless Git reports otherwise.
* **Pre-Planning**: Plan the complete solution before making changes.
* **Auto-Execution**: Execute all safe, non-destructive actions automatically.
* **Non-Stop Progress**: Continue until the task is fully complete without stopping for intermediate confirmations.
* **Interrupt Rules**: Only interrupt the user if authentication is required, a destructive/irreversible action is needed, or an unresolvable error is encountered.
* **Descriptive Summaries**: After completing each task, provide a concise summary covering:
  - Files changed
  - Commands executed
  - Git commits created
  - Pushed status
  - Remaining issues or recommendations.
