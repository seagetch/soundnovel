import * as $ from 'jquery';
import { ipcRenderer } from 'electron';
//import Vue from "vue";
import ImageViewer from "./ImageViewer";
import { AudioPlayer } from "./AudioPlayer";
import * as helper from "./helpers"

var command_name : string = "";
//var audio : HTMLAudioElement;
//var image_resource : HTMLImageElement | HTMLCanvasElement = null;
var fullscreen = false;
var initialized = false;
var screen_size = [window.innerWidth, window.innerHeight];

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
    audio_player.play().then(() => {
        ipcRenderer.send("command", command_name)
    }).catch(() => {
        ipcRenderer.send("terminate", command_name)
    })
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
            }).hover((ev: any) => {
                $(ev.target).css({ "color": hcolor })
            }, (ev: any) => {
                $(ev.target).css({ "color": color })
            }).mousedown((ev: any) =>{
                $(ev.target).css({ "color": scolor })
            }).click((ev: any) => {
                selection.css({"display": "none"});
                if (observer)
                    observer.disconnect();
                ipcRenderer.send("set-variable", options["variable"], c);
                ipcRenderer.send("command", command_name);
            }).appendTo(selection);
        }
    }
    observer = helper.on_element_resize(selection, on_update);
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


ipcRenderer.on("screen", (event: any, value: [number, number]) => {
    screen_size = value;
    console.log("screen="+value)
})

// Start communication between GUI frontend and backend.
ipcRenderer.send("start");