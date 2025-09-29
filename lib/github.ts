import dotenv from "dotenv";
import { Octokit, App } from "octokit";
import type { GitHubIssue, IssueState } from './types';

dotenv.config();
const GITHUB_API_KEY = process.env.GITHUB_API_KEY;

if (!GITHUB_API_KEY || !GITHUB_API_KEY.trim()) {
  console.error('ERROR: missing GITHUB_API_KEY environment variable. Set it and try again.');
  process.exit(1);
}

const octokit = new Octokit({ 
  auth: GITHUB_API_KEY,
});

const fetchIssues = async (owner: string, repo: string): Promise<GitHubIssue[]> => {
    const githubResponse = await octokit.request("GET /repos/{owner}/{repo}/issues", {
        owner: owner,
        repo: repo,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    if(githubResponse.status != 200){
      console.error("Error while fetching repo's issues")
      process.exit(1);
    }
    
    const issues: GitHubIssue[] = (githubResponse.data as any[]).map(issue => ({
      id: issue.id,
      title: issue.title,
      state: issue.state as IssueState,
      description:  issue.body ?? "",
      url: issue.html_url,
    }));
    
    return issues;
}

export {fetchIssues};




