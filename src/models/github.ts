export type GitHubIssueState = "open" | "closed";

export interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    state: GitHubIssueState;
    description?: string;
    author?: {
        login: string;
        name: string;
    };
    comments: number
    assignee?: GitHubUser;
    createdAt?: string;
    updatedAt?: string;
    labels?: GitHubLabel[];
    
};

export interface GitHubUser {
    login: string;
    name?: string;
}

export interface GitHubLabel {
    id: number;
    name: string;
    color?: string;
}

export interface GitHubComment {
    id: number;
    body: string;
    author?: GitHubUser;
    createdAt?: string;
    updatedAt?: string;
}

