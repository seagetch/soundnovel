const { ipcRenderer } = require('electron');

var command_name : string = "";
//var audio : HTMLAudioElement;
//var image_resource : HTMLImageElement | HTMLCanvasElement = null;
var fullscreen = false;
var initialized = false;
var screen_size = [window.innerWidth, window.innerHeight];

function on_element_resize(element: JQuery<any>, callback: (element: JQuery<any>)=>void) {
    let previous_width : number = element.width();
    let observer = new MutationObserver((entries)=>{
        for (let e of entries) {
            let w = $(e.target).width();
            if (w != previous_width)
                callback(element);
            previous_width = w;
        }
    });
    observer.observe(element[0], {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['style']
    });
    return observer;
}
function on_canvas_resize(element: JQuery<any>, callback: (element: JQuery<any>)=>void) {
    let observer = new MutationObserver((entries)=>{
        for (let e of entries) {
            callback(element);
        }
    });
    observer.observe(element[0], {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['width', 'height']
    });
    return observer;
}

class ImageViewer {
    private image_resource : HTMLImageElement | HTMLCanvasElement = null;
    private canvas: HTMLCanvasElement;

    image_renderer() {
        let ctx = this.canvas.getContext('2d');
        let dest_rate = this.canvas.width / this.canvas.height;
        if (this.image_resource) {
            let src_rate  = this.image_resource.width / this.image_resource.height;
            if (src_rate > dest_rate) {
                let y = this.image_resource.height * this.canvas.width / this.image_resource.width;
                ctx.fillStyle = "rgb(0, 0, 0)";
                ctx.fillRect(0,                       0, this.canvas.width, (this.canvas.height - y) / 2);
                ctx.fillRect(0, (this.canvas.height + y) / 2, this.canvas.width, (this.canvas.height - y) / 2);
            ctx.drawImage(this.image_resource, 0, 0, this.image_resource.width, this.image_resource.height, 0, (this.canvas.height - y) / 2, this.canvas.width, y);
            } else {
                let x = this.image_resource.width * this.canvas.height / this.image_resource.height;
                ctx.fillStyle = "rgb(0, 0, 0)";
                ctx.fillRect(                     0, 0, (this.canvas.width - x) / 2, this.canvas.height);
                ctx.fillRect((this.canvas.width + x) / 2, 0, (this.canvas.width - x) / 2, this.canvas.height);
                ctx.drawImage(this.image_resource, 0, 0, this.image_resource.width, this.image_resource.height, (this.canvas.width - x) / 2, 0, x, this.canvas.height);
            }
        } else {
            ctx.fillStyle = "rgb(0, 0, 0)";
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    constructor (canvas : HTMLCanvasElement) {
        this.canvas = canvas;
    }

    truncated_load(filename: string, bounds:[[number, number], [number, number]]) {
        let canvas : HTMLCanvasElement = $("<canvas>").get()[0] as HTMLCanvasElement
        return new Promise((resolve, reject) => {
            let i = new Image();
            let ctx = canvas.getContext('2d');
            i.onload = (ev: Event) => {
                canvas.width = i.width * bounds[1][0];
                canvas.height = i.height * bounds[1][1];
                ctx.drawImage(i, i.width * bounds[0][0], i.height * bounds[0][1], canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
                resolve(canvas);
            }
            i.src=filename;
        })
    }

    tiled_load(image_src: any[]) {
        let off_canvas : HTMLCanvasElement = $("<canvas>").get()[0] as HTMLCanvasElement
        return new Promise((resolve, reject) => {
            let ctx = off_canvas.getContext('2d');
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
                    ctx.drawImage(i, x, y);
                    x += ofs_x * i.width;
                    y += ofs_y * i.height;
                }
                resolve(off_canvas);
            });    
        })
    }

    file_load(filename: string) {
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.onload = (ev) => {
                resolve(image);
            }
            image.src = filename;
        });
    }


    load (image_src: any) {
        if (!$(this.canvas).attr("observer")) {
            let canvas_observer = on_canvas_resize($(this.canvas), (elem)=>{
                this.image_renderer();
            });
            $(this.canvas).attr("observer", 1);
        }
        let promise : Promise<any> = null;
        if (Array.isArray(image_src)) {
            switch (image_src[0]) {
            case "truncate":
                promise = this.truncated_load(image_src[1], image_src[2]);
                break;
            case "horizontal":
            case "vertical":
                promise = this.tiled_load(image_src);
                break;
            default:
                console.log("Unknown command: "+image_src[0])
            }
        } else if (typeof image_src == "string")
            promise = this.file_load(image_src);

        if (promise) {
            promise.then((canvas:HTMLCanvasElement)=> {
                this.image_resource = canvas;
                this.image_renderer();    
            })
        } else {
            alert("Unknows image src="+image_src)
        }
    }
};

