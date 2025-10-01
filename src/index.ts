import { rl } from "./config/config.js";
import { SyncService } from "./services/sync.js";
import { promptUserForMappings } from "./cli/prompts.js";

const main = async () => {
    const syncService = new SyncService();
    
    console.log('=== GitHub to YouTrack Migration Tool ===\n');
    
    let mappings = await syncService.loadMappings();
    
    if (mappings.length > 0) {
        console.log('Found existing mappings. Loading...');
    } else {
        mappings = await promptUserForMappings();
        await syncService.saveMappings(mappings);
    }
    
    if (mappings.length === 0) {
        console.log('No mappings configured. Exiting.');
        rl.close();
        return;
    }
    
    await syncService.performInitialMigration(mappings);
    
    console.log('\n✅ Migration completed!');



    rl.close();
};

main();