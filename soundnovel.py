#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys, os
import copy
import codecs

import pygame
from pygame.locals import *
import Media
import Scenario

import yaml

sys.stdout = codecs.getwriter('utf_8')(sys.stdout)

def is_str(obj):
    return isinstance(obj, basestring) or isinstance(obj, str) or isinstance(obj, unicode)

class GUI:
    def __init__(self):
        self.last_image = None

    def event_loop(self, callback):
        loop = True
        while loop:
            event = pygame.event.poll()
            while event:
                if event.type == QUIT:
                    pygame.quit()
                    sys.exit()
                elif event.type != pygame.NOEVENT:
                    loop = callback(event)
                if loop:
                    event = pygame.event.wait()
                else:
                    event = None

    def safe_wait(self, sec):
        print("DEBUG: wait %s sec"%sec)
        TIMEOUT  = pygame.USEREVENT + 2
        pygame.time.set_timer(TIMEOUT, int(sec * 1000))
        def handle_end(event):
            if event.type == TIMEOUT:
                pygame.time.set_timer(TIMEOUT, 0)
                return False
            if event.type == KEYDOWN or event.type == MOUSEBUTTONDOWN:
                pygame.time.set_timer(TIMEOUT, 0)
                return False
            return True
        self.event_loop(handle_end)


    def title(self, scenario, screen, image_cache):
        title = scenario.get_image_path(scenario.image_map.get("title"), 0)
        if title:
            background = image_cache.get(title)
            background.blit(False)
            self.last_image = background
        if hasattr(scenario, "modes"):
            options = {"location": scenario.screen.get("menu_location"),
                       "candidates": scenario.modes,
                       "variable": "mode" }
            if scenario.screen.get("menu_color"):
                options["color"] = scenario.screen.get("menu_color")
            if scenario.screen.get("menu_layout"):
                options["layout"] = scenario.screen.get("menu_layout")
            if scenario.screen.get("menu_size"):
                options["size"] = scenario.screen.get("menu_size")
            self.select(scenario, screen, image_cache, options)
        
    def select(self, scenario, screen, image_cache, options):
        if options["location"]:
            x, y = options["location"]
        else:
            x, y = 0, 0
        fontsize = options["size"] if options.get("size") else 40        
        text_cache = Media.TextCache(screen)
        clickables = Media.Clickables()
        if self.last_image:
          self.last_image.blit(False)

        if options.get("layout"):
            offset = options["layout"]
            direction = offset["direction"]
            ofs_x,ofs_y = offset["offset"]
            line_size = offset.get("line-size")
        else:
            direction = "vertical"
            line_size = None
            ofs_x = 0
            ofs_y = 100

        rel_x = 0
        rel_y = 0
        cur_line_ofs = 0
        color = None
        hcolor = None
        scolor = None
        if options.get("color"):
            color = options["color"].get("base")
            hcolor = options["color"].get("hover")
            scolor = options["color"].get("selected")
        if not color:
            color = (240, 240, 240)
        if not hcolor:
            hcolor = (240, 224, 0)
        if not scolor:
            scolor = (240, 0, 0)
        for mode in options["candidates"]:
            text = text_cache.get(mode, color, fontsize)
            text.blit(x + rel_x, y + rel_y, False)
            clickables.append(Media.ClickField(text.get_rect(), mode))
            cur_line_ofs += 1
            if direction == "horizontal":
                rel_x += ofs_x
                if line_size and cur_line_ofs >= line_size:
                    rel_y += ofs_y
                    rel_x = 0
                    cur_line_ofs = 0
            elif direction == "vertical":
                rel_y += ofs_y
                if line_size and cur_line_ofs >= line_size:
                    rel_x += ofs_x
                    rel_y = 0
                    cur_line_ofs = 0

        pygame.display.update()
        class function_scope:
            prev_target = None
            text_color = color
            hover_color = hcolor
            selected_color = scolor

        def handle(event):
            if event.type == MOUSEBUTTONDOWN:
                (x,y)=event.pos
                target = clickables.test(x, y)
                if target:
                    if target.tag:
                        scenario.variables[options["variable"]] = target.tag
                        print("variables[%s]=%s"%(options["variable"], target.tag))
                    text = Media.Text(screen, target.tag, function_scope.selected_color, fontsize)#(240, 0, 0))
                    target_pos = target.rect
                    text.blit(target_pos.x, target_pos.y)
                    self.safe_wait(0.5)
                    return False
            if event.type == MOUSEMOTION:
                (x,y)=event.pos
                target = clickables.test(x, y)
                if function_scope.prev_target != target:
                    function_scope.prev_target = target
                    for i in clickables.fields:
                        if i == target:
                            color = function_scope.hover_color #(240,224,0)
                        else:
                            color = function_scope.text_color #(240,240,240)
                        text = text_cache.get(i.tag, color, fontsize)
                        target_pos = i.rect
                        text.blit(target_pos.x, target_pos.y, False)
                    pygame.display.update()
            return True
        self.event_loop(handle)


    def execute_scenario(self, scenario, screen, image_cache):
        print(u"Execute Scenario mode={}".format(scenario.variables.get("mode")))
        class function_scope:
            steps = scenario.run()
            show_progress = False

        SONG_END = pygame.USEREVENT + 1
        music = None
        music_length = 0
        music_cache = Media.MusicCache(SONG_END)

        text_cache = Media.TextCache(screen)
        
        operations = [
          {"Previous": ["⏮", "Previous"]},
          {"Backward": ["⏪", "Backward"]},
          {"Pause": ["⏸", "Play"], "Play": ["⏵", "Pause"] },
          {"Forward": ["⏩", "Forward"]},
          {"Next": ["⏭", "Next"]},
          {"Cancel": ["⏹", "Cancel"]}
        ]
        operation_states = [
          "Previous", "Backward", "Pause", "Forward", "Next", "Cancel"
        ]
        clickables = Media.Clickables()

        (w,h) = screen.get_size()
        step_x = w / (len(operations) - 1)
        font_size = int(step_x / 1.2)
        x = step_x / 2 - (font_size / 2)
        y = h / 2 - (font_size / 2)
        opr_color = [244, 244, 244]
        font = Media.Text.search_fonts("symbols2")[0]
        for i, o in enumerate(operation_states[:-1]):
            text = text_cache.get(operations[i][o][0].decode("utf-8"), opr_color, fontsize=font_size, fontname = font)
            text.move(x, y)
            clickables.append(Media.ClickField(text.get_rect(), i))
            x += step_x
        text = text_cache.get(operations[-1]["Cancel"][0].decode("utf-8"), opr_color, font_size / 2, fontname = font)
        text.move(10, 10)
        clickables.append(Media.ClickField(text.get_rect(), len(operations) - 1))
        clickables.append(Media.ClickField(pygame.Rect(0, h - 32, w, 32), -1))
        
        try:
            while True:
                command = function_scope.steps.next()

                if command.command == "ask":
                    options = command.options
                    self.select(scenario, screen, image_cache, options)      
                elif command.command == "scene":
                    sound = command.sound
                    image = command.image 
                    if isinstance(image, list):
                        print(u"image file={}".format(",".join([i.decode("utf-8") for i in image if is_str(i)])))
                    elif is_str(image):
                        print(u"image file={}".format(image.decode("utf-8")))
                    if image:
                        background = image_cache.get(image)
                        background.blit()
                        self.last_image = background
                        pygame.display.update()

                    if music:
                        music.stop()
                    print(u"sound file={}".format(sound.decode("utf-8")))
                    music = music_cache.get(sound.decode("utf-8"))
                    music_length = music.length()	
                    music.play()
                    
                    PROGRESS_TIMEOUT  = pygame.USEREVENT + 3

                    function_scope.show_progress = False
                    def show_progress_bar():
                        if function_scope.show_progress:
                            (w,h) = screen.get_size()
                            percent = float(music.played_offset()) / music_length
                            screen.fill((96,96,96,255), rect=(0, h - 32, w, 32))
                            screen.fill((96,128,244,255), rect=(0, h - 32, w * percent, 32))                            
                            pygame.display.update()
                    def handle(event):
                        command = None
                        if event.type == SONG_END:
                            pygame.time.set_timer(PROGRESS_TIMEOUT, 0)
                            print("SONG END")
                            music.clear()
                            return False

                        elif event.type == PROGRESS_TIMEOUT:
                            show_progress_bar()
