import { GitHubClient } from "./github/github-client.js";
import { YouTrackClient } from "./youtrack/youtrack-client.js";
const main = async () => {
    const gh = new GitHubClient();
    const yt = new YouTrackClient();
    const issues = await gh.fetchIssues("instaloader/instaloader");
    for (const issue of issues) {
        const projectId = "0-1";
        const created = await yt.createIssue(issue, projectId);
        if (created) {
            console.log(`Created YouTrack issue ${created.id} for GitHub issue #${issue.number}`);
        }
        else {
            console.log(`Failed to create YouTrack issue for GitHub issue #${issue.number}`);
        }
        if (issue.comments > 0) {
            console.log("Adding comment to issue", issue.number);
            const comments = await gh.fetchComments("instaloader/instaloader", issue.number);
            for (const comment of comments) {
                console.log("Comment:", comment);
                const added = await yt.addCommentToIssue(created.id, comment);
                if (added) {
                    console.log(`Added comment ${comment.id} to YouTrack issue ${created.id}`);
                }
                else {
                    console.log(`Failed to add comment ${comment.id} to YouTrack issue ${created.id}`);
                }
            }
        }
    }
};
main();
