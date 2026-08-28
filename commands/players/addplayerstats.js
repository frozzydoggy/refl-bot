const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readData, writeData } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addplayerstats")
        .setDescription("Add statistics to a REFL player")
        .addStringOption(option =>
            option
                .setName("player")
                .setDescription("Player name")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("goals")
                .setDescription("Goals to add")
                .setMinValue(0)
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("assists")
                .setDescription("Assists to add")
                .setMinValue(0)
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("trophies")
                .setDescription("Trophies to add")
                .setMinValue(0)
                .setRequired(true)
        ),

    async execute(interaction) {
        const permission = requireAdmin(interaction);

        if (!permission.allowed) {
            return interaction.reply({
                content: permission.message,
                ephemeral: true
            });
        }

        const players = readData("players.json", []);

        const playerName = interaction.options.getString("player");
        const goals = interaction.options.getInteger("goals");
        const assists = interaction.options.getInteger("assists");
        const trophies = interaction.options.getInteger("trophies");

        const player = players.find(
            p => p.name.toLowerCase() === playerName.toLowerCase()
        );

        if (!player) {
            return interaction.reply({
                content: `❌ Player **${playerName}** was not found.`,
                ephemeral: true
            });
        }

        if (!player.stats) {
            player.stats = {
                goals: 0,
                assists: 0,
                trophies: 0
            };
        }

        player.stats.goals += goals;
        player.stats.assists += assists;
        player.stats.trophies += trophies;

        const saved = writeData("players.json", players);

        if (!saved) {
            return interaction.reply({
                content: "❌ Failed to save player statistics.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("📊 Player Stats Updated")
            .setDescription(`Stats updated for **${player.name}**.`)
            .addFields(
                {
                    name: "⚽ Goals",
                    value: `+${goals} → **${player.stats.goals}**`,
                    inline: true
                },
                {
                    name: "🅰️ Assists",
                    value: `+${assists} → **${player.stats.assists}**`,
                    inline: true
                },
                {
                    name: "🏆 Trophies",
                    value: `+${trophies} → **${player.stats.trophies}**`,
                    inline: true
                }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};
