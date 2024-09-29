/* Define stack and heap sizes */
__size_cstack__ = 0x400;  /* Stack size: 1 KB */
__size_heap__ = 0x200;    /* Heap size: 512 bytes */

/* Define the start address for the interrupt vector */
__intvec_start__ = 0x08000000;

/* Define memory regions */
MEMORY
{
    ROM (rx)  : ORIGIN = 0x08000000, LENGTH = 0x000FF800    /* 1 MB-2K ROM */
    SETTINGS (r) : ORIGIN = 0x80FF7FF, LENGTH = 2K
    RAM (rwx) : ORIGIN = 0x20000000, LENGTH = 0x00020000    /* 128 KB RAM */
    CCMRAM (rw) : ORIGIN = 0x10000000, LENGTH = 0x00010000  /* 64 KB CCMRAM */
    INTVEC (rx) : ORIGIN = __intvec_start__, LENGTH = 0x52
}

/* Define sections and their placement in memory */
SECTIONS
{
    .intvec : 
    {
        . = ALIGN(4);
        KEEP(*(.isr_vector))    /* Keep the interrupt vector in the output */
    } > ROM AT > INTVEC

    .text : 
    {
        *(.text)                /* Code section */
        *(.text.*)              /* Other code sections */
        *(.rodata)              /* Read-only data */
        *(.rodata.*)            /* Other read-only data sections */
    } > ROM

    .data : 
    {
        . = ALIGN(4);
        _sdata = .;            /* Start of initialized data section */
        *(.data)                /* Initialized data */
        *(.data.*)              /* Other data sections */
        _edata = .;            /* End of initialized data section */
    } > RAM AT > ROM

    .bss (NOLOAD) :
    {
        . = ALIGN(4);
        _sbss = .;             /* Start of uninitialized data section */
        *(.bss)                 /* Uninitialized data */
        *(.bss.*)               /* Other uninitialized data sections */
        *(COMMON)               /* Common variables */
        _ebss = .;             /* End of uninitialized data section */
    } > RAM

    .heap (NOLOAD) : 
    {
        . = ALIGN(8);
        _heap_start = .;
        . += __size_heap__;
        _heap_end = .;
    } > RAM

    .stack (NOLOAD) :
    {
        . = ALIGN(8);
        _stack_start = .;
        . += __size_cstack__;
        _stack_end = .;
    } > RAM
}

/* Define symbols for stack, heap, and data */
PROVIDE(_estack = ORIGIN(RAM) + LENGTH(RAM));
PROVIDE(_sheap = _heap_start);
PROVIDE(_eheap = _heap_end);
PROVIDE(_sstack = _stack_start);
PROVIDE(_estack = _stack_end);
