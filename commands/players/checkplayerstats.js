const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON } = require("../../utils/database");
const { findByName } = require("../../utils/helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("checkplayerstats")
        .setDescription("Check a REFL player's statistics")
        .addStringOption(o => o.setName("player").setDescription("Player name").setRequired(true)),

    async execute(interaction) {
        const players = readJSON("players.json", []);
        const playerName = interaction.options.getString("player");
        const player = findByName(players, playerName);

        if (!player) return interaction.reply({ content: `❌ Player **${playerName}** was not found.`, ephemeral: true });

        const stats = {
            goals: Number(player.stats?.goals || 0),
            assists: Number(player.stats?.assists || 0),
            trophies: Number(player.stats?.trophies || 0)
        };

        const embed = new EmbedBuilder()
            .setTitle(`⚽ ${player.name}`)
            .addFields(
                { name: "🏟️ Team", value: player.team || "No team", inline: true },
                { name: "⚽ Goals", value: String(stats.goals), inline: true },
                { name: "🅰️ Assists", value: String(stats.assists), inline: true },
                { name: "🏆 Trophies", value: String(stats.trophies), inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
