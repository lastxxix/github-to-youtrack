import { gh, MAPPINGS_FILE, yt } from "../config/config.js";
import fs from 'fs/promises';
import { convertGitHubIssueToYouTrack } from "../utils/parser.js";
export class SyncService {
    async saveMappings(mappings) {
        await fs.writeFile(MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
        console.log(`Mappings saved in ${MAPPINGS_FILE}`);
    }
    async loadMappings() {
        try {
            const data = await fs.readFile(MAPPINGS_FILE, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            return [];
        }
    }
    async syncRepo(mapping) {
        const { githubRepo, youtrackProjectId, lastUpdate } = mapping;
        console.log(`\n--- Syncing ${githubRepo} ---`);
        const issues = await gh.fetchIssues(githubRepo, lastUpdate);
        if (issues.length === 0) {
            console.log(`No new or updated issues for ${githubRepo}`);
            return;
        }
        for (const issue of issues) {
            const existingIssue = await yt.findIssue(issue.number, youtrackProjectId);
            const ytIssue = existingIssue
                ? await yt.updateIssue(existingIssue, convertGitHubIssueToYouTrack(issue, youtrackProjectId))
                : await yt.createIssue(issue, youtrackProjectId);
            if (!ytIssue)
                continue;
            if (!existingIssue) {
                console.log(`Created YouTrack issue ${ytIssue.id} for GitHub issue #${issue.number}`);
            }
            else {
                console.log(`Updated YouTrack issue ${ytIssue.id} for GitHub issue #${issue.number}`);
            }
            if (issue.comments > 0) {
                const comments = await gh.fetchComments(githubRepo, issue.number, existingIssue ? lastUpdate : undefined);
                for (const comment of comments) {
                    const added = await yt.addCommentToIssue(ytIssue.id, comment);
                    if (added) {
                        console.log(`Added comment ${comment.id} to issue ${ytIssue.id}`);
                    }
                }
            }
        }
        mapping.lastUpdate = new Date().toISOString();
    }
    async performInitialMigration(mappings) {
        console.log('\n--- Starting initial migration ---\n');
        for (const { githubRepo, youtrackProjectId } of mappings) {
            const issues = await gh.fetchIssues(githubRepo);
            for (const issue of issues) {
                const created = await yt.createIssue(issue, youtrackProjectId);
                if (created) {
                    console.log(`Created YouTrack issue ${created.id} for GitHub issue #${issue.number}`);
                    if (issue.comments > 0) {
                        const comments = await gh.fetchComments(githubRepo, issue.number);
                        for (const comment of comments) {
                            await yt.addCommentToIssue(created.id, comment);
                        }
                    }
                }
            }
        }
    }
}
