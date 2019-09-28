import * as helper from "./helpers"
import { ipcRenderer } from "electron"
import screen from "./Screen"

export class AudioPlayer {
    private sound : JQuery<any>;
    private audio: HTMLAudioElement = null;
    private observer: MutationObserver = null;
    private resolve: any = null;
    private reject: any = null;

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
        }).hover((ev:any)=>{
            let target = $(ev.target);
            if (ev.buttons & 1)
            target.css({ "color": "black", "background-color": "white" })
            else
                target.css({ "color": "inherit", "background-color": "#808080" })
        }, (ev: any)=>{
            let target = $(ev.target);
            target.css({ "color": "inherit", "background-color": "transparent" })
        }).on("mousedown", (ev: any) => {
            let target = $(ev.target);
            if (ev.buttons & 1)
                target.css({ "color": "black", "background-color": "white" })
            else
                target.css({ "color": "inherit", "background-color": "#808080" })
        }).on("mouseup", (ev: any) => {
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

        screen.off_fullscreenchange()
        screen.fullscreenchange = (value: boolean) => {
            console.log("fullscreenchange")
            $("#sound").find("#Fullscreen").attr("states", value? "Unfullscreen": "Fullscreen");
        }


        $(this.audio).on("ended", (event:Event) => {
            if (this.observer)
                this.observer.disconnect();
            this.resolve();
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

        this.sound.off("mouseenter").on("mouseenter", (ev: Event) => {
            this.sound.fadeTo(250, 0.5);
        });
        this.sound.off("mouseleave").on("mouseleave", (ev: Event) => {
            this.sound.fadeTo(250, 0.0);
        });

        // Resizing progress bar on window resize event.
        let progress_size = (elem?: any) => {
            scanvas.width = (this.sound.innerWidth() - sound_op_left.outerWidth() - sound_op_right.outerWidth()) - 20;
            scanvas.style.width = scanvas.width + "px";
        }
        this.observer = helper.on_element_resize(this.sound, progress_size);
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
                this.resolve();
                this.audio = null;
            }
            let audio_mute     = ()=>{ this.audio.muted = true;  }
            let audio_unmute   = ()=>{ this.audio.muted = false; }
            let scenario_terminate = () => {
                this.audio.pause();
                if (this.observer)
                    this.observer.disconnect();
                    this.reject("terminate");
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
                    state: ()=>{return screen.fullscreen? "Unfullscreen":"Fullscreen"},
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

    play() : Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.audio) {
                this.resolve = resolve;
                this.reject = reject;
                this.audio.play();
            } else {
                console.info("Warning: no sound file provided.")
                resolve();
            }
        });
    }
}