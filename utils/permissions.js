function isAdmin(interaction) {
    return interaction.memberPermissions?.has("Administrator");
}

function requireAdmin(interaction) {
    if (!isAdmin(interaction)) {
        return false;
    }

    return true;
}

module.exports = {
    isAdmin,
    requireAdmin
};
