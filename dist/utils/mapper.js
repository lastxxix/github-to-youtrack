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
