const fs = require('fs');
const path = require('path');

const playersFile = path.join(__dirname, '..', 'players.json');

const TROPHIES = [
    'D1',
    'National Cup',
    'Pre-Season Cup',
    'Super Cup'
];

function loadPlayers() {
    try {
        if (!fs.existsSync(playersFile)) {
            const initialData = { players: {} };
            fs.writeFileSync(
                playersFile,
                JSON.stringify(initialData, null, 2)
            );
            return initialData;
        }

        const data = fs.readFileSync(playersFile, 'utf8');

        if (!data.trim()) {
            return { players: {} };
        }

        const parsed = JSON.parse(data);

        if (!parsed.players) {
            parsed.players = {};
        }

        return parsed;

    } catch (error) {
        console.error('Could not read players.json:', error);
        return { players: {} };
    }
}

function savePlayers(data) {
    try {
        fs.writeFileSync(
            playersFile,
            JSON.stringify(data, null, 2)
        );
    } catch (error) {
        console.error('Could not save players.json:', error);
    }
}

function addPlayer(username, club) {
    const data = loadPlayers();

    username = username.trim();

    if (!username) {
        return {
            success: false,
            message: 'Player username cannot be empty.'
        };
    }

    if (data.players[username]) {
        return {
            success: false,
            message: `Player **${username}** already exists.`
        };
    }

    data.players[username] = {
        username: username,
        club: club,
        goals: 0,
        assists: 0,
        trophies: {
            D1: 0,
            'National Cup': 0,
            'Pre-Season Cup': 0,
            'Super Cup': 0
        }
    };

    savePlayers(data);

    return {
        success: true,
        player: data.players[username]
    };
}

function addPlayerStats(username, goals, assists, trophy) {
    const data = loadPlayers();

    const player = data.players[username];

    if (!player) {
        return {
            success: false,
            message: `No player named **${username}** exists.`
        };
    }

    if (goals > 0) {
        player.goals += goals;
    }

    if (assists > 0) {
        player.assists += assists;
    }

    if (trophy) {
        if (!TROPHIES.includes(trophy)) {
            return {
                success: false,
                message: `**${trophy}** is not a valid trophy.`
            };
        }

        player.trophies[trophy]++;
    }

    savePlayers(data);

    return {
        success: true,
        player: player
    };
}

function getPlayer(username) {
    const data = loadPlayers();

    return data.players[username] || null;
}

function getAllPlayers() {
    const data = loadPlayers();

    return data.players;
}

module.exports = {
    TROPHIES,
    addPlayer,
    addPlayerStats,
    getPlayer,
    getAllPlayers
};
