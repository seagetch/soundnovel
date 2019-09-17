
import Path = require("path");
import fs = require("fs");
import yaml = require('js-yaml');

import { scenario } from "./scenario/scenario";
const { app, BrowserWindow, ipcMain } = require('electron')

class ScenarioPlayer {
    private scenario: scenario.Scenario;
    private screen: any;
    constructor() {
    }

    receive_cmds() : Promise<any> {
        return new Promise<any>( (resolve, reject)=>{
            ipcMain.once("command", (event: any, name: string) => {
                if (name == "")
                    this.title(event)
                else
                    resolve(event);
            })
            ipcMain.removeAllListeners("terminate");
            ipcMain.once("terminate", (event: any, name: string) => {
                this.scenario.force(this.scenario.config["failure"] || []);
                reject(event);
                // TBD: must fire failure loop invokation.
            })
        });
    }
    receive_others() {
        ipcMain.on("set-variable", (event: any, name:string, value:string) => {
            this.scenario.variables[name] = value;
        })
    }
    post_cmd(event: any, command: scenario.Command|void) {
        if (command instanceof scenario.Scene) {
            let scene = command as scenario.Scene;
            event.reply("command", ["scene", scene.sound, scene.image]);
        } else if (command instanceof scenario.Ask) {
            let ask = command as scenario.Ask;
            event.reply("command", ["ask", ask.options])
        }
    }
    exec_cmd(event: any, command: scenario.Command|void) : Promise<any> {
        this.post_cmd(event, command);
        return this.receive_cmds() 
    }


    title(event: any) {
        let title_img = this.scenario.get_image_path(this.scenario.config["image_map"]["title"], 0);
        if (this.scenario.config["modes"]) {
            let options : {[key:string]: any}= {
                "location": this.scenario.config["screen"]["menu_location"],
                "candidates": this.scenario.config["modes"],
                "variable": "mode"
            };
            options["color"] = this.scenario.config["screen"]["menu_color"];
            options["layout"] = this.scenario.config["screen"]["manu_layout"];
            options["size"] = this.scenario.config["screen"]["manu_size"];
            let scene = new scenario.Scene(null, title_img);
            let ask = new scenario.Ask(options);
            return this.exec_cmd(event, scene).then((event: any)=>{ 
                return this.exec_cmd(event, ask)
            }).then((event: any)=>{
                return this.execute_scenario(event);
            })
        }
    }

    execute_scenario(event: any) : Promise<any> {
        var gen = this.scenario.run();
        let next_command = (event: any) : Promise<any> => {
            let i : any = gen.next();
            if (!i.done) {
                let command : scenario.Command|void = i.value;
                return this.exec_cmd(event, command).then(next_command).catch((reason:any) => {
                    console.log("rejected. event:"+reason)
                    gen = this.scenario.loop(null);
                    return next_command(reason);
                });
            } else {
                return this.title(event);
            }
        }
        return next_command(event);
    }
    run() {
        let filename = process.argv[2];
        let root_path = Path.dirname(filename);
        
        console.log("Reading config ("+filename+")")
        
        const yamlText = fs.readFileSync(filename, 'utf8')
        let config = yaml.safeLoad(yamlText);
        
        this.scenario = new scenario.Scenario(root_path, config);

        let size = config["screen"]["size"];
        let w = size[0], h = size[1];
        let x = w / 2, y = h / 2;

        // Create the browser window.
        this.screen = new BrowserWindow({
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
        let title = Path.basename(Path.dirname(filename));
        this.receive_others()
        this.receive_cmds()
    }
}


let scenario_test = () => {
    let filename = process.argv[2];
    let root_path = Path.dirname(filename);
    
    console.log("Reading config ("+filename+")")
    
    const yamlText = fs.readFileSync(filename, 'utf8')
    let config = yaml.safeLoad(yamlText);
    
    let sc = new scenario.Scenario(root_path, config)

    sc.variables["mode"] = sc.config["modes"][sc.config["modes"].length - 1];

    for (let k in sc.config) {
        console.log(" config."+k+": "+sc.config[k])
    }
    const g = sc.run();
    for (var i = g.next(); !i.done; i = g.next()) {
        let command = i.value;
        if (command instanceof scenario.Scene){
            let scene = command as scenario.Scene;
            console.log("Scene : sounds="+scene.sound+", images="+scene.image);
        } else if (command instanceof scenario.Ask) {
            let ask = command as scenario.Ask;
            console.log("Ask : options="+ask.options);
        }
    }
}

//scenario_test();
let gui = new ScenarioPlayer();
app.on('ready', () => {gui.run()});