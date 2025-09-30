# GitHub to YouTrack

GitHub to YouTrack is a tool that synchronizes issues from GitHub repositories to YouTrack projects. It not only retrieves GitHub issues and their associated comments to create corresponding YouTrack issues but also supports an **automatic synchronization mode** that keeps issues updated over time.


## Disclaimer

The current implementation uses a polling mechanism to check for updates at regular intervals when auto-sync is enabled. Although using GitHub webhooks would be more efficient by updating issues only on events, this approach requires the GitHub repository user to have administrative privileges or the necessary permissions to create webhooks. Therefore, polling is used specifically for automatic synchronization.

Additionally, by default, closed issues on GitHub are also imported.

## Getting Started

1. **Clone the repository.**

2. **Install dependencies:**
    ```sh
    npm install
    ```

3. **Configure Environment Variables:**

    Copy `.env.example` to `.env` and fill in the required values:
    - `YOUTRACK_API_KEY`
    - `YOUTRACK_BASE_URL`
    - `GITHUB_API_KEY`
    - `SYNC_INTERVAL_SECONDS` (Optional; default is 7200 seconds or 2 hours)

4. **Build the Project:**
    ```sh
    npm run build
    ```

5. **Run the Application:**
    ```sh
    npm start
    ```

## Usage

Upon startup, the application will prompt you for:
- The GitHub repository.
- The corresponding YouTrack project ID.
- Whether to enable automatic synchronization.

- **Automatic Sync:**  
  If auto-sync is enabled, the application will periodically poll GitHub for issue updates based on the interval specified in the `SYNC_INTERVAL_SECONDS` environment variable (or a value entered at runtime). This ensures that issues remain updated without manual intervention.
- **Manual Sync:**  
  If auto-sync is not enabled, the tool will perform a one-time synchronization when run.
