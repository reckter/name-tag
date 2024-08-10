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
    "user": "hannes",
    "availableSlides": [],
    "isCycling": False
}

badger_os.state_load("loop", state)
print(state)

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

def get_image(slide, frame, force = False):
    key = str(slide) + "-" + str(frame)
    if (not force and has_bytes(key)):
        print("has bytes")
        return byte_load(key)
    connect_to_wifi()
    print("downloading image " + str(frame) + " from " + str(slide))
    response = urequests.get("https://name-tag.reckt3r.rocks/api/slides/" + str(slide) + "/frames/" + str(frame) + "/compact")
    byte_save(key, response.content)
    return response.content

def ensure_slide_data(slide):
    if not has_bytes(str(slide)):
        get_whole_slide_show(slide)

byte_size = int(128 * 296 / 8)
def get_whole_slide_show(slide):
    connect_to_wifi()
    print("downloading slide " + str(slide))
    response = urequests.get("https://name-tag.reckt3r.rocks/api/slides/" + str(slide) + "/frames/compact")
    print(len(response.content))
    byte_save(str(slide), response.content)
    #for i in range(max):
    #    print("saving " + str(i))
    #    key = str(slide) + "-" + str(i)
    #    byte_save(key, response.content[i * byte_size: (i + 1) * byte_size])

def download_slide_info():
    connect_to_wifi()
    print("downloading slide info")
    response = urequests.get("https://name-tag.reckt3r.rocks/api/slides/listByUser?user=" + state["user"])
    state["availableSlides"] = response.json()

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

def smooth_screen_update():
    display.set_update_speed(badger2040.UPDATE_TURBO)
    for i in range(20):
        display.update()

def reset_screen():
    display.set_update_speed(badger2040.UPDATE_NORMAL)
    for i in range(2):
        display.set_pen(0)
        display.display.rectangle(0,0,WIDTH,HEIGHT)
        display.update()
        display.set_pen(15)
        display.display.rectangle(0,0,WIDTH,HEIGHT)
        display.update()

def delete_cache():
    for file in os.listdir("/state/bytes"):
        os.remove("/state/bytes/" + file)



def download_all(slide):
    print("downloading all")
    get_whole_slide_show(slide)
    #for i in range(max):
     #   get_image(slide, i, True)
# ################
# main
# ################


current = byte_load("screen")
#if current != None:
 #   drawImage(current)
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


        if badger2040.woken_by_rtc():
            if state["isCycling"]:
                state["slide"] += 1
                if state["slide"] + 1 > len(state["availableSlides"]):
                   state["slide"] = 0
            changed = True

        if display.pressed(badger2040.BUTTON_A):
            state["slide"] -= 1
            if state["slide"] < 0:
                state["slide"] = len(state["availableSlides"]) - 1
            state["isCycling"] = False
            changed = True

        if display.pressed(badger2040.BUTTON_C):
            state["slide"] += 1
            if state["slide"] > len(state["availableSlides"]) - 1:
                state["slide"] = 0
            state["isCycling"] = False
            changed = True


        if display.pressed(badger2040.BUTTON_B):
            state["slide"] = 0
            state["isCycling"] = False
            changed = True

        if (display.pressed(badger2040.BUTTON_UP) and display.pressed(badger2040.BUTTON_DOWN)):
            delete_cache()

        if (display.pressed(badger2040.BUTTON_UP)):
            download_slide_info()
            if(len(state["availableSlides"]) - 1< state["slide"]):
                state["slide"] = 0

            download_all(state["availableSlides"][state["slide"]]["id"])
            changed = True

        if display.pressed(badger2040.BUTTON_DOWN):
            state["isCycling"] = not state["isCycling"]
            print("cycling:" + str(state["isCycling"]))
            changed = True

        if changed:
            print("updating image")
            slide = state["availableSlides"][state["slide"]]

            last_changed = time()
            print("getting image!")
            ensure_slide_data(slide["id"])
            if(slide["chunkSize"] > 1):
                display.set_update_speed(badger2040.UPDATE_TURBO)
            else:
                display.set_update_speed(badger2040.UPDATE_NORMAL)


            all_bytes = byte_load(slide["id"])
            for i in range(slide["chunkSize"]):
                #image = get_image(state["slide"], state["frame"] + i)

                drawImage(all_bytes[i * byte_size: (i +1) * byte_size])
                display.update()


            badger_os.state_save("loop", state)
            #byte_save("screen", image)
            changed = False
        #sleep(dif / 2)
        if state["isCycling"]:
            badger2040.sleep_for(1)
        else:
            badger2040.sleep_for(10)
        display.halt()
except Exception as e:
    print(e)
    raise e
    print("halt")

    badger_os.state_save("loop", state)
    badger2040.sleep_for(1)
    display.halt()

