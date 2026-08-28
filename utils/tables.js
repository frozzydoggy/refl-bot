function sortTable(teams) {
    return teams.sort((a, b) => {
        // Points
        if (b.points !== a.points) {
            return b.points - a.points;
        }

        // Goal difference
        const aGD = (a.goalsFor || 0) - (a.goalsAgainst || 0);
        const bGD = (b.goalsFor || 0) - (b.goalsAgainst || 0);

        if (bGD !== aGD) {
            return bGD - aGD;
        }

        // Goals scored
        if ((b.goalsFor || 0) !== (a.goalsFor || 0)) {
            return (b.goalsFor || 0) - (a.goalsFor || 0);
        }

        // Alphabetical as final tiebreaker
        return a.name.localeCompare(b.name);
    });
}

function calculateTeamStats(team) {
    const played = team.played || 0;
    const wins = team.wins || 0;
    const draws = team.draws || 0;
    const losses = team.losses || 0;
    const goalsFor = team.goalsFor || 0;
    const goalsAgainst = team.goalsAgainst || 0;

    return {
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: wins * 3 + draws
    };
}

function formatTable(teams) {
    const sorted = sortTable(
        teams.map(team => ({
            ...team,
            ...calculateTeamStats(team)
        }))
    );

    let table = "";

    table += "```text\n";
    table += "POS TEAM                 P  W  D  L  GD  PTS\n";
    table += "----------------------------------------------\n";

    sorted.forEach((team, index) => {
        const pos = String(index + 1).padStart(3);
        const name = team.name.substring(0, 20).padEnd(20);
        const p = String(team.played).padStart(2);
        const w = String(team.wins).padStart(2);
        const d = String(team.draws).padStart(2);
        const l = String(team.losses).padStart(2);
        const gd = String(team.goalDifference).padStart(3);
        const pts = String(team.points).padStart(3);

        table += `${pos} ${name} ${p} ${w} ${d} ${l} ${gd} ${pts}\n`;
    });

    table += "```";

    return table;
}

module.exports = {
    sortTable,
    calculateTeamStats,
    formatTable
};
