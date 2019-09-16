//import os, re, glob
//import random

//def is_str(obj):
//    return isinstance(obj, basestring) or isinstance(obj, str) or isinstance(obj, unicode)
import glob = require("glob");
import Path = require("path");
export module scenario {
export class Command {
    private _command : string;
    constructor() {
        this._command = null;
    }

    get command() { return this._command; }
    set command(val: string) { this._command = val; }
}

export class Scene extends Command {
    private _sound : string;
    private _image : string;
    constructor(sound : string, image : string) {
        super();
        this.command = "scene";
        this._sound = sound;
        this._image = image;
    }

    get sound() { return this._sound; }
    get image() { return this._image; }
}

export class Ask extends Command {
    private _options : {[key: string]: any};
    constructor(options:{[key:string]: any}) {
        super();
        this._options = options;
    }
    get options() : {[key: string]: any} { return this._options; }
}

export class Scenario {
    static PlayAll : string = "play-all";
    static PlayOne : string = "play-one";
    static Select  : string = "select";
    static Ask     : string = "ask";
    static Nop     : string = "nop";
    static SubScenario : string = "sub-scenario";
    
    static Jump     : string = "jump";
    static Exit     : string = "exit";
    static Dice     : string = "dice";
    static DiceWithMode : string = "dice-with-mode";
    static DiceWith : string = "dice-with";
    static JumpBy   : string = "jump-by";

    private situation_change : number;
    private music_path : string;
    private image_path : string;
    private _variables : {[key: string]: any};
    private sub_scenario : any[];
    private histories : any[];
    private states : any[];
    private count : number;
    private _config : {[index: string] : any};

    constructor(private root_path : string, config : {[key:string]: any}) {
        this._config = config;
        this.situation_change = 50;
        this.music_path = root_path + "/" + this._config["paths"].Music;
        this.image_path = root_path + "/" + this._config["paths"].Images;
        this.sub_scenario = [];
        this._variables = {};
    }

    get config() : {[index: string]: any} {return this._config;}
    get variables() : {[key: string]: any} { return this._variables;}

    get_prefix_for(name : string) : any {
        if (this.sub_scenario != null) {
            let state = this.sub_scenario[this.sub_scenario.length - 1][name];
            return state[1];
        }
        return null;
    }

    list_files(name : string, prefix : string = null) {
        if (!prefix)
            prefix = this.get_prefix_for(name);
        let result = glob.sync(Path.join(this.music_path, prefix));
        result.sort();
        return [result, this._config["image_map"][prefix]];
    }

    get_image_path(images: any[], id:number) : any {
        let name = images[id%images.length];
        if (name instanceof Array) {
            return [name[0]].concat(name.slice(1, name.length).map( (x: any): any => { 
                if (typeof(x) == "string")
                    return Path.join(this.image_path, x);
                else
                    return x; }));
        } else if (typeof(name) == "string")
            return Path.join(this.image_path, name);
    }

    select_action_rand(name : string, prefix : string) : [number, [string, string]] {
        let resources = this.list_files(name, prefix);
        let sounds = resources[0];
        let images = resources[1];
        if (sounds instanceof Array) {
            let selected : number = Math.floor(Math.random() * sounds.length);
            return [selected, [sounds[selected], this.get_image_path(images, selected)]];
        }
        return [null, [null, null]];
    }

    dice(current: string, mapping : any[]) : any[] {
        let judge: any[] = null;
        while (!judge) {
            let dice_ : number = Math.random() * 100;
            console.log("DICE="+dice_);
            let index = 0;
            for (let m of mapping) {
                let v : number = m[0];
                let k : any[] = m[1];
                if (dice_ < v) {
                    if (this.histories.length > 1 && 
                        this.histories[this.histories.length - 1].length > 1 &&
                        this.histories[this.histories.length - 1][this.histories[this.histories.length - 1].length - 1] == k[1])
                        break;
                    else {
                        judge = k;
                        console.log("ACT="+judge[0]+"->"+judge[1]);
                        break;
                    }
                }
                dice_ -= v;
                index ++;
            }
            if (judge) {
                if (judge.length > 2) {
                    let prefix = judge.slice(2, judge.length);
                    let resources = this.list_files(current);
                    let sounds = resources[0], images = resources[1];
                    let sound_candidates = sounds.filter((s:string):boolean => { return prefix.indexOf(Path.basename(s)) >= 0;});
                    let variation = Math.floor(Math.random() * sound_candidates.length);
                    let resources2: any[] = [ [sound_candidates[variation], this.get_image_path(images, index)] ];
                    judge = judge.slice(0, 2).concat(resources2); 
                }
                return judge;
            }
        }
    }

