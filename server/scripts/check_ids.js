const sequelize = require('../src/config/database');
const UniqueId = require('../src/models/UniqueId');

async function checkIds() {
    try {
        await sequelize.authenticate();
        const usedIds = await UniqueId.findAll({ where: { is_used: true } });
        if (usedIds.length === 0) {
            console.log('No IDs have been used yet.');
        } else {
            console.log(`Used IDs: ${usedIds.map(u => u.unique_id).join(', ')}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

checkIds();
