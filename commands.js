/**
 * This is the file where the bot commands are located
 *
 * @license MIT license
 */
 
var http = require('http');
var sys = require('sys');
 
exports.commands = {
        /**
         * Help commands
         *
         * These commands are here to provide information about the bot.
         */
 
        about: function(arg, by, room, con) {
                if (this.hasRank(by, '#~') || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '/pm ' + by + ', ';
                }
                text += '**Pokémon Showdown Bot** coded by: Alliance Kimi and Subject Shanks';
                this.say(con, room, text);
        },
        help: 'guide',
        guide: function(arg, by, room, con) {
                if (this.hasRank(by, '+%@#~') || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '/pm ' + by + ', ';
                }
                if (config.botguide) {
                        text += 'A guide on how to use this bot can be found here: ' + config.botguide;
                } else {
                        text += 'There is no guide for this bot. PM the owner with any questions.';
                }
                this.say(con, room, text);
        },
 
        /**
         * Dev commands
         *
         * These commands are here for highly ranked users (or the creator) to use
         * to perform arbitrary actions that can't be done through any other commands
         * or to help with upkeep of the bot.
         */
 
        reload: function(arg, by, room, con) {
                if (!this.hasRank(by, '%#~')) return false;
                try {
                        this.uncacheTree('./commands.js');
                        Commands = require('./commands.js').commands;
                        this.say(con, room, 'Commands reloaded.');
                } catch (e) {
                        error('failed to reload: ' + sys.inspect(e));
                }
        },
        js: function(arg, by, room, con) {
                if (config.excepts.indexOf(toId(by)) === -1) return false;
                try {
                        var result = eval(arg.trim());
                        this.say(con, room, JSON.stringify(result));
                } catch (e) {
                        this.say(con, room, e.name + ": " + e.message);
                }
        },
 
        /**
         * Room Owner commands
         *
         * These commands allow room owners to personalise settings for moderation and command use.
         */
 
        settings: 'set',
        set: function(arg, by, room, con) {
                if (!this.hasRank(by, '+%@&#~') || room.charAt(0) === ',') return false;
 
                var settable = {
                        say: 1,
                        joke: 1,
                        choose: 1,
                        usagestats: 1,
                        helix: 1,
                        banword: 1
                };
                var modOpts = {
                        flooding: 1,
                        stretching: 1,
                        bannedwords: 1
                };
 
                var opts = arg.split(',');
                var cmd = toId(opts[0]);
                if (cmd === 'mod' || cmd === 'm' || cmd === 'modding') {
                        if (!opts[1] || !toId(opts[1]) || !(toId(opts[1]) in modOpts)) return this.say(con, room, 'Incorrect command: correct syntax is ' + config.commandcharacter + 'set mod, [' +
                                Object.keys(modOpts).join('/') + '](, [on/off])');
 
                        if (!this.settings['modding']) this.settings['modding'] = {};
                        if (!this.settings['modding'][room]) this.settings['modding'][room] = {};
                        if (opts[2] && toId(opts[2])) {
                                if (!this.hasRank(by, '#~')) return false;
                                if (!(toId(opts[2]) in {on: 1, off: 1}))  return this.say(con, room, 'Incorrect command: correct syntax is ' + config.commandcharacter + 'set mod, [' +
                                        Object.keys(modOpts).join('/') + '](, [on/off])');
                                if (toId(opts[2]) === 'off') {
                                        this.settings['modding'][room][toId(opts[1])] = 0;
                                } else {
                                        delete this.settings['modding'][room][toId(opts[1])];
                                }
                                this.writeSettings();
                                this.say(con, room, 'Moderation for ' + toId(opts[1]) + ' in this room is now ' + toId(opts[2]).toUpperCase() + '.');
                                return;
                        } else {
                                this.say(con, room, 'Moderation for ' + toId(opts[1]) + ' in this room is currently ' +
                                        (this.settings['modding'][room][toId(opts[1])] === 0 ? 'OFF' : 'ON') + '.');
                                return;
                        }
                } else {
                        if (!Commands[cmd]) return this.say(con, room, config.commandcharacter + '' + opts[0] + ' is not a valid command.');
                        var failsafe = 0;
                        while (!(cmd in settable)) {
                                if (typeof Commands[cmd] === 'string') {
                                        cmd = Commands[cmd];
                                } else if (typeof Commands[cmd] === 'function') {
                                        if (cmd in settable) {
                                                break;
                                        } else {
                                                this.say(con, room, 'The settings for ' + config.commandcharacter + '' + opts[0] + ' cannot be changed.');
                                                return;
                                        }
                                } else {
                                        this.say(con, room, 'Something went wrong. PM TalkTakesTime here or on Smogon with the command you tried.');
                                        return;
                                }
                                failsafe++;
                                if (failsafe > 5) {
                                        this.say(con, room, 'The command "' + config.commandcharacter + '' + opts[0] + '" could not be found.');
                                        return;
                                }
                        }
 
                        var settingsLevels = {
                                off: false,
                                disable: false,
                                '+': '+',
                                '%': '%',
                                '@': '@',
                                '&': '&',
                                '#': '#',
                                '~': '~',
                                on: true,
                                enable: true
                        };
                        if (!opts[1] || !opts[1].trim()) {
                                var msg = '';
                                if (!this.settings[cmd] || (!this.settings[cmd][room] && this.settings[cmd][room] !== false)) {
                                        msg = '.' + cmd + ' is available for users of rank ' + ((cmd === 'autoban' || cmd === 'banword') ? '#' : config.defaultrank) + ' and above.';
                                } else if (this.settings[cmd][room] in settingsLevels) {
                                        msg = '.' + cmd + ' is available for users of rank ' + this.settings[cmd][room] + ' and above.';
                                } else if (this.settings[cmd][room] === true) {
                                        msg = '.' + cmd + ' is available for all users in this room.';
                                } else if (this.settings[cmd][room] === false) {
                                        msg = '' + config.commandcharacter+''+ cmd + ' is not available for use in this room.';
                                }
                                this.say(con, room, msg);
                                return;
                        } else {
                                if (!this.hasRank(by, '#~')) return false;
                                var newRank = opts[1].trim();
                                if (!(newRank in settingsLevels)) return this.say(con, room, 'Unknown option: "' + newRank + '". Valid settings are: off/disable, +, %, @, &, #, ~, on/enable.');
                                if (!this.settings[cmd]) this.settings[cmd] = {};
                                this.settings[cmd][room] = settingsLevels[newRank];
                                this.writeSettings();
                                this.say(con, room, 'The command ' + config.commandcharacter + '' + cmd + ' is now ' +
                                        (settingsLevels[newRank] === newRank ? ' available for users of rank ' + newRank + ' and above.' :
                                        (this.settings[cmd][room] ? 'available for all users in this room.' : 'unavailable for use in this room.')))
                        }
                }
        },
        blacklist: 'autoban',
        ban: 'autoban',
        ab: 'autoban',
        autoban: function(arg, by, room, con) {
                if (!this.hasRank(by, '~#')) return false;
                if (!this.hasRank(this.ranks[room] || ' ', '@&#~')) return this.say(con, room, config.nick + ' requires rank of @ or higher to (un)blacklist.');
 
                arg = arg.split(',');
                var added = [];
                var illegalNick = [];
                var alreadyAdded = [];
                if (!arg.length || (arg.length === 1 && !arg[0].trim().length)) return this.say(con, room, 'You must specify at least one user to blacklist.');
                for (var i = 0; i < arg.length; i++) {
                        var tarUser = toId(arg[i]);
                        if (tarUser.length < 1 || tarUser.length > 18) {
                                illegalNick.push(tarUser);
                                continue;
                        }
                        if (!this.blacklistUser(tarUser, room)) {
                                alreadyAdded.push(tarUser);
                                continue;
                        }
                        this.say(con, room, '/ban ' + tarUser + ', Blacklisted user');
                        this.say(con,room, '/modnote ' + tarUser + ' was added to the blacklist by ' + by + '.');
                        added.push(tarUser);
                }
 
                var text = '';
                if (added.length) {
                        text += 'User(s) "' + added.join('", "') + '" added to blacklist successfully. ';
                        this.writeSettings();
                }
                if (alreadyAdded.length) text += 'User(s) "' + alreadyAdded.join('", "') + '" already present in blacklist. ';
                if (illegalNick.length) text += 'All ' + (text.length ? 'other ' : '') + 'users had illegal nicks and were not blacklisted.';
                this.say(con, room, text);
        },
        unblacklist: 'unautoban',
        unban: 'unautoban',
        unab: 'unautoban',
        unautoban: function(arg, by, room, con) {
                if (!this.hasRank(by, '#~')) return false;
                if (!this.hasRank(this.ranks[room] || ' ', '@&#~')) return this.say(con, room, config.nick + ' requires rank of @ or higher to (un)blacklist.');
 
                arg = arg.split(',');
                var removed = [];
                var notRemoved = [];
                if (!arg.length || (arg.length === 1 && !arg[0].trim().length)) return this.say(con, room, 'You must specify at least one user to unblacklist.');
                for (var i = 0; i < arg.length; i++) {
                        var tarUser = toId(arg[i]);
                        if (tarUser.length < 1 || tarUser.length > 18) {
                                notRemoved.push(tarUser);
                                continue;
                        }
                        if (!this.unblacklistUser(tarUser, room)) {
                                notRemoved.push(tarUser);
                                continue;
                        }
                        this.say(con, room, '/unban ' + tarUser);
                        removed.push(tarUser);
                }
 
                var text = '';
                if (removed.length) {
                        text += 'User(s) "' + removed.join('", "') + '" removed from blacklist successfully. ';
                        this.writeSettings();
                }
                if (notRemoved.length) text += (text.length ? 'No other ' : 'No ') + 'specified users were present in the blacklist.';
                this.say(con, room, text);
        },
        viewbans: 'viewblacklist',
        vab: 'viewblacklist',
        viewautobans: 'viewblacklist',
        viewblacklist: function(arg, by, room, con) {
                if (!this.hasRank(by, '#@~')) return false;
 
                var text = '';
                if (!this.settings.blacklist || !this.settings.blacklist[room]) {
                        text = 'No users are blacklisted in this room.';
                } else {
                        if (arg.length) {
                                var nick = toId(arg);
                                if (nick.length < 1 || nick.length > 18) {
                                        text = 'Invalid nickname: "' + nick + '".';
                                } else {
                                        text = 'User "' + nick + '" is currently ' + (nick in this.settings.blacklist[room] ? '' : 'not ') + 'blacklisted in ' + room + '.';
                                }
                        } else {
                                var nickList = Object.keys(this.settings.blacklist[room]);
                                if (!nickList.length) return this.say(con, room, '/pm ' + by + ', No users are blacklisted in this room.');
                                this.uploadToHastebin(con, room, by, 'The following users are banned in ' + room + ':\n\n' + nickList.join('\n'))
                                return;
                        }
                }
                this.say(con, room, '/pm ' + by + ', ' + text);
        },
        banphrase: 'banword',
        banword: function(arg, by, room, con) {
                if (!this.hasRank(by, '+#~')) return false;
                if (!this.settings.bannedphrases) this.settings.bannedphrases = {};
                arg = arg.trim().toLowerCase();
                if (!arg) return false;
                var tarRoom = room;
 
                if (room.charAt(0) === ',') {
                        if (!this.hasRank(by, '~')) return false;
                        tarRoom = 'global';
                }
 
                if (!this.settings.bannedphrases[tarRoom]) this.settings.bannedphrases[tarRoom] = {};
                if (arg in this.settings.bannedphrases[tarRoom]) return this.say(con, room, "Phrase \"" + arg + "\" is already banned.");
                this.settings.bannedphrases[tarRoom][arg] = 1;
                this.writeSettings();
                this.say(con, room, "Phrase \"" + arg + "\" is now banned.");
        },
        unbanphrase: 'unbanword',
        unbanword: function(arg, by, room, con) {
                if (!this.hasRank(by, '+#~')) return false;
                arg = arg.trim().toLowerCase();
                if (!arg) return false;
                var tarRoom = room;
 
                if (room.charAt(0) === ',') {
                        if (!this.hasRank(by, '~')) return false;
                        tarRoom = 'global';
                }
 
                if (!this.settings.bannedphrases || !this.settings.bannedphrases[tarRoom] || !(arg in this.settings.bannedphrases[tarRoom]))
                        return this.say(con, room, "Phrase \"" + arg + "\" is not currently banned.");
                delete this.settings.bannedphrases[tarRoom][arg];
                if (!Object.size(this.settings.bannedphrases[tarRoom])) delete this.settings.bannedphrases[tarRoom];
                if (!Object.size(this.settings.bannedphrases)) delete this.settings.bannedphrases;
                this.writeSettings();
                this.say(con, room, "Phrase \"" + arg + "\" is no longer banned.");
        },
        viewbannedphrases: 'viewbannedwords',
        vbw: 'viewbannedwords',
        viewbannedwords: function(arg, by, room, con) {
                if (!this.hasRank(by, '@#~')) return false;
                arg = arg.trim().toLowerCase();
                var tarRoom = room;
 
                if (room.charAt(0) === ',') {
                        if (!this.hasRank(by, '~')) return false;
                        tarRoom = 'global';
                }
 
                var text = "";
                if (!this.settings.bannedphrases || !this.settings.bannedphrases[tarRoom]) {
                        text = "No phrases are banned in this room.";
                } else {
                        if (arg.length) {
                                text = "The phrase \"" + arg + "\" is currently " + (arg in this.settings.bannedphrases[tarRoom] ? "" : "not ") + "banned " +
                                        (room.charAt(0) === ',' ? "globally" : "in " + room) + ".";
                        } else {
                                var banList = Object.keys(this.settings.bannedphrases[tarRoom]);
                                if (!banList.length) return this.say(con, room, "No phrases are banned in this room.");
                                this.uploadToHastebin(con, room, by, "The following phrases are banned " + (room.charAt(0) === ',' ? "globally" : "in " + room) + ":\n\n" + banList.join('\n'))
                                return;
                        }
                }
                this.say(con, room, text);
        },
	k: 'kick',
        kick: function(arg, by, room, con) {
                if (!this.canUse('kick', room, by)) return false;
                var victim = toId(stripCommands(arg));
 
                switch (victim) {
                        case 'sparkychild': this.say(room, 'Access denied :^)'); break;
                        case 'elfflopper': this.say(room, 'Access denied :^)'); break;
                        case 'charliechan': this.say(room, 'Access denied :^)'); break;
                        case 'trickster': this.say(room, 'Access denied :^)'); break;
                        case 'nineage': this.say(room, 'Access denied :^)'); break;
			case 'alliancekimi': this.say(room, 'Access denied :^)'); break;
                        case 'fender': this.say(room, 'Access denied :^)'); break;
                        case 'naten': this.say(room, 'I would if i could'); break;
                        default:
                                this.say(room, '/kick ' + victim + ', (◕‿◕✿)');
                                this.say(room, '/modnote ' + victim + ' was rk\'d by ' + by);
                                break;
                }
        },
        /**
         * General commands
         *
         * Add custom commands here.
         */
 
        tell: 'say',
        say: function(arg, by, room, con) {
                if (!this.canUse('say', room, by)) return false;
                this.say(con, room, stripCommands(arg));
	},
        joke: function(arg, by, room, con) {
                if (!this.canUse('joke', room, by) || room.charAt(0) === ',') return false;
                var self = this;
 
                var reqOpt = {
                        hostname: 'api.icndb.com',
                        path: '/jokes/random',
                        method: 'GET'
                };
                var req = http.request(reqOpt, function(res) {
                        res.on('data', function(chunk) {
                                try {
                                        var data = JSON.parse(chunk);
                                        self.say(con, room, data.value.joke.replace(/&quot;/g, "\""));
                                } catch (e) {
                                        self.say(con, room, 'Sorry, couldn\'t fetch a random joke... :(');
                                }
                        });
                });
                req.end();
        },
        choose: function(arg, by, room, con) {
                if (arg.indexOf(',') === -1) {
                        var choices = arg.split(' ');
                } else {
                        var choices = arg.split(',');
                }
                choices = choices.filter(function(i) {return (toId(i) !== '')});
                if (choices.length < 2) return this.say(con, room, (room.charAt(0) === ',' ? '': '/pm ' + by + ', ') + '.choose: You must give at least 2 valid choices.');
 
                var choice = choices[Math.floor(Math.random()*choices.length)];
                this.say(con, room, ((this.canUse('choose', room, by) || room.charAt(0) === ',') ? '':'/pm ' + by + ', ') + stripCommands(choice));
        },
        usage: 'usagestats',
        usagestats: function(arg, by, room, con) {
                if (this.canUse('usagestats', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '/pm ' + by + ', ';
                }
                text += 'http://www.smogon.com/stats/';
                this.say(con, room, text);
        },
        seen: function(arg, by, room, con) { // this command is still a bit buggy
                var text = (room.charAt(0) === ',' ? '' : '/pm ' + by + ', ');
                arg = toId(arg);
                if (!arg || arg.length > 18) return this.say(con, room, text + 'Invalid username.');
                if (arg === toId(by)) {
                        text += 'Have you looked in the mirror lately?';
                } else if (arg === toId(config.nick)) {
                        text += 'You might be either blind or illiterate. Might want to get that checked out.';
                } else if (!this.chatData[arg] || !this.chatData[arg].seenAt) {
                        text += 'The user ' + arg + ' has never been seen.';
                } else {
                        text += arg + ' was last seen ' + this.getTimeAgo(this.chatData[arg].seenAt) + ' ago' + (
                                this.chatData[arg].lastSeen ? ', ' + this.chatData[arg].lastSeen : '.');
                }
                this.say(con, room, text);
        },
        askbot: function(arg, by, room, con) {
                if (this.canUse('askbot', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '/pm ' + by + ', ';
                }
 
                var rand = ~~(23 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "Signs point to yes."; break;
                        case 2: text += "Yes."; break;
                        case 3: text += "Reply hazy, try again."; break;
                        case 4: text += "Without a doubt."; break;
                        case 5: text += "My sources say no."; break;
                        case 6: text += "As I see it, yes."; break;
                        case 7: text += "You may rely on it."; break;
                        case 8: text += "Concentrate and ask again."; break;
                        case 9: text += "Outlook not so good."; break;
                        case 10: text += "It is decidedly so."; break;
                        case 11: text += "Better not tell you now."; break;
                        case 12: text += "Very doubtful."; break;
                        case 13: text += "Yes - definitely."; break;
                        case 14: text += "It is certain."; break;
                        case 15: text += "Cannot predict now."; break;
                        case 16: text += "Most likely."; break;
                        case 17: text += "Ask again later."; break;
                        case 18: text += "My reply is no."; break;
                        case 19: text += "Outlook good."; break;
                        case 20: text += "Don't count on it."; break;
			case 21: text += "No nigga."; break;
			case 22: text += "Nah."; break;
			case 23: text += "I mean, I guess..."; break;
                }
                this.say(con, room, text);
        },
        randtype: function(arg, by, room, con) {
                if (this.canUse('randtype', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '/pm ' + by + ', ';
                }
 
                var rand = ~~(19 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "The Spheal Gods have deemed you to be: __Normal__"; break;
                        case 2: text += "The Spheal Gods have deemed you to be: __Fire__"; break;
                        case 3: text += "The Spheal Gods have deemed you to be: __Fighting__"; break;
                        case 4: text += "The Spheal Gods have deemed you to be: __Water__"; break;
                        case 5: text += "The Spheal Gods have deemed you to be: __Flying__"; break;
                        case 6: text += "The Spheal Gods have deemed you to be: __Grass__"; break;
                        case 7: text += "The Spheal Gods have deemed you to be: __Poison__"; break;
                        case 8: text += "The Spheal Gods have deemed you to be: __Electric__"; break;
                        case 9: text += "The Spheal Gods have deemed you to be: __Ground__"; break;
                        case 10: text += "The Spheal Gods have deemed you to be: __Psychic__"; break;
                        case 11: text += "The Spheal Gods have deemed you to be: __Rock__"; break;
                        case 12: text += "The Spheal Gods have deemed you to be: __Ice__"; break;
                        case 13: text += "The Spheal Gods have deemed you to be: __Bug__"; break;
                        case 14: text += "The Spheal Gods have deemed you to be: __Dragon__"; break;
                        case 15: text += "The Spheal Gods have deemed you to be: __Ghost__"; break;
                        case 16: text += "The Spheal Gods have deemed you to be: __Dark__"; break;
                        case 17: text += "The Spheal Gods have deemed you to be: __Steel__"; break;
                        case 18: text += "The Spheal Gods have deemed you to be: __Fairy__"; break;
                        case 19: text += "The Spheal Gods have deemed you to be: __Bird__. You're special!"; break;
                }
                this.say(con, room, text);
        },
        randmega: function(arg, by, room, con) {
                if (this.canUse('randmega', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '/pm ' + by + ', ';
                }
 
                var rand = ~~(50 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "!dt Abomasnow-Mega"; break;
                        case 2: text += "!dt Absol-Mega"; break;
                        case 3: text += "!dt Aerodactyl-Mega"; break;
                        case 4: text += "!dt Aggron-Mega"; break;
                        case 5: text += "!dt Alakazam-Mega"; break;
                        case 6: text += "!dt Altaria-Mega"; break;
                        case 7: text += "!dt Ampharos-Mega"; break;
                        case 8: text += "!dt Audino-Mega"; break;
                        case 9: text += "!dt Banette-Mega"; break;
                        case 10: text += "!dt Beedrill-Mega"; break;
                        case 11: text += "!dt Blastoise-Mega"; break;
                        case 12: text += "!dt Blaziken-Mega"; break;
                        case 13: text += "!dt Camerupt-Mega"; break;
                        case 14: text += "!dt Charizard-Mega-X"; break;
                        case 15: text += "!dt Charizard-Mega-Y"; break;
                        case 16: text += "!dt Diancie-Mega"; break;
                        case 17: text += "!dt Gallade-Mega"; break;
                        case 18: text += "!dt Garchomp-Mega"; break;
                        case 19: text += "!dt Gardevoir-Mega"; break;
                        case 20: text += "!dt Gengar-Mega"; break;
                        case 21: text += "!dt Glalie-Mega"; break;
                        case 22: text += "!dt Gyarados-Mega"; break;
                        case 23: text += "!dt Heracross-Mega"; break;
                        case 24: text += "!dt Houndoom-Mega"; break;
                        case 25: text += "!dt Kangaskhan-Mega"; break;
                        case 26: text += "!dt Latias-Mega"; break;
                        case 27: text += "!dt Latios-Mega"; break;
                        case 28: text += "!dt Lopunny-Mega"; break;
                        case 29: text += "!dt Lucario-Mega"; break;
                        case 30: text += "!dt Manectric-Mega"; break;
                        case 31: text += "!dt Mawile-Mega"; break;
                        case 32: text += "!dt Medicham-Mega"; break;
                        case 33: text += "!dt Metagross-Mega"; break;
                        case 34: text += "!dt Mewtwo-Mega-X"; break;
                        case 35: text += "!dt Mewtwo-Mega-Y"; break;
                        case 36: text += "!dt Pidgeot-Mega"; break;
                        case 37: text += "!dt Pinsir-Mega"; break;
                        case 38: text += "!dt Rayquaza-Mega"; break;
                        case 39: text += "!dt Sableye-Mega"; break;
                        case 40: text += "!dt Salamence-Mega"; break;
                        case 41: text += "!dt Sceptile-Mega"; break;
                        case 42: text += "!dt Scizor-Mega"; break;
                        case 43: text += "!dt Sharpedo-Mega"; break;
                        case 44: text += "!dt Slowbro-Mega"; break;
                        case 45: text += "!dt Steelix-Mega"; break;
                        case 46: text += "!dt Swampert-Mega"; break;
                        case 47: text += "!dt Tyranitar-Mega"; break;
                        case 48: text += "!dt venusaur-Mega"; break;
                        case 49: text += "!dt Kyogre-Primal"; break;
                        case 50: text += "!dt Groudon-Primal"; break;
                }
                this.say(con, room, text);
        },
spheal: function(arg, by, room, con) {
                if (this.canUse('spheal', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '/pm ' + by + ', ';
                }
 
                var rand = ~~(10 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "!pokemon Spheal"; break;
                        case 2: text += "I have sphealings for you."; break;
                        case 3: text += "Why is Mega Spheal still not a thing?"; break;
                        case 4: text += "Spheals are cute, like you."; break;
                        case 5: text += "I'm here to spheal your heart."; break;
                        case 6: text += "This Spheal Luvdisc's you very much."; break;
                        case 7: text += "I can't fight my sphealings for you."; break;
                        case 8: text += "You get the Spheal of approval."; break;
                        case 9: text += "SPHEAL SPHEAL SPHEAL SPHEAL SPHEAL"; break;
                        case 10: text += "/me rolls around like a Spheal."; break;
                }
                this.say(con, room, text);
        },
away: function(arg, by, room, con) {
                if (this.canUse('away', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '/pm ' + by + ', ';
                }
 
                var rand = ~~(6 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "/away fap"; break;
                        case 2: text += "/away rip"; break;
                        case 3: text += "/away ded"; break;
                        case 4: text += "/afk"; break;
                        case 5: text += "/away lel"; break;
			case 6: text += "/away zzz"; break;
                }
		this.say(con, room, text);
	},
back: function(arg, by, room, con) {
                if (this.canUse('back', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '/pm ' + by + ', ';
                }
 
                var rand = ~~(5 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "/back"; break;
                        case 2: text += "/back"; break;
                        case 3: text += "/back"; break;
                        case 4: text += "/back"; break;
                        case 5: text += "/back"; break;
                }
		this.say(con, room, text);
	},
seduce: function(arg, by, room, con) {
                if (this.canUse('seduce', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '/pm ' + by + ', ';
                }
 
                var rand = ~~(5 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "!showimage http://i.imgur.com/9bPFTVH.png, 300, 175"; break;
                        case 2: text += "!showimage http://i.imgur.com/9bPFTVH.png, 300, 175"; break;
                        case 3: text += "!showimage http://i.imgur.com/9bPFTVH.png, 300, 175"; break;
                        case 4: text += "!showimage http://i.imgur.com/9bPFTVH.png, 300, 175"; break;
                        case 5: text += "!showimage http://i.imgur.com/9bPFTVH.png, 300, 175"; break;
                }
		this.say(con, room, text);
	},
roll: function(arg, by, room, con) {
                if (this.canUse('roll', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '/pm ' + by + ', ';
                }
 
                var rand = ~~(5 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "!showimage http://i.imgur.com/UIHwZbm.gif, 300, 175"; break;
                        case 2: text += "!showimage http://i.imgur.com/UIHwZbm.gif, 300, 175"; break;
                        case 3: text += "!showimage http://i.imgur.com/UIHwZbm.gif, 300, 175"; break;
                        case 4: text += "!showimage http://i.imgur.com/UIHwZbm.gif, 300, 175"; break;
                        case 5: text += "!showimage http://i.imgur.com/UIHwZbm.gif, 300, 175"; break;
                }
		this.say(con, room, text);
	},
elf: function(arg, by, room, con) {
                if (this.canUse('elf', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '/pm ' + by + ', ';
                }
 
                var rand = ~~(6 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "Spy is really great and all but I'm still cooler. -Elf"; break;
                        case 2: text += "Did I ever tell you the story of when I flopped on an Azelf? -Elf"; break;
                        case 3: text += "I wish pokemon was real so I could catch a spheal and sweep everyone with it. -Elf"; break;
                        case 4: text += "Man I'm so awesome B) -Elf"; break;
                        case 5: text += "Ok stop rn ;/ -Elf"; break;
			case 6: text += "I am the hottest one out there, you'll melt just by looking at me. -Elf's Trainer Quote"; break;
                }
		this.say(con, room, text);
	},
	Kanto: 'kanto',
        kanto: function(arg, by, room, con) {
                if (this.canUse('kanto', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '';
                }
 
                var rand = ~~(151 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "!dt 1"; break;
                        case 2: text += "!dt 2"; break;
                        case 3: text += "!dt 3"; break;
                        case 4: text += "!dt 4"; break;
                        case 5: text += "!dt 5"; break;
                        case 6: text += "!dt 6"; break;
                        case 7: text += "!dt 7"; break;
                        case 8: text += "!dt 8"; break;
                        case 9: text += "!dt 9"; break;
                        case 10: text += "!dt 10"; break;
                        case 11: text += "!dt 11"; break;
                        case 12: text += "!dt 12"; break;
                        case 13: text += "!dt 13"; break;
                        case 14: text += "!dt 14"; break;
                        case 15: text += "!dt 15"; break;
                        case 16: text += "!dt 16"; break;
                        case 17: text += "!dt 17"; break;
                        case 18: text += "!dt 18"; break;
                        case 19: text += "!dt 19"; break;
                        case 20: text += "!dt 20"; break;
                        case 21: text += "!dt 21"; break;
                        case 22: text += "!dt 22"; break;
                        case 23: text += "!dt 23"; break;
                        case 24: text += "!dt 24"; break;
                        case 25: text += "!dt 25"; break;
                        case 26: text += "!dt 26"; break;
                        case 27: text += "!dt 27"; break;
                        case 28: text += "!dt 28"; break;
                        case 29: text += "!dt 29"; break;
                        case 30: text += "!dt 30"; break;
                        case 31: text += "!dt 31"; break;
                        case 32: text += "!dt 32"; break;
                        case 33: text += "!dt 33"; break;
                        case 34: text += "!dt 34"; break;
                        case 35: text += "!dt 35"; break;
                        case 36: text += "!dt 36"; break;
                        case 37: text += "!dt 37"; break;
                        case 38: text += "!dt 38"; break;
                        case 39: text += "!dt 39"; break;
                        case 40: text += "!dt 40"; break;
                        case 41: text += "!dt 41"; break;
                        case 42: text += "!dt 42"; break;
                        case 43: text += "!dt 43"; break;
                        case 44: text += "!dt 44"; break;
                        case 45: text += "!dt 45"; break;
                        case 46: text += "!dt 46"; break;
                        case 47: text += "!dt 47"; break;
                        case 48: text += "!dt 48"; break;
                        case 49: text += "!dt 49"; break;
                        case 50: text += "!dt 50"; break;
                        case 51: text += "!dt 51"; break;
                        case 52: text += "!dt 52"; break;
                        case 53: text += "!dt 53"; break;
                        case 54: text += "!dt 54"; break;
                        case 55: text += "!dt 55"; break;
                        case 56: text += "!dt 56"; break;
                        case 57: text += "!dt 57"; break;
                        case 58: text += "!dt 58"; break;
                        case 59: text += "!dt 59"; break;
                        case 60: text += "!dt 60"; break;
                        case 61: text += "!dt 61"; break;
                        case 62: text += "!dt 62"; break;
                        case 63: text += "!dt 63"; break;
                        case 64: text += "!dt 64"; break;
                        case 65: text += "!dt 65"; break;
                        case 66: text += "!dt 66"; break;
                        case 67: text += "!dt 67"; break;
                        case 68: text += "!dt 68"; break;
                        case 69: text += "!dt 69"; break;
                        case 70: text += "!dt 70"; break;
                        case 71: text += "!dt 71"; break;
                        case 72: text += "!dt 72"; break;
                        case 73: text += "!dt 73"; break;
                        case 74: text += "!dt 74"; break;
                        case 75: text += "!dt 75"; break;
                        case 76: text += "!dt 76"; break;
                        case 77: text += "!dt 77"; break;
                        case 78: text += "!dt 78"; break;
                        case 79: text += "!dt 79"; break;
                        case 80: text += "!dt 80"; break;
                        case 81: text += "!dt 81"; break;
                        case 82: text += "!dt 82"; break;
                        case 83: text += "!dt 83"; break;
                        case 84: text += "!dt 84"; break;
                        case 85: text += "!dt 85"; break;
                        case 86: text += "!dt 86"; break;
                        case 87: text += "!dt 87"; break;
                        case 88: text += "!dt 88"; break;
                        case 89: text += "!dt 89"; break;
                        case 90: text += "!dt 90"; break;
                        case 91: text += "!dt 91"; break;
                        case 92: text += "!dt 92"; break;
                        case 93: text += "!dt 93"; break;
                        case 94: text += "!dt 94"; break;
                        case 95: text += "!dt 95"; break;
                        case 96: text += "!dt 96"; break;
                        case 97: text += "!dt 97"; break;
                        case 98: text += "!dt 98"; break;
                        case 99: text += "!dt 99"; break;
                        case 100: text += "!dt 100"; break;
                        case 101: text += "!dt 101"; break;
                        case 102: text += "!dt 102"; break;
                        case 103: text += "!dt 103"; break;
                        case 104: text += "!dt 104"; break;
                        case 105: text += "!dt 105"; break;
                        case 106: text += "!dt 106"; break;
                        case 107: text += "!dt 107"; break;
                        case 108: text += "!dt 108"; break;
                        case 109: text += "!dt 109"; break;
                        case 110: text += "!dt 110"; break;
                        case 111: text += "!dt 111"; break;
                        case 112: text += "!dt 112"; break;
                        case 113: text += "!dt 113"; break;
                        case 114: text += "!dt 114"; break;
                        case 115: text += "!dt 115"; break;
                        case 116: text += "!dt 116"; break;
                        case 117: text += "!dt 117"; break;
                        case 118: text += "!dt 118"; break;
                        case 119: text += "!dt 119"; break;
                        case 120: text += "!dt 120"; break;
                        case 121: text += "!dt 121"; break;
                        case 122: text += "!dt 122"; break;
                        case 123: text += "!dt 123"; break;
                        case 124: text += "!dt 124"; break;
                        case 125: text += "!dt 125"; break;
                        case 126: text += "!dt 126"; break;
                        case 127: text += "!dt 127"; break;
                        case 128: text += "!dt 128"; break;
                        case 129: text += "!dt 129"; break;
                        case 130: text += "!dt 130"; break;
                        case 131: text += "!dt 131"; break;
                        case 132: text += "!dt 132"; break;
                        case 133: text += "!dt 133"; break;
                        case 134: text += "!dt 134"; break;
                        case 135: text += "!dt 135"; break;
                        case 136: text += "!dt 136"; break;
                        case 137: text += "!dt 137"; break;
                        case 138: text += "!dt 138"; break;
                        case 139: text += "!dt 139"; break;
                        case 140: text += "!dt 140"; break;
                        case 141: text += "!dt 141"; break;
                        case 142: text += "!dt 142"; break;
                        case 143: text += "!dt 143"; break;
                        case 144: text += "!dt 144"; break;
                        case 145: text += "!dt 145"; break;
                        case 146: text += "!dt 146"; break;
                        case 147: text += "!dt 147"; break;
                        case 148: text += "!dt 148"; break;
                        case 149: text += "!dt 149"; break;
                        case 150: text += "!dt 150"; break;
                        case 151: text += "!dt 151"; break;
                }
                this.say(con, room, text);
        },
 	Johto: 'johto',
        johto: function(arg, by, room, con) {
                if (this.canUse('kanto', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '';
                }
 
                var rand = ~~(100 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "!dt 152"; break;
                        case 2: text += "!dt 153"; break;
                        case 3: text += "!dt 154"; break;
                        case 4: text += "!dt 155"; break;
                        case 5: text += "!dt 156"; break;
                        case 6: text += "!dt 157"; break;
                        case 7: text += "!dt 158"; break;
                        case 8: text += "!dt 159"; break;
                        case 9: text += "!dt 160"; break;
                        case 10: text += "!dt 161"; break;
                        case 11: text += "!dt 162"; break;
                        case 12: text += "!dt 163"; break;
                        case 13: text += "!dt 164"; break;
                        case 14: text += "!dt 165"; break;
                        case 15: text += "!dt 166"; break;
                        case 16: text += "!dt 167"; break;
                        case 17: text += "!dt 168"; break;
                        case 18: text += "!dt 169"; break;
                        case 19: text += "!dt 170"; break;
                        case 20: text += "!dt 171"; break;
                        case 21: text += "!dt 172"; break;
                        case 22: text += "!dt 173"; break;
                        case 23: text += "!dt 174"; break;
                        case 24: text += "!dt 175"; break;
                        case 25: text += "!dt 176"; break;
                        case 26: text += "!dt 177"; break;
                        case 27: text += "!dt 178"; break;
                        case 28: text += "!dt 179"; break;
                        case 29: text += "!dt 180"; break;
                        case 30: text += "!dt 181"; break;
                        case 31: text += "!dt 182"; break;
                        case 32: text += "!dt 183"; break;
                        case 33: text += "!dt 184"; break;
                        case 34: text += "!dt 185"; break;
                        case 35: text += "!dt 186"; break;
                        case 36: text += "!dt 187"; break;
                        case 37: text += "!dt 188"; break;
                        case 38: text += "!dt 189"; break;
                        case 39: text += "!dt 190"; break;
                        case 40: text += "!dt 191"; break;
                        case 41: text += "!dt 192"; break;
                        case 42: text += "!dt 193"; break;
                        case 43: text += "!dt 194"; break;
                        case 44: text += "!dt 195"; break;
                        case 45: text += "!dt 196"; break;
                        case 46: text += "!dt 197"; break;
                        case 47: text += "!dt 198"; break;
                        case 48: text += "!dt 199"; break;
                        case 49: text += "!dt 200"; break;
                        case 50: text += "!dt 201"; break;
                        case 51: text += "!dt 202"; break;
                        case 52: text += "!dt 203"; break;
                        case 53: text += "!dt 204"; break;
                        case 54: text += "!dt 205"; break;
                        case 55: text += "!dt 206"; break;
                        case 56: text += "!dt 207"; break;
                        case 57: text += "!dt 208"; break;
                        case 58: text += "!dt 209"; break;
                        case 59: text += "!dt 210"; break;
                        case 60: text += "!dt 211"; break;
                        case 61: text += "!dt 212"; break;
                        case 62: text += "!dt 213"; break;
                        case 63: text += "!dt 214"; break;
                        case 64: text += "!dt 215"; break;
                        case 65: text += "!dt 216"; break;
                        case 66: text += "!dt 217"; break;
                        case 67: text += "!dt 218"; break;
                        case 68: text += "!dt 219"; break;
                        case 69: text += "!dt 220"; break;
                        case 70: text += "!dt 221"; break;
                        case 71: text += "!dt 222"; break;
                        case 72: text += "!dt 223"; break;
                        case 73: text += "!dt 224"; break;
                        case 74: text += "!dt 225"; break;
                        case 75: text += "!dt 226"; break;
                        case 76: text += "!dt 227"; break;
                        case 77: text += "!dt 228"; break;
                        case 78: text += "!dt 229"; break;
                        case 79: text += "!dt 230"; break;
                        case 80: text += "!dt 231"; break;
                        case 81: text += "!dt 232"; break;
                        case 82: text += "!dt 233"; break;
                        case 83: text += "!dt 234"; break;
                        case 84: text += "!dt 235"; break;
                        case 85: text += "!dt 236"; break;
                        case 86: text += "!dt 237"; break;
                        case 87: text += "!dt 238"; break;
                        case 88: text += "!dt 239"; break;
                        case 89: text += "!dt 240"; break;
                        case 90: text += "!dt 241"; break;
                        case 91: text += "!dt 242"; break;
                        case 92: text += "!dt 243"; break;
                        case 93: text += "!dt 244"; break;
                        case 94: text += "!dt 245"; break;
                        case 95: text += "!dt 246"; break;
                        case 96: text += "!dt 247"; break;
                        case 97: text += "!dt 248"; break;
                        case 98: text += "!dt 249"; break;
                        case 99: text += "!dt 250"; break;
                        case 100: text += "!dt 251"; break;
                }
                this.say(con, room, text);
        },
 	Hoenn: 'hoenn',
        hoenn: function(arg, by, room, con) {
                if (this.canUse('hoenn', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '';
                }
 
                var rand = ~~(135 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "!dt 252"; break;
                        case 2: text += "!dt 253"; break;
                        case 3: text += "!dt 254"; break;
                        case 4: text += "!dt 255"; break;
                        case 5: text += "!dt 256"; break;
                        case 6: text += "!dt 257"; break;
                        case 7: text += "!dt 258"; break;
                        case 8: text += "!dt 259"; break;
                        case 9: text += "!dt 260"; break;
                        case 10: text += "!dt 261"; break;
                        case 11: text += "!dt 262"; break;
                        case 12: text += "!dt 263"; break;
                        case 13: text += "!dt 264"; break;
                        case 14: text += "!dt 265"; break;
                        case 15: text += "!dt 266"; break;
                        case 16: text += "!dt 267"; break;
                        case 17: text += "!dt 268"; break;
                        case 18: text += "!dt 269"; break;
                        case 19: text += "!dt 270"; break;
                        case 20: text += "!dt 271"; break;
                        case 21: text += "!dt 272"; break;
                        case 22: text += "!dt 273"; break;
                        case 23: text += "!dt 274"; break;
                        case 24: text += "!dt 275"; break;
                        case 25: text += "!dt 276"; break;
                        case 26: text += "!dt 277"; break;
                        case 27: text += "!dt 278"; break;
                        case 28: text += "!dt 279"; break;
                        case 29: text += "!dt 280"; break;
                        case 30: text += "!dt 281"; break;
                        case 31: text += "!dt 282"; break;
                        case 32: text += "!dt 283"; break;
                        case 33: text += "!dt 284"; break;
                        case 34: text += "!dt 285"; break;
                        case 35: text += "!dt 286"; break;
                        case 36: text += "!dt 287"; break;
                        case 37: text += "!dt 288"; break;
                        case 38: text += "!dt 289"; break;
                        case 39: text += "!dt 290"; break;
                        case 40: text += "!dt 291"; break;
                        case 41: text += "!dt 292"; break;
                        case 42: text += "!dt 293"; break;
                        case 43: text += "!dt 294"; break;
                        case 44: text += "!dt 295"; break;
                        case 45: text += "!dt 296"; break;
                        case 46: text += "!dt 297"; break;
                        case 47: text += "!dt 298"; break;
                        case 48: text += "!dt 299"; break;
                        case 49: text += "!dt 300"; break;
                        case 50: text += "!dt 301"; break;
                        case 51: text += "!dt 302"; break;
                        case 52: text += "!dt 303"; break;
                        case 53: text += "!dt 304"; break;
                        case 54: text += "!dt 305"; break;
                        case 55: text += "!dt 306"; break;
                        case 56: text += "!dt 307"; break;
                        case 57: text += "!dt 308"; break;
                        case 58: text += "!dt 309"; break;
                        case 59: text += "!dt 310"; break;
                        case 60: text += "!dt 311"; break;
                        case 61: text += "!dt 312"; break;
                        case 62: text += "!dt 313"; break;
                        case 63: text += "!dt 314"; break;
                        case 64: text += "!dt 315"; break;
                        case 65: text += "!dt 316"; break;
                        case 66: text += "!dt 317"; break;
                        case 67: text += "!dt 318"; break;
                        case 68: text += "!dt 319"; break;
                        case 69: text += "!dt 320"; break;
                        case 70: text += "!dt 321"; break;
                        case 71: text += "!dt 322"; break;
                        case 72: text += "!dt 323"; break;
                        case 73: text += "!dt 324"; break;
                        case 74: text += "!dt 325"; break;
                        case 75: text += "!dt 326"; break;
                        case 76: text += "!dt 327"; break;
                        case 77: text += "!dt 328"; break;
                        case 78: text += "!dt 329"; break;
                        case 79: text += "!dt 330"; break;
                        case 80: text += "!dt 331"; break;
                        case 81: text += "!dt 332"; break;
                        case 82: text += "!dt 333"; break;
                        case 83: text += "!dt 334"; break;
                        case 84: text += "!dt 335"; break;
                        case 85: text += "!dt 336"; break;
                        case 86: text += "!dt 337"; break;
                        case 87: text += "!dt 338"; break;
                        case 88: text += "!dt 339"; break;
                        case 89: text += "!dt 340"; break;
                        case 90: text += "!dt 341"; break;
                        case 91: text += "!dt 342"; break;
                        case 92: text += "!dt 343"; break;
                        case 93: text += "!dt 344"; break;
                        case 94: text += "!dt 345"; break;
                        case 95: text += "!dt 346"; break;
                        case 96: text += "!dt 347"; break;
                        case 97: text += "!dt 348"; break;
                        case 98: text += "!dt 349"; break;
                        case 99: text += "!dt 350"; break;
                        case 100: text += "!dt 351"; break;
                        case 101: text += "!dt 352"; break;
                        case 102: text += "!dt 353"; break;
                        case 103: text += "!dt 354"; break;
                        case 104: text += "!dt 355"; break;
                        case 105: text += "!dt 356"; break;
                        case 106: text += "!dt 357"; break;
                        case 107: text += "!dt 358"; break;
                        case 108: text += "!dt 359"; break;
                        case 109: text += "!dt 360"; break;
                        case 110: text += "!dt 361"; break;
                        case 111: text += "!dt 362"; break;
                        case 112: text += "!dt 363"; break;
                        case 113: text += "!dt 364"; break;
                        case 114: text += "!dt 365"; break;
                        case 115: text += "!dt 366"; break;
                        case 116: text += "!dt 367"; break;
                        case 117: text += "!dt 368"; break;
                        case 118: text += "!dt 369"; break;
                        case 119: text += "!dt 370"; break;
                        case 120: text += "!dt 371"; break;
                        case 121: text += "!dt 372"; break;
                        case 122: text += "!dt 373"; break;
                        case 123: text += "!dt 374"; break;
                        case 124: text += "!dt 375"; break;
                        case 125: text += "!dt 376"; break;
                        case 126: text += "!dt 377"; break;
                        case 127: text += "!dt 378"; break;
                        case 128: text += "!dt 379"; break;
                        case 129: text += "!dt 380"; break;
                        case 130: text += "!dt 381"; break;
                        case 131: text += "!dt 382"; break;
                        case 132: text += "!dt 383"; break;
                        case 133: text += "!dt 384"; break;
                        case 134: text += "!dt 385"; break;
                        case 135: text += "!dt 386"; break;
                }
                this.say(con, room, text);
        },
 	Sinnoh: 'sinnoh',
        sinnoh: function(arg, by, room, con) {
                if (this.canUse('sinnoh', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '';
                }
 
                var rand = ~~(107 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "!dt 387"; break;
                        case 2: text += "!dt 388"; break;
                        case 3: text += "!dt 389"; break;
                        case 4: text += "!dt 390"; break;
                        case 5: text += "!dt 391"; break;
                        case 6: text += "!dt 392"; break;
                        case 7: text += "!dt 393"; break;
                        case 8: text += "!dt 394"; break;
                        case 9: text += "!dt 395"; break;
                        case 10: text += "!dt 396"; break;
                        case 11: text += "!dt 397"; break;
                        case 12: text += "!dt 398"; break;
                        case 13: text += "!dt 399"; break;
                        case 14: text += "!dt 400"; break;
                        case 15: text += "!dt 401"; break;
                        case 16: text += "!dt 402"; break;
                        case 17: text += "!dt 403"; break;
                        case 18: text += "!dt 404"; break;
                        case 19: text += "!dt 405"; break;
                        case 20: text += "!dt 406"; break;
                        case 21: text += "!dt 407"; break;
                        case 22: text += "!dt 408"; break;
                        case 23: text += "!dt 409"; break;
                        case 24: text += "!dt 410"; break;
                        case 25: text += "!dt 411"; break;
                        case 26: text += "!dt 412"; break;
                        case 27: text += "!dt 413"; break;
                        case 28: text += "!dt 414"; break;
                        case 29: text += "!dt 415"; break;
                        case 30: text += "!dt 416"; break;
                        case 31: text += "!dt 417"; break;
                        case 32: text += "!dt 418"; break;
                        case 33: text += "!dt 419"; break;
                        case 34: text += "!dt 420"; break;
                        case 35: text += "!dt 421"; break;
                        case 36: text += "!dt 422"; break;
                        case 37: text += "!dt 423"; break;
                        case 38: text += "!dt 424"; break;
                        case 39: text += "!dt 425"; break;
                        case 40: text += "!dt 426"; break;
                        case 41: text += "!dt 427"; break;
                        case 42: text += "!dt 428"; break;
                        case 43: text += "!dt 429"; break;
                        case 44: text += "!dt 430"; break;
                        case 45: text += "!dt 431"; break;
                        case 46: text += "!dt 432"; break;
                        case 47: text += "!dt 433"; break;
                        case 48: text += "!dt 434"; break;
                        case 49: text += "!dt 435"; break;
                        case 50: text += "!dt 436"; break;
                        case 51: text += "!dt 437"; break;
                        case 52: text += "!dt 438"; break;
                        case 53: text += "!dt 439"; break;
                        case 54: text += "!dt 440"; break;
                        case 55: text += "!dt 441"; break;
                        case 56: text += "!dt 442"; break;
                        case 57: text += "!dt 443"; break;
                        case 58: text += "!dt 444"; break;
                        case 59: text += "!dt 445"; break;
                        case 60: text += "!dt 446"; break;
                        case 61: text += "!dt 447"; break;
                        case 62: text += "!dt 448"; break;
                        case 63: text += "!dt 449"; break;
                        case 64: text += "!dt 450"; break;
                        case 65: text += "!dt 451"; break;
                        case 66: text += "!dt 452"; break;
                        case 67: text += "!dt 453"; break;
                        case 68: text += "!dt 454"; break;
                        case 69: text += "!dt 455"; break;
                        case 70: text += "!dt 456"; break;
                        case 71: text += "!dt 457"; break;
                        case 72: text += "!dt 458"; break;
                        case 73: text += "!dt 459"; break;
                        case 74: text += "!dt 460"; break;
                        case 75: text += "!dt 461"; break;
                        case 76: text += "!dt 462"; break;
                        case 77: text += "!dt 463"; break;
                        case 78: text += "!dt 464"; break;
                        case 79: text += "!dt 465"; break;
                        case 80: text += "!dt 466"; break;
                        case 81: text += "!dt 467"; break;
                        case 82: text += "!dt 468"; break;
                        case 83: text += "!dt 469"; break;
                        case 84: text += "!dt 470"; break;
                        case 85: text += "!dt 471"; break;
                        case 86: text += "!dt 472"; break;
                        case 87: text += "!dt 473"; break;
                        case 88: text += "!dt 474"; break;
                        case 89: text += "!dt 475"; break;
                        case 90: text += "!dt 476"; break;
                        case 91: text += "!dt 477"; break;
                        case 92: text += "!dt 478"; break;
                        case 93: text += "!dt 479"; break;
                        case 94: text += "!dt 480"; break;
                        case 95: text += "!dt 481"; break;
                        case 96: text += "!dt 482"; break;
                        case 97: text += "!dt 483"; break;
                        case 98: text += "!dt 484"; break;
                        case 99: text += "!dt 485"; break;
                        case 100: text += "!dt 486"; break;
                        case 101: text += "!dt 487"; break;
                        case 102: text += "!dt 488"; break;
                        case 103: text += "!dt 489"; break;
                        case 104: text += "!dt 490"; break;
                        case 105: text += "!dt 491"; break;
                        case 106: text += "!dt 492"; break;
                        case 107: text += "!dt 493"; break;
                }
                this.say(con, room, text);
        },
 	Unova: 'unova',
        unova: function(arg, by, room, con) {
                if (this.canUse('unova', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '';
                }
 
                var rand = ~~(156 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "!dt 494"; break;
                        case 2: text += "!dt 495"; break;
                        case 3: text += "!dt 496"; break;
                        case 4: text += "!dt 497"; break;
                        case 5: text += "!dt 498"; break;
                        case 6: text += "!dt 499"; break;
                        case 7: text += "!dt 500"; break;
                        case 8: text += "!dt 501"; break;
                        case 9: text += "!dt 502"; break;
                        case 10: text += "!dt 503"; break;
                        case 11: text += "!dt 504"; break;
                        case 12: text += "!dt 505"; break;
                        case 13: text += "!dt 506"; break;
                        case 14: text += "!dt 507"; break;
                        case 15: text += "!dt 508"; break;
                        case 16: text += "!dt 509"; break;
                        case 17: text += "!dt 510"; break;
                        case 18: text += "!dt 511"; break;
                        case 19: text += "!dt 512"; break;
                        case 20: text += "!dt 513"; break;
                        case 21: text += "!dt 514"; break;
                        case 22: text += "!dt 515"; break;
                        case 23: text += "!dt 516"; break;
                        case 24: text += "!dt 517"; break;
                        case 25: text += "!dt 518"; break;
                        case 26: text += "!dt 519"; break;
                        case 27: text += "!dt 520"; break;
                        case 28: text += "!dt 521"; break;
                        case 29: text += "!dt 522"; break;
                        case 30: text += "!dt 523"; break;
                        case 31: text += "!dt 524"; break;
                        case 32: text += "!dt 525"; break;
                        case 33: text += "!dt 526"; break;
                        case 34: text += "!dt 527"; break;
                        case 35: text += "!dt 528"; break;
                        case 36: text += "!dt 529"; break;
                        case 37: text += "!dt 530"; break;
                        case 38: text += "!dt 531"; break;
                        case 39: text += "!dt 532"; break;
                        case 40: text += "!dt 533"; break;
                        case 41: text += "!dt 534"; break;
                        case 42: text += "!dt 535"; break;
                        case 43: text += "!dt 536"; break;
                        case 44: text += "!dt 537"; break;
                        case 45: text += "!dt 538"; break;
                        case 46: text += "!dt 539"; break;
                        case 47: text += "!dt 540"; break;
                        case 48: text += "!dt 541"; break;
                        case 49: text += "!dt 542"; break;
                        case 50: text += "!dt 543"; break;
                        case 51: text += "!dt 544"; break;
                        case 52: text += "!dt 545"; break;
                        case 53: text += "!dt 546"; break;
                        case 54: text += "!dt 547"; break;
                        case 55: text += "!dt 548"; break;
                        case 56: text += "!dt 549"; break;
                        case 57: text += "!dt 550"; break;
                        case 58: text += "!dt 551"; break;
                        case 59: text += "!dt 552"; break;
                        case 60: text += "!dt 553"; break;
                        case 61: text += "!dt 554"; break;
                        case 62: text += "!dt 555"; break;
                        case 63: text += "!dt 556"; break;
                        case 64: text += "!dt 557"; break;
                        case 65: text += "!dt 558"; break;
                        case 66: text += "!dt 559"; break;
                        case 67: text += "!dt 560"; break;
                        case 68: text += "!dt 561"; break;
                        case 69: text += "!dt 562"; break;
                        case 70: text += "!dt 563"; break;
                        case 71: text += "!dt 564"; break;
                        case 72: text += "!dt 565"; break;
                        case 73: text += "!dt 566"; break;
                        case 74: text += "!dt 567"; break;
                        case 75: text += "!dt 568"; break;
                        case 76: text += "!dt 569"; break;
                        case 77: text += "!dt 570"; break;
                        case 78: text += "!dt 571"; break;
                        case 79: text += "!dt 572"; break;
                        case 80: text += "!dt 573"; break;
                        case 81: text += "!dt 574"; break;
                        case 82: text += "!dt 575"; break;
                        case 83: text += "!dt 576"; break;
                        case 84: text += "!dt 577"; break;
                        case 85: text += "!dt 578"; break;
                        case 86: text += "!dt 579"; break;
                        case 87: text += "!dt 580"; break;
                        case 88: text += "!dt 581"; break;
                        case 89: text += "!dt 582"; break;
                        case 90: text += "!dt 583"; break;
                        case 91: text += "!dt 584"; break;
                        case 92: text += "!dt 585"; break;
                        case 93: text += "!dt 586"; break;
                        case 94: text += "!dt 587"; break;
                        case 95: text += "!dt 588"; break;
                        case 96: text += "!dt 589"; break;
                        case 97: text += "!dt 590"; break;
                        case 98: text += "!dt 591"; break;
                        case 99: text += "!dt 592"; break;
                        case 100: text += "!dt 593"; break;
                        case 101: text += "!dt 594"; break;
                        case 102: text += "!dt 595"; break;
                        case 103: text += "!dt 596"; break;
                        case 104: text += "!dt 597"; break;
                        case 105: text += "!dt 598"; break;
                        case 106: text += "!dt 599"; break;
                        case 107: text += "!dt 600"; break;
                        case 108: text += "!dt 601"; break;
                        case 109: text += "!dt 602"; break;
                        case 110: text += "!dt 603"; break;
                        case 111: text += "!dt 604"; break;
                        case 112: text += "!dt 605"; break;
                        case 113: text += "!dt 606"; break;
                        case 114: text += "!dt 607"; break;
                        case 115: text += "!dt 608"; break;
                        case 116: text += "!dt 609"; break;
                        case 117: text += "!dt 610"; break;
                        case 118: text += "!dt 611"; break;
                        case 119: text += "!dt 612"; break;
                        case 120: text += "!dt 613"; break;
                        case 121: text += "!dt 614"; break;
                        case 122: text += "!dt 615"; break;
                        case 123: text += "!dt 616"; break;
                        case 124: text += "!dt 617"; break;
                        case 125: text += "!dt 618"; break;
                        case 126: text += "!dt 619"; break;
                        case 127: text += "!dt 620"; break;
                        case 128: text += "!dt 621"; break;
                        case 129: text += "!dt 622"; break;
                        case 130: text += "!dt 623"; break;
                        case 131: text += "!dt 624"; break;
                        case 132: text += "!dt 625"; break;
                        case 133: text += "!dt 626"; break;
                        case 134: text += "!dt 627"; break;
                        case 135: text += "!dt 628"; break;
                        case 136: text += "!dt 629"; break;
                        case 137: text += "!dt 630"; break;
                        case 138: text += "!dt 631"; break;
                        case 139: text += "!dt 632"; break;
                        case 140: text += "!dt 633"; break;
                        case 141: text += "!dt 634"; break;
                        case 142: text += "!dt 635"; break;
                        case 143: text += "!dt 636"; break;
                        case 144: text += "!dt 637"; break;
                        case 145: text += "!dt 638"; break;
                        case 146: text += "!dt 639"; break;
                        case 147: text += "!dt 640"; break;
                        case 148: text += "!dt 641"; break;
                        case 149: text += "!dt 642"; break;
                        case 150: text += "!dt 643"; break;
                        case 151: text += "!dt 644"; break;
                        case 152: text += "!dt 645"; break;
                        case 153: text += "!dt 646"; break;
                        case 154: text += "!dt 647"; break;
                        case 155: text += "!dt 648"; break;
                        case 156: text += "!dt 649"; break;
                }
                this.say(con, room, text);
        },
	Kalos: 'kalos',
        kalos: function(arg, by, room, con) {
                if (this.canUse('kalos', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '';
                }
 
                var rand = ~~(72 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "!dt 650"; break;
                        case 2: text += "!dt 651"; break;
                        case 3: text += "!dt 652"; break;
                        case 4: text += "!dt 653"; break;
                        case 5: text += "!dt 654"; break;
                        case 6: text += "!dt 655"; break;
                        case 7: text += "!dt 656"; break;
                        case 8: text += "!dt 657"; break;
                        case 9: text += "!dt 658"; break;
                        case 10: text += "!dt 659"; break;
                        case 11: text += "!dt 660"; break;
                        case 12: text += "!dt 661"; break;
                        case 13: text += "!dt 662"; break;
                        case 14: text += "!dt 663"; break;
                        case 15: text += "!dt 664"; break;
                        case 16: text += "!dt 665"; break;
                        case 17: text += "!dt 666"; break;
                        case 18: text += "!dt 667"; break;
                        case 19: text += "!dt 668"; break;
                        case 20: text += "!dt 669"; break;
                        case 21: text += "!dt 670"; break;
                        case 22: text += "!dt 671"; break;
                        case 23: text += "!dt 672"; break;
                        case 24: text += "!dt 673"; break;
                        case 25: text += "!dt 674"; break;
                        case 26: text += "!dt 675"; break;
                        case 27: text += "!dt 676"; break;
                        case 28: text += "!dt 677"; break;
                        case 29: text += "!dt 678"; break;
                        case 30: text += "!dt 679"; break;
                        case 31: text += "!dt 680"; break;
                        case 32: text += "!dt 681"; break;
                        case 33: text += "!dt 682"; break;
                        case 34: text += "!dt 683"; break;
                        case 35: text += "!dt 684"; break;
                        case 36: text += "!dt 685"; break;
                        case 37: text += "!dt 686"; break;
                        case 38: text += "!dt 687"; break;
                        case 39: text += "!dt 688"; break;
                        case 40: text += "!dt 689"; break;
                        case 41: text += "!dt 690"; break;
                        case 42: text += "!dt 691"; break;
                        case 43: text += "!dt 692"; break;
                        case 44: text += "!dt 693"; break;
                        case 45: text += "!dt 694"; break;
                        case 46: text += "!dt 695"; break;
                        case 47: text += "!dt 696"; break;
                        case 48: text += "!dt 697"; break;
                        case 49: text += "!dt 698"; break;
                        case 50: text += "!dt 699"; break;
                        case 51: text += "!dt 700"; break;
                        case 52: text += "!dt 701"; break;
                        case 53: text += "!dt 702"; break;
                        case 54: text += "!dt 703"; break;
                        case 55: text += "!dt 704"; break;
                        case 56: text += "!dt 705"; break;
                        case 57: text += "!dt 706"; break;
                        case 58: text += "!dt 707"; break;
                        case 59: text += "!dt 708"; break;
                        case 60: text += "!dt 709"; break;
                        case 61: text += "!dt 710"; break;
                        case 62: text += "!dt 711"; break;
                        case 63: text += "!dt 712"; break;
                        case 64: text += "!dt 713"; break;
                        case 65: text += "!dt 714"; break;
                        case 66: text += "!dt 715"; break;
                        case 67: text += "!dt 716"; break;
                        case 68: text += "!dt 717"; break;
                        case 69: text += "!dt 718"; break;
                        case 70: text += "!dt 719"; break;
                        case 71: text += "!dt 720"; break;
                }
                this.say(con, room, text);
        },
        rko: function(arg, by, room, con) {
                if (this.canUse('rko', room, by) || room.charAt(0) === ',') {
                var user = toId(stripCommands(arg));
 
		} else {
		var text = 'You cant do this! Its mean! D:';
		}

                switch (user) {
                        case 'sparkychild': this.say(room, 'Access denied :^)'); break;
                        case 'elfflopper': this.say(room, 'Access denied :^)'); break;
                        case 'charliechan': this.say(room, 'Access denied :^)'); break;
                        case 'trickster': this.say(room, 'Access denied :^)'); break;
                        case 'nineage': this.say(room, 'Access denied :^)'); break;
			case 'alliancekimi': this.say(room, 'I cant attack my owner. D:'); break;
                        case 'fender': this.say(room, 'Access denied :^)'); break;
                        case 'naten': this.say(room, 'I would if i could'); break;
                        default:
                                this.say(room, '/kick ' + user + '');
				this.say(room, '＼(^▽^✿)ノ');
                                this.say(room, '/modnote ' + user + ' was kicked by ' + by);
                                break;
                }
        },
	Randpoke: 'randpoke',
        randpoke: function(arg, by, room, con) {
                if (this.canUse('randpoke', room, by) || room.charAt(0) === ',') {
                        var text = '';
                } else {
                        var text = '';
                }
 
                var rand = ~~(721 * Math.random()) + 1;
 
                switch (rand) {
                        case 1: text += "!dt 1"; break;
                        case 2: text += "!dt 2"; break;
                        case 3: text += "!dt 3"; break;
                        case 4: text += "!dt 4"; break;
                        case 5: text += "!dt 5"; break;
                        case 6: text += "!dt 6"; break;
                        case 7: text += "!dt 7"; break;
                        case 8: text += "!dt 8"; break;
                        case 9: text += "!dt 9"; break;
                        case 10: text += "!dt 10"; break;
                        case 11: text += "!dt 11"; break;
                        case 12: text += "!dt 12"; break;
                        case 13: text += "!dt 13"; break;
                        case 14: text += "!dt 14"; break;
                        case 15: text += "!dt 15"; break;
                        case 16: text += "!dt 16"; break;
                        case 17: text += "!dt 17"; break;
                        case 18: text += "!dt 18"; break;
                        case 19: text += "!dt 19"; break;
                        case 20: text += "!dt 20"; break;
                        case 21: text += "!dt 21"; break;
                        case 22: text += "!dt 22"; break;
                        case 23: text += "!dt 23"; break;
                        case 24: text += "!dt 24"; break;
                        case 25: text += "!dt 25"; break;
                        case 26: text += "!dt 26"; break;
                        case 27: text += "!dt 27"; break;
                        case 28: text += "!dt 28"; break;
                        case 29: text += "!dt 29"; break;
                        case 30: text += "!dt 30"; break;
                        case 31: text += "!dt 31"; break;
                        case 32: text += "!dt 32"; break;
                        case 33: text += "!dt 33"; break;
                        case 34: text += "!dt 34"; break;
                        case 35: text += "!dt 35"; break;
                        case 36: text += "!dt 36"; break;
                        case 37: text += "!dt 37"; break;
                        case 38: text += "!dt 38"; break;
                        case 39: text += "!dt 39"; break;
                        case 40: text += "!dt 40"; break;
                        case 41: text += "!dt 41"; break;
                        case 42: text += "!dt 42"; break;
                        case 43: text += "!dt 43"; break;
                        case 44: text += "!dt 44"; break;
                        case 45: text += "!dt 45"; break;
                        case 46: text += "!dt 46"; break;
                        case 47: text += "!dt 47"; break;
                        case 48: text += "!dt 48"; break;
                        case 49: text += "!dt 49"; break;
                        case 50: text += "!dt 50"; break;
                        case 51: text += "!dt 51"; break;
                        case 52: text += "!dt 52"; break;
                        case 53: text += "!dt 53"; break;
                        case 54: text += "!dt 54"; break;
                        case 55: text += "!dt 55"; break;
                        case 56: text += "!dt 56"; break;
                        case 57: text += "!dt 57"; break;
                        case 58: text += "!dt 58"; break;
                        case 59: text += "!dt 59"; break;
                        case 60: text += "!dt 60"; break;
                        case 61: text += "!dt 61"; break;
                        case 62: text += "!dt 62"; break;
                        case 63: text += "!dt 63"; break;
                        case 64: text += "!dt 64"; break;
                        case 65: text += "!dt 65"; break;
                        case 66: text += "!dt 66"; break;
                        case 67: text += "!dt 67"; break;
                        case 68: text += "!dt 68"; break;
                        case 69: text += "!dt 69"; break;
                        case 70: text += "!dt 70"; break;
                        case 71: text += "!dt 71"; break;
                        case 72: text += "!dt 72"; break;
                        case 73: text += "!dt 73"; break;
                        case 74: text += "!dt 74"; break;
                        case 75: text += "!dt 75"; break;
                        case 76: text += "!dt 76"; break;
                        case 77: text += "!dt 77"; break;
                        case 78: text += "!dt 78"; break;
                        case 79: text += "!dt 79"; break;
                        case 80: text += "!dt 80"; break;
                        case 81: text += "!dt 81"; break;
                        case 82: text += "!dt 82"; break;
                        case 83: text += "!dt 83"; break;
                        case 84: text += "!dt 84"; break;
                        case 85: text += "!dt 85"; break;
                        case 86: text += "!dt 86"; break;
                        case 87: text += "!dt 87"; break;
                        case 88: text += "!dt 88"; break;
                        case 89: text += "!dt 89"; break;
                        case 90: text += "!dt 90"; break;
                        case 91: text += "!dt 91"; break;
                        case 92: text += "!dt 92"; break;
                        case 93: text += "!dt 93"; break;
                        case 94: text += "!dt 94"; break;
                        case 95: text += "!dt 95"; break;
                        case 96: text += "!dt 96"; break;
                        case 97: text += "!dt 97"; break;
                        case 98: text += "!dt 98"; break;
                        case 99: text += "!dt 99"; break;
                        case 100: text += "!dt 100"; break;
                        case 101: text += "!dt 101"; break;
                        case 102: text += "!dt 102"; break;
                        case 103: text += "!dt 103"; break;
                        case 104: text += "!dt 104"; break;
                        case 105: text += "!dt 105"; break;
                        case 106: text += "!dt 106"; break;
                        case 107: text += "!dt 107"; break;
                        case 108: text += "!dt 108"; break;
                        case 109: text += "!dt 109"; break;
                        case 110: text += "!dt 110"; break;
                        case 111: text += "!dt 111"; break;
                        case 112: text += "!dt 112"; break;
                        case 113: text += "!dt 113"; break;
                        case 114: text += "!dt 114"; break;
                        case 115: text += "!dt 115"; break;
                        case 116: text += "!dt 116"; break;
                        case 117: text += "!dt 117"; break;
                        case 118: text += "!dt 118"; break;
                        case 119: text += "!dt 119"; break;
                        case 120: text += "!dt 120"; break;
                        case 121: text += "!dt 121"; break;
                        case 122: text += "!dt 122"; break;
                        case 123: text += "!dt 123"; break;
                        case 124: text += "!dt 124"; break;
                        case 125: text += "!dt 125"; break;
                        case 126: text += "!dt 126"; break;
                        case 127: text += "!dt 127"; break;
                        case 128: text += "!dt 128"; break;
                        case 129: text += "!dt 129"; break;
                        case 130: text += "!dt 130"; break;
                        case 131: text += "!dt 131"; break;
                        case 132: text += "!dt 132"; break;
                        case 133: text += "!dt 133"; break;
                        case 134: text += "!dt 134"; break;
                        case 135: text += "!dt 135"; break;
                        case 136: text += "!dt 136"; break;
                        case 137: text += "!dt 137"; break;
                        case 138: text += "!dt 138"; break;
                        case 139: text += "!dt 139"; break;
                        case 140: text += "!dt 140"; break;
                        case 141: text += "!dt 141"; break;
                        case 142: text += "!dt 142"; break;
                        case 143: text += "!dt 143"; break;
                        case 144: text += "!dt 144"; break;
                        case 145: text += "!dt 145"; break;
                        case 146: text += "!dt 146"; break;
                        case 147: text += "!dt 147"; break;
                        case 148: text += "!dt 148"; break;
                        case 149: text += "!dt 149"; break;
                        case 150: text += "!dt 150"; break;
                        case 151: text += "!dt 151"; break;
                        case 152: text += "!dt 152"; break;
                        case 153: text += "!dt 153"; break;
                        case 154: text += "!dt 154"; break;
                        case 155: text += "!dt 155"; break;
                        case 156: text += "!dt 156"; break;
                        case 157: text += "!dt 157"; break;
                        case 158: text += "!dt 158"; break;
                        case 159: text += "!dt 159"; break;
                        case 160: text += "!dt 160"; break;
                        case 161: text += "!dt 161"; break;
                        case 162: text += "!dt 162"; break;
                        case 163: text += "!dt 163"; break;
                        case 164: text += "!dt 164"; break;
                        case 165: text += "!dt 165"; break;
                        case 166: text += "!dt 166"; break;
                        case 167: text += "!dt 167"; break;
                        case 168: text += "!dt 168"; break;
                        case 169: text += "!dt 169"; break;
                        case 170: text += "!dt 170"; break;
                        case 171: text += "!dt 171"; break;
                        case 172: text += "!dt 172"; break;
                        case 173: text += "!dt 173"; break;
                        case 174: text += "!dt 174"; break;
                        case 175: text += "!dt 175"; break;
                        case 176: text += "!dt 176"; break;
                        case 177: text += "!dt 177"; break;
                        case 178: text += "!dt 178"; break;
                        case 179: text += "!dt 179"; break;
                        case 180: text += "!dt 180"; break;
                        case 181: text += "!dt 181"; break;
                        case 182: text += "!dt 182"; break;
                        case 183: text += "!dt 183"; break;
                        case 184: text += "!dt 184"; break;
                        case 185: text += "!dt 185"; break;
                        case 186: text += "!dt 186"; break;
                        case 187: text += "!dt 187"; break;
                        case 188: text += "!dt 188"; break;
                        case 189: text += "!dt 189"; break;
                        case 190: text += "!dt 190"; break;
                        case 191: text += "!dt 191"; break;
                        case 192: text += "!dt 192"; break;
                        case 193: text += "!dt 193"; break;
                        case 194: text += "!dt 194"; break;
                        case 195: text += "!dt 195"; break;
                        case 196: text += "!dt 196"; break;
                        case 197: text += "!dt 197"; break;
                        case 198: text += "!dt 198"; break;
                        case 199: text += "!dt 199"; break;
                        case 200: text += "!dt 200"; break;
                        case 201: text += "!dt 201"; break;
                        case 202: text += "!dt 202"; break;
                        case 203: text += "!dt 203"; break;
                        case 204: text += "!dt 204"; break;
                        case 205: text += "!dt 205"; break;
                        case 206: text += "!dt 206"; break;
                        case 207: text += "!dt 207"; break;
                        case 208: text += "!dt 208"; break;
                        case 209: text += "!dt 209"; break;
                        case 210: text += "!dt 210"; break;
                        case 211: text += "!dt 211"; break;
                        case 212: text += "!dt 212"; break;
                        case 213: text += "!dt 213"; break;
                        case 214: text += "!dt 214"; break;
                        case 215: text += "!dt 215"; break;
                        case 216: text += "!dt 216"; break;
                        case 217: text += "!dt 217"; break;
                        case 218: text += "!dt 218"; break;
                        case 219: text += "!dt 219"; break;
                        case 220: text += "!dt 220"; break;
                        case 221: text += "!dt 221"; break;
                        case 222: text += "!dt 222"; break;
                        case 223: text += "!dt 223"; break;
                        case 224: text += "!dt 224"; break;
                        case 225: text += "!dt 225"; break;
                        case 226: text += "!dt 226"; break;
                        case 227: text += "!dt 227"; break;
                        case 228: text += "!dt 228"; break;
                        case 229: text += "!dt 229"; break;
                        case 230: text += "!dt 230"; break;
                        case 231: text += "!dt 231"; break;
                        case 232: text += "!dt 232"; break;
                        case 233: text += "!dt 233"; break;
                        case 234: text += "!dt 234"; break;
                        case 235: text += "!dt 235"; break;
                        case 236: text += "!dt 236"; break;
                        case 237: text += "!dt 237"; break;
                        case 238: text += "!dt 238"; break;
                        case 239: text += "!dt 239"; break;
                        case 240: text += "!dt 240"; break;
                        case 241: text += "!dt 241"; break;
                        case 242: text += "!dt 242"; break;
                        case 243: text += "!dt 243"; break;
                        case 244: text += "!dt 244"; break;
                        case 245: text += "!dt 245"; break;
                        case 246: text += "!dt 246"; break;
                        case 247: text += "!dt 247"; break;
                        case 248: text += "!dt 248"; break;
                        case 249: text += "!dt 249"; break;
                        case 250: text += "!dt 250"; break;
                        case 251: text += "!dt 251"; break;
                        case 252: text += "!dt 252"; break;
                        case 253: text += "!dt 253"; break;
                        case 254: text += "!dt 254"; break;
                        case 255: text += "!dt 255"; break;
                        case 256: text += "!dt 256"; break;
                        case 257: text += "!dt 257"; break;
                        case 258: text += "!dt 258"; break;
                        case 259: text += "!dt 259"; break;
                        case 260: text += "!dt 260"; break;
                        case 261: text += "!dt 261"; break;
                        case 262: text += "!dt 262"; break;
                        case 263: text += "!dt 263"; break;
                        case 264: text += "!dt 264"; break;
                        case 265: text += "!dt 265"; break;
                        case 266: text += "!dt 266"; break;
                        case 267: text += "!dt 267"; break;
                        case 268: text += "!dt 268"; break;
                        case 269: text += "!dt 269"; break;
                        case 270: text += "!dt 270"; break;
                        case 271: text += "!dt 271"; break;
                        case 272: text += "!dt 272"; break;
                        case 273: text += "!dt 273"; break;
                        case 274: text += "!dt 274"; break;
                        case 275: text += "!dt 275"; break;
                        case 276: text += "!dt 276"; break;
                        case 277: text += "!dt 277"; break;
                        case 278: text += "!dt 278"; break;
                        case 279: text += "!dt 279"; break;
                        case 280: text += "!dt 280"; break;
                        case 281: text += "!dt 281"; break;
                        case 282: text += "!dt 282"; break;
                        case 283: text += "!dt 283"; break;
                        case 284: text += "!dt 284"; break;
                        case 285: text += "!dt 285"; break;
                        case 286: text += "!dt 286"; break;
                        case 287: text += "!dt 287"; break;
                        case 288: text += "!dt 288"; break;
                        case 289: text += "!dt 289"; break;
                        case 290: text += "!dt 290"; break;
                        case 291: text += "!dt 291"; break;
                        case 292: text += "!dt 292"; break;
                        case 293: text += "!dt 293"; break;
                        case 294: text += "!dt 294"; break;
                        case 295: text += "!dt 295"; break;
                        case 296: text += "!dt 296"; break;
                        case 297: text += "!dt 297"; break;
                        case 298: text += "!dt 298"; break;
                        case 299: text += "!dt 299"; break;
                        case 300: text += "!dt 300"; break;
                        case 301: text += "!dt 301"; break;
                        case 302: text += "!dt 302"; break;
                        case 303: text += "!dt 303"; break;
                        case 304: text += "!dt 304"; break;
                        case 305: text += "!dt 305"; break;
                        case 306: text += "!dt 306"; break;
                        case 307: text += "!dt 307"; break;
                        case 308: text += "!dt 308"; break;
                        case 309: text += "!dt 309"; break;
                        case 310: text += "!dt 310"; break;
                        case 311: text += "!dt 311"; break;
                        case 312: text += "!dt 312"; break;
                        case 313: text += "!dt 313"; break;
                        case 314: text += "!dt 314"; break;
                        case 315: text += "!dt 315"; break;
                        case 316: text += "!dt 316"; break;
                        case 317: text += "!dt 317"; break;
                        case 318: text += "!dt 318"; break;
                        case 319: text += "!dt 319"; break;
                        case 320: text += "!dt 320"; break;
                        case 321: text += "!dt 321"; break;
                        case 322: text += "!dt 322"; break;
                        case 323: text += "!dt 323"; break;
                        case 324: text += "!dt 324"; break;
                        case 325: text += "!dt 325"; break;
                        case 326: text += "!dt 326"; break;
                        case 327: text += "!dt 327"; break;
                        case 328: text += "!dt 328"; break;
                        case 329: text += "!dt 329"; break;
                        case 330: text += "!dt 330"; break;
                        case 331: text += "!dt 331"; break;
                        case 332: text += "!dt 332"; break;
                        case 333: text += "!dt 333"; break;
                        case 334: text += "!dt 334"; break;
                        case 335: text += "!dt 335"; break;
                        case 336: text += "!dt 336"; break;
                        case 337: text += "!dt 337"; break;
                        case 338: text += "!dt 338"; break;
                        case 339: text += "!dt 339"; break;
                        case 340: text += "!dt 340"; break;
                        case 341: text += "!dt 341"; break;
                        case 342: text += "!dt 342"; break;
                        case 343: text += "!dt 343"; break;
                        case 344: text += "!dt 344"; break;
                        case 345: text += "!dt 345"; break;
                        case 346: text += "!dt 346"; break;
                        case 347: text += "!dt 347"; break;
                        case 348: text += "!dt 348"; break;
                        case 349: text += "!dt 349"; break;
                        case 350: text += "!dt 350"; break;
                        case 351: text += "!dt 351"; break;
                        case 352: text += "!dt 352"; break;
                        case 353: text += "!dt 353"; break;
                        case 354: text += "!dt 354"; break;
                        case 355: text += "!dt 355"; break;
                        case 356: text += "!dt 356"; break;
                        case 357: text += "!dt 357"; break;
                        case 358: text += "!dt 358"; break;
                        case 359: text += "!dt 359"; break;
                        case 360: text += "!dt 360"; break;
                        case 361: text += "!dt 361"; break;
                        case 362: text += "!dt 362"; break;
                        case 363: text += "!dt 363"; break;
                        case 364: text += "!dt 364"; break;
                        case 365: text += "!dt 365"; break;
                        case 366: text += "!dt 366"; break;
                        case 367: text += "!dt 367"; break;
                        case 368: text += "!dt 368"; break;
                        case 369: text += "!dt 369"; break;
                        case 370: text += "!dt 370"; break;
                        case 371: text += "!dt 371"; break;
                        case 372: text += "!dt 372"; break;
                        case 373: text += "!dt 373"; break;
                        case 374: text += "!dt 374"; break;
                        case 375: text += "!dt 375"; break;
                        case 376: text += "!dt 376"; break;
                        case 377: text += "!dt 377"; break;
                        case 378: text += "!dt 378"; break;
                        case 379: text += "!dt 379"; break;
                        case 380: text += "!dt 380"; break;
                        case 381: text += "!dt 381"; break;
                        case 382: text += "!dt 382"; break;
                        case 383: text += "!dt 383"; break;
                        case 384: text += "!dt 384"; break;
                        case 385: text += "!dt 385"; break;
                        case 386: text += "!dt 386"; break;
                        case 387: text += "!dt 387"; break;
                        case 388: text += "!dt 388"; break;
                        case 389: text += "!dt 389"; break;
                        case 390: text += "!dt 390"; break;
                        case 391: text += "!dt 391"; break;
                        case 392: text += "!dt 392"; break;
                        case 393: text += "!dt 393"; break;
                        case 394: text += "!dt 394"; break;
                        case 395: text += "!dt 395"; break;
                        case 396: text += "!dt 396"; break;
                        case 397: text += "!dt 397"; break;
                        case 398: text += "!dt 398"; break;
                        case 399: text += "!dt 399"; break;
                        case 400: text += "!dt 400"; break;
                        case 401: text += "!dt 401"; break;
                        case 402: text += "!dt 402"; break;
                        case 403: text += "!dt 403"; break;
                        case 404: text += "!dt 404"; break;
                        case 405: text += "!dt 405"; break;
                        case 406: text += "!dt 406"; break;
                        case 407: text += "!dt 407"; break;
                        case 408: text += "!dt 408"; break;
                        case 409: text += "!dt 409"; break;
                        case 410: text += "!dt 410"; break;
                        case 411: text += "!dt 411"; break;
                        case 412: text += "!dt 412"; break;
                        case 413: text += "!dt 413"; break;
                        case 414: text += "!dt 414"; break;
                        case 415: text += "!dt 415"; break;
                        case 416: text += "!dt 416"; break;
                        case 417: text += "!dt 417"; break;
                        case 418: text += "!dt 418"; break;
                        case 419: text += "!dt 419"; break;
                        case 420: text += "!dt 420"; break;
                        case 421: text += "!dt 421"; break;
                        case 422: text += "!dt 422"; break;
                        case 423: text += "!dt 423"; break;
                        case 424: text += "!dt 424"; break;
                        case 425: text += "!dt 425"; break;
                        case 426: text += "!dt 426"; break;
                        case 427: text += "!dt 427"; break;
                        case 428: text += "!dt 428"; break;
                        case 429: text += "!dt 429"; break;
                        case 430: text += "!dt 430"; break;
                        case 431: text += "!dt 431"; break;
                        case 432: text += "!dt 432"; break;
                        case 433: text += "!dt 433"; break;
                        case 434: text += "!dt 434"; break;
                        case 435: text += "!dt 435"; break;
                        case 436: text += "!dt 436"; break;
                        case 437: text += "!dt 437"; break;
                        case 438: text += "!dt 438"; break;
                        case 439: text += "!dt 439"; break;
                        case 440: text += "!dt 440"; break;
                        case 441: text += "!dt 441"; break;
                        case 442: text += "!dt 442"; break;
                        case 443: text += "!dt 443"; break;
                        case 444: text += "!dt 444"; break;
                        case 445: text += "!dt 445"; break;
                        case 446: text += "!dt 446"; break;
                        case 447: text += "!dt 447"; break;
                        case 448: text += "!dt 448"; break;
                        case 449: text += "!dt 449"; break;
                        case 450: text += "!dt 450"; break;
                        case 451: text += "!dt 451"; break;
                        case 452: text += "!dt 452"; break;
                        case 453: text += "!dt 453"; break;
                        case 454: text += "!dt 454"; break;
                        case 455: text += "!dt 455"; break;
                        case 456: text += "!dt 456"; break;
                        case 457: text += "!dt 457"; break;
                        case 458: text += "!dt 458"; break;
                        case 459: text += "!dt 459"; break;
                        case 460: text += "!dt 460"; break;
                        case 461: text += "!dt 461"; break;
                        case 462: text += "!dt 462"; break;
                        case 463: text += "!dt 463"; break;
                        case 464: text += "!dt 464"; break;
                        case 465: text += "!dt 465"; break;
                        case 466: text += "!dt 466"; break;
                        case 467: text += "!dt 467"; break;
                        case 468: text += "!dt 468"; break;
                        case 469: text += "!dt 469"; break;
                        case 470: text += "!dt 470"; break;
                        case 471: text += "!dt 471"; break;
                        case 472: text += "!dt 472"; break;
                        case 473: text += "!dt 473"; break;
                        case 474: text += "!dt 474"; break;
                        case 475: text += "!dt 475"; break;
                        case 476: text += "!dt 476"; break;
                        case 477: text += "!dt 477"; break;
                        case 478: text += "!dt 478"; break;
                        case 479: text += "!dt 479"; break;
                        case 480: text += "!dt 480"; break;
                        case 481: text += "!dt 481"; break;
                        case 482: text += "!dt 482"; break;
                        case 483: text += "!dt 483"; break;
                        case 484: text += "!dt 484"; break;
                        case 485: text += "!dt 485"; break;
                        case 486: text += "!dt 486"; break;
                        case 487: text += "!dt 487"; break;
                        case 488: text += "!dt 488"; break;
                        case 489: text += "!dt 489"; break;
                        case 490: text += "!dt 490"; break;
                        case 491: text += "!dt 491"; break;
                        case 492: text += "!dt 492"; break;
                        case 493: text += "!dt 493"; break;
                        case 494: text += "!dt 494"; break;
                        case 495: text += "!dt 495"; break;
                        case 496: text += "!dt 496"; break;
                        case 497: text += "!dt 497"; break;
                        case 498: text += "!dt 498"; break;
                        case 499: text += "!dt 499"; break;
                        case 500: text += "!dt 500"; break;
                        case 501: text += "!dt 501"; break;
                        case 502: text += "!dt 502"; break;
                        case 503: text += "!dt 503"; break;
                        case 504: text += "!dt 504"; break;
                        case 505: text += "!dt 505"; break;
                        case 506: text += "!dt 506"; break;
                        case 507: text += "!dt 507"; break;
                        case 508: text += "!dt 508"; break;
                        case 509: text += "!dt 509"; break;
                        case 510: text += "!dt 510"; break;
                        case 511: text += "!dt 511"; break;
                        case 512: text += "!dt 512"; break;
                        case 513: text += "!dt 513"; break;
                        case 514: text += "!dt 514"; break;
                        case 515: text += "!dt 515"; break;
                        case 516: text += "!dt 516"; break;
                        case 517: text += "!dt 517"; break;
                        case 518: text += "!dt 518"; break;
                        case 519: text += "!dt 519"; break;
                        case 520: text += "!dt 520"; break;
                        case 521: text += "!dt 521"; break;
                        case 522: text += "!dt 522"; break;
                        case 523: text += "!dt 523"; break;
                        case 524: text += "!dt 524"; break;
                        case 525: text += "!dt 525"; break;
                        case 526: text += "!dt 526"; break;
                        case 527: text += "!dt 527"; break;
                        case 528: text += "!dt 528"; break;
                        case 529: text += "!dt 529"; break;
                        case 530: text += "!dt 530"; break;
                        case 531: text += "!dt 531"; break;
                        case 532: text += "!dt 532"; break;
                        case 533: text += "!dt 533"; break;
                        case 534: text += "!dt 534"; break;
                        case 535: text += "!dt 535"; break;
                        case 536: text += "!dt 536"; break;
                        case 537: text += "!dt 537"; break;
                        case 538: text += "!dt 538"; break;
                        case 539: text += "!dt 539"; break;
                        case 540: text += "!dt 540"; break;
                        case 541: text += "!dt 541"; break;
                        case 542: text += "!dt 542"; break;
                        case 543: text += "!dt 543"; break;
                        case 544: text += "!dt 544"; break;
                        case 545: text += "!dt 545"; break;
                        case 546: text += "!dt 546"; break;
                        case 547: text += "!dt 547"; break;
                        case 548: text += "!dt 548"; break;
                        case 549: text += "!dt 549"; break;
                        case 550: text += "!dt 550"; break;
                        case 551: text += "!dt 551"; break;
                        case 552: text += "!dt 552"; break;
                        case 553: text += "!dt 553"; break;
                        case 554: text += "!dt 554"; break;
                        case 555: text += "!dt 555"; break;
                        case 556: text += "!dt 556"; break;
                        case 557: text += "!dt 557"; break;
                        case 558: text += "!dt 558"; break;
                        case 559: text += "!dt 559"; break;
                        case 560: text += "!dt 560"; break;
                        case 561: text += "!dt 561"; break;
                        case 562: text += "!dt 562"; break;
                        case 563: text += "!dt 563"; break;
                        case 564: text += "!dt 564"; break;
                        case 565: text += "!dt 565"; break;
                        case 566: text += "!dt 566"; break;
                        case 567: text += "!dt 567"; break;
                        case 568: text += "!dt 568"; break;
                        case 569: text += "!dt 569"; break;
                        case 570: text += "!dt 570"; break;
                        case 571: text += "!dt 571"; break;
                        case 572: text += "!dt 572"; break;
                        case 573: text += "!dt 573"; break;
                        case 574: text += "!dt 574"; break;
                        case 575: text += "!dt 575"; break;
                        case 576: text += "!dt 576"; break;
                        case 577: text += "!dt 577"; break;
                        case 578: text += "!dt 578"; break;
                        case 579: text += "!dt 579"; break;
                        case 580: text += "!dt 580"; break;
                        case 581: text += "!dt 581"; break;
                        case 582: text += "!dt 582"; break;
                        case 583: text += "!dt 583"; break;
                        case 584: text += "!dt 584"; break;
                        case 585: text += "!dt 585"; break;
                        case 586: text += "!dt 586"; break;
                        case 587: text += "!dt 587"; break;
                        case 588: text += "!dt 588"; break;
                        case 589: text += "!dt 589"; break;
                        case 590: text += "!dt 590"; break;
                        case 591: text += "!dt 591"; break;
                        case 592: text += "!dt 592"; break;
                        case 593: text += "!dt 593"; break;
                        case 594: text += "!dt 594"; break;
                        case 595: text += "!dt 595"; break;
                        case 596: text += "!dt 596"; break;
                        case 597: text += "!dt 597"; break;
                        case 598: text += "!dt 598"; break;
                        case 599: text += "!dt 599"; break;
                        case 600: text += "!dt 600"; break;
                        case 601: text += "!dt 601"; break;
                        case 602: text += "!dt 602"; break;
                        case 603: text += "!dt 603"; break;
                        case 604: text += "!dt 604"; break;
                        case 605: text += "!dt 605"; break;
                        case 606: text += "!dt 606"; break;
                        case 607: text += "!dt 607"; break;
                        case 608: text += "!dt 608"; break;
                        case 609: text += "!dt 609"; break;
                        case 610: text += "!dt 610"; break;
                        case 611: text += "!dt 611"; break;
                        case 612: text += "!dt 612"; break;
                        case 613: text += "!dt 613"; break;
                        case 614: text += "!dt 614"; break;
                        case 615: text += "!dt 615"; break;
                        case 616: text += "!dt 616"; break;
                        case 617: text += "!dt 617"; break;
                        case 618: text += "!dt 618"; break;
                        case 619: text += "!dt 619"; break;
                        case 620: text += "!dt 620"; break;
                        case 621: text += "!dt 621"; break;
                        case 622: text += "!dt 622"; break;
                        case 623: text += "!dt 623"; break;
                        case 624: text += "!dt 624"; break;
                        case 625: text += "!dt 625"; break;
                        case 626: text += "!dt 626"; break;
                        case 627: text += "!dt 627"; break;
                        case 628: text += "!dt 628"; break;
                        case 629: text += "!dt 629"; break;
                        case 630: text += "!dt 630"; break;
                        case 631: text += "!dt 631"; break;
                        case 632: text += "!dt 632"; break;
                        case 633: text += "!dt 633"; break;
                        case 634: text += "!dt 634"; break;
                        case 635: text += "!dt 635"; break;
                        case 636: text += "!dt 636"; break;
                        case 637: text += "!dt 637"; break;
                        case 638: text += "!dt 638"; break;
                        case 639: text += "!dt 639"; break;
                        case 640: text += "!dt 640"; break;
                        case 641: text += "!dt 641"; break;
                        case 642: text += "!dt 642"; break;
                        case 643: text += "!dt 643"; break;
                        case 644: text += "!dt 644"; break;
                        case 645: text += "!dt 645"; break;
                        case 646: text += "!dt 646"; break;
                        case 647: text += "!dt 647"; break;
                        case 648: text += "!dt 648"; break;
                        case 649: text += "!dt 649"; break;
                        case 650: text += "!dt 650"; break;
                        case 651: text += "!dt 651"; break;
                        case 652: text += "!dt 652"; break;
                        case 653: text += "!dt 653"; break;
                        case 654: text += "!dt 654"; break;
                        case 655: text += "!dt 655"; break;
                        case 656: text += "!dt 656"; break;
                        case 657: text += "!dt 657"; break;
                        case 658: text += "!dt 658"; break;
                        case 659: text += "!dt 659"; break;
                        case 660: text += "!dt 660"; break;
                        case 661: text += "!dt 661"; break;
                        case 662: text += "!dt 662"; break;
                        case 663: text += "!dt 663"; break;
                        case 664: text += "!dt 664"; break;
                        case 665: text += "!dt 665"; break;
                        case 666: text += "!dt 666"; break;
                        case 667: text += "!dt 667"; break;
                        case 668: text += "!dt 668"; break;
                        case 669: text += "!dt 669"; break;
                        case 670: text += "!dt 670"; break;
                        case 671: text += "!dt 671"; break;
                        case 672: text += "!dt 672"; break;
                        case 673: text += "!dt 673"; break;
                        case 674: text += "!dt 674"; break;
                        case 675: text += "!dt 675"; break;
                        case 676: text += "!dt 676"; break;
                        case 677: text += "!dt 677"; break;
                        case 678: text += "!dt 678"; break;
                        case 679: text += "!dt 679"; break;
                        case 680: text += "!dt 680"; break;
                        case 681: text += "!dt 681"; break;
                        case 682: text += "!dt 682"; break;
                        case 683: text += "!dt 683"; break;
                        case 684: text += "!dt 684"; break;
                        case 685: text += "!dt 685"; break;
                        case 686: text += "!dt 686"; break;
                        case 687: text += "!dt 687"; break;
                        case 688: text += "!dt 688"; break;
                        case 689: text += "!dt 689"; break;
                        case 690: text += "!dt 690"; break;
                        case 691: text += "!dt 691"; break;
                        case 692: text += "!dt 692"; break;
                        case 693: text += "!dt 693"; break;
                        case 694: text += "!dt 694"; break;
                        case 695: text += "!dt 695"; break;
                        case 696: text += "!dt 696"; break;
                        case 697: text += "!dt 697"; break;
                        case 698: text += "!dt 698"; break;
                        case 699: text += "!dt 699"; break;
                        case 700: text += "!dt 700"; break;
                        case 701: text += "!dt 701"; break;
                        case 702: text += "!dt 702"; break;
                        case 703: text += "!dt 703"; break;
                        case 704: text += "!dt 704"; break;
                        case 705: text += "!dt 705"; break;
                        case 706: text += "!dt 706"; break;
                        case 707: text += "!dt 707"; break;
                        case 708: text += "!dt 708"; break;
                        case 709: text += "!dt 709"; break;
                        case 710: text += "!dt 710"; break;
                        case 711: text += "!dt 711"; break;
                        case 712: text += "!dt 712"; break;
                        case 713: text += "!dt 713"; break;
                        case 714: text += "!dt 714"; break;
                        case 715: text += "!dt 715"; break;
                        case 716: text += "!dt 716"; break;
                        case 717: text += "!dt 717"; break;
                        case 718: text += "!dt 718"; break;
                        case 719: text += "!dt 719"; break;
                        case 720: text += "!dt 720"; break;
                }
                this.say(con, room, text);
        },
 };
