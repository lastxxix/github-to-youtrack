import { question, rl, yt, gh } from "./config/config.js";
async function promptUserForMappings() {
    const mappings = [];
    while (true) {
        const githubRepo = await question('Enter GitHub repo (org/repo, leave empty to finish): ');
        if (!githubRepo)
            break;
        const projects = await yt.fetchProjects();
        console.log("Available YouTrack projects:");
        projects.forEach(project => {
            console.log(`${project.id}: ${project.name}`);
        });
        const youtrackProjectId = await question('Enter YouTrack projectId from the list above: ');
        const autoSync = await question('Do you want to enable automatic sync? (y/n): ');
        if (autoSync.toLowerCase() === 'y') {
            mappings.push({ githubRepo, youtrackProjectId, lastUpdate: new Date().toISOString() });
        }
        else {
            mappings.push({ githubRepo, youtrackProjectId });
        }
    }
    return mappings;
}
const main = async () => {
    const mappings = await promptUserForMappings();
    for (const { githubRepo, youtrackProjectId } of mappings) {
        const issues = await gh.fetchIssues(githubRepo);
        for (const issue of issues) {
            const created = await yt.createIssue(issue, youtrackProjectId);
            if (created) {
                console.log(`Created YouTrack issue ${created.id} for GitHub issue #${issue.number}`);
            }
            else {
                console.log(`Failed to create YouTrack issue for GitHub issue #${issue.number}`);
            }
            if (issue.comments > 0) {
                console.log("Adding comment to issue", issue.number);
                const comments = await gh.fetchComments(githubRepo, issue.number);
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
    }
    rl.close();
};
main();
