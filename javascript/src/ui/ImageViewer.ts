import * as helpers from "./helpers";
export default class ImageViewer {
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
            let canvas_observer = helpers.on_canvas_resize($(this.canvas), (elem)=>{
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
}