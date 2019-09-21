const { ipcRenderer } = require('electron');

var command_name : string = "";
var audio : HTMLAudioElement;
var initialized = false;

function image_renderer(canvas: HTMLCanvasElement, image: HTMLImageElement|HTMLCanvasElement) {
    let ctx = canvas.getContext('2d');
    return (ev?: Event) => {
        let dest_rate = canvas.width / canvas.height;
        let src_rate  = image.width / image.height;
        if (src_rate > dest_rate) {
            let y = image.height * canvas.width / image.width;
            ctx.fillStyle = "rgb(0, 0, 0)";
            ctx.fillRect(0,                       0, canvas.width, (canvas.height - y) / 2);
            ctx.fillRect(0, (canvas.height + y) / 2, canvas.width, (canvas.height - y) / 2);
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, (canvas.height - y) / 2, canvas.width, y);
        } else {
            let x = image.width * canvas.height / image.height;
            ctx.fillStyle = "rgb(0, 0, 0)";
            ctx.fillRect(                     0, 0, (canvas.width - x) / 2, canvas.height);
            ctx.fillRect((canvas.width + x) / 2, 0, (canvas.width - x) / 2, canvas.height);
            ctx.drawImage(image, 0, 0, image.width, image.height, (canvas.width - x) / 2, 0, x, canvas.height);
        }
    };
}

function scene(command: any[]) {
    let image_src : any = command[2];

    let canvas : HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;

    if (Array.isArray(image_src)) {
        let off_canvas : HTMLCanvasElement = $("<canvas>").get()[0] as HTMLCanvasElement
        let off_ctx = off_canvas.getContext('2d');
        switch (image_src[0]) {
        case "truncate": {
            let i = new Image();
            let bounds : [[number, number], [number, number]] = image_src[2]
            i.onload = (ev: Event) => {
                off_canvas.width = i.width * bounds[1][0];
                off_canvas.height = i.height * bounds[1][1];
                off_ctx.drawImage(i, i.width * bounds[0][0], i.height * bounds[0][1], off_canvas.width, off_canvas.height, 0, 0, off_canvas.width, off_canvas.height)
                image_renderer(canvas, off_canvas)();
            }
            i.src=image_src[1]
        } break;
        case "horizontal":
        case "vertical": {
            Promise.all((image_src.slice(1, image_src.length) as string[]).map((elem: string) : Promise<HTMLImageElement> => {
                let i : HTMLImageElement = new Image() as HTMLImageElement;
                return new Promise((resolve, reject) => {
                    i.onload = (ev: Event) => {
                        resolve(i)
                    }
                    i.src = elem;
                })
            })).then((images: HTMLImageElement[]) => {
                var red_w : (x: number, y: number, _1: number, _2: number[]) => number
                var red_h : (x: number, y: number, _1: number, _2: number[]) => number
                var ofs_x: number = 0, ofs_y:number = 0;
                if (image_src[0] == "horizontal") {
                    red_w = (x, y, _1, _2) => { return x + y; }
                    red_h = (x, y, _1, _2) => { return (x>y)? x: y; }
                    ofs_x = 1;
                } else {
                    red_h = (x, y, _1, _2) => { return x + y; }
                    red_w = (x, y, _1, _2) => { return (x>y)? x: y; }
                    ofs_y = 1;
                }
                let w = images.map((i) => { return i.width;}).reduce(red_w);
                let h = images.map((i) => { return i.height;}).reduce(red_h);
                off_canvas.width = w;
                off_canvas.height = h;
                var x = 0, y = 0;
                for (let i of images) {
                    off_ctx.drawImage(i, x, y);
                    x += ofs_x * i.width;
                    y += ofs_y * i.height;
                }
                image_renderer(canvas, off_canvas)();
            });
        } break;
        default:
            console.log("Unknown command: "+image_src[0])
        }
        
    } else if (typeof image_src == "string") {
        let image = new Image();
        image.onload = image_renderer(canvas, image);
        image.src = image_src as string;
    } else {
        alert("Unknows image src="+image_src)
    }

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

        let update_progress = () => {
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
            $(scanvas).off("mousedown").on("mousedown", (ev: Event) => {
            let mev = ev as MouseEvent;
            if (audio && audio.duration > 0) {
                let rate = mev.x / scanvas.width;
                audio.currentTime = rate * audio.duration;
                update_progress();
            }
        });

        audio.onended = function(event:Event) {
            window.clearTimeout(timeout_id);
            ipcRenderer.send("command", command_name);
            audio = null;
        }
        let sound = $("#sound-ops").html("");
        for (let i =0; i < operation_states.length; i++) {
            let cmd : {[key: string]: [string, string, ()=>void]} = sound_operations[i];
            $("<div>").html(cmd[operation_states[i]][0]).css({
                "display": "inline", 
                "font-size": "64px"
            }).on("click", (ev:Event) => {
                let states : string = operation_states[i];
                cmd[states][2]();
                operation_states[i] = cmd[states][1];
                $(ev.target).html(sound_operations[i][cmd[states][1]][0]);
            }).appendTo(sound);
        }
        audio.play();
    } else {
        audio = null;
        ipcRenderer.send("command", command_name);
    }

}

