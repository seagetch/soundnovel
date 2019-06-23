import os, io, re
import pygame
from pygame.locals import *
try:
    from urllib2 import urlopen #python2
except ImportError:
    from urllib.request import urlopen #python3

class ImageCache:
    def __init__(self,screen):
        self.cache = {}
        self.screen = screen
        
    def get(self, filename):
        if isinstance(filename, list):
            _filename = "-".join("%s"%filename)
        else:
            _filename = filename
        if self.cache.get(_filename):
            return self.cache.get(_filename)
        else:
            self.cache[_filename] = Background(self.screen, filename)
            return self.cache.get(_filename)


class Background:
    def __init__(self, screen, filename):
        self.screen = screen
        if isinstance(filename, list):
            if filename[0] == "truncate":
                truncate = filename[2]
                files = [filename[1]]
            else:
                truncate = None
                files = filename[1:]
            self.tile_load(files, filename[0] == "horizontal", truncate = truncate)
        else:
            self.load(filename)
        
    def get_subsurface(self, img, truncate):
        rect = img.get_rect()
        w = rect.width
        h = rect.height
        
        rect2 = (int(w * truncate[0][0]), int(h * truncate[0][1]), 
                 int(w * truncate[1][0]), int(h * truncate[1][1]))
        return img.subsurface(rect2)
        
    def load_single_file(self, filename):
        if re.match("^http(s)://", filename):
            file = io.BytesIO(urlopen(filename).read())
            return pygame.image.load(file).convert_alpha()
        else:
            return pygame.image.load(filename).convert_alpha()    

    def tile_load(self, files, horizontal=False, truncate=None):
        print("load images[%d]"%len(files))
        try:
            imgs = [self.load_single_file(f) for f in files]
            if truncate:
                imgs = [self.get_subsurface(img, truncate) for img in imgs]
                
        except Exception as e:
          print("error loadeing %s"%(",".join([f.decode("utf-8") for f in files])))
          raise e
        print("loaded:")
        if horizontal:
            widths  = sum([i.get_rect().width for i in imgs])
            heights = max([i.get_rect().height for i in imgs])
        else:
            widths  = max([i.get_rect().width for i in imgs])
            heights = sum([i.get_rect().height for i in imgs])
        self.img = pygame.Surface((widths, heights))
        if horizontal:
            x = 0
            for i in imgs:
                self.img.blit(i, (x, 0))
                x += i.get_rect().width
        else:
            y = 0
            for i in imgs:
                self.img.blit(i, (0, y))
                y += i.get_rect().height
        (w,h) = self.screen.get_size()
        rect_img = self.img.get_rect()
        w2 = rect_img.width * h / rect_img.height
        h2 = rect_img.height * w / rect_img.width
        if w2 > w:
            self.img = pygame.transform.scale(self.img, (w, h2))
        else:
            self.img = pygame.transform.scale(self.img, (w2, h))
        print("image loaded: size=%d,%d"%(w,h))
            
    def load(self, filename):
        (w,h) = self.screen.get_size()
        self.img = self.load_single_file(filename)
        rect_img = self.img.get_rect()
        w2 = rect_img.width * h / rect_img.height
        h2 = rect_img.height * w / rect_img.width
        if w2 > w:
            self.img = pygame.transform.scale(self.img, (w, h2))
        else:
            self.img = pygame.transform.scale(self.img, (w2, h))

    def blit(self, update = True):
        (w,h) = self.screen.get_size()
        rect_img = self.img.get_rect()
        (x,y) = (w/2, h/2)
        rect_img.center = (x,y)
        self.screen.fill((0,0,0,255))
        self.screen.blit(self.img, rect_img)
        if update:
            pygame.display.update()


class ClickField:
    def __init__(self, rect, tag):
        self.rect = rect
        self.tag = tag
    
    def test(self, x, y):
        return self.rect.collidepoint(x, y)
        
    def offset(self, x, y):
        return (x - self.rect.left, y - self.rect.top)


class Clickables:
    def __init__(self):
        self.fields = []

    def append(self, field):
        return self.fields.append(field)
    
    def remove(self, field):
        self.fields.remove(field)

    def test(self, x, y):
        tags = [f for f in self.fields if f.test(x, y)]
        return tags[0] if len(tags) > 0 else None
