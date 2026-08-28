const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON, writeJSON } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");
const { findByName } = require("../../utils/helpers");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("funds")
        .setDescription("Manage REFL club funds")
        .addSubcommand(s => s.setName("check").setDescription("Check club funds")
            .addStringOption(o => o.setName("team").setDescription("Team name").setRequired(true)))
        .addSubcommand(s => s.setName("add").setDescription("Add funds")
            .addStringOption(o => o.setName("team").setDescription("Team name").setRequired(true))
            .addIntegerOption(o => o.setName("amount").setDescription("Amount").setMinValue(0).setRequired(true)))
        .addSubcommand(s => s.setName("remove").setDescription("Remove funds")
            .addStringOption(o => o.setName("team").setDescription("Team name").setRequired(true))
            .addIntegerOption(o => o.setName("amount").setDescription("Amount").setMinValue(0).setRequired(true)))
        .addSubcommand(s => s.setName("set").setDescription("Set funds")
            .addStringOption(o => o.setName("team").setDescription("Team name").setRequired(true))
            .addIntegerOption(o => o.setName("amount").setDescription("New balance").setMinValue(0).setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const teamName = interaction.options.getString("team").trim();
        const funds = readJSON("funds.json", []);
        const teams = readJSON("teams.json", []);
        const team = findByName(teams, teamName);

        if (!team) return interaction.reply({ content: `❌ Team **${teamName}** was not found.`, ephemeral: true });

        let account = funds.find(f => f.teamId === team.id || String(f.team).toLowerCase() === team.name.toLowerCase());

        if (subcommand === "check") {
            const balance = account ? Number(account.balance || 0) : 0;

            const embed = new EmbedBuilder()
                .setTitle("💰 REFL Club Funds")
                .setDescription(`**${team.name}**`)
                .addFields({ name: "Balance", value: `£${balance.toLocaleString()}`, inline: true })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (!requireAdmin(interaction)) return interaction.reply({ content: "❌ You need Administrator permissions.", ephemeral: true });

        if (!account) {
            account = { teamId: team.id, team: team.name, balance: 0 };
            funds.push(account);
        } else {
            account.teamId = team.id;
            account.team = team.name;
            account.balance = Number(account.balance || 0);
        }

        const amount = interaction.options.getInteger("amount");

        if (subcommand === "add") account.balance += amount;

        if (subcommand === "remove") {
            if (account.balance < amount) {
                return interaction.reply({ content: `❌ **${team.name}** only has £${account.balance.toLocaleString()}.`, ephemeral: true });
            }
            account.balance -= amount;
        }

        if (subcommand === "set") account.balance = amount;

        if (!writeJSON("funds.json", funds)) return interaction.reply({ content: "❌ Failed to save the funds.", ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle("💰 Club Funds Updated")
            .setDescription(`**${team.name}**`)
            .addFields({ name: "New Balance", value: `£${account.balance.toLocaleString()}`, inline: true })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
