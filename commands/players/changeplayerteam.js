const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON, writeJSON } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");
const { findByName } = require("../../utils/helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("changeplayerteam")
        .setDescription("Change a player's REFL team")
        .addStringOption(o => o.setName("player").setDescription("Player name").setRequired(true))
        .addStringOption(o => o.setName("team").setDescription("New team").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        if (!requireAdmin(interaction)) return interaction.editReply("❌ You need Administrator permissions.");

        const players = readJSON("players.json", []);
        const teams = readJSON("teams.json", []);

        const playerName = interaction.options.getString("player");
        const newTeamName = interaction.options.getString("team");

        const player = findByName(players, playerName);
        const newTeam = findByName(teams, newTeamName);

        if (!player) return interaction.editReply(`❌ Player **${playerName}** was not found.`);
        if (!newTeam) return interaction.editReply(`❌ Team **${newTeamName}** was not found.`);

        const oldTeam = player.team || "No team";
        player.team = newTeam.name;

        if (!writeJSON("players.json", players)) return interaction.editReply("❌ Failed to save the team change.");

        const embed = new EmbedBuilder()
            .setTitle("🔄 Player Team Changed")
            .setDescription(`**${player.name}** has changed teams.`)
            .addFields(
                { name: "Previous Team", value: oldTeam, inline: true },
                { name: "New Team", value: newTeam.name, inline: true }
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
