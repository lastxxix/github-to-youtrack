import dotenv from "dotenv";
import { Octokit, App } from "octokit";
import { all } from "axios";
import { GITHUB_API_KEY } from "../config/config.js";
import { GitHubComment, GitHubIssue, GitHubIssueState, GitHubUser } from "../models/github.js";
dotenv.config();

export class GitHubClient {
    private octokit: Octokit;

    constructor() {
        this.octokit = new Octokit({ auth: GITHUB_API_KEY });
    }

    private parseGitHubUrl(url: string): { owner: string; repo: string } | null {
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
        
        return null;  
    }

    private async mapIssue(issue: any): Promise<GitHubIssue> {
      
        let assignee: GitHubUser | undefined = undefined;

        if(issue.assignee) {
            assignee = await this.fetchUser(issue.assignee);
        }
        
        return {
            id: issue.id,
            number: issue.number,
            title: issue.title,
            description: issue.body,
            state: issue.state as GitHubIssueState,
            comments: issue.comments,
            assignee: assignee,
        };
    }

    private async mapComment(comment: any): Promise<GitHubComment> {
        const author = await this.fetchUser(comment.user);
        return {
            id: comment.id,
            body: comment.body,
            author: author,
            createdAt: comment.created_at,
            updatedAt: comment.updated_at
        };
    }

    private async fetchUser(userData: any): Promise<GitHubUser | undefined> {
        if (!userData || !userData.login) {
            return undefined;
        }
        try {
            const response = await this.octokit.request("GET /users/{username}", {
                username: userData.login
            });
            if (response.status === 200) {
                return {
                    login: response.data.login,
                    name: response.data.name || undefined
                };
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
        return undefined;
    }

    public async fetchComments(repoUrl:string, issueNumber: number): Promise<GitHubComment[]> {
        const parsed = this.parseGitHubUrl(repoUrl);
        if(!parsed) {
            throw new Error("Invalid GitHub repository URL: " + repoUrl);
        }
        const { owner, repo } = parsed;
        try {
            const comments: GitHubComment[] = [];
            let page = 1;
            const perPage = 100;
            let hasMore = true;
            while (hasMore) {
                const response = await this.octokit.request("GET /repos/{owner}/{repo}/issues/{issue_number}/comments", {
                    owner: owner,
                    repo: repo,
                    issue_number: issueNumber,
                    page: page,
                    per_page: perPage
                });
                const mappedComments = await Promise.all(response.data.map(comment => this.mapComment(comment)));
                comments.push(...mappedComments);
                hasMore = response.data.length === perPage;
                page++;
            }
            return comments;
        }  catch (error) {
            console.error("Error fetching comments:", error);
            return [];
        }
    }

    public async fetchIssues(repoUrl: string, since?: string): Promise<GitHubIssue[]> {
        const parsed = this.parseGitHubUrl(repoUrl);
        if(!parsed) {
            throw new Error("Invalid GitHub repository URL: " + repoUrl);
        }
        const { owner, repo } = parsed;

        try {
            const allIssues: any[] = [];
            let page = 1;
            const perPage = 100;
            let hasMore = true;
            while (hasMore) {
                const githubResponse = await this.octokit.request("GET /repos/{owner}/{repo}/issues", {
                    owner: owner,
                    repo: repo,
                    page: page,
                    per_page: perPage,
                    state: 'all',
                    since: since
                });

                const pageIssues = githubResponse.data.filter((issue => {
                    return !issue.pull_request;
                }));

                const mappedIssues = await Promise.all(pageIssues.map(issue => this.mapIssue(issue)));
                allIssues.push(...mappedIssues);
                hasMore = githubResponse.data.length === perPage;
                page++;
            }   
            console.log("Fetched", allIssues.length, "issues from GitHub");
            return allIssues;
        } catch (error) {
            console.error("Error fetching issues:", error);
            return [];
        }
    }
}








