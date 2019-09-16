const { ipcRenderer } = require('electron')

var command_name : string = ""
var audio : HTMLAudioElement;

ipcRenderer.send("command",command_name)

ipcRenderer.on("command", (event:any, command: any[]) => {
    if (command[0] == "scene") {
        command_name = command[0];
        document.getElementById("background").innerHTML = "<img src='"+command[2]+"' width='100%' height='100%'/>";
        if (command[1]) {
            audio = new Audio(command[1]);
            document.getElementById("sound").innerHTML = command[1];
            document.getElementById("sound").appendChild(audio);
            audio.onended = function(event:Event) {
                ipcRenderer.send("command", command_name)
            }
            audio.play();
        } else
            ipcRenderer.send("command", command_name)
    } else if (command[0] == "ask") {
        document.getElementById("selection").innerHTML = command[1]["candidates"].map((v: string, i: number)=>{"<span>"+v.toString()+"</span>"}).join(", ");
        let candidates : any[] = command[1]["candidates"];
        ipcRenderer.send("set-variable", command[1]["variable"], candidates[candidates.length - 1]);
        ipcRenderer.send("command", command_name)
    }

})

window.onkeydown = (event: KeyboardEvent) => {
    if (event.key == 'Enter' && audio) {
        audio.pause();
        ipcRenderer.send("command", command_name)
    }
}