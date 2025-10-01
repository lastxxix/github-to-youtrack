# GitHub to YouTrack

GitHub to YouTrack is a tool that synchronizes issues from GitHub repositories to YouTrack projects. It not only retrieves GitHub issues and their associated comments to create corresponding YouTrack issues but also supports an **automatic synchronization mode** that keeps issues updated over time.

## Disclaimer

The current implementation uses a polling mechanism to check for updates at regular intervals when auto-sync is enabled. Although using GitHub webhooks would be more efficient by updating issues only on events, this approach requires the GitHub repository user to have administrative privileges or the necessary permissions to create webhooks. Therefore, polling is used specifically for automatic synchronization.

Additionally, by default, closed issues on GitHub are also imported.

**Important Update**: Until yesterday (30/09), creating comments with the author on YouTrack worked without needing to pre-create the user in YouTrack. As of today, this no longer works. Attempting to create a comment without the corresponding YouTrack user ID now results in the following error:

```ts
{
  error: 'Bad Request',
  error_description: 'YouTrack is unable to locate an User-type entity unless its ID is also provided',
  error_developer_message: 'YouTrack is unable to locate an User-type entity unless its ID is also provided'
}
```

As a result, any new comment will now appear as created by the account associated with the YouTrack API key used for synchronization.

## Getting Started

1. **Clone the repository.**

2. **Install dependencies:**

    ```sh
    npm install
    ```

3. **Configure Environment Variables:**

    Copy `.env.example` to `.env` and fill in the required values:

    - **`YOUTRACK_API_KEY`** – YouTrack API token.

        To generate it:
        1. Log in to your YouTrack account.
        2. Go to **Profile > Account Security**.
        3. Click **New token**, give it a name and select the necessary permissions (at least `Read Projects` and `Create Issues`).
        4. Copy the generated token and paste it here.

    - **`YOUTRACK_BASE_URL`** – The base URL of your YouTrack instance.  
        For YouTrack Cloud, the format is:  
        `https://<your-instance>.youtrack.cloud`
        For self-hosted YouTrack, it is the URL where your YouTrack server is accessible.

    - **`GITHUB_API_KEY`** – GitHub personal access token.  
        To generate it:
        1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens).
        2. Click **Generate new token (classic)**, select the scopes you need (at least `repo`), and copy the token.

    - **`MAPPING_FILE`** (optional) – Path to a JSON file where repository-to-project mappings are stored. Default is `mappings.json`.

4. **Build the Project:**

    ```sh
    npm run build
    ```

5. **Run the Application:**

    The application can be started in different modes:

    - **Start both services (default):**

        ```sh
        npm start
        ```

        This will first run the **migrate** process and then start the **sync daemon** automatically.

    - **Run only the migrate process:**

        ```sh
        npm run migrate
        ```

        Use this if you only want to update/migrate data.

    - **Start only the sync daemon:**

        ```sh
        npm run sync
        ```

        **Note:** The sync daemon should only be started after running the migrate process, otherwise it may not work correctly.

## Usage

Upon startup, the application will prompt you to configure repository mappings. For each mapping, you will provide:

1. **GitHub repository** – Enter the repository in the format `org/repo` or `https://github.com/org/repo`. Leave empty to stop adding mappings.
2. **YouTrack project ID** – Select the corresponding project from the list fetched from YouTrack.
3. **Automatic synchronization** – Choose whether to enable automatic sync:
   - If **yes**, you will be prompted to set the sync interval in minutes (default is 5, maximum is 1440).
   - If **no**, the repository will be mapped without automatic syncing.

Example workflow:

```sh
Enter GitHub repo (e.g. org/repo or url, leave empty to continue): my-org/my-repo
Fetching YouTrack projects...
1: Project Alpha
2: Project Beta
Enter YouTrack projectId: 1
Enable automatic sync? (y/n): y
Sync interval in minutes (default: 5, max: 1440): 10

Enter GitHub repo (e.g. org/repo, leave empty to continue): 
```
