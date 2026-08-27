const fs = require('fs');

const PLAYERS_FILE = './players.json';

// ==========================================
// REFL TROPHIES
// ==========================================

const TROPHIES = [
    'D1',
    'National Cup',
    'Pre-Season Cup',
    'Super Cup'
];

// ==========================================
// LOAD PLAYERS
// ==========================================

function loadPlayers() {
    if (!fs.existsSync(PLAYERS_FILE)) {
        return {};
    }

    try {
        return JSON.parse(
            fs.readFileSync(PLAYERS_FILE, 'utf8')
        );
    } catch (error) {
        console.error('Could not read players.json:', error);
        return {};
    }
}

// ==========================================
// SAVE PLAYERS
// ==========================================

function savePlayers(players) {
    fs.writeFileSync(
        PLAYERS_FILE,
        JSON.stringify(players, null, 2)
    );
}

// ==========================================
// ADD PLAYER
// ==========================================

function addPlayer(username, club) {

    const players = loadPlayers();

    if (players[username]) {
        return {
            success: false,
            message: 'That player already exists.'
        };
    }

    players[username] = {
        username: username,
        club: club,
        goals: 0,
        assists: 0,
        trophies: {
            'D1': 0,
            'National Cup': 0,
            'Pre-Season Cup': 0,
            'Super Cup': 0
        }
    };

    savePlayers(players);

    return {
        success: true,
        player: players[username]
    };
}

// ==========================================
// ADD PLAYER STATS
// ==========================================

function addPlayerStats(
    username,
    goals,
    assists,
    trophy
) {

    const players = loadPlayers();

    if (!players[username]) {
        return {
            success: false,
            message: 'That player does not exist.'
        };
    }

    players[username].goals += goals;
    players[username].assists += assists;

    if (trophy) {

        if (!TROPHIES.includes(trophy)) {

            return {
                success: false,
                message: 'Invalid trophy.'
            };
        }

        players[username].trophies[trophy]++;
    }

    savePlayers(players);

    return {
        success: true,
        player: players[username]
    };
}

// ==========================================
// GET PLAYER
// ==========================================

function getPlayer(username) {

    const players = loadPlayers();

    return players[username] || null;
}

// ==========================================
// GET ALL PLAYERS
// ==========================================

function getAllPlayers() {

    return loadPlayers();
}

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    TROPHIES,
    addPlayer,
    addPlayerStats,
    getPlayer,
    getAllPlayers
};