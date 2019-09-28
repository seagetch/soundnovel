import { ipcRenderer } from "electron"

export class FullScreen {
    private _fullscreen: boolean = false;
    private _fullscreenchange: ((v: boolean)=>void)[] = [];
    constrcutor() {
    }

    run() {
        ipcRenderer.on("fullscreen", (event: any, value: boolean) => {
            this._fullscreen = value;
            console.log("fullscreen="+value)
            for (let callback of this._fullscreenchange) {
                callback(value);
            }
        });
    }

    get fullscreen() { return this._fullscreen; }
    set fullscreen(value: boolean) {
        ipcRenderer.send("fullscreen", value);
    }
    set fullscreenchange(callback: (v: boolean)=>void) {
        this._fullscreenchange.push(callback);
    }
    off_fullscreenchange() {
        this._fullscreenchange.length = 0;
    }
}
let screen = new FullScreen();
screen.run();
export default screen;