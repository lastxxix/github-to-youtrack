import dotenv from "dotenv";
import { Octokit, App } from "octokit";
import type { GitHubIssue, GitHubIssueState } from './types.js';
import { all } from "axios";
dotenv.config();

interface FetchIssuesOptions {
  repoUrl: string;
}

const GITHUB_API_KEY = process.env.GITHUB_API_KEY;

if (!GITHUB_API_KEY || !GITHUB_API_KEY.trim()) {
  console.error('ERROR: missing GITHUB_API_KEY environment variable. Set it and try again.');
  process.exit(1);
}

const octokit = new Octokit({ 
  auth: GITHUB_API_KEY,
});

const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
  url = url.trim();
  url = url.replace(/\.git$/, '');

  const sshMatch = url.match(/git@github\.com:([^/]+)\/(.+)/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  const httpsMatch = url.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  const simpleMatch = url.match(/^([^/]+)\/([^/]+)$/);
  if (simpleMatch) {
    return { owner: simpleMatch[1], repo: simpleMatch[2] };
  }
  
  return {owner: "", repo: ""};
};

const fetchGitHubIssues = async (repoUrl: string) => {

  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    console.error("Invalid GitHub URL");
    return;
  }

  const { owner, repo } = parsed;
  const allIssues: GitHubIssue[] = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const githubResponse = await octokit.request("GET /repos/{owner}/{repo}/issues", {
        owner: owner,
        repo: repo,
        page: page,
        per_page: perPage,
        state: 'all'
    });
    if(githubResponse.data.length == 0) {
      break;
    }
    
    const pageIssues: GitHubIssue[] = (githubResponse.data as any[]).filter((issue => {
      return !issue.pull_request;
    })).map(issue => ({
      id: issue.id,
      title: issue.title,
      state: issue.state as GitHubIssueState,
      description:  issue.body ?? "",
    }));
    allIssues.push(...pageIssues);

    if (githubResponse.data.length < perPage) {
      break; 
    }
    page++;
  }

  console.log(`Total issues fetched from github: ${allIssues.length}\n`);
  return allIssues;
}



export {fetchGitHubIssues};




