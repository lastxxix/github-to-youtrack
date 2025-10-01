import { rl, ss } from "./config/config.js";
import { promptUserForMappings } from "./cli/prompts.js";
const main = async () => {
    console.log('=== GitHub to YouTrack Migration Tool ===\n');
    let mappings = await ss.loadMappings();
    if (mappings.length > 0) {
        console.log('Found existing mappings. Loading...');
    }
    else {
        mappings = await promptUserForMappings();
        await ss.saveMappings(mappings);
    }
    if (mappings.length === 0) {
        console.log('No mappings configured. Exiting.');
        rl.close();
        return;
    }
    await ss.performInitialMigration(mappings);
    console.log('\n✅ Migration completed!');
    rl.close();
};
main();
