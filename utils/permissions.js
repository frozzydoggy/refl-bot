function isAdmin(interaction) {
    return Boolean(
        interaction.memberPermissions &&
        interaction.memberPermissions.has("Administrator")
    );
}

function requireAdmin(interaction) {
    return isAdmin(interaction);
}

module.exports = {
    isAdmin,
    requireAdmin
};
