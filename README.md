## WIP Disclaimers

* This is an potential upcoming [Hack Club](https://hackclub.com) You Ship, We Ship (YSWS) program.

> **This project is semi-endorsed by Hack Club and isn't fully an official program yet.**

* Things are still under heavy development as the Forge Printer are WIP (Work in Progress) projects
* All information on this README is subject to change at any moment
* Submission requirements, images, and links are not final. Website URLs are placeholders and may not be functional
* If you have any questions about the Development of Forge (and are a teen under 18), feel free to visit [#forge-dev](https://hackclub.slack.com/archives/C078GBDKC03) on the [Hack Club Slack!](https://hackclub.com/arcade/?param=slack)

# Forge, Hack Club's 3D Printer

**[Landing Page](https://forge.hackclub.com)** | **[Gallery](https://forge.hackclub.com/gallery)**

2nd Place Finalist of the Hack Club Arcade Showcase 2024, out of over 2000 projects.

Find problems in the world and use programmatic 3D modeling to solve them. Submit your solutions to the Gallery and get a Forge 3D Printer
Forge is planned to be a **You Ship, We Ship** project from [Hack Club](https://hackclub.com).

Forge is **fully open source**. We encourage all to submit to the gallery through PRs! However, you must be a teenager or younger to receive a free printer.

## What is Forge exactly?

The Forge YSWS Project can be considered 4 major sections:

* Forge Printer - the cantilevered 3D Printer
* Forge Mainboard - the custom-engineered control board powered by a STM32F405 and TMC2209s. Also includes the interface board
* Forge Firmware - The custom-engineered firmware that powers the Forge Mainboard

## About the Forge Printer

The Forge Printer is a fast, inexpensive, and compact cantilevered 3D Printer. More details soon!

## Specifications

**These are Forge's specifications as of November 25, 2024. We're currently in the process of building MK2. As we get closer to 2025, more details will be published.**

* STM32F405RGT6 32-Bit MCU
* TMC2209 Stepper Drivers
  * Reduced Motor Noise
  * Sensorless XY homing  
* TZ-E3 Hotend
  * 300°C Maximum Temperature
  * Designed around the Bambu Lab X1C hotend
  * 30mm³/s max flow rate
* 120x120x145mm Build Volume
  * Up to 100°C heated bed temperature
  * Magnetic Textured PEI Plate
* MGN9C Linear Rails on X and Z axies
* MGN12C Linear Rail on Y axis
* Sherpa Mini Direct Drive Extruder (DDE)
* Fully Automatic Bed Leveling (ABL)
* Meanwell RPS-200-24 PSU (Intergrated)
* PLA, PETG, TPU capable
  * ABS and ASA are possible but require an enclosure and active ventilation
* Aluminum and 3D Printed ASA frame
* 3010 Axial Fan for Heatbreak cooling and 4010 "Blower-style" fan for part cooling
* Up to 500mm/s Print Velocity*
   *This number is an estimate, real print speeds will be updated as Forge's development continues
* SD1306 1.92" OLED and Rotary Encoder for the interface

## Firmware

* The Forge Mainboard will run on Marlin Firmware. (Custom, open source Forge Firmware had been planned but development has been halted as as of right now it is unrealistic)

* **The Forge Mainboard (2-layer PCB) is supported by Klipper**
  * Using the Forge Printer with Klipper will be possible! The latest revision of the Forge Mainboard (2 layer PCB version) runs a STM32F405 which is fully compatible with Klipper! Additionally, we'll be providing a Klipper [WiP configuration file](https://github.com/hackclub/Forge/blob/main/Firmware/klipper) and OrcaSlicer profiles (Coming Soon) for you!
  * SBC Info:
    * **A Raspberry Pi Zero 2W will be required for *Klipper*. You can also use another SBC (that can run MainSailOS or Fluidd) with the same form factor. However, the Zero W (1st Gen) is highly not recommended due to performance limitations. Larger SBCs like the Raspberry Pi 1/2/3/4/5 boards are not compatible due to size limitations. We'll be providing a Raspberry Pi Zero Bracket available to print closer to MK2's launch!** The Forge Mainboard connects to the SBC via GPIO to GPIO, therefore, SPI touchscreens are not recommended.

## Additional notes

* The full Forge Printer and Mainboard BOM will (soon be) at the bottom of this doc. The Forge Printer BOM will not be available until we begin prototyping. However, the BOM for the Forge Mainboard is currently available as a CSV in `Electronics/Motherboard/billofmaterials.csv`.
* The estimated value of the Forge Printer is $200-$250, but this estimate will change over time.
  * However, Forge will be **100% Free for teens 18 and under after designing 5 models and submitting a PR**
* Currently, Forge's parts and components are planned to be manufactured by [Siboor](https://www.siboor.com), a well established supplier of 3D Printing components.
* Forge is designed in Onshape. [Check out the 3D model!](https://cad.onshape.com/documents/490fa34c5c188f9b01dad5d1/w/4ce61de39bd6c276033d903d/e/7a262062418efbefd9181a13?renderMode=0&uiState=6696ce6038c5ba5455f5be75)

## Licensing

* **Currently, the Forge Project is GPLV3 (General Public License)**
* The design uses a Annex Engineering Sperpa Mini Extruder.
  * In compliance with their guidelines, the CAD models of the Forge Printer will use a placeholder provided by Annex Engineering.
  * [Sherpa Mini GitHub](https://github.com/Annex-Engineering/Sherpa_Mini-Extruder/tree/master)
* Anybody is allowed to freely use, advertise, modify, copy, or distribute any Forge designs or software as needed with the condition that any public distribution or use of Forge software/design must also be open source and use GPL.
* For more information about this license, check out this [link](https://www.gnu.org/licenses/gpl-3.0.en.html)
  
## Support the Project!

* Forge's banking is fully transparent: [Check it out now!](https://hcb.hackclub.com/forge)
* [Donate to the Forge Project](https://hcb.hackclub.com/donations/start/forge), any dollar counts!
* **Forge is now offically [fiscally sponsored](https://en.wikipedia.org/wiki/Fiscal_sponsorship#:~:text=Fiscal%20sponsorship%20refers%20to%20the,and%20an%20established%20non-profit.) by Hack Club (a 501(c)(3) NPO with EIN 81-2908499)!

## How do I get a Forge Printer?

### 1) Find a problem

Look around! Find problems that 3D printing can fix. From a carabiner to a phone case!  

### 2) Design a solution

Using any modeling software you are comfortable with, follow the tutorials (link coming soon!) and create your solutions.  

### 3) Submit your design

The submission rules to get a Forge Printer for a PR are (not available, the Forge design guidelines will be accessible at launch). **You must be a teenager (or younger to qualify for a free machine)** but anyone can make a model and make a PR. Currently, we are requiring 5 Blot-level (of quality) models. This may change as the project progresses. While the full guidelines are not accessible, here are the basics of what you should(n't) do with your Forge project:

* Exporting your design to an STL is an option if you want to test your model on another 3D printer before you submit a PR.

#### Dos and Don'ts

* A PR should have a .stl file
* Don't copy anything from other websites/generate code with AI (ChatGPT)
  * Doing so is considered plagiarism. Anyone submitting fraudulent code will be ineligible for a Forge Printer and may result in a violation of the Hack Club Code of Conduct
* Your model should be both functional and have some aesthetic quality.
  * TL:DR, make it look nice(to you at least)
* Your model should have effort (roughly 8 hours per model)

### 4) Receive the parts to build your own Forge Printer

The bill of materials for the Forge Printer will be coming soon here as we start finalizing the printer. An assembly guide will also be available here (coming soon!).
Also note that, currently, the BOMs are not polished as we communicate with Siboor and test manufacture.

## Forge Printer BOM

* Coming soon! We have the finished BOM for the MK1 Prototype from Siboor which we just need to clean up before posting here!

## Forge Project Credits:

### Forge Team:

* Krishna Meda (@EmperorNumerius) - Project Lead, Communications, Promotional Materials
* Arnnav Kudale (@blazecoding2009) - Project Lead, Sourcing, Electrical Engineering, Forge Firmware/Klipper Config Dev
* Michael Panait (@mikeymascatu) - Design Engineering, Promotional Materials
* Brendan Conover (@AGB556) - Design Engineering
* Malav Patel (@astro-develops) - Forge Landing Page Frontend Developer, Promotional Materials
* Arthur Beck (@AverseABFun) - Forge Firmware Dev and PCB designer

Note that we all kind of work on everything, listed above is just what we generally do

### Special Thanks:

* Aaron Wong (@aaronw-dev) - Former Project Lead, Firmware Dev, Artist, Electrical Engineer
* Engineering and Sales teams at Siboor - This project wouldn't be possible without them <3
* Patricio (@Patcybermind) - Former Forge Editor Developer
* Max Wofford (@maxwofford) - Hack Club HQ Representative, Forge Benefactor
* Alex Ren (@qcoral) - Thanks for the help with licensing!
* Annex Engineering (@Annex-Engineering) - Thanks for helping with the Sherpa Mini copyright!
* Jonathan Dong (@Dongathan-Jong) - Forge Art, Promotional Materials
* Beenana (@Beenana02) - Promotional Materials

### CAD Models and reference designs:
* [Sherpa Mini by Annex Engineering](https://github.com/Annex-Engineering/Sherpa_Mini-Extruder)
