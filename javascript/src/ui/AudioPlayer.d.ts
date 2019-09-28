export declare class AudioPlayer {
    private sound;
    private audio;
    private observer;
    private resolve;
    private reject;
    constructor(sound: JQuery<any>);
    create_audio(filename: string): HTMLAudioElement;
    generate_button(button_info: any): JQuery<HTMLElement>;
    bind_events(): void;
    load(filename: string): void;
    play(): Promise<void>;
}
