import urequests
import badger2040
import badger_os
from badger2040 import WIDTH, HEIGHT
from time import time
from time import sleep
import os


state = {
    "frame": 0,
    "slide": 0,
    "tries": 0,
    "success": 0,
    "fails": 0
}

badger_os.state_load("loop", state)

display = badger2040.Badger2040()

def byte_save(name, data):
    try:
        with open("/state/bytes/{}.bytes".format(name), "wb") as f:
            f.write(data)
            f.flush()
    except OSError as e:
        try:
            os.stat("/state/bytes")
        except OSError:
            os.mkdir("/state/bytes")
            byte_save(name, data)

def has_bytes(name):
    try:
        os.stat("/state/bytes/{}.bytes".format(name))
        return True
    except OSError:
        return False

def byte_load(name):
    try:
        data = open("/state/bytes/{}.bytes".format(name), "rb").read()
        print("loaded " + str(len(data)))
        return data
    except (OSError, ValueError) as e:
        print("error reading")
        print(e)
        pass
    pass

def get_image(slide, frame):
    key = str(slide) + "-" + str(frame)
    if (has_bytes(key)):
        print("has bytes")
        return byte_load(key)
    connect_to_wifi()
    response = urequests.get("https://name-tag.reckt3r.rocks/api/slide/" + str(slide) + "/frame/" + str(frame) + "/compact")
    byte_save(key, response.content)
    return response.content

def connect_to_wifi():
    if not display.isconnected():
        try:
            print("conecting...")
            net_status = 0
            display.connect(status_handler=net_status_handler)
            #display.connect()
        except e:
            show_progress(2)
            print(e)
            print("did not connect. sleeping...")

            state["fails"] += 1
            badger2040.sleep_for(1)
            display.halt()
            #If on usb, we need to skip to the top of the loop



def display_bitmap(o_x, o_y, width, height, data):
    WIDTH, HEIGHT = display.display.get_bounds()

    y_bytes = int(height // 8)

    if len(data) < width * height / 8:
        raise ValueError("Data undersized")

    for x in range(width):
        src = x * y_bytes
        dst = (x + o_x) * int(HEIGHT // 8) + int(o_y // 8)
        b = bytes(data[src:src + y_bytes])
        memoryview(display.display)[dst:dst + y_bytes] = b

# from https://github.com/pimoroni/badger2040/issues/41#issuecomment-1669671337
def drawImage(content):
    b = bytes(content)
    memoryview(display.display)[0:len(content)] = b

net_counter = 1
def net_status_handler(a,b,c):
    pass
    #net_counter = net_counter + 1
    #show_progress(net_counter, 127)

def clear_progress(update = False, y = 0):
    display.set_pen(15)
    display.pixel_span(0, y, 296)
    if update:
        display.set_update_speed(badger2040.UPDATE_TURBO)
        display.partial_update(0, y, 296, y)


def show_progress(count, y = 0):
    clear_progress(y = y)

    # draw {count} many lines
    display.set_pen(0)
    for i in range(count):
        display.pixel_span(i * 8 + 1, y, 6)
    display.set_update_speed(badger2040.UPDATE_TURBO)
    display.update()
    #display.partial_update(0, 5, count * 8, 7)

def draw_battery_indicator():
    state_of_charge = badger_os.get_battery_level()
    print(state_of_charge)
    display.pixel_span(127,0, 269 * state_of_charge)

def reset_screen():
    display.set_update_speed(badger2040.UPDATE_NORMAL)
    for i in range(20):
        display.set_pen(0)
        display.display.rectangle(0,0,WIDTH,HEIGHT)
        display.update()
        display.set_pen(15)
        display.display.rectangle(0,0,WIDTH,HEIGHT)
        display.update()

# ################
# main
# ################


current = byte_load("screen")
if current != None:
    drawImage(current)
    #display.set_update_speed(badger2040.UPDATE_TURBO)
    #display.update()

try:
    badger2040.system_speed(badger2040.SYSTEM_VERY_SLOW)
except:
    print("could not change speed *shrug*")


print("updating...")

display.keepalive()
last_changed = time()

# Call halt in a loop, on battery this switches off power.
# On USB, the app will exit when A+C is pressed because the launcher picks that up.

try:
    while True:
        display.keepalive()
        changed = False

        dif = time() - last_changed
        if time() - last_changed >= 60:
            print(time())
            changed = True
            state["frame"] +=1

        if badger2040.woken_by_rtc():
            state["frame"] += 1
            if (state["frame"] > 5):
                state["frame"] = 0
            changed = True

        if display.pressed(badger2040.BUTTON_UP):
            if state["frame"] > 0:
                state["frame"] -= 1
                changed = True

        if (display.pressed(badger2040.BUTTON_UP) and display.pressed(badger2040.BUTTON_B)):
            reset_screen()

        if display.pressed(badger2040.BUTTON_DOWN):
            if state["frame"] < 1000: #TODO
                state["frame"] += 1
                changed = True

        if changed:
            state["tries"] += 1
            print("updating image")
            show_progress(1)
            print(str(display.isconnected()))
            show_progress(3)

            last_changed = time()
            print("getting image!")
            image = get_image(state["slide"], state["frame"])
            show_progress(4)
            print("drawing")

            drawImage(image)
            #display.set_pen(15)
            #display.display.rectangle(0,0,WIDTH,HEIGHT)

            draw_battery_indicator()
            print("updating screen")
            display.set_update_speed(badger2040.UPDATE_NORMAL)

            state["success"] += 1

            display.text(str(state["tries"]) + ": " + str(state["success"]) + " - " + str(state["fails"]), 0, 100)
            display.update()
            badger_os.state_save("loop", state)
            byte_save("screen", image)
            changed = False
        #sleep(dif / 2)
        badger2040.sleep_for(1)
        display.halt()
except Exception as e:
    print(e)
    print("halt")

    state["fails"] += 1
    badger_os.state_save("net_image", state)
    badger2040.sleep_for(1)
    display.halt()

