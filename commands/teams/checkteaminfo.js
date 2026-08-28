const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON } = require("../../utils/database");
const { calculateTeamStats } = require("../../utils/tables");
const { findByName } = require("../../utils/helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("checkteaminfo")
        .setDescription("Check REFL team information")
        .addStringOption(o => o.setName("team").setDescription("Team name").setRequired(true)),

    async execute(interaction) {
        const name = interaction.options.getString("team");
        const teams = readJSON("teams.json", []);
        const team = findByName(teams, name);

        if (!team) {
            return interaction.reply({ content: `❌ Team **${name}** was not found.`, ephemeral: true });
        }

        const stats = calculateTeamStats(team);

        const embed = new EmbedBuilder()
            .setTitle(`⚽ ${team.name}`)
            .addFields(
                { name: "League", value: team.league || "Not set", inline: true },
                { name: "🏟️ Stadium", value: team.stadium || "Not set", inline: true },
                { name: "👤 Manager", value: team.managerId ? `<@${team.managerId}>` : "Not set", inline: true },
                { name: "👑 Owner", value: team.ownerId ? `<@${team.ownerId}>` : "Not set", inline: true },
                { name: "📊 Record", value: `${stats.played} P • ${stats.wins} W • ${stats.draws} D • ${stats.losses} L`, inline: false },
                { name: "⚽ Goals", value: `${stats.goalsFor} GF • ${stats.goalsAgainst} GA • ${stats.goalDifference} GD`, inline: true },
                { name: "🏆 Points", value: `${stats.points}`, inline: true }
            )
            .setDescription(team.description || "No team description.")
            .setTimestamp();

        if (team.logo) embed.setThumbnail(team.logo);

        return interaction.reply({ embeds: [embed] });
    }
};
