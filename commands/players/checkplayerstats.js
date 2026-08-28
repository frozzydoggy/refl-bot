const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readData } = require("../../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("checkplayerstats")
        .setDescription("Check a REFL player's statistics")
        .addStringOption(option =>
            option
                .setName("player")
                .setDescription("Player name")
                .setRequired(true)
        ),

    async execute(interaction) {
        const players = readData("players.json", []);

        const playerName = interaction.options.getString("player");

        const player = players.find(
            p => p.name.toLowerCase() === playerName.toLowerCase()
        );

        if (!player) {
            return interaction.reply({
                content: `❌ Player **${playerName}** was not found.`,
                ephemeral: true
            });
        }

        const stats = player.stats || {
            goals: 0,
            assists: 0,
            trophies: 0
        };

        const embed = new EmbedBuilder()
            .setTitle(`⚽ ${player.name}`)
            .addFields(
                {
                    name: "🏟️ Team",
                    value: player.team || "No team",
                    inline: true
                },
                {
                    name: "⚽ Goals",
                    value: `${stats.goals}`,
                    inline: true
                },
                {
                    name: "🅰️ Assists",
                    value: `${stats.assists}`,
                    inline: true
                },
                {
                    name: "🏆 Trophies",
                    value: `${stats.trophies}`,
                    inline: true
                }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};
