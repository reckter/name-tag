import urequests
import badger2040
import badger_os
from badger2040 import WIDTH
from time import time
from time import sleep


try:
    badger2040.system_speed(badger2040.SYSTEM_VERY_SLOW)
except:
    print("could not change speed *shrug*")

display = badger2040.Badger2040()

state = {
    "frame": 0,
    "slide": 0
}

badger_os.state_load("net_image", state)

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
    memoryview(display.display)[0:len(content)] = content
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


# ################
# main
# ################



def net_status_handler():
    return

print("updating...")
# Connects to the wireless network. Ensure you have entered your details in WIFI_CONFIG.py :).


display.keepalive()
last_changed = time()

# Call halt in a loop, on battery this switches off power.
# On USB, the app will exit when A+C is pressed because the launcher picks that up.
while True:
    display.keepalive()
    changed = False

    print(time() - last_changed)
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

    if display.pressed(badger2040.BUTTON_DOWN):
        if state["frame"] < 1000: #TODO
            state["frame"] += 1
            changed = True


    if changed:
        print("updating image")
        if not display.isconnected():
            try:
                print("conecting...")
                display.connect(
                    # status_handler=net_status_handler
                )
            except:
                print("did not connect. sleeping...")
                badger2040.sleep_for(1)
                display.halt()

        last_changed = time()
        print("getting image!")
        image = getImage()
        print("drawing")
        drawImage(image)
        print("updating screen")
        display.set_update_speed(badger2040.UPDATE_NORMAL)
        display.update()
        badger_os.state_save("net_image", state)
        changed = False
    sleep(1)
    #badger2040.sleep_for(1)
    #display.halt()





