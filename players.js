const fs = require("fs");
const path = require("path");

const playersFile = path.join(__dirname, "..", "players.json");

function loadPlayers() {
    if (!fs.existsSync(playersFile)) {
        fs.writeFileSync(playersFile, JSON.stringify({ players: {} }, null, 2));
    }

    try {
        const data = fs.readFileSync(playersFile, "utf8");

        if (!data.trim()) {
            return { players: {} };
        }

        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading players.json:", error);
        return { players: {} };
    }
}

function savePlayers(data) {
    fs.writeFileSync(playersFile, JSON.stringify(data, null, 2));
}

function addPlayer(username, discordId) {
    const data = loadPlayers();

    if (data.players[username]) {
        return false;
    }

    data.players[username] = {
        discordId: discordId || null,
        goals: 0,
        assists: 0,
        trophies: 0
    };

    savePlayers(data);
    return true;
}

function getPlayer(username) {
    const data = loadPlayers();
    return data.players[username] || null;
}

function getAllPlayers() {
    const data = loadPlayers();
    return data.players;
}

function updatePlayerStats(username, stats) {
    const data = loadPlayers();

    if (!data.players[username]) {
        return false;
    }

    if (stats.goals !== undefined) {
        data.players[username].goals = stats.goals;
    }

    if (stats.assists !== undefined) {
        data.players[username].assists = stats.assists;
    }

    if (stats.trophies !== undefined) {
        data.players[username].trophies = stats.trophies;
    }

    savePlayers(data);
    return true;
}

module.exports = {
    addPlayer,
    getPlayer,
    getAllPlayers,
    updatePlayerStats
};
