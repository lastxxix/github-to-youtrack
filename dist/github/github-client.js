import dotenv from "dotenv";
import { Octokit } from "octokit";
import { GITHUB_API_KEY } from "../config/config.js";
import { mapGitHubComment, mapGitHubIssue, parseGitHubUrl } from "../utils/parser.js";
dotenv.config();
export class GitHubClient {
    octokit;
    constructor() {
        this.octokit = new Octokit({ auth: GITHUB_API_KEY });
    }
    async fetchUser(userData) {
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
        }
        catch (error) {
            console.error("Error fetching user:", error);
        }
        return undefined;
    }
    async fetchComments(repoUrl, issueNumber, since) {
        const parsed = parseGitHubUrl(repoUrl);
        if (!parsed) {
            throw new Error("Invalid GitHub repository URL: " + repoUrl);
        }
        const { owner, repo } = parsed;
        try {
            const comments = [];
            let page = 1;
            const perPage = 100;
            let hasMore = true;
            while (hasMore) {
                const response = await this.octokit.request("GET /repos/{owner}/{repo}/issues/{issue_number}/comments", {
                    owner: owner,
                    repo: repo,
                    issue_number: issueNumber,
                    page: page,
                    per_page: perPage,
                    since: since
                });
                const mappedComments = await Promise.all(response.data.map(async (comment) => mapGitHubComment(comment, await this.fetchUser(comment.user))));
                comments.push(...mappedComments);
                hasMore = response.data.length === perPage;
                page++;
            }
            return comments;
        }
        catch (error) {
            console.error("Error fetching comments:", error);
            return [];
        }
    }
    async fetchIssues(repoUrl, since) {
        const parsed = parseGitHubUrl(repoUrl);
        if (!parsed) {
            throw new Error("Invalid GitHub repository URL: " + repoUrl);
        }
        const { owner, repo } = parsed;
        try {
            const allIssues = [];
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
                const mappedIssues = await Promise.all(pageIssues.map(async (issue) => {
                    const assignee = issue.assignee ? await this.fetchUser(issue.assignee) : undefined;
                    return mapGitHubIssue(issue, assignee);
                }));
                allIssues.push(...mappedIssues);
                hasMore = githubResponse.data.length === perPage;
                page++;
            }
            console.log("Fetched", allIssues.length, "issues from GitHub");
            return allIssues;
        }
        catch (error) {
            console.error("Error fetching issues:", error);
            return [];
        }
    }
}