function ask(command: any[]) {
    let options = command[1];
    let location = options["location"];
    let x = location ? location[0] : 0, y = location ? location[1] : 0
    let fontsize : number = options["size"] ? options["size"] : 40
    let layout = options["layout"];
    let direction = layout ? layout["direction"] : "vertical"
    let ofs_x : number = layout ? layout["offset"][0] : 0, ofs_y : number = layout ? layout["offset"][1] : 100
    let line_size = layout ? layout["line-size"] : null;
    let color_info = options["color"]
    let color = color_info ? color_info["base"] : "rgb(240, 240, 240)";
    let hcolor = color_info ? color_info["hover"] : "rgb(240, 224, 0)";
    let scolor = color_info ? color_info["selected"] : "rgb(240, 0, 0)";
    let candidates : any[] = command[1]["candidates"];

    let selection = $("#selection").html("").css({
        "position": "absolute",
        "top": y +"px",
        "left": x + "px",
        "z-index": "100",
        "display": "block",
        "border-color": "#000000",
        "width": (direction == "horizontal" && line_size) ? (ofs_x * line_size) + "px" : "auto", 
        "height": (direction == "vertical" && line_size) ? (ofs_y * line_size) + "px" : "auto" 
    })
    for (let c of candidates) {
        $("<div>").html(c).css({
            "font-size": fontsize.toString() + "px",
            "font-weight": "700",
            "flex-direction": (direction == "vertical")? "column": "row",
            "color": color,
            "display": (direction == "vertical")? "block": "inline-block",
            "padding": "0",
            "margin": "0",
            "height": ofs_y,
            "width": (direction == "vertical")? "auto": ofs_x + "px",
            "z-index": fontsize.toString() + "px"
        }).hover((ev) => {
            $(ev.target).css({ "color": hcolor })
        }, (ev) => {
            $(ev.target).css({ "color": color })
        }).mousedown((ev) =>{
            $(ev.target).css({ "color": scolor })
        }).click((ev) => {
            selection.css({"display": "none"});
            ipcRenderer.send("set-variable", options["variable"], c);
            ipcRenderer.send("command", command_name);
        }).appendTo(selection);
    }
}

ipcRenderer.on("command", (event:any, command: any[]) => {
    if (!initialized) {
        initialized = true;
        let w : number = window.innerWidth, h : number = window.innerHeight;
        $("#background").css({
            "padding": "0",
            "margin": "0",
            "position": "absolute",
            "top": "0",
            "left": "0",
            "z-index": "-1"
        });
        let canvas : HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
        canvas.width = w;
        canvas.height = h;

        $("#sound-progress").css({
            "position": "absolute",
            "height": "32px",
            "width": w + "px",
            "z-index": "1",
            "top": (h - 32).toString()+"px",
            "left": "0",
            "opacity": "0.5",
            "flex-direction": "row"
        })
        let scanvas : HTMLCanvasElement = document.getElementById("sound-progress") as HTMLCanvasElement;
        scanvas.width = w;
        scanvas.height = 32;
    }
    command_name = command[0];
    if (command[0] == "scene") {
        scene(command)
    } else if (command[0] == "ask") {
        ask(command);
    } else if (command[0] == "title") {
        document.title = command[1];
        ipcRenderer.send("command", command_name);
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