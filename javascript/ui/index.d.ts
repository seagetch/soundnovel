declare const ipcRenderer: any;
declare var command_name: string;
declare var audio: HTMLAudioElement;
declare var initialized: boolean;
declare function image_renderer(canvas: HTMLCanvasElement, image: HTMLImageElement | HTMLCanvasElement): (ev?: Event) => void;
declare function scene(command: any[]): void;
declare function ask(command: any[]): void;
