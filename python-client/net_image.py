import urequests
import badger2040
import badger_os
from badger2040 import WIDTH, HEIGHT
from time import time
from time import sleep


state = {
    "frame": 0,
    "slide": 0
}

badger_os.state_load("net_image", state)

display = badger2040.Badger2040()

def byte_save(name, data):
    try:
        with open("/state/{}.bytes".format(name), "wb") as f:
            f.write(data)
            f.flush()
    except OSError:
        import os
        try:
            os.stat("/state")
        except OSError:
            os.mkdir("/state")
            byte_save(name, data)

def byte_load(name):
    try:
        data = open("/state/{}.bytes".format(name), "rb").read()
        print("loaded " + str(len(data)))
        return data
    except (OSError, ValueError) as e:
        print("error reading")
        print(e)
        pass
    pass

def getImage():
    response = urequests.get("https://name-tag-bice.vercel.app/api/slide/" + str(state["slide"]) + "/frame/" + str(state["frame"]) + "/compact")
    return response.content

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

# TODO should use https://github.com/pimoroni/badger2040/issues/41#issuecomment-1669671337
def drawImage(content):
    b = bytes(content)
    memoryview(display.display)[0:len(content)] = b
#     x = 0
#     y = 0
#     print(len(content))
#     for number in content:
#         for offset in range(8):
#             bit = number & (1 << 7 - offset)
#             if bit > 0:
#                 display.set_pen(0)
#             else:
#                 display.set_pen(15)
#             display.pixel(x, y)
#             x = x + 1
#             if x >= WIDTH:
#                 x = 0
#                 y = y + 1
#     print(x)
#     print(y)


def net_status_handler(a,b,c):
    print(b)
    return

def clear_progress(update = False):
    display.set_pen(15)
    display.pixel_span(0, 0, 296)
    if update:
        display.set_update_speed(badger2040.UPDATE_TURBO)
        display.partial_update(0, 5, 296, 0)


def show_progress(count):
    clear_progress()

    # draw {count} many lines
    display.set_pen(0)
    for i in range(count):
        display.pixel_span(i * 8 + 1, 0, 6)
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
# Connects to the wireless network. Ensure you have entered your details in WIFI_CONFIG.py :).


display.keepalive()
last_changed = time()

# Call halt in a loop, on battery this switches off power.
# On USB, the app will exit when A+C is pressed because the launcher picks that up.
while True:
    display.keepalive()
    changed = False

    dif = time() - last_changed
    #display.pixel_span(0,127, dif * 5)
    #display.set_update_speed(badger2040.UPDATE_TURBO)
    #display.update()
    if time() - last_changed >= 60:
        print(time())
        changed = True
        state["frame"] +=1

    if badger2040.woken_by_rtc():
        state["frame"] += 1
        changed = True

    if display.pressed(badger2040.BUTTON_UP):
        if state["frame"] > 0:
            state["frame"] -= 1
            changed = True

    if (display.pressed(badger2040.BUTTON_USER) and display.pressed(badger2040.BUTTON_B)):
        reset_screen()

    if display.pressed(badger2040.BUTTON_DOWN):
        if state["frame"] < 1000: #TODO
            state["frame"] += 1
            changed = True


    if changed:
        print("updating image")
        show_progress(1)
        if not display.isconnected():
            try:
                print("conecting...")
                display.connect(
                    status_handler=net_status_handler
                )
            except e:
                print(e)
                print("did not connect. sleeping...")
                badger2040.sleep_for(1)
                display.halt()
                #If on usb, we need to skip to the top of the loop
                continue
        show_progress(2)

        last_changed = time()
        print("getting image!")
        image = getImage()
        show_progress(3)
        print("drawing")

        drawImage(image)
        #display.set_pen(15)
        #display.display.rectangle(0,0,WIDTH,HEIGHT)

        draw_battery_indicator()
        print("updating screen")
        display.set_update_speed(badger2040.UPDATE_NORMAL)
        display.update()
        badger_os.state_save("net_image", state)
        byte_save("screen", image)
        changed = False
    sleep(dif / 2)
    #badger2040.sleep_for(1)
    #display.halt()

