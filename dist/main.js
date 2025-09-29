import { fetchGitHubIssues } from "./utils/github.js";
import { createYouTrackIssue, fetchYouTrackProjects } from "./utils/youtrack.js";
import * as readline from "readline";
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const question = (prompt) => {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
};
const main = async () => {
    const projects = await fetchYouTrackProjects();
    if (!projects) {
        console.error("No projects found!");
        rl.close();
        return;
    }
    console.log("Loading YouTrack projects...");
    projects.forEach(project => {
        console.log(`${project.id}: ${project.name}`);
    });
    const projectId = await question("\n\nInsert YouTrack project ID (e.g. 0-1): ");
    if (!projectId.trim()) {
        console.error("Project ID is required!");
        rl.close();
        return;
    }
    if (!projects.find((p => p.id == projectId))) {
        console.error("Project ID is required!");
        rl.close();
        return;
    }
    const repoUrl = await question("\n\nInsert GitHub Repository URL (e.g., owner/repo or https://github.com/owner/repo): ");
    console.log("\nStarting issue migration...");
    const githubIssues = await fetchGitHubIssues(repoUrl);
    if (!githubIssues) {
        console.error("No issues to import, leaving...");
        rl.close();
        return;
    }
    let success = 0;
    let error = 0;
    for (const ghIssue of githubIssues) {
        const ytIssue = await createYouTrackIssue(ghIssue, projectId);
        if (ytIssue) {
            console.log(`Created YouTrack issue: ${ytIssue.id} - "${ytIssue.summary}"`);
            success++;
        }
        else {
            console.log(`Failed to import issue - "${ghIssue.title}"`);
            error++;
        }
    }
    console.log("Migration completed!");
    console.log(`Successfully migrated: ${success}/${error} issues`);
    return;
};
main();
