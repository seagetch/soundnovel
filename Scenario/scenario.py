import os, re, glob
import random

def is_str(obj):
    return isinstance(obj, basestring) or isinstance(obj, str) or isinstance(obj, unicode)

class Command(object):
    def __init__(self):
        self.command = None

class Scene(Command):
    def __init__(self, sound, image):
        self.command = "scene"
        self.sound = sound
        self.image = image

class Ask(Command):
    def __init__(self, options):
        self.command = "ask"
        self.options = options

class Scenario:
    PlayAll = "play-all"
    PlayOne = "play-one"
    Select  = "select"
    Ask     = "ask"
    Nop     = "nop"
    SubScenario = "sub-scenario"
    
    Jump     = "jump"
    Exit     = "exit"
    Dice     = "dice"
    DiceWithMode = "dice-with-mode"
    DiceWith = "dice-with"
    JumpBy   = "jump-by"

    def __init__(self, root_path, config):
        for k, v in config.items():
            setattr(self, k, v)
        self.situation_change = 50
        self.music_path = os.path.join(root_path, self.paths.get("Music").encode("utf-8"))
        self.image_path = self.paths.get("Images").encode("utf-8")
        if not re.match("^http(s)://", self.image_path):
            self.image_path = os.path.join(root_path, self.image_path)
        self.SubScenario = []
        self.variables = {}

    def get_prefix_for(self, name):
        if self.SubScenario:
            state = self.SubScenario[-1][name]
            return state[1]
        else:
            return None

    def list_files(self, name, prefix = None):
        if not prefix:
            prefix =self.get_prefix_for(name)
        result = glob.glob("%s/%s"%(self.music_path, prefix.encode("utf-8")))
        result.sort()
        return (result, self.image_map[prefix])

    def get_image_path(self, images, id):
        name = images[id%len(images)]
        if isinstance(name, list):
            return [name[0]] + [os.path.join(self.image_path, x.encode("utf-8")) if is_str(x) else x for x in name[1:]]
        elif is_str(name):
            return os.path.join(self.image_path, name.encode("utf-8"))
        else:
            return None

    def select_action_rand(self, name, prefix):
        sounds,images = self.list_files(name, prefix)
        if isinstance(sounds, list) and len(sounds) > 0:
            selected = random.randrange(len(sounds))
            return (selected, (sounds[selected], self.get_image_path(images, selected)) )
        return (None, (None, None))


    def dice(self, current, mapping):
        judge = None
        while not judge:
            dice_ = random.randrange(100)
            print("DICE=%d"%dice_)
            index = 0
            for v, k in mapping:
                print("%s:%d"%(k,v))
                if dice_ < v:
                    if len(self.histories) > 1 and \
                         (len(self.histories[-1]) > 1 and self.histories[-1][-1] == k[1]):
                        break
                    else:
                        judge = k
                        print("ACT=%s->%s"%(judge[0], judge[1]))
                        break
                dice_ -= v
                index += 1
            if judge:
                if len(judge) > 2:
                    prefix=judge[2:]
                    sounds, images = self.list_files(current)
                    sounds = [s for s in sounds if os.path.basename(s) in prefix]
                    variation = random.randrange(len(sounds))
                    judge = judge[0:2] + [[sounds[variation], self.get_image_path(images, index)]]
                return judge

    def transit_to_next(self, next_info):
        if len(self.states) > 0:
            current = self.states[-1]
        else:
            current = None

        if next_info[0] == Scenario.Dice:
            print("Dice")
            file_prefix=next_info[2:] if len(next_info)>2 else None
            next_info = self.dice(current, getattr(self, next_info[1]))
        elif next_info[0] == Scenario.DiceWithMode:
            print("Dice-with-mode")
            next_info = self.dice(current, getattr(self, next_info[1])[self.variables["mode"]])
        elif next_info[0] == Scenario.DiceWith:
            value = scenario.variables.get(next_info[1])
            print("Dice-with")
            next_info = self.dice(current, getattr(self, next_info[2])[value])

        next_action = next_info[0]

        if next_action == Scenario.Jump:
            print("Jump [%d]"%len(self.states))
            next_name = next_info[1]
            if len(self.states) > 0:
                self.states[-1] = next_name
                self.histories[-1].append(next_name)
        elif next_action == Scenario.JumpBy:
            value = self.variables.get(next_info[1])
            if len(next_info) >= 3:
                next_name = next_info[2].get(value)
            else:
                next_name = value
            print("Jump by [%s=%s] --> %s"%(next_info[1], value, next_name))
            if len(self.states) > 0:
                self.states[-1] = next_name
                self.histories[-1].append(next_name)
            next_info = []
        elif next_action == Scenario.Exit:
            if len(self.SubScenario) > 0:
                self.SubScenario.pop()
                self.states.pop()
                self.histories.pop()
            next_name = next_info[1] if len(next_info) >= 2 else None
            print("Exit [%d]"%len(self.states))
            if len(self.states) > 0:
                self.states[-1] = next_name
                self.histories[-1].append(next_name)
        else:
            print("Unknown action %s"%next_action)
            pass
        if len(next_info) > 2:
            print("file=%s"%next_info[2])
            return next_info[2]
        else:
            return None

    def run(self):
        self.SubScenario = []
        self.states = []
        self.histories = []
        self.count = 0
        return self.loop(self.scenario)


    def force(self, states):
        while len(self.SubScenario) > len(states):
            self.SubScenario.pop()
            self.histories.pop()
        self.states = states
        self.histories.append(states)

    def loop(self, current_scenario = None):
        while True:
            self.count += 1
            print("\nTrial %d:"%self.count)
            if not current_scenario:
                if len(self.states) > 0 and len(self.SubScenario) > 0:
                    current_scenario = self.SubScenario[-1][self.states[-1]]
                else:
                    break

            if len(self.states) > 0:
                print("STATE=%s"%self.states[-1])
                pass
            head = current_scenario[0]
            if is_str(head):
                scenario = [current_scenario]
            elif isinstance(head, list):
                scenario = current_scenario[:-1]
            for cs in scenario:
                action = cs[0]
                print("ACTIONS=%s"%(action,))
                if action == Scenario.SubScenario:
                    content = cs[1]
                    print("Push SubScenario %s"%content)
                    self.SubScenario.append(content)
                    self.states.append(None)
                    self.histories.append([])
                elif action == Scenario.PlayAll:
                    content = cs[1]
#                    sounds,images = self.list_files(self.states[-1], content)
                    sounds,images = self.list_files(None, content)
                    for i in range(len(sounds)):
                        yield Scene(sounds[i], self.get_image_path(images, i))
                elif action == Scenario.PlayOne:
                    content = cs[1]
#                    _, filename = self.select_action_rand(self.states[-1], content)
                    _, filename = self.select_action_rand(None, content)
                    yield Scene(*filename)
                elif action == Scenario.Ask:
                    content = cs[1]
                    options = content
                    yield Ask(options)
                elif action == Scenario.Select:
                    content = cs[1]
                elif action == Scenario.Nop:
                    pass
            next = current_scenario[-1]
            filename = self.transit_to_next(next)
            if filename:
                yield Scene(*filename)

            current_scenario = None
