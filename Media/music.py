import os, re
import pygame
from pygame.locals import *
import fcntl
import ffmpeg
import threading
import datetime
import math
import wave
import mutagen

class MusicCache:
    def __init__(self, endevent=None):
        self.cache = {}
        self.endevent = endevent
        
    def get(self, filename):
        if isinstance(filename, list):
            _filename = "-".join("%s"%filename)
        else:
            _filename = filename
        if self.cache.get(_filename):
            return self.cache.get(_filename)
        else:
            music = Music(self.endevent)
            music.load(filename)
            self.cache[_filename] = music
            return self.cache.get(_filename)
            
class Music:
    FREQ = 44100
    SIZE = 16
    CHANNELS = 2
    
    @classmethod
    def offset(self, seq = 1):
        return seq * self.FREQ * self.SIZE * self.CHANNELS / 8
    
    @classmethod
    def seconds(self, ofs):
        return float(ofs) / self.offset()
    
    @classmethod
    def init(self):
        pygame.mixer.pre_init(self.FREQ, self.SIZE, self.CHANNELS, 1024*4)


    def __init__(self, endevent=None):
        self.buffer = None
        self.channel = None
        self.sound = None
        self.endevent = endevent
        self.filename = None
        self.thread = None
        self.cache = None
        self.play_start_time = None
        self.paused_at = None
    
    def load(self, filename):
        self.filename = filename
#            pygame.mixer.music.load(filename)

    def play(self, offset_second = 0):
        if self.channel:
            print("Clear channel")
            self.stop()
        self.channel = pygame.mixer.find_channel()
        if not self.channel or self.channel.get_busy():
            print("Error: Channel is busy!")
            return False

        def play_async(filename, offset_second):
            print("Play async")
            total_buf = None
            self.play_start_time = None
            played_offset = 0
            ioptions = {}
            if offset_second:
                ioptions["ss"] = offset_second
            pipe = ffmpeg.input(filename, **ioptions).output("pipe:", ac=Music.CHANNELS, f="s16le", acodec="pcm_s16le").run_async(pipe_stdout=True, pipe_stderr=True)
            pipe.stderr.close()
            try:
                while True:
                    buf = os.read(pipe.stdout.fileno(), Music.offset())
                    total_buf = buf if not total_buf else total_buf + buf
                    if len(buf) == 0:
                        break
                    if self.channel:
                        # if queue becomes empty and our buffer has enough length, put it to the channel queue.
                        if self.channel and not self.channel.get_queue() and len(total_buf) - played_offset > Music.offset():
                            if not self.play_start_time:
                                self.play_start_time = datetime.datetime.now() 
                                if offset_second:
                                    self.play_start_time -= datetime.timedelta(seconds = int(offset_second), microseconds = math.fmod(offset_second,1) * 1000 * 1000)
                                print("started at %s (now=%s)"%(self.play_start_time, datetime.datetime.now()))
                            self.channel.queue(pygame.mixer.Sound(buffer=total_buf[played_offset:]))
                            #played_offset = len(total_buf)
                            total_buf = None
                    else:
                        pipe.stdout.close()
            except ValueError as e:
                print(e)
            
            # Read all media. waitng until queue becomes empty.
#                if not offset_second:
#                    self.cache = total_buf
            while self.channel and self.channel.get_queue():
                time.sleep(.1)
            if self.channel:
                self.channel.queue(pygame.mixer.Sound(buffer=total_buf[played_offset:]))
                # All data is sent to the queue here.
            while self.channel and self.channel.get_queue():
                time.sleep(.1)
            # Last sound chunk is sent to buffer
            if self.channel and self.endevent:
                self.channel.set_endevent(self.endevent)


        if self.cache:
            print("Using cache")
            self.channel.queue(pygame.mixer.Sound(buffer=self.cache))
            if self.channel and self.endevent:
                self.channel.set_endevent(self.endevent)
            return True
        else:
            if offset_second:
                length = self.length()
                if length < offset_second:
                    return False
            self.thread = threading.Thread(target=play_async, args=(self.filename, offset_second))
            self.thread.start()
            return True
#            pygame.mixer.music.set_endevent(SONG_END)
#            pygame.mixer.music.play()

    def length(self):
        if self.filename.endswith(".wav"):
            wav = wave.open(self.filename, 'r')
            return wav.getnframes() / wav.getframerate()
        else:
            audio_info = mutagen.File(self.filename)
            return audio_info.info.length

    def played_offset(self):
        if self.play_start_time:
            diff = (datetime.datetime.now() if not self.paused_at else self.paused_at) - self.play_start_time
            result = diff.seconds + diff.microseconds / float(1000 * 1000)
            return result
        return 0
    
    def pause(self):
        print("Pause")
        if self.channel:
            self.channel.pause()
            self.paused_at = datetime.datetime.now()
   
    def unpause(self):
        print("Unpause")
        if self.paused_at:
            self.channel.unpause()
            paused_duration = datetime.datetime.now() - self.paused_at
            self.play_start_time += paused_duration
            self.paused_at = None
    
    def is_paused(self):
        return self.paused_at != None
    
    def seek(self, relative_sec):
        current = self.played_offset()
        print("Current played time=%f secs"%current)
        if current:
            start = current + relative_sec
            print("Start play at %f sec"%start)
            if start < 0:
                start = None
            return self.play(start)
    
    def stop(self):
        if self.channel:
            self.clear()
            while self.channel.get_queue() or self.channel.get_sound():
                self.channel.get_sound().stop()
            self.channel = None
            if self.thread:
                self.thread.join()
            self.thread = None
            self.played_time = None
#            pygame.mixer.music.stop()
    
    def clear(self):
        if self.channel:
            self.channel.set_endevent()

    def rewind(self):
        self.stop()
        return self.play()
#            pygame.mixer.music.rewind()
