const { ipcRenderer } = require('electron');

var command_name : string = "";
var audio : HTMLAudioElement;
var image_resource : HTMLImageElement | HTMLCanvasElement = null;
var fullscreen = false;
var initialized = false;
var screen_size = [window.innerWidth, window.innerHeight];

function image_renderer(canvas: HTMLCanvasElement) {
    let ctx = canvas.getContext('2d');
    return (ev?: Event) => {
        let dest_rate = canvas.width / canvas.height;
        if (image_resource) {
            let src_rate  = image_resource.width / image_resource.height;
            if (src_rate > dest_rate) {
                let y = image_resource.height * canvas.width / image_resource.width;
                ctx.fillStyle = "rgb(0, 0, 0)";
                ctx.fillRect(0,                       0, canvas.width, (canvas.height - y) / 2);
                ctx.fillRect(0, (canvas.height + y) / 2, canvas.width, (canvas.height - y) / 2);
            ctx.drawImage(image_resource, 0, 0, image_resource.width, image_resource.height, 0, (canvas.height - y) / 2, canvas.width, y);
            } else {
                let x = image_resource.width * canvas.height / image_resource.height;
                ctx.fillStyle = "rgb(0, 0, 0)";
                ctx.fillRect(                     0, 0, (canvas.width - x) / 2, canvas.height);
                ctx.fillRect((canvas.width + x) / 2, 0, (canvas.width - x) / 2, canvas.height);
                ctx.drawImage(image_resource, 0, 0, image_resource.width, image_resource.height, (canvas.width - x) / 2, 0, x, canvas.height);
            }
        } else {
            ctx.fillStyle = "rgb(0, 0, 0)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
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
                off_ctx.drawImage(i, i.width * bounds[0][0], i.height * bounds[0][1], off_canvas.width, off_canvas.height, 0, 0, off_canvas.width, off_canvas.height);
                image_resource = off_canvas;
                image_renderer(canvas)();
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
                image_resource = off_canvas;
                image_renderer(canvas)();
            });
        } break;
        default:
            console.log("Unknown command: "+image_src[0])
        }
        
    } else if (typeof image_src == "string") {
        let image = new Image();
        image.onload = (ev) => {
            image_resource = image;
            image_renderer(canvas)(ev);
        }
        image.src = image_src as string;
    } else {
        alert("Unknows image src="+image_src)
    }

    let sound = $("#sound");
    if (command[1]) {
        audio = new Audio(command[1]);
        let observer : MutationObserver = null;
        let audio_rewind   = ()=>{ audio.currentTime = 0;}
        let audio_rewind10 = ()=>{ audio.currentTime -= 10;}
        let audio_forward10 = ()=>{ audio.currentTime += 10;}
        let audio_forward   = ()=>{
            audio.pause();
            if (observer)
                observer.disconnect();
            ipcRenderer.send("command", command_name)
            audio = null;
        }
        let audio_mute     = ()=>{ audio.muted = true;  }
        let audio_unmute   = ()=>{ audio.muted = false; }
        let scenario_terminate = () => {
            audio.pause();
            if (observer)
                observer.disconnect();
            ipcRenderer.send("terminate", command_name)
            audio = null;
        }
        let set_fullscreen   = ()=>{ipcRenderer.send("fullscreen", true);}
        let set_unfullscreen = ()=>{ipcRenderer.send("fullscreen", false);}
        let sound_operations : {[key:string]: [string, string, ()=>void, string]}[] = [
            {"Previous": ["⏮", "Previous", audio_rewind, "left"]},
            {"Backward": ["⏪", "Backward", audio_rewind10, "left"]},
            {"Pause": ["⏸", "Play", ()=>{audio.pause()}, "left"], "Play": ["⏵", "Pause", ()=>{audio.play()}, "left"] },
            {"Forward": ["⏩", "Forward", audio_forward10, "left"]},
            {"Next": ["⏭", "Next", audio_forward, "left"]},
            {"Mute": ["🔈", "Unmute", audio_mute, "right"], "Unmute": ["🔇", "Mute", audio_unmute, "right"]},
            {"Cancel": ["⏹", "Cancel", scenario_terminate, "left"]},
            {"Fullscreen": ["⊞", "Unfullscreen", set_fullscreen, "right"], "Unfullscreen": ["⊟", "Fullscreen", set_unfullscreen, "right"] },
        ]
        let operation_states = [
            "Previous", "Backward", "Pause", "Forward", "Next", "Mute", "Cancel", fullscreen? "Unfullscreen":"Fullscreen"
        ]

        let update_progress = () => {
            if (audio) {
                let rate = audio.currentTime / audio.duration;
                let canvas : HTMLCanvasElement = document.getElementById('sound-progress') as HTMLCanvasElement;
                let w = canvas.width, h = canvas.height;
                let ctx = canvas.getContext('2d');
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, w * rate, 32);
                ctx.fillStyle = "rgb(96, 96, 96)";
                ctx.fillRect(w * rate, 0, w - w * rate, 32);
            }
        }
        audio.ontimeupdate = update_progress;

        let scanvas : HTMLCanvasElement = $('#sound-progress').get()[0] as HTMLCanvasElement;
        $(scanvas).off("mousedown").on("mousedown", (ev: Event) => {
            let mev = ev as MouseEvent;
            if (audio && audio.duration > 0) {
                let rate = mev.offsetX   / scanvas.width;
                audio.currentTime = rate * audio.duration;
            }
        });

        audio.onended = function(event:Event) {
            if (observer)
                observer.disconnect();
            ipcRenderer.send("command", command_name);
            audio = null;
        }
        let sound_op_left = $("#sound-ops").html("");
        let sound_op_right = $("#sound-ops-right").html("");
        for (let i =0; i < operation_states.length; i++) {
            let cmd : {[key: string]: [string, string, ()=>void, string]} = sound_operations[i];
            $("<span>").html(cmd[operation_states[i]][0]).css({
                "margin-left": "0",
                "margin-top": "8",
                "margin-bottom": "8",
                "display": "inline-block", 
                "font-size": "32px",
                "width": "48px",
                "height": "48px",
                "text-align": "center",
                "border-radius": "50%",
            }).hover((ev)=>{
                let target = $(ev.target);
                if (ev.buttons & 1)
                   target.css({ "color": "black", "background-color": "white" })
                else
                    target.css({ "color": "inherit", "background-color": "#808080" })
            }, (ev)=>{
                let target = $(ev.target);
                target.css({ "color": "inherit", "background-color": "transparent" })
            }).on("mousedown", (ev) => {
                let target = $(ev.target);
                if (ev.buttons & 1)
                    target.css({ "color": "black", "background-color": "white" })
                else
                    target.css({ "color": "inherit", "background-color": "#808080" })
            }).on("mouseup", (ev) => {
                let target = $(ev.target);
                target.css({ "color": "inherit", "background-color": "transparent" })
                if (ev.button == 0) {
                    let states : string = operation_states[i];
                    cmd[states][2]();
                    operation_states[i] = cmd[states][1];
                    $(ev.target).html(sound_operations[i][cmd[states][1]][0]);
                }
            }).appendTo((cmd[operation_states[i]][3] == "left")?sound_op_left:sound_op_right);
        }
        scanvas.width = (sound.innerWidth() - sound_op_left.outerWidth() - sound_op_right.outerWidth()) * 0.99;
        scanvas.style.width = scanvas.width + "px";
        sound.off("mouseenter");
        sound.off("mouseleave");
        sound.hover((ev) => {
            sound.fadeTo(250, 0.5);
        }, (ev) => {
            sound.fadeTo(250, 0.0);
        })


        {
            let previous_width : number = sound.width();
            observer = new MutationObserver((entries)=>{
                for (let e of entries) {
                    let w = $(e.target).width();
                    if (w != previous_width)
                    scanvas.width = (sound.innerWidth() - sound_op_left.outerWidth() - sound_op_right.outerWidth()) * 0.99;
                    scanvas.style.width = scanvas.width + "px";
                    previous_width = w;
                }
            });
            observer.observe(sound[0], {
              attributes: true,
              attributeOldValue: true,
              attributeFilter: ['style']
            });
        }
        audio.play();
    } else {
        audio = null;
        sound.off("mouseenter");
        sound.css({"opacity": "0.0"});
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
        "display": "block"
    });
    let on_update = (ev?: Event) => {
        let current_rate = window.innerWidth / window.innerHeight;
        let orig_rate = screen_size[0] / screen_size[1];
    
        let scale = 1.0, offset_x = 0, offset_y = 0;
        if (screen_size[0] != window.innerWidth) {
            if (current_rate < orig_rate) {
                scale = window.innerWidth / screen_size[0];
                offset_y = (window.innerHeight - screen_size[1] * scale) / 2;
            } else {
                scale = window.innerHeight / screen_size[1];
                offset_x = (window.innerWidth - screen_size[0] * scale) / 2;
            }
        }
    
        selection = $("#selection").html("").css({
            "position": "absolute",
            "top": (scale * y + offset_y) +"px",
            "left": (scale * x + offset_x) + "px",
            "z-index": "100",
            "border-color": "#000000",
            "width": (direction == "horizontal" && line_size) ? (scale * ofs_x * line_size) + "px" : "auto", 
            "height": (direction == "vertical" && line_size) ? (scale * ofs_y * line_size) + "px" : "auto" 
        })
        for (let c of candidates) {
            $("<div>").html(c).css({
                "font-size": (fontsize*scale).toString() + "px",
                "font-weight": "700",
                "flex-direction": (direction == "vertical")? "column": "row",
                "color": color,
                "display": (direction == "vertical")? "block": "inline-block",
                "padding": "0",
                "margin": "0",
                "height": (scale * ofs_y)+"px",
                "width": (direction == "vertical")? "auto": (scale * ofs_x) + "px",
                "z-index": (fontsize*scale).toString() + "px"
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
    $(window).on("resize", on_update);
    on_update();

}

ipcRenderer.on("command", (event:any, command: any[]) => {
    if (!initialized) {
        initialized = true;
        let w : number = window.innerWidth, h : number = window.innerHeight;
        let canvas : HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
        canvas.width = w;
        canvas.height = h;
        $(window).on("resize", (ev:Event) => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            image_renderer(canvas)();
        });
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

ipcRenderer.on("fullscreen", (event: any, value: boolean) => {
    fullscreen = value;
    console.log("fullscreen="+value)
})

ipcRenderer.on("screen", (event: any, value: [number, number]) => {
    screen_size = value;
    console.log("screen="+value)
})

window.onkeydown = (event: KeyboardEvent) => {
    if (event.key == 'Enter' && audio) {
        audio.pause();
        ipcRenderer.send("command", command_name);
        audio = null;
    }
    if (event.key == 'Escape') {
        ipcRenderer.send("fullscreen", false);
    }
}

// Start communication between GUI frontend and backend.
ipcRenderer.send("start");