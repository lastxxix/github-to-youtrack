export type YouTrackIssueStates = "Open" | "In Progress" | "Done";

export interface YouTrackProject {
    id: string;
    name?: string;
}

export interface YouTrackUser {
    login: string;
    fullName?: string;
}

export interface YouTrackIssue {
    id: string;
    summary: string;
    description?: string;
    project: YouTrackProject;
    author: YouTrackUser;
    customFields: YouTrackField[];
    comments?: YouTrackComment[];
    tags?: YouTrackIssueTag[];
}

export interface YouTrackIssueTag {
    name: string;
}

export interface YouTrackField {
    name: string;
    value?: {
        name: string;
    };
    $type: string;
}

export interface YouTrackComment {
    id: string;
    msg: string;
    created: string;
    updated: string;
    author?: YouTrackUser;
}


export interface YouTrackCreateIssue {
    project: { id: string };
    summary: string;
    description?: string;
    customFields: YouTrackField[];
}