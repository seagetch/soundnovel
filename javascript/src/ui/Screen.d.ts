export declare class FullScreen {
    private _fullscreen;
    private _fullscreenchange;
    constrcutor(): void;
    run(): void;
    fullscreen: boolean;
    fullscreenchange: (v: boolean) => void;
    off_fullscreenchange(): void;
}
declare let screen: FullScreen;
export default screen;
