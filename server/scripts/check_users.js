const sequelize = require('../src/config/database');
const User = require('../src/models/User');

async function listUsers() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll();
        console.log('\n--- Registered Users ---');
        users.forEach(u => console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.full_name}`));
        console.log('------------------------\n');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

listUsers();
