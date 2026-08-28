const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON, writeJSON } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");
const { findByName } = require("../../utils/helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("editteaminfo")
        .setDescription("Edit REFL team information")
        .addStringOption(o => o.setName("team").setDescription("Current team name").setRequired(true))
        .addStringOption(o => o.setName("name").setDescription("New team name").setRequired(false))
        .addStringOption(o => o.setName("league").setDescription("New league").setRequired(false)
            .addChoices({ name: "D1", value: "D1" }, { name: "D2", value: "D2" }))
        .addUserOption(o => o.setName("manager").setDescription("New manager").setRequired(false))
        .addUserOption(o => o.setName("owner").setDescription("New owner").setRequired(false))
        .addStringOption(o => o.setName("stadium").setDescription("New stadium").setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        if (!requireAdmin(interaction)) {
            return interaction.editReply("❌ You need Administrator permissions.");
        }

        const teams = readJSON("teams.json", []);
        const currentName = interaction.options.getString("team");
        const team = findByName(teams, currentName);

        if (!team) return interaction.editReply(`❌ Team **${currentName}** was not found.`);

        const newName = interaction.options.getString("name")?.trim();
        const newLeague = interaction.options.getString("league");
        const manager = interaction.options.getUser("manager");
        const owner = interaction.options.getUser("owner");
        const stadium = interaction.options.getString("stadium")?.trim();

        if (!newName && !newLeague && !manager && !owner && !stadium) {
            return interaction.editReply("❌ Provide at least one thing to change.");
        }

        if (newName && teams.some(t => t.id !== team.id && String(t.name).toLowerCase() === newName.toLowerCase())) {
            return interaction.editReply(`❌ **${newName}** already exists.`);
        }

        if (newName) team.name = newName;
        if (newLeague) team.league = newLeague;
        if (manager) team.managerId = manager.id;
        if (owner) team.ownerId = owner.id;
        if (stadium) team.stadium = stadium;

        if (!writeJSON("teams.json", teams)) {
            return interaction.editReply("❌ Failed to save the changes.");
        }

        const embed = new EmbedBuilder()
            .setTitle("🛠️ Team Updated")
            .setDescription(`**${team.name}** has been updated.`)
            .addFields(
                { name: "League", value: team.league || "Not set", inline: true },
                { name: "Manager", value: team.managerId ? `<@${team.managerId}>` : "Not set", inline: true },
                { name: "Owner", value: team.ownerId ? `<@${team.ownerId}>` : "Not set", inline: true },
                { name: "Stadium", value: team.stadium || "Not set", inline: true }
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
