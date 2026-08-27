const fs = require('fs');
const path = require('path');

const PLAYERS_FILE = path.join(__dirname, '..', 'players.json');

const TROPHIES = [
    'D1',
    'National Cup',
    'Pre-Season Cup',
    'Super Cup'
];

function createEmptyDatabase() {
    return {
        players: {}
    };
}

function createEmptyPlayer(username, club) {
    return {
        username,
        club,
        goals: 0,
        assists: 0,
        trophies: {
            D1: 0,
            'National Cup': 0,
            'Pre-Season Cup': 0,
            'Super Cup': 0
        }
    };
}

function loadPlayers() {
    try {
        if (!fs.existsSync(PLAYERS_FILE)) {
            const database = createEmptyDatabase();

            fs.writeFileSync(
                PLAYERS_FILE,
                JSON.stringify(database, null, 2)
            );

            return database;
        }

        const raw = fs.readFileSync(PLAYERS_FILE, 'utf8');

        if (!raw.trim()) {
            return createEmptyDatabase();
        }

        const database = JSON.parse(raw);

        if (!database.players || typeof database.players !== 'object') {
            database.players = {};
        }

        // Repair old/incomplete player entries
        for (const key of Object.keys(database.players)) {
            const player = database.players[key];

            if (!player.username) {
                player.username = key;
            }

            if (!player.club) {
                player.club = 'Unknown';
            }

            if (typeof player.goals !== 'number') {
                player.goals = 0;
            }

            if (typeof player.assists !== 'number') {
                player.assists = 0;
            }

            if (!player.trophies || typeof player.trophies !== 'object') {
                player.trophies = {};
            }

            for (const trophy of TROPHIES) {
                if (typeof player.trophies[trophy] !== 'number') {
                    player.trophies[trophy] = 0;
                }
            }
        }

        return database;

    } catch (error) {
        console.error('❌ Could not load players.json:', error);

        return createEmptyDatabase();
    }
}

function savePlayers(database) {
    try {
        const temporaryFile = `${PLAYERS_FILE}.tmp`;

        fs.writeFileSync(
            temporaryFile,
            JSON.stringify(database, null, 2)
        );

        fs.renameSync(
            temporaryFile,
            PLAYERS_FILE
        );

        return true;

    } catch (error) {
        console.error('❌ Could not save players.json:', error);

        return false;
    }
}

function findPlayerKey(database, username) {
    if (!username) {
        return null;
    }

    const search = username.trim().toLowerCase();

    return Object.keys(database.players).find(
        key => key.toLowerCase() === search
    ) || null;
}

function addPlayer(username, club) {
    const database = loadPlayers();

    username = username.trim();

    if (!username) {
        return {
            success: false,
            message: 'Player username cannot be empty.'
        };
    }

    const existingPlayer = findPlayerKey(
        database,
        username
    );

    if (existingPlayer) {
        return {
            success: false,
            message: `Player **${database.players[existingPlayer].username}** already exists.`
        };
    }

    const player = createEmptyPlayer(
        username,
        club
    );

    database.players[username] = player;

    if (!savePlayers(database)) {
        return {
            success: false,
            message: 'Could not save the player database.'
        };
    }

    return {
        success: true,
        player
    };
}

function addPlayerStats(
    username,
    goals = 0,
    assists = 0,
    trophy = null
) {
    const database = loadPlayers();

    const playerKey = findPlayerKey(
        database,
        username
    );

    if (!playerKey) {
        return {
            success: false,
            message: `No player named **${username}** exists.`
        };
    }

    const player = database.players[playerKey];

    if (goals < 0 || assists < 0) {
        return {
            success: false,
            message: 'Goals and assists cannot be negative.'
        };
    }

    if (trophy && !TROPHIES.includes(trophy)) {
        return {
            success: false,
            message: `**${trophy}** is not a valid REFL trophy.`
        };
    }

    player.goals += goals;
    player.assists += assists;

    if (trophy) {
        player.trophies[trophy]++;
    }

    if (!savePlayers(database)) {
        return {
            success: false,
            message: 'Could not save the player database.'
        };
    }

    return {
        success: true,
        player
    };
}

function getPlayer(username) {
    const database = loadPlayers();

    const playerKey = findPlayerKey(
        database,
        username
    );

    if (!playerKey) {
        return null;
    }

    return database.players[playerKey];
}

function getAllPlayers() {
    const database = loadPlayers();

    return database.players;
}

function removePlayer(username) {
    const database = loadPlayers();

    const playerKey = findPlayerKey(
        database,
        username
    );

    if (!playerKey) {
        return {
            success: false,
            message: `No player named **${username}** exists.`
        };
    }

    const player = database.players[playerKey];

    delete database.players[playerKey];

    if (!savePlayers(database)) {
        return {
            success: false,
            message: 'Could not save the player database.'
        };
    }

    return {
        success: true,
        player
    };
}

function editPlayerClub(username, newClub) {
    const database = loadPlayers();

    const playerKey = findPlayerKey(
        database,
        username
    );

    if (!playerKey) {
        return {
            success: false,
            message: `No player named **${username}** exists.`
        };
    }

    database.players[playerKey].club = newClub;

    if (!savePlayers(database)) {
        return {
            success: false,
            message: 'Could not save the player database.'
        };
    }

    return {
        success: true,
        player: database.players[playerKey]
    };
}

module.exports = {
    TROPHIES,
    addPlayer,
    addPlayerStats,
    getPlayer,
    getAllPlayers,
    removePlayer,
    editPlayerClub
};
