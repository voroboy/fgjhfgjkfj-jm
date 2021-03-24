const { Discord } = require("../ApexStats.js");
const config = require("../config.json");
const percentage = require("percentagebar");
const legends = require("../GameData/legends.json");
const colours = require("../GameData/legendColors.json");

var { DateTime } = require("luxon");
const { default: axios } = require("axios");

var currentTimestamp = DateTime.local().toFormat("ooo") * 2;

module.exports = {
  name: "stats",
  description: "Shows user legend stats.",
  execute(message, args) {
    let platform = args[0];

    if (args[1]) {
      if (args[2]) {
        if (args[3]) {
          var player = `${args[1]}%20${args[2]}%20${args[3]}`;
        } else {
          var player = `${args[1]}%20${args[2]}`;
        }
      } else {
        var player = args[1];
      }
    }

    if (!args.length)
      // No args
      return message.channel.send(
        `To use this command, use the following format: \n\`${config.prefix}stats [platform] [username]\``
      );

    if (!platform || !player)
      // Arg 1 or 2 is missing
      return message.channel.send(
        `To use this command, use the following format:\n\`${config.prefix}stats [platform] [username]\``
      );

    if (platform && player) var platformUppercase = platform.toUpperCase();

    // Check is user uses PSN or PS5, XBOX or XBSX when checking stats
    if (
      platformUppercase == "PSN" ||
      platformUppercase == "PS5" ||
      platformUppercase == "PS"
    ) {
      var platformCheck = "PS4";
    } else if (platformUppercase == "XBOX" || platformUppercase == "XBSX") {
      var platformCheck = "X1";
    } else {
      var platformCheck = platformUppercase;
    }

    var plats = [
      // Current list of supported platforms
      "X1",
      "PS4",
      "PC",
    ];

    if (plats.indexOf(platformCheck) == -1)
      return message.channel.send(
        "Sorry, it looks like you didn't provide a valid platform.\nFor reference, PC = Origin/Steam, X1 = Xbox, and PS4 = Playstation Network."
      );

    function checkPlat(platform, username) {
      if (platform == "PC") {
        return username;
      } else {
        return "SDCore";
      }
    }

    function formatNumbers(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    rexxURL = `https://fn.alphaleagues.com/v1/apex/stats/?username=${checkPlat(
      platformCheck,
      player
    )}&platform=pc&auth=${config.ApexAPI}`;
    mainURL = `https://api.apexstats.dev/v5.php?platform=${platformCheck}&player=${player}`;

    var rexx = axios.get(rexxURL);
    var main = axios.get(mainURL);

    message.channel.send("Retrieving stats...").then(async (msg) => {
      axios
        .all([rexx, main])
        .then(
          axios.spread((...responses) => {
            // Response Data
            var rexxResponse = responses[0].data;
            var mainResponse = responses[1].data;

            // Season/Account Info
            var season = "8";
            var avatar = "https://cdn.apexstats.dev/Icon.png";
            var selectedLegend = mainResponse.legends.selected.LegendName;
            var currentRank = mainResponse.global.rank;
            var accountBP = mainResponse.global.battlepass.history.season8;
            var accountLevel = mainResponse.global.level;

            // Account Data
            var totalKills = formatNumbers(rexxResponse.player.stats.kills);
            var totalMatches = formatNumbers(rexxResponse.player.stats.matches);
            var KPM = rexxResponse.player.stats.kills_per_match;
            var totalWins = formatNumbers(rexxResponse.player.stats.wins.total);
            var winRatio = formatNumbers(
              rexxResponse.player.stats.wins["win%"]
            );
            var damageDealt = formatNumbers(
              rexxResponse.player.stats.damage.dealt
            );

            // Account Trackers
            var trackerOne = mainResponse.legends.selected.data[0];
            var trackerTwo = mainResponse.legends.selected.data[1];
            var trackerThree = mainResponse.legends.selected.data[2];

            function findLegendByID() {
              var getLegend = legends[mainResponse.legends.selected.LegendName];

              if (getLegend == "undefined" || getLegend == null) {
                return "NoBanner";
              } else {
                return getLegend;
              }
            }

            function getAccountLevel(level) {
              if (level >= 500) {
                return 500;
              } else {
                return level;
              }
            }

            function getAccountBP(BP) {
              if (BP != -1) {
                if (BP >= 110) {
                  return 110;
                } else {
                  return BP;
                }
              } else {
                return 0;
              }
            }

            function getRankBadge(rankName) {
              if (rankName == "Silver") {
                return "<:rankedSilver:787174770424021083>";
              } else if (rankName == "Gold") {
                return "<:rankedGold:787174769942462474>";
              } else if (rankName == "Platinum") {
                return "<:rankedPlatinum:787174770780667944>";
              } else if (rankName == "Diamond") {
                return "<:rankedDiamond:787174769728290816>";
              } else if (rankName == "Master") {
                return "<:rankedMaster:787174770680135680>";
              } else if (
                rankName == "Predator" ||
                rankName == "Apex Predator"
              ) {
                return "<:rankedPredator:787174770730336286>";
              } else {
                return "<:rankedBronze:787174769623302204>";
              }
            }

            function getTrackerTitle(id, legend) {
              if (id == "1905735931") {
                return "No data";
              } else {
                var trackerFile = require(`../GameData/TrackerData/${legend}.json`);

                if (trackerFile[id] == "undefined" || trackerFile[id] == null) {
                  return id;
                } else {
                  return trackerFile[id];
                }
              }
            }

            function getTrackerValue(id, value) {
              if (id == "1905735931") {
                return "-";
              } else {
                return value;
              }
            }

            // PC Embed
            const statsPC = new Discord.MessageEmbed()
              .setAuthor(
                `Legend Stats for ${
                  mainResponse.global.name
                } on ${platformUppercase} playing ${findLegendByID(
                  selectedLegend
                )}`,
                avatar
              )
              .setColor(colours[findLegendByID(selectedLegend)])
              .addField(
                "Ranked Placement",
                `**Rank:** ${getRankBadge(currentRank.rankName)} ${
                  currentRank.rankName
                } ${currentRank.rankDiv}\n**Score:** ${formatNumbers(
                  currentRank.rankScore
                )}`,
                true
              )
              .addField(
                `Account & Season ${season} BattlePass Level`,
                `**Account Level ${getAccountLevel(
                  accountLevel
                )}/500**\n${percentage(
                  500,
                  getAccountLevel(accountLevel),
                  10
                )}\n**BattlePass Level ${getAccountBP(
                  accountBP
                )}/110**\n${percentage(110, getAccountBP(accountBP), 10)}`,
                true
              )
              .addField("\u200b", "\u200b")
              .addField(
                "Account Kills",
                `**Total Kills:** ${totalKills}\n**Total Matches:** ${totalMatches}\n**Kills p/Match:** ${KPM}`,
                true
              )
              .addField(
                "Account Wins/Damage",
                `**Total Wins:** ${totalWins}\n**Win Rate:** ${winRatio}%\n**Damage Dealt:** ${damageDealt}`,
                true
              )
              .addField("Currently Equipped Trackers", "\u200b")
              .addField(
                `${getTrackerTitle(
                  trackerOne.id,
                  findLegendByID(selectedLegend)
                )}`,
                `${getTrackerValue(
                  trackerOne.id,
                  formatNumbers(trackerOne.value)
                )}`,
                true
              )
              .addField(
                `${getTrackerTitle(
                  trackerTwo.id,
                  findLegendByID(selectedLegend)
                )}`,
                `${getTrackerValue(
                  trackerTwo.id,
                  formatNumbers(trackerTwo.value)
                )}`,
                true
              )
              .addField(
                `${getTrackerTitle(
                  trackerThree.id,
                  findLegendByID(selectedLegend)
                )}`,
                `${getTrackerValue(
                  trackerThree.id,
                  formatNumbers(trackerThree.value)
                )}`,
                true
              )
              .setImage(
                `https://cdn.apexstats.dev/LegendBanners/${findLegendByID(
                  selectedLegend
                )}.png?q=${currentTimestamp}`
              )
              .setFooter(" Weird tracker name? Let SDCore#1234 know!");

            const statsConsole = new Discord.MessageEmbed()
              .setAuthor(
                `Legend Stats for ${
                  mainResponse.global.name
                } on ${platformUppercase} playing ${findLegendByID(
                  selectedLegend
                )}`,
                avatar
              )
              .setColor(colours[findLegendByID(selectedLegend)])
              .addField(
                "Ranked Placement",
                `**Rank:** ${getRankBadge(currentRank.rankName)} ${
                  currentRank.rankName
                } ${currentRank.rankDiv}\n**Score:** ${formatNumbers(
                  currentRank.rankScore
                )}`,
                true
              )
              .addField(
                `Account & Season ${season} BattlePass Level`,
                `**Account Level ${getAccountLevel(
                  accountLevel
                )}/500**\n${percentage(
                  500,
                  getAccountLevel(accountLevel),
                  10
                )}\n**BattlePass Level ${getAccountBP(
                  accountBP
                )}/110**\n${percentage(110, getAccountBP(accountBP), 10)}`,
                true
              )
              .addField("Currently Equipped Trackers", "\u200b")
              .addField(
                `${getTrackerTitle(
                  trackerOne.id,
                  findLegendByID(selectedLegend)
                )}`,
                `${getTrackerValue(
                  trackerOne.id,
                  formatNumbers(trackerOne.value)
                )}`,
                true
              )
              .addField(
                `${getTrackerTitle(
                  trackerTwo.id,
                  findLegendByID(selectedLegend)
                )}`,
                `${getTrackerValue(
                  trackerTwo.id,
                  formatNumbers(trackerTwo.value)
                )}`,
                true
              )
              .addField(
                `${getTrackerTitle(
                  trackerThree.id,
                  findLegendByID(selectedLegend)
                )}`,
                `${getTrackerValue(
                  trackerThree.id,
                  formatNumbers(trackerThree.value)
                )}`,
                true
              )
              .setImage(
                `https://cdn.apexstats.dev/LegendBanners/${findLegendByID(
                  selectedLegend
                )}.png?q=${currentTimestamp}`
              )
              .setFooter(" Weird tracker name? Let SDCore#1234 know!");

            if (platformUppercase == "PC") {
              msg.delete();
              msg.channel.send(statsPC);
            } else {
              msg.delete();
              msg.channel.send(statsConsole);
            }
          })
        )
        .catch((errors) => {
          console.log(`Error: ${errors}`);
          msg.delete();
          message.channel.send(
            "That player doesn't exist, we cannot connect to the API, or there was some other error. If the problem persists, please try again or contact support."
          );
        });
    });
  },
};