class AudioPlayer {
    private sound : JQuery<any>;
    private audio: HTMLAudioElement = null;
    private observer: MutationObserver = null;

    constructor(sound: JQuery<any>) {
        this.sound = sound;
    }

    create_audio(filename: string): HTMLAudioElement {
        return new Audio(filename);
    }

    generate_button(button_info: any) {
        let cmd : {[key: string]: [string, string, ()=>void]} = button_info.command;
        let button = $("<span>").attr("id", button_info.name).css({
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
                (ev.target as {[key:string]:any}).trigger();
            }
        });
        // Binding trigger method to button DOM.
        let button_ : {[key:string]: any} = button[0];
        button_.trigger = function() {
            let states = $(button).attr("states");
            cmd[states][2]();
        }
        button_.trigger_force = function(states: string) {
            cmd[states][2]();
        }
        // Watching "state" attribute of the button.
        new MutationObserver((entries) => {
            for (let e of entries) {
                let states = $(e.target).attr("states");
                $(e.target).html(button_info.command[states][0]);
            }
        }).observe(button[0], {
            attributes: true,
            attributeFilter: ["states"]
        });
        button.attr("states", button_info.state());
        return button;
    }

    bind_events() {
        // Update progress bar 
        let scanvas : HTMLCanvasElement = this.sound.find('#sound-progress')[0] as HTMLCanvasElement;

        $(this.audio).on("ended", (event:Event) => {
            if (this.observer)
                this.observer.disconnect();
            ipcRenderer.send("command", command_name);
            this.audio = null;
        });

        // Connecting audio and Progress bar.
        $(this.audio).on("timeupdate", () => {
            if (this.audio) {
                let rate = this.audio.currentTime / this.audio.duration;
                let w = scanvas.width, h = scanvas.height;
                let ctx = scanvas.getContext('2d');
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, w * rate, 32);
                ctx.fillStyle = "rgb(96, 96, 96)";
                ctx.fillRect(w * rate, 0, w - w * rate, 32);
            }
        });

        $(scanvas).off("mousedown").on("mousedown", (ev: Event) => {
            let mev = ev as MouseEvent;
            if (this.audio && this.audio.duration > 0) {
                let rate = mev.offsetX   / scanvas.width;
                this.audio.currentTime = rate * this.audio.duration;
            }
        });

        // Connecting button state with media states.
        $(this.audio).on("pause", () => {
            this.sound.find("#Play").attr("states", "Play")
        });

        $(this.audio).on("play", () => {
            this.sound.find("#Play").attr("states", "Pause")
        });
        $(this.audio).on("volumechange", () => {
            if (this.audio.muted) {
                this.sound.find("#Mute").attr("states", "Unmute")
            } else
                this.sound.find("#Mute").attr("states", "Mute")
        });

        // Adding popup capabilities for sound panel.
        let sound_op_left  = this.sound.find("#sound-ops")
        let sound_op_right = this.sound.find("#sound-ops-right")

        this.sound.off("mouseenter").on("mouseenter", (ev) => {
            this.sound.fadeTo(250, 0.5);
        });
        this.sound.off("mouseleave").on("mouseleave", (ev) => {
            this.sound.fadeTo(250, 0.0);
        });

        // Resizing progress bar on window resize event.
        let progress_size = (elem?: any) => {
            scanvas.width = (this.sound.innerWidth() - sound_op_left.outerWidth() - sound_op_right.outerWidth()) - 20;
            scanvas.style.width = scanvas.width + "px";
        }
        this.observer = on_element_resize(this.sound, progress_size);
        progress_size();

        $(window).off("keydown").on("keydown", (event: Event) => {
            let ke = event as KeyboardEvent;
            if (this.audio) {
                if (ke.key == 'Enter') {
                    ($("#sound").find("#Next")[0] as {[key:string]:any}).trigger();
                } else if (ke.keyCode == 32) {
                    ($("#sound").find("#Play")[0] as {[key:string]:any}).trigger();
                } else if (ke.keyCode == 37) {
                    ($("#sound").find("#Backward")[0] as {[key:string]:any}).trigger();
                } else if (ke.keyCode == 39) {
                    ($("#sound").find("#Forward")[0] as {[key:string]:any}).trigger();
                } else if (ke.key == 'Backspace') {
                    ($("#sound").find("#Cancel")[0] as {[key:string]:any}).trigger();
                }
            }
            if (ke.key == 'Escape') {
                ($("#sound").find("#Fullscreen")[0] as {[key:string]:any}).trigger_force("Unfullscreen");
            }
        });
        
    }
    
    load(filename: string) {
        // Playing sound.
        if (filename) {
            this.audio = this.create_audio(filename);
            let audio_rewind = ()=>{ this.audio.currentTime = 0;}
            let audio_rewind10 = ()=>{ this.audio.currentTime -= 10;}
            let audio_forward10 = ()=>{ this.audio.currentTime += 10;}
            let audio_forward   = ()=>{
                this.audio.pause();
                if (this.observer)
                    this.observer.disconnect();
                ipcRenderer.send("command", command_name)
                this.audio = null;
            }
            let audio_mute     = ()=>{ this.audio.muted = true;  }
            let audio_unmute   = ()=>{ this.audio.muted = false; }
            let scenario_terminate = () => {
                this.audio.pause();
                if (this.observer)
                    this.observer.disconnect();
                ipcRenderer.send("terminate", command_name)
                this.audio = null;
            }
            let audio_play = () =>{this.audio.play()}
            let audio_pause = () =>{this.audio.pause()}
            let set_fullscreen   = ()=>{ipcRenderer.send("fullscreen", true);}
            let set_unfullscreen = ()=>{ipcRenderer.send("fullscreen", false);}
        
            let buttons: {
                name: string, 
                state: ()=>string, 
                side:string, 
                command: {[key: string]: [string, string, ()=>void]} 
            }[] = 
            [
                {
                    name: "Previous", 
                    state: ()=>{ return "Previous";}, 
                    side: "left", 
                    command: {"Previous": ["⏮", "Previous", audio_rewind]}
                }, 
                {
                    name: "Backward", 
                    state: ()=>{ return "Backward";},
                    side: "left",
                    command: {"Backward": ["⏪", "Backward", audio_rewind10]}
                },
                {
                    name: "Play", 
                    state: () => { return this.audio.paused ? "Play": "Paused" },
                    side: "left",
                    command: {
                        "Pause": ["⏸", "Play", audio_pause], 
                        "Play": ["⏵", "Pause", audio_play] 
                    }
                }, 
                {
                    name: "Forward", 
                    state: () => {return "Forward"},
                    side: "left",
                    command: {"Forward": ["⏩", "Forward", audio_forward10]}
                }, 
                {
                    name: "Next", 
                    state: () =>{ return "Next"},
                    side: "left",
                    command: {"Next": ["⏭", "Next", audio_forward]}
                },
                {
                    name: "Mute", 
                    state: ()=> { return this.audio.muted? "Unmute": "Mute"},
                    side: "right",
                    command: {
                        "Mute": ["🔈", "Unmute", audio_mute], 
                        "Unmute": ["🔇", "Mute", audio_unmute]
                    }
                },
                {
                    name: "Cancel", 
                    state: ()=>{ return "Cancel"},
                    side: "left",
                    command: {"Cancel": ["⏹", "Cancel", scenario_terminate]}
                }, 
                {
                    name: "Fullscreen", 
                    state: ()=>{return fullscreen? "Unfullscreen":"Fullscreen"},
                    side: "right",
                    command: {
                        "Fullscreen": ["⊞", "Unfullscreen", set_fullscreen],
                        "Unfullscreen": ["⊟", "Fullscreen", set_unfullscreen] 
                    }
                }
            ]

            // Generating buttons.
            let sound_op_left = this.sound.find("#sound-ops").html("");
            let sound_op_right = this.sound.find("#sound-ops-right").html("");
            for (let i =0; i < buttons.length; i++) {
                let button = this.generate_button(buttons[i]);
                button.appendTo((buttons[i].side == "left")?sound_op_left:sound_op_right);
            }

            // Binding event handlers.
            this.bind_events();

        } else {
            this.audio = null;
            this.sound.off("mouseenter");
            this.sound.css({"opacity": "0.0"});
        }        
    }

    play() : void {
        if (this.audio)
            this.audio.play();
        else {
            ipcRenderer.send("command", command_name);
        }
    }
}

var image_viewer : ImageViewer = null;
function scene(command: any[]) {
    // Displaying image.
    let image_src : any = command[2];
    let canvas : HTMLCanvasElement = $("#canvas")[0] as HTMLCanvasElement;
    if (!image_viewer)
        image_viewer = new ImageViewer(canvas);
    image_viewer.load(image_src);

    // Playing sound.
    let audio_player : AudioPlayer = new AudioPlayer($("#sound"));
    audio_player.load(command[1]);
    audio_player.play();
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
    let observer : MutationObserver = null;
    let on_update = (ev?: JQuery<any>) => {
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
                if (observer)
                    observer.disconnect();
                ipcRenderer.send("set-variable", options["variable"], c);
                ipcRenderer.send("command", command_name);
            }).appendTo(selection);
        }
    }
    observer = on_element_resize(selection, on_update);
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
            $("#selection").width(1);
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
    $("#sound").find("#Fullscreen").attr("states", fullscreen? "Unfullscreen": "Fullscreen");
    console.log("fullscreen="+value)
})


ipcRenderer.on("screen", (event: any, value: [number, number]) => {
    screen_size = value;
    console.log("screen="+value)
})

// Start communication between GUI frontend and backend.
ipcRenderer.send("start");