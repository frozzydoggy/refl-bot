function findByName(items, name) {
    const target = String(name || "").trim().toLowerCase();

    return items.find(item =>
        String(item.name || "").trim().toLowerCase() === target
    );
}

function normalizeLeague(value) {
    const league = String(value || "").trim().toUpperCase();
    return league === "D1" || league === "D2" ? league : null;
}

module.exports = {
    findByName,
    normalizeLeague
};
