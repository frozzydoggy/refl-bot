const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON, writeJSON } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addteam")
        .setDescription("Add a team to REFL")
        .addStringOption(o => o.setName("name").setDescription("Team name").setRequired(true))
        .addStringOption(o => o.setName("league").setDescription("Team league").setRequired(true)
            .addChoices({ name: "D1", value: "D1" }, { name: "D2", value: "D2" }))
        .addUserOption(o => o.setName("manager").setDescription("Team manager (optional)").setRequired(false))
        .addUserOption(o => o.setName("owner").setDescription("Team owner (optional)").setRequired(false))
        .addStringOption(o => o.setName("stadium").setDescription("Team stadium (optional)").setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        if (!requireAdmin(interaction)) {
            return interaction.editReply("❌ You need Administrator permissions.");
        }

        const name = interaction.options.getString("name").trim();
        const league = interaction.options.getString("league");
        const manager = interaction.options.getUser("manager");
        const owner = interaction.options.getUser("owner");
        const stadium = interaction.options.getString("stadium")?.trim() || null;

        const teams = readJSON("teams.json", []);

        if (!Array.isArray(teams)) {
            return interaction.editReply("❌ teams.json must contain an array.");
        }

        if (teams.some(t => String(t.name).toLowerCase() === name.toLowerCase())) {
            return interaction.editReply(`❌ **${name}** already exists.`);
        }

        const team = {
            id: Date.now().toString(),
            name,
            league,
            managerId: manager?.id || null,
            ownerId: owner?.id || null,
            stadium,
            description: null,
            logo: null,
            stats: {
                played: 0, wins: 0, draws: 0, losses: 0,
                goalsFor: 0, goalsAgainst: 0
            }
        };

        teams.push(team);

        if (!writeJSON("teams.json", teams)) {
            return interaction.editReply("❌ Failed to save the team.");
        }

        const embed = new EmbedBuilder()
            .setTitle("⚽ Team Added")
            .setDescription(`**${team.name}** has been added to REFL.`)
            .addFields(
                { name: "League", value: team.league, inline: true },
                { name: "Manager", value: manager ? `<@${manager.id}>` : "Not assigned", inline: true },
                { name: "Owner", value: owner ? `<@${owner.id}>` : "Not assigned", inline: true },
                { name: "Stadium", value: stadium || "Not assigned", inline: true }
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
