import { question, yt } from "../config/config.js";
export async function promptUserForMappings() {
    const mappings = [];
    while (true) {
        const githubRepo = await question('Enter GitHub repo (e.g. org/repo, leave empty to continue): ');
        if (!githubRepo)
            break;
        console.log("Fetching YouTrack projects...");
        const projects = await yt.fetchProjects();
        projects.forEach(project => {
            console.log(`${project.id}: ${project.name}`);
        });
        const youtrackProjectId = await question('Enter YouTrack projectId: ');
        const autoSync = await question('Enable automatic sync? (y/n): ');
        if (autoSync.toLowerCase() === 'y') {
            const intervalInput = await question('Sync interval in minutes (default: 5, max: 1440): ');
            const syncIntervalMinutes = Math.min(Math.max(parseInt(intervalInput) || 5, 1), 1440);
            mappings.push({
                githubRepo,
                youtrackProjectId,
                lastUpdate: new Date().toISOString(),
                syncIntervalMinutes
            });
        }
        else {
            mappings.push({ githubRepo, youtrackProjectId });
        }
    }
    return mappings;
}
