const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readData, writeData } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("funds")
        .setDescription("Manage REFL team funds")
        .addSubcommand(subcommand =>
            subcommand
                .setName("check")
                .setDescription("Check a team's funds")
                .addStringOption(option =>
                    option
                        .setName("team")
                        .setDescription("Team name")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Add funds to a team")
                .addStringOption(option =>
                    option
                        .setName("team")
                        .setDescription("Team name")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName("amount")
                        .setDescription("Amount to add")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove funds from a team")
                .addStringOption(option =>
                    option
                        .setName("team")
                        .setDescription("Team name")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName("amount")
                        .setDescription("Amount to remove")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Set a team's funds")
                .addStringOption(option =>
                    option
                        .setName("team")
                        .setDescription("Team name")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName("amount")
                        .setDescription("New balance")
                        .setMinValue(0)
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const teamName = interaction.options.getString("team");

        const funds = readData("funds.json", []);

        let teamFunds = funds.find(
            team => team.team.toLowerCase() === teamName.toLowerCase()
        );

        // CHECK FUNDS
        if (subcommand === "check") {
            if (!teamFunds) {
                return interaction.reply({
                    content: `❌ **${teamName}** does not have a funds account yet.`,
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("💰 REFL Club Funds")
                .setDescription(`**${teamFunds.team}**`)
                .addFields({
                    name: "Balance",
                    value: `£${teamFunds.balance.toLocaleString()}`,
                    inline: true
                })
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        // ADMIN CHECK FOR CHANGING FUNDS
        const permission = requireAdmin(interaction);

        if (!permission.allowed) {
            return interaction.reply({
                content: permission.message,
                ephemeral: true
            });
        }

        // CREATE ACCOUNT IF IT DOESN'T EXIST
        if (!teamFunds) {
            teamFunds = {
                team: teamName,
                balance: 0
            };

            funds.push(teamFunds);
        }

        const amount = interaction.options.getInteger("amount");

        // ADD
        if (subcommand === "add") {
            teamFunds.balance += amount;
        }

        // REMOVE
        if (subcommand === "remove") {
            if (teamFunds.balance < amount) {
                return interaction.reply({
                    content:
                        `❌ **${teamFunds.team}** only has ` +
                        `£${teamFunds.balance.toLocaleString()}.`,
                    ephemeral: true
                });
            }

            teamFunds.balance -= amount;
        }

        // SET
        if (subcommand === "set") {
            teamFunds.balance = amount;
        }

        const saved = writeData("funds.json", funds);

        if (!saved) {
            return interaction.reply({
                content: "❌ Failed to save the funds.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("💰 Club Funds Updated")
            .setDescription(`**${teamFunds.team}**`)
            .addFields({
                name: "New Balance",
                value: `£${teamFunds.balance.toLocaleString()}`,
                inline: true
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};
