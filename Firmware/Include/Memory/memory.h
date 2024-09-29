/**
 * @file memory.h
 * @brief Non-volatile memory storage
 * @author Arthur Beck/@ave (averse.abfun@gmail.com)
 * @note Written ad-hoc for Forge by Arthur Beck
 * @version 1.0
 * @copyright 2024
 */

#ifndef MEMORY_H
#define MEMORY_H

#include "../CMSIS-Core/cmsis_compiler.h"
#include "../HAL/stm32f4xx_hal.h"
#include <stdbool.h>

#ifdef __cplusplus
extern "C"
{
#endif

    void initMem();
    void readMemBytes(uint32_t address, uint8_t *pBuffer, uint32_t numPage);
    void writeMemBytes(uint32_t address, uint8_t *pBuffer, uint32_t numPage);

#ifdef __cplusplus
}
#endif /* __cplusplus */

#endif /* MEMORY_H */