/// <reference types="jquery" />
declare const ipcRenderer: Electron.IpcRenderer;
declare var command_name: string;
declare var fullscreen: boolean;
declare var initialized: boolean;
declare var screen_size: number[];
declare function on_element_resize(element: JQuery<any>, callback: (element: JQuery<any>) => void): MutationObserver;
declare function on_canvas_resize(element: JQuery<any>, callback: (element: JQuery<any>) => void): MutationObserver;
declare class ImageViewer {
    private image_resource;
    private canvas;
    image_renderer(): void;
    constructor(canvas: HTMLCanvasElement);
    truncated_load(filename: string, bounds: [[number, number], [number, number]]): Promise<unknown>;
    tiled_load(image_src: any[]): Promise<unknown>;
    file_load(filename: string): Promise<unknown>;
    load(image_src: any): void;
}
declare class AudioPlayer {
    private sound;
    private audio;
    private observer;
    constructor(sound: JQuery<any>);
    create_audio(filename: string): HTMLAudioElement;
    generate_button(button_info: any): JQuery<HTMLElement>;
    bind_events(): void;
    load(filename: string): void;
    play(): void;
}
declare var image_viewer: ImageViewer;
declare function scene(command: any[]): void;
declare function ask(command: any[]): void;
