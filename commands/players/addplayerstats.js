const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON, writeJSON } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");
const { findByName } = require("../../utils/helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addplayerstats")
        .setDescription("Add statistics to a REFL player")
        .addStringOption(o => o.setName("player").setDescription("Player name").setRequired(true))
        .addIntegerOption(o => o.setName("goals").setDescription("Goals to add").setMinValue(0).setRequired(true))
        .addIntegerOption(o => o.setName("assists").setDescription("Assists to add").setMinValue(0).setRequired(true))
        .addIntegerOption(o => o.setName("trophies").setDescription("Trophies to add").setMinValue(0).setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        if (!requireAdmin(interaction)) return interaction.editReply("❌ You need Administrator permissions.");

        const players = readJSON("players.json", []);
        const playerName = interaction.options.getString("player");
        const goals = interaction.options.getInteger("goals");
        const assists = interaction.options.getInteger("assists");
        const trophies = interaction.options.getInteger("trophies");

        const player = findByName(players, playerName);
        if (!player) return interaction.editReply(`❌ Player **${playerName}** was not found.`);

        if (!player.stats || typeof player.stats !== "object") {
            player.stats = { goals: 0, assists: 0, trophies: 0 };
        }

        player.stats.goals = Number(player.stats.goals || 0) + goals;
        player.stats.assists = Number(player.stats.assists || 0) + assists;
        player.stats.trophies = Number(player.stats.trophies || 0) + trophies;

        if (!writeJSON("players.json", players)) return interaction.editReply("❌ Failed to save player statistics.");

        const embed = new EmbedBuilder()
            .setTitle("📊 Player Stats Updated")
            .setDescription(`Stats updated for **${player.name}**.`)
            .addFields(
                { name: "⚽ Goals", value: `+${goals} → **${player.stats.goals}**`, inline: true },
                { name: "🅰️ Assists", value: `+${assists} → **${player.stats.assists}**`, inline: true },
                { name: "🏆 Trophies", value: `+${trophies} → **${player.stats.trophies}**`, inline: true }
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
