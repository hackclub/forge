| title | Sample Guide |
| description | A demo of the interactive guide format — swap this out for real guides. |
| unlisted | true |
| --- | --- |

Guides live in the `guides/` folder of the repo, one folder per guide with a `guide.md` inside. Anything you write above the first step heading becomes this overview step.

A metadata table at the top of the file sets the guide's `title`, `description`, `priority` (higher sorts first), and `unlisted` (hide it from the list).

## Add steps

Every `##` heading in `guide.md` becomes its own step. Whatever markdown you write under the heading — text, images, lists, code blocks, callouts — is the step's content.

Use **Next** to mark a step done and move on. Your progress is saved on this device, so you can close the popup and pick up where you left off.

## Attach files

Drop files into the guide's `files/` folder and link to them from a step, like this: [blink.ino](files/blink.ino)

Linked files show up as attachments on that step — text files are viewable inline with a copy button, and everything is downloadable. Images linked from `files/` render inline in the step content instead.

## Ship it

That's the whole format. Add a new folder under `guides/`, write your `guide.md`, and it appears in the Guides list automatically.
