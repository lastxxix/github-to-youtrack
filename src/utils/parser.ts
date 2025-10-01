import { GitHubComment, GitHubIssue, GitHubIssueState, GitHubUser } from "../models/github.js";
import { YouTrackCreateIssue, YouTrackIssue, YouTrackProject } from "../models/youtrack.js";

export function convertGitHubIssueToYouTrack(issue: GitHubIssue, projectId: string): YouTrackCreateIssue {
    return {
        project: { id: projectId },
        summary: `#${issue.number} ${issue.title}`,
        description: issue.description || "",
        customFields: [
            {
                name: "State",
                value: { name: issue.state === "open" ? "To Do" : "Done" },
                $type: "StateIssueCustomField"
            }
        ]
    };
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    url = url.trim().replace(/\.git$/, '');

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

export function mapToYouTrackIssue(data: any): YouTrackIssue {
    return {
        id: data.id,
        summary: data.summary,
        description: data.description,
        author: data.author?.name || "Unknown",
        project: {
            id: data.project?.id,
            name: data.project?.name
        },
        customFields: data.customFields?.map((cf: any) => ({
            name: cf.name,
            value: cf.value?.name || cf.value || null
        })) || []
    };
}

export function mapGitHubUser(data: any): GitHubUser {
    return {
        login: data.login,
        name: data.name,
    };
}

export async function mapGitHubIssue(issue: any, assignee?: GitHubUser): Promise<GitHubIssue> {
   
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


export async function mapGitHubComment(comment: any, author?: GitHubUser): Promise<GitHubComment> {

    return {
        id: comment.id,
        body: comment.body,
        author: author,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at
    };
}