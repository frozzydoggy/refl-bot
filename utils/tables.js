function normalizeTeamStats(team) {
    const stats = team.stats || {};

    return {
        played: Number(stats.played ?? team.played ?? 0),
        wins: Number(stats.wins ?? team.wins ?? 0),
        draws: Number(stats.draws ?? team.draws ?? 0),
        losses: Number(stats.losses ?? team.losses ?? 0),
        goalsFor: Number(stats.goalsFor ?? team.goalsFor ?? 0),
        goalsAgainst: Number(stats.goalsAgainst ?? team.goalsAgainst ?? 0)
    };
}

function calculateTeamStats(team) {
    const stats = normalizeTeamStats(team);
    const goalDifference = stats.goalsFor - stats.goalsAgainst;
    const points = stats.wins * 3 + stats.draws;

    return {
        ...stats,
        goalDifference,
        points
    };
}

function sortTable(teams) {
    return [...teams].sort((a, b) => {
        const aStats = calculateTeamStats(a);
        const bStats = calculateTeamStats(b);

        if (bStats.points !== aStats.points) {
            return bStats.points - aStats.points;
        }

        if (bStats.goalDifference !== aStats.goalDifference) {
            return bStats.goalDifference - aStats.goalDifference;
        }

        if (bStats.goalsFor !== aStats.goalsFor) {
            return bStats.goalsFor - aStats.goalsFor;
        }

        return String(a.name).localeCompare(String(b.name));
    });
}

function formatTable(teams, league = null) {
    const sorted = sortTable(teams);

    const normalizedLeague = String(league || "").toUpperCase();

    let table = "```text\n";
    table += "POS TEAM                 P  W  D  L  GD  PTS\n";
    table += "----------------------------------------------\n";

    sorted.forEach((team, index) => {
        const stats = calculateTeamStats(team);
        const position = index + 1;

        // REFL league qualification/relegation zones:
        // D1: positions 1-4 = green, 7-8 = red
        // D2: positions 1-2 = green
        let zone = "  ";

        if (normalizedLeague === "D1") {
            if (position <= 4) {
                zone = "🟩";
            } else if (position === 7 || position === 8) {
                zone = "🟥";
            }
        } else if (normalizedLeague === "D2") {
            if (position <= 2) {
                zone = "🟩";
            }
        }

        const pos = String(position).padStart(3);
        const name = String(team.name).substring(0, 20).padEnd(20);
        const p = String(stats.played).padStart(2);
        const w = String(stats.wins).padStart(2);
        const d = String(stats.draws).padStart(2);
        const l = String(stats.losses).padStart(2);
        const gd = String(stats.goalDifference).padStart(3);
        const pts = String(stats.points).padStart(3);

        table += `${zone} ${pos} ${name} ${p} ${w} ${d} ${l} ${gd} ${pts}\n`;
    });

    table += "```\n";

    if (normalizedLeague === "D1") {
        table += "🟩 Promotion / qualifying zone: 1st–4th\n";
        table += "🟥 Relegation zone: 7th–8th";
    } else if (normalizedLeague === "D2") {
        table += "🟩 Promotion zone: 1st–2nd";
    }

    return table;
}

function ensureTeamStats(team) {
    if (!team.stats || typeof team.stats !== "object") {
        team.stats = {};
    }

    const defaults = {
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0
    };

    for (const [key, value] of Object.entries(defaults)) {
        if (!Number.isFinite(Number(team.stats[key]))) {
            team.stats[key] = value;
        } else {
            team.stats[key] = Number(team.stats[key]);
        }
    }

    return team.stats;
}

module.exports = {
    sortTable,
    calculateTeamStats,
    formatTable,
    ensureTeamStats
};
