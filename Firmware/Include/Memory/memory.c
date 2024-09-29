/**
 * @file memory.c
 * @brief Non-volatile memory storage
 * @author Arthur Beck/@ave (averse.abfun@gmail.com)
 * @note Written ad-hoc for Forge by Arthur Beck
 * @version 1.0
 * @copyright 2024
 */

#include "memory.h"

static bool initalized = false;

void initMem()
{
    initalized = true;
}

void readMemBytes(uint32_t address, uint8_t *pBuffer, uint32_t numPage)
{
    if (!initalized)
    {
        initMem();
    }
}