#                            print("Played: %d / %d secs"%(music.played_offset(), music_length))

                        elif event.type == MOUSEMOTION:
                            (x,y)=event.pos
                            target = clickables.test(x, y)
                            if self.last_image:
                                self.last_image.blit()                            
                            if target:
                                i = target.tag
                                if i >= 0:
                                    if function_scope.show_progress:
                                        pygame.time.set_timer(PROGRESS_TIMEOUT, 0)
                                        function_scope.show_progress = False
                                    o = operation_states[i]
                                    icon = operations[i][o][0].decode("utf-8")
                                    text = text_cache.get(icon, opr_color, font_size, font)
                                    text.blit(target.rect.left, target.rect.top, True)
                                else:
                                    if not function_scope.show_progress:                                   
                                        pygame.time.set_timer(PROGRESS_TIMEOUT, int(1000))
                                    function_scope.show_progress = True
                                    show_progress_bar()
                            else:
                                if function_scope.show_progress:
                                    pygame.time.set_timer(PROGRESS_TIMEOUT, 0)
                                function_scope.show_progress = False


                        elif event.type == MOUSEBUTTONDOWN:
                            (x,y)=event.pos
                            target = clickables.test(x, y)
                            if target:
                                i = target.tag
                                if i >= 0:
                                    o = operation_states[i]
                                    command = o
                                    operation_states[i] = operations[i][o][1]
                                    icon = operations[i][o][0].decode("utf-8")
                                    text = text_cache.get(icon, opr_color, font_size, font)
                                    text.blit(target.rect.left, target.rect.top, True)
                                else:
                                    offset = target.offset(x, y)
                                    percent = float(offset[0]) / w
                                    if music_length:
                                        ofs_time = percent * music_length
                                        music.seek(ofs_time - music.played_offset())
                                        show_progress_bar()

                        elif event.type == KEYDOWN:
                            if event.key == K_ESCAPE or event.key == K_q:
                                command = "Cancel"
                            elif event.key == K_RETURN:
                                command = "Next"
                            elif event.key == K_SPACE:
                                command = operation_states[2]
                                operation_states[2] = operations[2][command][1]
                            elif event.key == K_RIGHT:
                                command = "Forward"
                            elif event.key == K_BACKSPACE:
                                command = "Previous"
                            elif event.key == K_LEFT:
                                command = "Backward"

                        if command:
                            if command == "Cancel":
                                print("Failed")
                                music.stop()
                                if hasattr(scenario, "failure"):
                                    scenario.force(copy.copy(scenario.failure))
                                    function_scope.steps = scenario.loop()
                                else:
                                    scenario.force([])
                                    function_scope.steps = scenario.loop()
                                return False
                            elif command == "Next":
                                print("Skip voice")
                                music.stop()
                                return False
                            elif command == "Pause":
                                print("Pause")
                                music.pause()
                            elif command == "Play":
                                print("Play")
                                music.unpause()
                            elif command == "Forward":
                                print("Skip voice 10 seconds")
                                if not music.seek(10):
                                    return False
                            elif command == "Previous":
                                print("Rewind voice")
                                music.rewind()
                            elif command == "Backward":
                                print("Rewind voice 10 seconds")
                                music.seek(-10)
                        return True
                    self.event_loop(handle)

        except StopIteration:
            self.safe_wait(10)
            music.stop()
        except RuntimeError:
            pass


    def run(self):
        filename = sys.argv[1].decode("utf-8") if len(sys.argv) > 1 else None
        if not filename:
            filename = os.path.join(os.path.dirname(sys.argv[0].decode("utf-8")), "config.yaml")
        with open(filename,"r") as f:
            config = yaml.safe_load(f)
        
        root_path = os.path.dirname(filename.encode("utf-8"))
        (w, h) = (config.get("screen").get("size")[0], config.get("screen").get("size")[1])
        (x, y) = (w/2, h/2)
        Media.Music.init()
        pygame.init()
    #    pygame.display.set_mode((w, h),pygame.FULLSCREEN,32)
        pygame.display.set_mode((w, h), pygame.DOUBLEBUF,32)

        screen = pygame.display.get_surface()
        pygame.display.set_caption(os.path.basename(os.path.dirname(filename.encode("utf-8"))))
        pygame.display.update()

        image_cache = Media.ImageCache(screen)

        while True:
            scenario = Scenario.Scenario(root_path, config)
            self.title(scenario, screen, image_cache)
            self.execute_scenario(scenario, screen, image_cache)



if 0:
    scenario = Scenario.Scenario()
    for f in  scenario.run():
        print(f)
else:
    gui = GUI()
    gui.run()
