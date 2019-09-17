const { ipcRenderer } = require('electron');

var command_name : string = "";
var audio : HTMLAudioElement;
var initialized = false;

function scene(command: any[]) {
    let image = new Image();
    image.src = command[2];
    image.onload = (ev: Event) => {
        let w = window.innerWidth, h = window.innerHeight;
        let canvas : HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, w, h);
    };

    if (command[1]) {
        var timeout_id : number = null;
        audio = new Audio(command[1]);
        let audio_rewind   = ()=>{ audio.currentTime = 0;}
        let audio_rewind10 = ()=>{ audio.currentTime -= 10;}
        let audio_forward10 = ()=>{ audio.currentTime += 10;}
        let audio_forward   = ()=>{
            audio.pause();
            ipcRenderer.send("command", command_name)
            audio = null;
            window.clearTimeout(timeout_id);
        }
        let scenario_terminate = () => {
            audio.pause();
            ipcRenderer.send("terminate", command_name)
            audio = null;
            window.clearTimeout(timeout_id);
        }
        let sound_operations : {[key:string]: [string, string, ()=>void]}[] = [
            {"Previous": ["⏮", "Previous", audio_rewind]},
            {"Backward": ["⏪", "Backward", audio_rewind10]},
            {"Pause": ["⏸", "Play", ()=>{audio.pause()}], "Play": ["⏵", "Pause", ()=>{audio.play()}] },
            {"Forward": ["⏩", "Forward", audio_forward10]},
            {"Next": ["⏭", "Next", audio_forward]},
            {"Cancel": ["⏹", "Cancel", scenario_terminate ]}
        ]
        let operation_states = [
            "Previous", "Backward", "Pause", "Forward", "Next", "Cancel"
        ]

        function update_progress() {
            if (audio) {
                let rate = audio.currentTime / audio.duration;
                let canvas : HTMLCanvasElement = document.getElementById('sound-progress') as HTMLCanvasElement;
                let w = canvas.width, h = canvas.height;
                let ctx = canvas.getContext('2d');
                ctx.fillStyle = "rgb(96,128,244)";
                ctx.fillRect(0, 0, w * rate, 32);
                ctx.fillStyle = "rgb(96, 96, 96)";
                ctx.fillRect(w * rate, 0, w - w * rate, 32);
            }
        }
        let progress = () => { 
            update_progress();
            timeout_id = window.setTimeout(progress, 1000);
        }
        timeout_id = window.setTimeout(progress, 1000);
        let scanvas : HTMLCanvasElement = document.getElementById('sound-progress') as HTMLCanvasElement;
        scanvas.onmousedown = (ev: MouseEvent) => {
            if (audio && audio.duration > 0) {
                let rate = ev.x / scanvas.width;
                audio.currentTime = rate * audio.duration;
                update_progress();
            }
        }
        
        document.getElementById("sound").appendChild(audio);
        audio.onended = function(event:Event) {
            window.clearTimeout(timeout_id);
            ipcRenderer.send("command", command_name);
            audio = null;
        }
        let sound = document.getElementById("sound-ops");
        sound.innerHTML="";
        var i = 0;
        for (let s of sound_operations) {
            let states = operation_states[i]
            var cmd_tmp : [string, string, ()=>void] = null;
            for (let ss in s) {
                if (ss == states) {
                    cmd_tmp = s[ss];
                }
            }
            let button = document.createElement("div");
            let text = document.createTextNode(cmd_tmp[0]);
            button.style.display = "inline";
            button.style.fontSize = "64px";
            button.appendChild(text);
            sound.appendChild(button);
            let index = i;
            button.onclick = (ev:Event) => {
                let states : string = operation_states[index];
                var cmd : [string, string, ()=>void] = sound_operations[index][states];
                cmd[2]();
                operation_states[index] = cmd[1];
                button.innerHTML=sound_operations[index][cmd[1]][0];
            }
            i ++;
        }
        audio.play();
    } else {
        audio = null;
        ipcRenderer.send("command", command_name);
    }

}

function ask(command: any[]) {
    let options = command[1];
    let selection = document.getElementById("selection");
    let location = options["location"];
    let x = location ? location[0] : 0, y = location ? location[1] : 0
    let fontsize : number = options["size"] ? options["size"] : 40
    let layout = options["layout"];
    let direction = layout ? layout["direction"] : "vertical"
    let ofs_x : number = layout ? layout["offset"][0] : 0, ofs_y : number = layout ? layout["offset"][1] : 100
    let line_size = layout ? layout["line-size"] : null;
    let color_info = options["color"]
    let color = color_info ? color_info["base"] : "#FEFEFE";
    let hcolor = color_info ? color_info["hover"] : "#FEE000";
    let scolor = color_info ? color_info["selected"] : "#FE0000";
    let candidates : any[] = command[1]["candidates"];

    selection.style.position = 'absolute';
    selection.style.top = y+"px";
    selection.style.left = x+"px";
    selection.innerHTML = "";
    selection.style.flexDirection = (direction == "vertical")? "column": "row";
    selection.style.zIndex = "100";
    selection.style.display = "block";
    selection.style.borderColor = "#000000";
    for (let c of candidates) {
        console.log("Ask: candidates="+c)
        let element = document.createElement("div");
        let text = document.createTextNode(c);
        element.appendChild(text);
        element.style.fontSize = fontsize.toString() + "px";
        element.style.fontWeight = "700";
        element.style.color = color;
        element.style.marginBottom = (ofs_y - fontsize).toString()+"px";
        element.style.zIndex = "100";
        element.onclick = (event: MouseEvent) => {
            selection.style.display = "none";
            ipcRenderer.send("set-variable", options["variable"], c);
            ipcRenderer.send("command", command_name);
        }
        selection.appendChild(element);
    }
}

ipcRenderer.on("command", (event:any, command: any[]) => {
    if (!initialized) {
        initialized = true;
        let background = document.getElementById("background");
        let w : number = window.innerWidth, h : number = window.innerHeight;
        background.style.padding = "0";
        background.style.margin = "0";
        background.style.position = "absolute";
        background.style.top = "0";
        background.style.left = "0";
        let canvas : HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
        canvas.width = w;
        canvas.height = h;
        background.style.zIndex = "-1";

        let sound = document.getElementById("sound-progress");
        sound.style.position = "absolute";
        sound.style.height = "32px";
        sound.style.width = w + "px";
        sound.style.zIndex = "1";
        sound.style.top = (h - 32).toString()+"px";
        sound.style.left = "0";
        sound.style.opacity = "0.5";
        sound.style.flexDirection = "row";
        let scanvas : HTMLCanvasElement = document.getElementById("sound-progress") as HTMLCanvasElement;
        scanvas.width = w;
        scanvas.height = 32;
    }
    command_name = command[0];
    if (command[0] == "scene") {
        scene(command)
    } else if (command[0] == "ask") {
        ask(command);
    } else {
        ipcRenderer.send("command-error", command_name)
    }
})

window.onkeydown = (event: KeyboardEvent) => {
    if (event.key == 'Enter' && audio) {
        audio.pause();
        ipcRenderer.send("command", command_name)
        audio = null;
    }
}

// Start communication between GUI frontend and backend.
ipcRenderer.send("command",command_name);