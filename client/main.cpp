#include "pico_explorer.hpp"
#include "drivers/st7789/st7789.hpp"
#include "libraries/pico_graphics/pico_graphics.hpp"
#include "badger2040.hpp"
#include <pico/curl.h>

using namespace pimoroni;

Badger2040 badger;

ST7789 st7789(PicoExplorer::WIDTH, PicoExplorer::HEIGHT, ROTATE_0, false, get_spi_pins(BG_SPI_FRONT));
PicoGraphics_PenRGB332 graphics(st7789.width, st7789.height, nullptr);

struct MemoryStruct {
    char *memory;
    size_t size;
};


static size_t
WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    struct MemoryStruct *mem = (struct MemoryStruct *) userp;

    char *ptr = realloc(mem->memory, mem->size + realsize + 1);
    if (!ptr) {
        /* out of memory! */
        printf("not enough memory (realloc returned NULL)\n");
        return 0;
    }

    mem->memory = ptr;
    memcpy(&(mem->memory[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->memory[mem->size] = 0;

    return realsize;
}

int main() {
    graphics.set_pen(255, 0, 0);
    CURLcode ret;
    CURL *hnd;

    struct MemoryStruct chunk;

    chunk.memory = malloc(1);  /* will be grown as needed by the realloc above */
    chunk.size = 0;    /* no data at this point */

    hnd = curl_easy_init();
    curl_easy_setopt(hnd, CURLOPT_URL,
                     "https://name-tag-bice.vercel.app/api/slide/0/frame/0/compact");

    curl_easy_setopt(curl_handle, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);

    /* we pass our 'chunk' struct to the callback function */
    curl_easy_setopt(curl_handle, CURLOPT_WRITEDATA, (void *) &chunk);

    /* some servers do not like requests that are made without a user-agent
       field, so we provide one */
    curl_easy_setopt(curl_handle, CURLOPT_USERAGENT, "libcurl-agent/1.0");

    /* Here is a list of options the curl code used that cannot get generated
       as source easily. You may select to either not use them or implement
       them yourself.

       CURLOPT_WRITEDATA set to a objectpointer
       CURLOPT_WRITEFUNCTION set to a functionpointer
       CURLOPT_READDATA set to a objectpointer
       CURLOPT_READFUNCTION set to a functionpointer
       CURLOPT_SEEKDATA set to a objectpointer
       CURLOPT_SEEKFUNCTION set to a functionpointer
       CURLOPT_ERRORBUFFER set to a objectpointer
       CURLOPT_STDERR set to a objectpointer
       CURLOPT_HEADERFUNCTION set to a functionpointer
       CURLOPT_HEADERDATA set to a objectpointer

     */

    ret = curl_easy_perform(hnd);

    curl_easy_cleanup(hnd);
    hnd = NULL;
    badger.init();
    badger.image(chunk.memory);
    badger.update();
    while (badger.is_busy()) {
        sleep_ms(10);
    }
    badger.halt();
}