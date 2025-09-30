export function convertGitHubIssueToYouTrack(issue, projectId) {
    return {
        project: { id: projectId },
        summary: issue.title,
        description: issue.description || "",
        customFields: [
            {
                name: "State",
                value: { name: issue.state === "open" ? "To Do" : "Done" },
                $type: "StateIssueCustomField"
            },
        ]
    };
}
export function parseGitHubUrl(url) {
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
export function mapToYouTrackIssue(data) {
    return {
        id: data.id,
        summary: data.summary,
        description: data.description,
        author: data.author?.name || "Unknown",
        project: {
            id: data.project?.id,
            name: data.project?.name
        },
        customFields: data.customFields?.map((cf) => ({
            name: cf.name,
            value: cf.value?.name || cf.value || null
        })) || []
    };
}
export function mapGitHubUser(data) {
    return {
        login: data.login,
        name: data.name,
    };
}
export async function mapGitHubIssue(issue, assignee) {
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
export async function mapGitHubComment(comment, author) {
    return {
        id: comment.id,
        body: comment.body,
        author: author,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at
    };
}
