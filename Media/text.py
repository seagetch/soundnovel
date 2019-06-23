import re
import pygame
from pygame.locals import *

class TextCache:
    def __init__(self,screen):
        self.cache = {}
        self.screen = screen

    def to_hash(self, text, color):
        return "%02x%02x%02x%s"%(color[0], color[1], color[2], text)

    def get(self, text, color, fontsize=40, fontname=None):
        hash = self.to_hash(text, color)
        if self.cache.get(hash):
            return self.cache.get(hash)
        else:
            self.cache[hash] = Text(self.screen, text, color, fontsize, fontname)
            return self.cache.get(hash)

class Text:
    FontHash = {}
    def __init__(self, screen, text, color=(0, 0, 0), fontsize=40, fontname = None):
        if not fontname:
            fontname = Text.search_fonts("cjk")[0]

        fontname = pygame.font.match_font(fontname)

        self.screen = screen
        font = pygame.font.Font(fontname, fontsize)
        self.text = font.render(text, True, color)
        self.rect = self.text.get_rect()

    @classmethod
    def search_fonts(cls, filter_name):
        if not cls.FontHash.get(filter_name):
            cls.FontHash[filter_name] = [font for font in pygame.font.get_fonts() if re.search(filter_name, font)]
        return cls.FontHash[filter_name]
        
    def move(self, x, y):
        self.rect.topleft = (x, y)

    def blit(self, x, y, update = True):
        self.move(x, y)
        self.screen.blit(self.text, self.rect)
        if update:
            pygame.display.update()
    
    def get_rect(self):
        return self.rect


