import urequests
import badger2040
import badger_os
from badger2040 import WIDTH, HEIGHT
from time import time
from time import sleep
import os

display = badger2040.Badger2040()

display.set_update_speed(badger2040.UPDATE_TURBO)

for i in range(256):
    display.set_pen(0)
    for x in range(8):
        is_set = i & (1 << x)
        if is_set:
            display.set_pen(0)
        else
            display.set_pen(15)
        display.display.rectangle(x * 8, 0, 8, 8)
    display.update()
    sleep(10)

