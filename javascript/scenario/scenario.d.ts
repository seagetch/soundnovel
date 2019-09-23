export declare module scenario {
    class Command {
        private _command;
        constructor();
        command: string;
    }
    class Scene extends Command {
        private _sound;
        private _image;
        constructor(sound: string, image: string);
        readonly sound: string;
        readonly image: string;
    }
    class Ask extends Command {
        private _options;
        constructor(options: {
            [key: string]: any;
        });
        readonly options: {
            [key: string]: any;
        };
    }
    class Scenario {
        private root_path;
        static PlayAll: string;
        static PlayOne: string;
        static Select: string;
        static Ask: string;
        static Nop: string;
        static SubScenario: string;
        static Jump: string;
        static Exit: string;
        static Dice: string;
        static DiceWithMode: string;
        static DiceWith: string;
        static JumpBy: string;
        private situation_change;
        private music_path;
        private image_path;
        private _variables;
        private sub_scenario;
        private histories;
        private states;
        private count;
        private _config;
        constructor(root_path: string, config: {
            [key: string]: any;
        });
        readonly config: {
            [index: string]: any;
        };
        readonly variables: {
            [key: string]: any;
        };
        get_prefix_for(name: string): any;
        list_files(name: string, prefix?: string, candidates?: string[]): any[];
        get_image_path(images: any[], id: number): any;
        select_action_rand(name: string, prefix: string): [number, [string, string]];
        dice(current: string, mapping: any[]): any[];
        transit_to_next(next_info: any[]): any;
        run(): Generator<void | Scene | Ask, void, unknown>;
        force(states: any): void;
        loop(current_scenario?: any): Generator<Scene | Ask, void, unknown>;
    }
}
