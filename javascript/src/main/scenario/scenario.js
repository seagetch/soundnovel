"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var glob = require("glob");
var path = require("path");
var scenario;
(function (scenario_1) {
    var Command = (function () {
        function Command() {
            this._command = null;
        }
        Object.defineProperty(Command.prototype, "command", {
            get: function () { return this._command; },
            set: function (val) { this._command = val; },
            enumerable: true,
            configurable: true
        });
        return Command;
    }());
    scenario_1.Command = Command;
    var Scene = (function (_super) {
        __extends(Scene, _super);
        function Scene(sound, image) {
            var _this = _super.call(this) || this;
            _this.command = "scene";
            _this._sound = sound;
            _this._image = image;
            return _this;
        }
        Object.defineProperty(Scene.prototype, "sound", {
            get: function () { return this._sound; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "image", {
            get: function () { return this._image; },
            enumerable: true,
            configurable: true
        });
        return Scene;
    }(Command));
    scenario_1.Scene = Scene;
    var Ask = (function (_super) {
        __extends(Ask, _super);
        function Ask(options) {
            var _this = _super.call(this) || this;
            _this._options = options;
            return _this;
        }
        Object.defineProperty(Ask.prototype, "options", {
            get: function () { return this._options; },
            enumerable: true,
            configurable: true
        });
        return Ask;
    }(Command));
    scenario_1.Ask = Ask;
    var Scenario = (function () {
        function Scenario(root_path, config) {
            this.root_path = root_path;
            this._config = config;
            this.situation_change = 50;
            this.music_path = root_path + "/" + this._config["paths"].Music;
            this.image_path = root_path + "/" + this._config["paths"].Images;
            this.sub_scenario = [];
            this._variables = {};
        }
        Object.defineProperty(Scenario.prototype, "config", {
            get: function () { return this._config; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scenario.prototype, "variables", {
            get: function () { return this._variables; },
            enumerable: true,
            configurable: true
        });
        Scenario.prototype.get_prefix_for = function (name) {
            if (this.sub_scenario != null) {
                var state = this.sub_scenario[this.sub_scenario.length - 1][name];
                return state[1];
            }
            return null;
        };
        Scenario.prototype.list_files = function (name, prefix, candidates) {
            if (prefix === void 0) { prefix = null; }
            if (candidates === void 0) { candidates = null; }
            if (!prefix)
                prefix = this.get_prefix_for(name);
            var result = glob.sync(path.join(this.music_path, prefix));
            result.sort();
            if (candidates)
                result = result.filter(function (s) { return prefix.indexOf(path.basename(s)) >= 0; });
            return [result, this._config["image_map"][prefix]];
        };
        Scenario.prototype.get_image_path = function (images, id) {
            var _this = this;
            var name = images[id % images.length];
            if (name instanceof Array) {
                return [name[0]].concat(name.slice(1, name.length).map(function (x) {
                    if (typeof (x) == "string")
                        return path.join(_this.image_path, x);
                    else
                        return x;
                }));
            }
            else if (typeof (name) == "string")
                return path.join(this.image_path, name);
        };
        Scenario.prototype.select_action_rand = function (name, prefix) {
            var resources = this.list_files(name, prefix);
            var sounds = resources[0];
            var images = resources[1];
            if (sounds instanceof Array) {
                var selected = Math.floor(Math.random() * sounds.length);
                return [selected, [sounds[selected], this.get_image_path(images, selected)]];
            }
            return [null, [null, null]];
        };
        Scenario.prototype.dice = function (current, mapping) {
            var judge = null;
            while (!judge) {
                var dice_ = Math.random() * 100;
                console.log("DICE=" + dice_);
                var index = 0;
                for (var _i = 0, mapping_1 = mapping; _i < mapping_1.length; _i++) {
                    var m = mapping_1[_i];
                    var v = m[0];
                    var k = m[1];
                    if (dice_ < v) {
                        if (this.histories.length > 1 &&
                            this.histories[this.histories.length - 1].length > 1 &&
                            this.histories[this.histories.length - 1][this.histories[this.histories.length - 1].length - 1] == k[1])
                            break;
                        else {
                            judge = k;
                            console.log("ACT=" + judge[0] + "->" + judge[1]);
                            break;
                        }
                    }
                    dice_ -= v;
                    index++;
                }
                if (judge) {
                    if (judge.length > 2) {
                        var prefix = judge.slice(2, judge.length);
                        var resources = this.list_files(current);
                        var sound_candidates = resources[0], images = resources[1];
                        var variation = Math.floor(Math.random() * sound_candidates.length);
                        var resources2 = [[sound_candidates[variation], this.get_image_path(images, index)]];
                        judge = judge.slice(0, 2).concat(resources2);
                    }
                    return judge;
                }
            }
        };
        Scenario.prototype.transit_to_next = function (next_info) {
            var current = (this.states.length > 0) ? this.states[this.states.length - 1] : null;
            switch (next_info[0]) {
                case Scenario.Dice:
                    {
                        console.log("Dice");
                        var file_prefix = (next_info.length > 2) ? next_info.slice(2, next_info.length) : null;
                        next_info = this.dice(current, this._config[next_info[1]]);
                    }
                    break;
                case Scenario.DiceWithMode:
                    {
                        console.log("Dice-with-mode");
                        next_info = this.dice(current, this._config[next_info[1]][this._variables["mode"]]);
                    }
                    break;
                case Scenario.DiceWith:
                    {
                        var value = this._variables[next_info[1]];
                        console.log("Dice-with");
                        next_info = this.dice(current, this._config[next_info[2]][value]);
                    }
                    break;
            }
            ;
            switch (next_info[0]) {
                case Scenario.Jump:
                    {
                        console.log("Jump [" + this.states.length + "] --> " + next_info[1]);
                        if (this.states.length > 0) {
                            this.states[this.states.length - 1] = next_info[1];
                            this.histories[this.histories.length - 1].push(next_info[1]);
                        }
                    }
                    break;
                case Scenario.JumpBy:
                    {
                        var value = this._variables[next_info[1]];
                        var next_name = (next_info.length >= 3) ? next_info[2][value] : value;
                        console.log("Jump by [" + next_info[1] + "=" + value + "] --> " + next_name);
                        if (this.states.length > 0) {
                            this.states[this.states.length - 1] = next_name;
                            this.histories[this.histories.length - 1].push(next_name);
                        }
                        next_info = [];
                    }
                    break;
                case Scenario.Exit:
                    {
                        if (this.sub_scenario.length) {
                            this.sub_scenario.pop();
                            this.states.pop();
                            this.histories.pop();
                        }
                        var next_name = (next_info.length >= 2) ? next_info[1] : null;
                        console.log("Exit [" + this.states.length + "]");
                        if (this.states.length > 0) {
                            this.states[this.states.length - 1] = next_name;
                            this.histories[this.histories.length - 1].push(next_name);
                        }
                    }
                    break;
                default:
                    console.log("Unknown action '" + next_info[0] + "'");
                    break;
            }
            if (next_info.length > 2) {
                console.log("file=" + next_info[2]);
                return next_info[2];
            }
            else
                return null;
        };
        Scenario.prototype.run = function () {
            var g, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.sub_scenario = [];
                        this.states = [];
                        this.histories = [];
                        this.count = 0;
                        g = this.loop(this._config["scenario"]);
                        i = g.next();
                        _a.label = 1;
                    case 1:
                        if (!!i.done) return [3, 4];
                        return [4, i.value];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i = g.next();
                        return [3, 1];
                    case 4: return [2];
                }
            });
        };
        Scenario.prototype.force = function (states) {
            while (this.sub_scenario.length > states.length) {
                this.sub_scenario.pop();
                this.histories.pop();
            }
            this.states = states;
            this.histories.push(states);
        };
        Scenario.prototype.loop = function (current_scenario) {
            if (current_scenario === void 0) { current_scenario = null; }
            var head, scenario, _i, scenario_2, cs, action, content, _a, resources, sounds, images, i, resources, filename_1, options, next, filename;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!true) return [3, 18];
                        this.count++;
                        console.log("\nTrial " + this.count + ":");
                        if (!current_scenario) {
                            if (this.states.length > 0 && this.sub_scenario.length > 0)
                                current_scenario = this.sub_scenario[this.sub_scenario.length - 1][this.states[this.states.length - 1]];
                            else
                                return [2];
                        }
                        if (this.states.length > 0)
                            console.log("STATE[" + this.states.length + "]=" + this.states[this.states.length - 1]);
                        head = current_scenario[0];
                        scenario = [];
                        if (typeof (head) == 'string') {
                            scenario = [current_scenario];
                        }
                        else if (typeof (head) == 'object') {
                            scenario = current_scenario.slice(0, current_scenario.length - 1);
                        }
                        _i = 0, scenario_2 = scenario;
                        _b.label = 1;
                    case 1:
                        if (!(_i < scenario_2.length)) return [3, 15];
                        cs = scenario_2[_i];
                        action = cs[0];
                        console.log("ACTIONS=" + action);
                        _a = action;
                        switch (_a) {
                            case Scenario.SubScenario: return [3, 2];
                            case Scenario.PlayAll: return [3, 3];
                            case Scenario.PlayOne: return [3, 8];
                            case Scenario.Ask: return [3, 10];
                            case Scenario.Select: return [3, 12];
                            case Scenario.Nop: return [3, 13];
                        }
                        return [3, 14];
                    case 2:
                        content = cs[1];
                        console.log("Push SubScenario " + content);
                        this.sub_scenario.push(content);
                        this.states.push(null);
                        this.histories.push([]);
                        return [3, 14];
                    case 3:
                        content = cs[1];
                        resources = this.list_files(null, content);
                        sounds = resources[0], images = resources[1];
                        i = 0;
                        _b.label = 4;
                    case 4:
                        if (!(i < sounds.length)) return [3, 7];
                        return [4, (new Scene(sounds[i], this.get_image_path(images, i)))];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6:
                        i++;
                        return [3, 4];
                    case 7: return [3, 14];
                    case 8:
                        content = cs[1];
                        resources = this.select_action_rand(null, content);
                        filename_1 = resources[1];
                        return [4, (new Scene(filename_1[0], filename_1[1]))];
                    case 9:
                        _b.sent();
                        return [3, 14];
                    case 10:
                        options = cs[1];
                        console.log("  options=" + options);
                        return [4, (new Ask(options))];
                    case 11:
                        _b.sent();
                        return [3, 14];
                    case 12:
                        {
                            content = cs[1];
                        }
                        return [3, 14];
                    case 13: return [3, 14];
                    case 14:
                        _i++;
                        return [3, 1];
                    case 15:
                        next = current_scenario[current_scenario.length - 1];
                        filename = this.transit_to_next(next);
                        if (!filename) return [3, 17];
                        return [4, (new Scene(filename[0], filename[1]))];
                    case 16:
                        _b.sent();
                        _b.label = 17;
                    case 17:
                        current_scenario = null;
                        return [3, 0];
                    case 18:
                        ;
                        return [2];
                }
            });
        };
        Scenario.PlayAll = "play-all";
        Scenario.PlayOne = "play-one";
        Scenario.Select = "select";
        Scenario.Ask = "ask";
        Scenario.Nop = "nop";
        Scenario.SubScenario = "sub-scenario";
        Scenario.Jump = "jump";
        Scenario.Exit = "exit";
        Scenario.Dice = "dice";
        Scenario.DiceWithMode = "dice-with-mode";
        Scenario.DiceWith = "dice-with";
        Scenario.JumpBy = "jump-by";
        return Scenario;
    }());
    scenario_1.Scenario = Scenario;
})(scenario = exports.scenario || (exports.scenario = {}));
//# sourceMappingURL=scenario.js.map