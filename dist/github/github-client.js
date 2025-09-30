import dotenv from "dotenv";
import { Octokit } from "octokit";
import { GITHUB_API_KEY } from "../config/config.js";
dotenv.config();
export class GitHubClient {
    octokit;
    constructor() {
        this.octokit = new Octokit({ auth: GITHUB_API_KEY });
    }
    parseGitHubUrl(url) {
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
    async mapIssue(issue) {
        let assignee = undefined;
        if (issue.assignee) {
            assignee = await this.fetchUser(issue.assignee);
        }
        return {
            id: issue.id,
            number: issue.number,
            title: issue.title,
            description: issue.body,
            state: issue.state,
            comments: issue.comments,
            assignee: assignee,
        };
    }
    async mapComment(comment) {
        const author = await this.fetchUser(comment.user);
        return {
            id: comment.id,
            body: comment.body,
            author: author,
            createdAt: comment.created_at,
            updatedAt: comment.updated_at
        };
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
    async fetchComments(repoUrl, issueNumber) {
        const parsed = this.parseGitHubUrl(repoUrl);
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
                    per_page: perPage
                });
                const mappedComments = await Promise.all(response.data.map(comment => this.mapComment(comment)));
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
        const parsed = this.parseGitHubUrl(repoUrl);
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
                const mappedIssues = await Promise.all(pageIssues.map(issue => this.mapIssue(issue)));
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
