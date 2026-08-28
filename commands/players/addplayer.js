const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON, writeJSON } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");
const { findByName } = require("../../utils/helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addplayer")
        .setDescription("Add a player to REFL")
        .addStringOption(o => o.setName("name").setDescription("Player name").setRequired(true))
        .addUserOption(o => o.setName("user").setDescription("Player's Discord account").setRequired(true))
        .addStringOption(o => o.setName("team").setDescription("Player's team").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        if (!requireAdmin(interaction)) return interaction.editReply("❌ You need Administrator permissions.");

        const name = interaction.options.getString("name").trim();
        const user = interaction.options.getUser("user");
        const teamName = interaction.options.getString("team").trim();

        const players = readJSON("players.json", []);
        const teams = readJSON("teams.json", []);

        if (!findByName(teams, teamName)) {
            return interaction.editReply(`❌ Team **${teamName}** was not found.`);
        }

        if (players.some(p =>
            String(p.name).toLowerCase() === name.toLowerCase() ||
            p.discordId === user.id
        )) {
            return interaction.editReply("❌ That player already exists.");
        }

        players.push({
            id: Date.now().toString(),
            name,
            discordId: user.id,
            team: findByName(teams, teamName).name,
            stats: { goals: 0, assists: 0, trophies: 0 }
        });

        if (!writeJSON("players.json", players)) return interaction.editReply("❌ Failed to save the player.");

        const embed = new EmbedBuilder()
            .setTitle("⚽ Player Added")
            .setDescription(`**${name}** has been added to REFL.`)
            .addFields(
                { name: "Team", value: findByName(teams, teamName).name, inline: true },
                { name: "Discord", value: `<@${user.id}>`, inline: true }
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
