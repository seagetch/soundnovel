
import path = require("path");
import fs = require("fs");
import yaml = require("js-yaml");

import { scenario } from "./scenario/scenario";
import electron = require("electron")
import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } from "constants";

class ScenarioPlayer {
    private scenario: scenario.Scenario;
    private screen: any;
    private window_title: string;
    constructor() {
    }

    receive_start() : Promise<any> {
        return new Promise<any>((resolve, reject) => {
            electron.ipcMain.once("start", (event: any) => {
                event.reply("screen", this.scenario.config["screen"]["size"]);
                event.reply("fullscreen", this.screen.fullscreen);
                resolve(event);
            });
        });
    }

    receive_cmds(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            electron.ipcMain.once("command", (event: any, name: string) => {
                resolve(event);
            })
            electron.ipcMain.removeAllListeners("terminate");
            electron.ipcMain.once("terminate", (event: any, name: string) => {
                reject(event);
            })
        });
    }
    receive_others() {
        electron.ipcMain.on("set-variable", (event: any, name: string, value: string) => {
            this.scenario.variables[name] = value;
        })
        electron.ipcMain.on("fullscreen", (event: any, value: boolean) => {
            if (value) {
                this.screen.setResizable(true);
                this.screen.setFullScreen(value);
            } else {
                this.screen.setFullScreen(value);
                this.screen.setResizable(false);
                this.screen.setMenuBarVisibility(false);
            }
            event.reply("fullscreen", value);
        })
    }
    post_cmd(event: any, command: scenario.Command | string[] | void) {
        if (command instanceof scenario.Scene) {
            let scene = command as scenario.Scene;
            event.reply("command", ["scene", scene.sound, scene.image]);
        } else if (command instanceof scenario.Ask) {
            let ask = command as scenario.Ask;
            event.reply("command", ["ask", ask.options])
        } else {
            event.reply("command", command)
        }
    }
    exec_cmd(event: any, command: scenario.Command | string[] | void): Promise<any> {
        this.post_cmd(event, command);
        return this.receive_cmds()
    }


    async title(event: any): Promise<any> {
        let title_img = this.scenario.get_image_path(this.scenario.config["image_map"]["title"], 0);
        if (this.scenario.config["modes"]) {
            let options: { [key: string]: any } = {
                "location": this.scenario.config["screen"]["menu_location"],
                "candidates": this.scenario.config["modes"],
                "variable": "mode"
            };
            options["color"] = this.scenario.config["screen"]["menu_color"];
            options["layout"] = this.scenario.config["screen"]["menu_layout"];
            options["size"] = this.scenario.config["screen"]["menu_size"];
            let scene = new scenario.Scene(null, title_img);
            let ask = new scenario.Ask(options);
            event = await this.exec_cmd(event, ["title", this.window_title]);
            event = await this.exec_cmd(event, scene);
            event = await this.exec_cmd(event, ask);
            return event;
        } else
            return null;
    }

    async execute_scenario(event: any): Promise<any> {
        var gen = this.scenario.run();
        for (let i: any = gen.next(); !i.done; i = gen.next()) {
            let command: scenario.Command|void = i.value;
            try {
                event = await this.exec_cmd(event, command);
            }catch(reason) {
                console.log("rejected. event:" + reason)
                this.scenario.force(Array.from(this.scenario.config["failure"] || []));
                gen = this.scenario.loop(null);
                event = reason;
            }
        }
        console.log("Terminate scenario.")
        return event;
    }

    run() {
        let filename = process.argv[process.argv.length - 1];
        let root_path = path.dirname(filename);

        console.log("Reading config (" + filename + ")")

        const yamlText = fs.readFileSync(filename, 'utf8')
        let config = yaml.safeLoad(yamlText);

        this.scenario = new scenario.Scenario(root_path, config);

        let size = config["screen"]["size"];
        let w = size[0], h = size[1];
        let point = electron.screen.getCursorScreenPoint();
        let display = electron.screen.getDisplayNearestPoint(point);

        // Create the browser window.
        this.screen = new electron.BrowserWindow({
            x: display.bounds.x + (display.bounds.width - w) / 2,
            y: display.bounds.y + (display.bounds.height - h) / 2,
            width: w,
            height: h,
            webPreferences: {
                nodeIntegration: true
            }
        })
        this.screen.setMenuBarVisibility(false);
        this.screen.setResizable(false);
        // and load the index.html of the app.
        this.screen.loadFile('./ui/index.html');
        this.window_title = path.basename(path.dirname(filename));
        this.receive_others();
        let doit = async() => {
            let event = await this.receive_start();
            while (true) {
                event = await this.title(event);
                event = await this.execute_scenario(event);
            }
        }
        doit();
    }
}


let scenario_test = () => {
    let filename = process.argv[process.argv.length - 1];
    let root_path = path.dirname(filename);
    console.log("Reading config (" + filename + ")")

    const yamlText = fs.readFileSync(filename, 'utf8')
    let config = yaml.safeLoad(yamlText);

    let sc = new scenario.Scenario(root_path, config)

    sc.variables["mode"] = sc.config["modes"][sc.config["modes"].length - 1];

    for (let k in sc.config) {
        console.log(" config." + k + ": " + sc.config[k])
    }
    const g = sc.run();
    for (var i = g.next(); !i.done; i = g.next()) {
        let command = i.value;
        if (command instanceof scenario.Scene) {
            let scene = command as scenario.Scene;
            console.log("Scene : sounds=" + scene.sound + ", images=" + scene.image);
        } else if (command instanceof scenario.Ask) {
            let ask = command as scenario.Ask;
            console.log("Ask : options=" + ask.options);
        }
    }
}

//scenario_test();
let gui = new ScenarioPlayer();
electron.app.on('ready', () => { gui.run() });