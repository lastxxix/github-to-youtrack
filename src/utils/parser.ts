import { GitHubIssue } from "../models/github.js";
import { YouTrackCreateIssue, YouTrackIssue } from "../models/youtrack.js";

export function convertGitHubIssueToYouTrack(issue: GitHubIssue, projectId: string): YouTrackCreateIssue {
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