export default class ImageViewer {
    private image_resource;
    private canvas;
    image_renderer(): void;
    constructor(canvas: HTMLCanvasElement);
    truncated_load(filename: string, bounds: [[number, number], [number, number]]): Promise<unknown>;
    tiled_load(image_src: any[]): Promise<unknown>;
    file_load(filename: string): Promise<unknown>;
    load(image_src: any): void;
}
