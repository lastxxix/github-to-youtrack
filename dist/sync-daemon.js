import { rl } from "./config/config.js";
import { SyncService } from "./services/sync.js";
const main = async () => {
    const syncService = new SyncService();
    const mappings = await syncService.loadMappings();
    if (mappings.length === 0) {
        console.log('No mappings found. Run the migration first.');
        process.exit(1);
    }
    const reposToSync = mappings.filter(m => m.lastUpdate);
    if (reposToSync.length === 0) {
        console.log('No repos configured for auto-sync.');
        process.exit(1);
    }
    console.log('Starting sync daemon\n');
    reposToSync.forEach(m => {
        const interval = m.syncIntervalMinutes || 5;
        console.log(`  - ${m.githubRepo}: every ${interval} min`);
    });
    console.log('\nPress Ctrl+C to stop');
    const syncTimers = new Map();
    const scheduleRepoSync = (mapping) => {
        const intervalMs = (mapping.syncIntervalMinutes || 5) * 60 * 1000;
        const timer = setInterval(async () => {
            try {
                await syncService.syncRepo(mapping);
                await syncService.saveMappings(mappings);
                console.log(`✅ [${mapping.githubRepo}] Synced at ${new Date().toLocaleTimeString()}`);
            }
            catch (error) {
                console.error(`❌ [${mapping.githubRepo}] Error:`, error);
            }
        }, intervalMs);
        syncTimers.set(mapping.githubRepo, timer);
    };
    reposToSync.forEach(scheduleRepoSync);
    process.on('SIGINT', async () => {
        console.log('\n\nStopping sync daemon...');
        syncTimers.forEach(timer => clearInterval(timer));
        await syncService.saveMappings(mappings);
        rl.close();
        process.exit(0);
    });
};
main();