    transit_to_next(next_info:any[]) : any {
        let current = (this.states.length > 0)? this.states[this.states.length - 1] : null;

        switch(next_info[0]) {
        case Scenario.Dice: {
            console.log("Dice");
            let file_prefix = (next_info.length > 2)? next_info.slice(2, next_info.length): null;
            next_info = this.dice(current, this._config[next_info[1]]);    
        }
        break;

        case Scenario.DiceWithMode:{
            console.log("Dice-with-mode");
            next_info = this.dice(current, this._config[next_info[1]][this._variables["mode"]]);
        }
        break;

        case Scenario.DiceWith:{
            let value = this._variables[next_info[1]];
            console.log("Dice-with");
            next_info = this.dice(current, this._config[next_info[2]][value]);
        }
        break;
        };

        switch(next_info[0]) {
        case Scenario.Jump: {
            console.log("Jump ["+this.states.length+"] --> "+next_info[1]);
            if (this.states.length > 0) {
                this.states[this.states.length-1] = next_info[1];
                this.histories[this.histories.length-1].push(next_info[1]);
            }
        }
        break;

        case Scenario.JumpBy: {
            let value = this._variables[next_info[1]]
            let next_name = (next_info.length >= 3)? next_info[2][value] : value;
            console.log("Jump by ["+next_info[1]+"="+value+"] --> "+ next_name)
            if (this.states.length > 0){
                this.states[this.states.length - 1] = next_name;
                this.histories[this.histories.length - 1].push(next_name);
            }
            next_info = [];
        }
        break;

        case Scenario.Exit: {
            if (this.sub_scenario.length) {
                this.sub_scenario.pop();
                this.states.pop();
                this.histories.pop();
            }
            let next_name = (next_info.length >= 2)? next_info[1] : null;
            console.log("Exit ["+this.states.length+"]");
            if (this.states.length > 0) {
                this.states[this.states.length - 1] = next_name;
                this.histories[this.histories.length - 1].push(next_name);
            }
        }
        break;

        default:
            console.log("Unknown action '"+next_info[0]+"'")
            break;
        }
        if (next_info.length > 2) {
            console.log("file="+next_info[2]);
            return next_info[2];
        } else
            return null;
    }

    *run() {
        this.sub_scenario = [];
        this.states = [];
        this.histories = [];
        this.count = 0;
        var g = this.loop(this._config["scenario"]);
        for (var i = g.next(); !i.done; i = g.next()) {
            yield i.value;
        }
    }

    force(states: any) {
        while (this.sub_scenario.length > this.states.length) {
            this.sub_scenario.pop();
            this.histories.pop();
        }
        this.states = states;
        this.histories.push(states);
    }

    *loop(current_scenario : any = null) {
        while (true) {
            this.count ++;
            console.log("\nTrial "+this.count+":");
            if (!current_scenario) {
                if (this.states.length > 0 && this.sub_scenario.length > 0)
                    current_scenario = this.sub_scenario[this.sub_scenario.length - 1][this.states[this.states.length - 1]];
                else
                    return;
            }
            if (this.states.length > 0)
                console.log("STATE["+this.states.length+"]="+this.states[this.states.length - 1]);
            let head = current_scenario[0];
            var scenario = [];
            if (typeof(head) == 'string') {
                scenario = [current_scenario]
            } else if (typeof(head) == 'object') {
                scenario = current_scenario.slice(0, current_scenario.length - 1)
            }
            for (let cs of scenario) {
                let action = cs[0];
                console.log("ACTIONS="+action);
                var content : any;

                switch (action) {
                case Scenario.SubScenario:
                    content = cs[1];
                    console.log("Push SubScenario "+content);
                    this.sub_scenario.push(content);
                    this.states.push(null);
                    this.histories.push([]);
                    break;
                case Scenario.PlayAll:{
                    content = cs[1];
                    let resources = this.list_files(null, content);
                    let sounds = resources[0], images = resources[1];
                    for (var i : number = 0; i < sounds.length; i ++)
                        yield(new Scene(sounds[i], this.get_image_path(images, i)))
                }
                break;
                case Scenario.PlayOne: {
                    content = cs[1];
                    let resources = this.select_action_rand(null, content);
                    let filename : [string, string] = resources[1];
                    yield(new Scene(filename[0], filename[1]));
                }
                break;
                case Scenario.Ask: {
                    let options = cs[1];
                    console.log("  options="+options);
                    yield(new Ask(options));
                }
                break;
                case Scenario.Select: {
                    content = cs[1]
                }
                break;
                case Scenario.Nop:
                    break;
                }
            }
            let next = current_scenario[current_scenario.length - 1];
            let filename = this.transit_to_next(next);
            if (filename) {
                yield(new Scene(filename[0], filename[1]));
            }

            current_scenario = null;
        };
    } 
}
}