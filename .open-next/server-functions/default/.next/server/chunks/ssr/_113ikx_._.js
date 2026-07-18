module.exports=[98801,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(211857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/components/blog/BlogPostView.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/components/blog/BlogPostView.tsx <module evaluation>","default")},509782,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(211857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/components/blog/BlogPostView.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/components/blog/BlogPostView.tsx","default")},192248,a=>{"use strict";a.i(98801);var b=a.i(509782);a.n(b)},220777,a=>{"use strict";var b=a.i(907997),c=a.i(245618);a.i(570396);var d=a.i(673727),e=a.i(192248);let f=[{id:"p4",title:"Building DevMerge: A React-Powered Suika Physics Clone",slug:"building-devmerge-suika-physics",excerpt:"Ever wanted to combine HTML and CSS to create React, but with bouncing physics? Here's a deep dive into building a Suika-style merge game using Matter.js.",content:`## What is DevMerge?

Have you ever played that wildly addictive "Suika" (Watermelon) game where you drop fruits into a box, and when two identical fruits touch, they merge into a bigger one? 

**DevMerge** is my developer-themed spin on that concept. Instead of fruits, you drop technologies. Two \`HTML\` blocks merge into \`CSS\`. Two \`CSS\` blocks merge into \`JS\`. And if you're good enough, you can merge your way all the way up to a \`Full-Stack Architect\` block!

> [!NOTE] 
> **Why build this?** It's a fantastic exercise in integrating a complex physics engine into a modern React application. It bridges the gap between traditional DOM manipulation and raw HTML5 Canvas rendering.

---

## The Tech Stack

Here is exactly what we used to build this game and *why*:

*   **Frontend Framework (React & Next.js 15):** React handles our UI state (like the current score, game over screens, and the "Next Block" preview). Next.js provides the lightning-fast routing to host the game on the portfolio.
*   **Physics Engine (Matter.js):** This is the heavy lifter. Matter.js is a 2D physics engine for the web. It handles all the complex **Vector Math** (calculating speed, direction, gravity, and angles) so we don't have to write physics formulas from scratch.
    *   *Real-World Analogy:* Imagine React is the scoreboard and referee of a basketball game, but Matter.js is the actual gravity pulling the basketball through the hoop.
*   **Styling (Tailwind CSS v4):** Used for styling the scoreboard, layout, and overlay modals. It keeps the game container responsive on mobile devices.

---

## Core Features Breakdown

Here are the moving parts that make the game work:

1.  **The Physics World:** A bounded box (with invisible walls and a floor) where blocks can fall, bounce, and stack without falling off the screen.
2.  **Mouse/Touch Dropping:** The game tracks your mouse coordinates horizontally. When you click, it creates a new "body" (a physics object) and drops it from the ceiling.
3.  **Collision Engine (The Merge):** The game constantly watches every block. The exact microsecond two blocks of the same "tier" touch, it deletes both of them, spawns the next tier block in their exact location, and adds points to your score.

---

## Deep Dive: How the Core Feature Works (With Code)

The absolute most important mechanism in this game is **Collision Merging**. 

How do we know when two objects hit each other? Matter.js gives us an event listener called \`collisionStart\`. We intercept this event, check if the two objects that hit are the same type, and if so, merge them.

Here is the production-grade logic that makes this happen:

\`\`\`javascript
// 1. Listen for any collision in the physics engine
Matter.Events.on(engine, 'collisionStart', (event) => {
  
  // 2. Loop through all pairs of objects that just collided
  event.pairs.forEach((collision) => {
    const bodyA = collision.bodyA;
    const bodyB = collision.bodyB;

    // 3. Check if both objects have the same 'tier' (e.g., both are HTML)
    if (bodyA.tier === bodyB.tier && bodyA.tier !== undefined) {
      
      // 4. Prevent merging if they are already the max tier
      const nextTierIndex = bodyA.tier + 1;
      if (nextTierIndex >= TECH_TIERS.length) return;

      // 5. Remove the two old blocks from the physics world
      Matter.Composite.remove(engine.world, [bodyA, bodyB]);

      // 6. Calculate exactly where they collided
      const midPointX = (bodyA.position.x + bodyB.position.x) / 2;
      const midPointY = (bodyA.position.y + bodyB.position.y) / 2;

      // 7. Spawn the new upgraded block at that exact location
      const newBlock = createTechBlock(midPointX, midPointY, nextTierIndex);
      Matter.Composite.add(engine.world, newBlock);

      // 8. Update the player's score
      setScore((prev) => prev + TECH_TIERS[nextTierIndex].score);
    }
  });
});
\`\`\`

### Line-by-Line Breakdown:
*   **Line 2 (\`Matter.Events.on\`)**: We tell the physics engine, "Hey, wake me up every time *any* two objects bump into each other."
*   **Line 5 (\`event.pairs\`)**: In a single frame (1/60th of a second), multiple blocks might hit each other simultaneously. We loop through all pairs to check them all.
*   **Line 10 (\`bodyA.tier === bodyB.tier\`)**: We check their custom "tier" property. If an HTML block hits a CSS block, this is false, and nothing happens. If HTML hits HTML, it's true!
*   **Line 17 (\`Matter.Composite.remove\`)**: We literally delete the two old blocks from existence so they disappear from the screen.
*   **Line 20-21 (Midpoint Math)**: We take the X (horizontal) and Y (vertical) coordinates of both old blocks, add them together, and divide by 2. This finds the exact center point between them so we know where to spawn the new block.
*   **Line 24-25 (\`Matter.Composite.add\`)**: We create the new, upgraded block and inject it into the physics world.

---

## Step-by-Step Architecture Guide

If you want to build this yourself, here is the exact blueprint to follow:

### Step 1: The React Setup
Initialize a blank Next.js or React application. Create a basic \`<canvas>\` element on your page. This canvas is like a blank piece of paper where our physics engine will draw the game.

### Step 2: Initialize the Physics World
Install \`matter-js\`. In a \`useEffect\` hook, create the Matter.js \`Engine\` (the brain calculating gravity) and the \`Render\` (the artist drawing the blocks onto your canvas). Create static rectangles to act as the floor and walls of your box.

### Step 3: Implement Player Controls
Add an event listener for \`onPointerDown\`. When the user clicks the canvas, grab their X coordinate. Use a function like \`Bodies.circle()\` to create a round physics object representing your level 1 tech block, and add it to the world at the top of the screen.

### Step 4: The Game Loop & Collisions
Add the \`collisionStart\` event listener explained in the Deep Dive section. Make sure you use a React state variable (like \`const [score, setScore] = useState(0)\`) to keep track of the points when merges happen.

### Step 5: The "Game Over" Condition
Matter.js doesn't know what "losing" is. You have to tell it! Create a \`setInterval\` loop that runs every second. Have it check the Y (vertical height) coordinate of every block in the box. If any block's height goes above the top of your container, trigger a React state \`setGameOver(true)\` to freeze the game and show a "You Lose" overlay!
`,category:"tutorial",tags:["Matter.js","React","Physics","GameDev"],cover_image:"",published_at:new Date().toISOString(),read_time:10,views_count:105,likes_count:42},{id:"p5",title:"Movie Hacker Screen: The Typing Simulator",slug:"movie-hacker-screen-the-typing-simulator",excerpt:"How to simulate high-speed movie-style hacking using randomized strings and React event interception.",content:`## What is the Movie Hacker Screen?

Have you ever watched a spy movie and seen the "hacker" smashing their keyboard at 200 words per minute while glowing green text rapidly fills the screen? We all know that's not how real software engineering works—but it sure looks incredibly cool. 

I built the **Mainframe Decryption** tool so anyone can feel like a cinematic hacker just by opening the page, full-screening their browser, and mashing their keyboard.

> [!NOTE] 
> **Why build this?** This is a fantastic exercise in browser event interception. It teaches you how to hijack default browser behaviors (like scrolling or typing into an input) and replace them entirely with custom React logic.

---

## The Tech Stack

Here is what we used to build this typing simulation:

*   **Frontend Framework (React & Next.js):** React manages the "state" of the terminal. It keeps track of exactly how much code has been typed so far and updates the screen instantly on every keystroke.
*   **Styling (Tailwind CSS):** We use specific Tailwind classes like \`text-emerald-500\` combined with a custom \`drop-shadow\` to give the text that authentic, glowing retro CRT monitor vibe.
*   **Raw JavaScript Events (No Backend):** The entire simulation runs instantly in your browser memory. There is no server latency, which makes the typing feel lightning fast.

---

## Core Features Breakdown

The magic of the hacker screen relies on a few core illusions:

1.  **The Code Repository:** A giant string of complex-looking (but harmless) Linux kernel C++ code loaded into the browser's memory.
2.  **Keymash Detection:** Every time you press *any* key on your keyboard, the system intercepts it and prevents the normal letter from appearing on screen.
3.  **Chunk Extraction:** Instead of typing what you actually pressed, the engine grabs the next 3 to 7 characters from the secret code repository and prints *them* to the screen instead.

---

## Deep Dive: How the Core Feature Works (With Code)

The absolute most important mechanism here is the **Event Interception Loop**. 

When you type a letter, we stop the browser's default behavior, calculate how many characters to reveal, and slice them from the master string.

Here is a simplified look at the React hook that powers this illusion:

\`\`\`javascript
// 1. A state to track how much of the code has been "typed"
const [charIndex, setCharIndex] = useState(0);

// 2. The master string of complex "hacker" code
const MASTER_CODE = "function bypassMainframe() { \\n  const hex = 0x4A7C; \\n  decrypt(hex); \\n}";

// 3. Listen for any keypress on the document
useEffect(() => {
  const handleKeyDown = (e) => {
    // 4. Ignore special keys like Shift, Ctrl, Alt
    if (e.key === 'Shift' || e.key === 'Control') return;
    
    // 5. Prevent the key from doing what it normally does (like scrolling)
    e.preventDefault();

    // 6. Generate a random number between 3 and 7
    const charsToAdd = Math.floor(Math.random() * 5) + 3;

    // 7. Advance the index by that random amount
    setCharIndex((prevIndex) => {
      // 8. If we reach the end of the code, loop back to the beginning
      if (prevIndex + charsToAdd >= MASTER_CODE.length) {
        return 0; 
      }
      return prevIndex + charsToAdd;
    });
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
\`\`\`

### Line-by-Line Breakdown:
*   **Line 2 (\`useState\`)**: We keep a numeric counter keeping track of exactly where we are in the master code string. If the value is 10, it means 10 characters are visible.
*   **Line 11 (\`e.preventDefault()\`)**: This is crucial. If you press the spacebar on a normal website, the browser scrolls down the page. This function completely stops that from happening.
*   **Line 14 (\`Math.random\`)**: We don't want to type exactly one character per keystroke; that looks too slow. We add a random burst of 3 to 7 characters per keypress to make you look like a speed-typing genius.
*   **Line 17 (\`setCharIndex\`)**: We update React's state, telling it to render the UI with the new, longer chunk of text.
*   **Line 19 (\`>= MASTER_CODE.length\`)**: If you type so much that you run out of code, we seamlessly loop the index back to 0.

---

## Step-by-Step Architecture Guide

Want to impress your friends at the coffee shop? Here is how to build this yourself:

### Step 1: The UI Canvas
Setup a full-screen, black background container using Tailwind (\`bg-black h-screen w-screen\`). Add \`overflow-hidden\` so the screen doesn't get a massive scrollbar and jump around wildly while typing.

### Step 2: The Master Code
Find a large chunk of open-source C++ or Rust code (the Linux kernel is a great source) and save it as a giant string variable in your file. 

### Step 3: The Interceptor
Create the \`charIndex\` state and the \`handleKeyDown\` event listener exactly as shown in the Deep Dive section above. Attach it to the global \`window\` object.

### Step 4: Rendering the Illusion
In your JSX, render the code using the substring method: \`MASTER_CODE.substring(0, charIndex)\`. This will print out exactly the amount of text corresponding to how many times you've hit the keyboard.

### Step 5: Cinematic Styling
Apply CSS styles to the text to sell the effect. Use monospace fonts (\`font-mono\`) and a bright green color (\`text-emerald-500\`). Add a subtle CSS drop-shadow to simulate the glow of an old CRT monitor.

### Step 6: (Bonus) Auto-Scroll
If you type past the bottom of the screen, you won't see the new code! Put an invisible \`div\` at the very bottom of the text container. Use a \`useEffect\` with \`ref.current.scrollIntoView()\` that fires every time \`charIndex\` updates, so the newest code is always anchored at the bottom.
`,category:"tutorial",tags:["React","JavaScript","Entertainment"],cover_image:"",published_at:new Date(Date.now()-1e3).toISOString(),read_time:8,views_count:0,likes_count:0},{id:"p6",title:"Building an Image to ASCII Art Generator",slug:"building-an-image-to-ascii-art-generator",excerpt:"How to use HTML5 Canvas to read the brightness of pixels and turn them into text-based vintage art.",content:`## What is ASCII Art?

Remember when computer graphics were just letters, numbers, and symbols arranged beautifully on a black screen? **ASCII Art** is a classic internet aesthetic born out of early hardware limitations. 

I built a tool that takes any modern image you upload and instantly converts it into purely text-based art. It's like applying a vintage, cyberpunk photo filter, but the resulting image is made entirely of characters!

> [!NOTE] 
> **Why build this?** Processing images directly in the browser is a surprisingly heavy task. Building this generator is a deep dive into HTML5 Canvas, raw Pixel manipulation, and mapping visual data (colors) into textual data (strings).

---

## The Tech Stack

Here is exactly what we used to build the ASCII engine:

*   **HTML5 Canvas (The Core):** We use a hidden \`<canvas>\` element to mathematically read the exact color of every single pixel in an uploaded image.
*   **JavaScript (React):** Handles the state and the heavy math needed to map a pixel's specific brightness level to a specific character.
*   **Tailwind CSS:** For styling the UI, allowing users to customize the resolution and color themes with a sleek control panel.

---

## Core Features Breakdown

To turn a beautiful high-res photo into text, the application has to do three major things:

1.  **File Upload & Resize:** We take an image from the user, but we shrink it down drastically (e.g., to 100 pixels wide). Why? Because if we used a 4K image, your browser would crash trying to render 8 million characters on a single webpage!
2.  **Pixel Brightness Calculation:** The tool analyzes the Red, Green, and Blue (RGB) values of a pixel to determine if it is a dark shadow or a bright highlight.
3.  **Character Mapping:** We assign visually "dense" characters (like \\\`@\\\` or \\\`#\\\`) to dark pixels, and visually "light" characters (like \\\`.\\\` or \\\`-\\\`) to bright pixels.

---

## Deep Dive: How the Core Feature Works (With Code)

How do we actually convert colors into text? The secret lies in a concept called **Brightness Mapping**.

Here is the exact logic we use to look at a single pixel and figure out what character it should become:

\\\`\\\`\\\`javascript
// 1. A string of characters from darkest (dense) to lightest (sparse)
const ASCII_CHARS = "@%#*+=-:. ";

// 2. A function to convert a single pixel's color into one character
function pixelToChar(r, g, b) {
  
  // 3. Calculate the "brightness" of the pixel (0 to 255)
  // We simply average the red, green, and blue values.
  const brightness = (r + g + b) / 3;

  // 4. Map the brightness to an index in our character string
  // If brightness is 0 (black), index is 0 ('@')
  // If brightness is 255 (white), index is 9 (' ')
  const charIndex = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1));

  // 5. Return the specific character
  return ASCII_CHARS[charIndex];
}
\\\`\\\`\\\`

### Line-by-Line Breakdown:
*   **Line 2 (\\\`ASCII_CHARS\\\`)**: We define our ASCII palette. The \\\`@\\\` symbol takes up a lot of screen space (perfect for shadows), while the \\\`.\\\` is tiny (perfect for highlights). The space at the end is for pure white.
*   **Line 9 (\\\`brightness = ...\\\`)**: We find the average brightness. *(Fun fact: Production algorithms actually weigh the Green channel higher because human eyes are more sensitive to green light, but a simple average works perfectly for this vibe!).*
*   **Line 14 (\\\`charIndex\\\`)**: This is the magic math. We take the brightness percentage (\\\`brightness / 255\\\`) and multiply it by the number of characters we have in our palette. 
*   **Line 14 (\\\`Math.floor\\\`)**: We round that decimal down so we get a clean integer index like 0, 1, or 5 to select the exact character from our string.
*   **Line 17 (\\\`return\\\`)**: We return the character and add it to our massive output string!

---

## Step-by-Step Architecture Guide

Ready to build your own image processor? Here is the exact blueprint to follow:

### Step 1: The File Uploader
Create an \`<input type="file" />\` in React to accept image uploads. Use the native browser \`FileReader\` API to read the file into a base64 Data URL.

### Step 2: The Hidden Canvas
Create an \`Image\` object in Javascript. Once it loads the uploaded file, draw it onto a hidden standard HTML \`<canvas>\` element. 

### Step 3: Shrink It Down
When drawing to the canvas, scale the image way down (to about 80-120 pixels wide) while maintaining the aspect ratio. Rendering text is incredibly expensive for the browser; you cannot render a 1080p image in text!

### Step 4: Extract the Data
Use \`canvas.getContext('2d').getImageData(0, 0, width, height)\` to extract the raw pixel array. This returns a massive, flat, one-dimensional array of every single pixel's Red, Green, Blue, and Alpha (transparency) values in order.

### Step 5: The Conversion Loop
Run a \`for\` loop over that massive array, jumping ahead by 4 steps each time (R, G, B, A). Pass the RGB values into the \`pixelToChar\` function from our Deep Dive to convert every group of RGB values into a single text character. Whenever you reach the end of a row (based on your canvas width), add a newline \`\\n\` character.

### Step 6: Render the Masterpiece
Render the final giant string of characters inside a \`<pre>\` HTML tag in your React component. The \`<pre>\` tag ensures that all the spacing, line breaks, and monospace formatting stay perfectly aligned!
`,category:"tutorial",tags:["Canvas","React","Image Processing"],cover_image:"",published_at:new Date(Date.now()-2e3).toISOString(),read_time:12,views_count:0,likes_count:0},{id:"p7",title:"Crafting Premium CSS Mesh Gradients",slug:"crafting-premium-css-mesh-gradients",excerpt:"How to build an interactive draggable canvas that generates complex CSS mesh backgrounds in real-time.",content:`## The Era of Soft UI

Have you noticed how modern, high-end websites (like Apple, Stripe, or Linear) use those beautiful, softly glowing, blurred color blobs in their backgrounds? They feel alive, tactile, and incredibly premium. 

I built a tool that lets anyone drag control points around a screen to instantly generate these "Mesh Gradients" without using any massive, slow-loading images—just pure CSS.

> [!NOTE] 
> **Why build this?** This project bridges the gap between design and engineering. It teaches you how to map physical mouse coordinates to CSS properties, dynamically re-rendering the DOM on the fly.

---

## The Tech Stack

Here is exactly what powers the generator:

*   **React:** Handles the state of all the floating control points. It constantly remembers their X/Y coordinates, their specific HEX colors, and their blur radius.
*   **Tailwind CSS:** Manages the overall UI layout and the sleek glassmorphism panels surrounding the canvas.
*   **Vanilla CSS (Radial Gradients):** The actual heavy lifting is done purely by the browser's native CSS rendering engine. Because it's just CSS, the performance is flawless.

---

## Core Features Breakdown

To make a smooth, interactive generator, we implemented three core features:

1.  **Interactive Canvas:** A massive trackpad where you can physically click and drag glowing nodes. As you move them, the background shifts underneath them in real-time.
2.  **Dynamic Node Editor:** A control panel that lets you add up to 6 custom nodes, change their specific HEX colors using a color picker, and adjust how "wide" their blur radius spreads.
3.  **Instant CSS Export:** As you tweak the design, the tool automatically compiles a massive string of CSS code. With one click, you can copy it straight into your own project.

---

## Deep Dive: How the Core Feature Works (With Code)

How do we generate this effect using only CSS? The secret is stacking multiple **Radial Gradients** on top of each other!

Here is the exact function that powers the live preview and the code export:

\\\`\\\`\\\`javascript
// 1. We keep an array of all the active control points in React State
const points = [
  { id: 1, x: 20, y: 30, color: '#f43f5e', size: 50 },
  { id: 2, x: 80, y: 20, color: '#a855f7', size: 60 }
];

// 2. A function to generate the final CSS string
function generateBackground(pointsArray) {
  
  // 3. Loop through every point and create a CSS radial gradient rule
  const bgImage = pointsArray.map(p => 
    \\\`radial-gradient(circle at \\\${p.x}% \\\${p.y}%, \\\${p.color} 0%, transparent \\\${p.size}%)\\\`
  ).join(', ');
  
  // 4. Return the complete, injectable CSS code
  return \\\`background-color: #000000;\\nbackground-image: \\\${bgImage};\\\`;
}
\\\`\\\`\\\`

### Line-by-Line Breakdown:
*   **Line 2 (\\\`points\\\`)**: We store an array of objects. Each object represents one glowing orb. It holds its exact X and Y position (as percentages), its color, and how big its glow is (\\\`size\\\`).
*   **Line 11 (\\\`radial-gradient\\\`)**: This is the core magic! For every point, we tell CSS: *"Draw a circle exactly at X% and Y%. Start with the solid color in the very center (0%), and smoothly fade it out into total transparency until it hits the \`size\` percentage."*
*   **Line 13 (\\\`join(', ')\\\`)**: CSS allows you to stack multiple backgrounds on a single element by separating them with commas. We combine all our individual circles into one massive stacked background rule.

---

## Step-by-Step Architecture Guide

Want to build your own mesh generator? Here is the exact blueprint to follow:

### Step 1: The Canvas Container
Create a large container \`<div>\` with a black background (\`bg-black\` in Tailwind). This is your canvas.

### Step 2: Event Listeners
Add \`onPointerDown\`, \`onPointerMove\`, and \`onPointerUp\` events to your container to track exactly where the user is dragging their mouse or finger. Use these coordinates to update the X and Y state of the currently active point.

### Step 3: The Draggable Handles
Render small white circles (the "handles") inside the container, absolutely positioned to match the X and Y state of each point. Add \`cursor-grab\` CSS so the user knows they can pick them up.

### Step 4: The String Generator
Use the \`generateBackground\` function from the Deep Dive section above to build the massive CSS string based on your React state.

### Step 5: Live DOM Repainting
Apply that exact string directly to the \`style={{}}\` property of your large container. Now, whenever the state updates (which happens 60 times a second while dragging), the background repaints instantly!

### Step 6: Code Export
Add a \`<pre><code>\` block to your UI that simply displays the raw \`generateBackground\` string. Hook up a "Copy" button using \`navigator.clipboard.writeText()\` so users can steal their creation for their own websites!
`,category:"tutorial",tags:["CSS","React","Design"],cover_image:"",published_at:new Date(Date.now()-3e3).toISOString(),read_time:6,views_count:0,likes_count:0},{id:"p8",title:"How I Built the AI 'Roast My Site' Bot",slug:"building-ai-portfolio-roaster",excerpt:"Using Claude 3.5 Sonnet, Cheerio, and custom prompt engineering to build an unhinged Senior Engineer roasting bot.",content:`## A Different Kind of Code Review

Getting your portfolio reviewed by a Senior Engineer is one of the best ways to improve—but what if that engineer had zero filter, a cynical attitude, and ruthlessly roasted your design choices? 

I built the **AI Portfolio Roaster**, a tool that takes any website URL, visually analyzes it, and delivers a brutal (but surprisingly helpful) teardown powered by AI.

> [!NOTE] 
> **Why build this?** Generative AI is often used for boring, corporate tasks. Building this roaster was an exercise in *Personality Engineering*—proving that AI can be genuinely funny, chaotic, and engaging if you prompt it correctly.

---

## The Tech Stack

Here is what we used to build our cynical robot mentor:

*   **Anthropic API (Claude 3.5 Sonnet):** The absolute brains of the operation. Claude is given a highly specific system prompt to act as an unhinged tech veteran.
*   **Cheerio (HTML Parsing):** AI cannot browse the web on its own easily. Before we send the site to the AI, we use a lightweight scraper called Cheerio to extract the text content and metadata so Claude actually knows what's on the page.
*   **Next.js API Routes:** A secure backend proxy that safely hides my Anthropic API keys from the public while processing the requests.

---

## Core Features Breakdown

To make the roast feel accurate and hilarious, the tool relies on a specific pipeline:

1.  **The Scraper:** The user inputs a URL. Our server immediately fetches that website and strips away all the messy CSS and JavaScript, leaving only the raw text content, titles, and meta tags.
2.  **The Prompt Engineering:** The secret sauce! We tell Claude to be sarcastic, cynical, and brutally honest, acting like a Senior Developer who has "seen it all and hates most of it."
3.  **Constructive Chaos:** Instead of just being mean, the AI is explicitly instructed to hide *actual, genuinely useful* UI/UX advice inside its rants.

---

## Deep Dive: How Prompt Engineering Works (With Code)

The code for this tool isn't just about calling an API; it's about crafting the exact personality.

Here is a simplified look at the backend route that generates the roast:

\\\`\\\`\\\`javascript
// 1. We import the official SDK
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 2. The API Route Handler
export async function POST(req) {
  const { url, scrapedContent } = await req.json();

  // 3. We call Claude with a highly specific system prompt
  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1000,
    system: \\\`You are an incredibly cynical, unhinged Senior Staff Engineer.
      You have 20 years of experience and zero patience for modern web trends.
      Your job is to ROAST the provided website content. Be brutal, be sarcastic,
      but somehow hide one actually useful piece of constructive criticism inside
      your rant. Do not hold back.\\\`,
    messages: [
      { role: "user", content: \\\`Here is the website content for \\\${url}:\\n\\n\\\${scrapedContent}\\\` }
    ]
  });

  // 4. Return the brutal roast to the frontend
  return new Response(JSON.stringify({ roast: msg.content[0].text }));
}
\\\`\\\`\\\`

### Line-by-Line Breakdown:
*   **Line 11 (\\\`model\\\`)**: We use Claude 3.5 Sonnet. Why? Because it is incredibly fast and has fantastic creative writing capabilities, making the roasts much funnier and less robotic than standard models.
*   **Line 13 (\\\`system\\\`)**: The System Prompt is where the magic happens. By giving the AI a very specific persona ("cynical, unhinged Senior Staff Engineer"), we completely change its tone from a helpful assistant to a chaotic mentor.
*   **Line 16 (\\\`constructive criticism\\\`)**: This is the most important instruction! A roast isn't fun if it's just mean. By forcing the AI to include real, actionable advice wrapped in sarcasm, the tool actually helps developers improve their sites.

---

## Step-by-Step Architecture Guide

Want to build your own AI personality? Here is the exact blueprint:

### Step 1: The Input UI
Create a slick frontend UI with an input field for a URL and a glowing "Roast Me" button. Make sure to validate that the user actually entered a real URL!

### Step 2: The Proxy Route
When clicked, send the URL to a Next.js backend API Route. **Never** put your Anthropic API key on the frontend, or hackers will steal it and rack up a massive bill.

### Step 3: The Scraper
In the API Route, use the \`fetch()\` API combined with a library like \`cheerio\` to download the target website's HTML. Extract the \`<title>\`, \`<meta>\` descriptions, and \`<body>\` text.

### Step 4: The AI Call
Pass that scraped text into the Anthropic SDK along with your custom System Prompt (like the one in the Deep Dive above). 

### Step 5: Render the Roast
Receive the JSON response from the backend and render it in a custom "chat bubble" UI on the frontend. *Bonus points:* use a typewriter effect to make it feel like the AI is live-typing the roast directly at the user!
`,category:"devlog",tags:["AI","Anthropic","Prompt Engineering"],cover_image:"",published_at:new Date(Date.now()-4e3).toISOString(),read_time:7,views_count:0,likes_count:0},{id:"p9",title:"Stacking the Web: Building Tech Stack Jenga",slug:"building-tech-stack-jenga",excerpt:"How to use Matter.js and React to build a fully playable 2D physics simulation of a Jenga tower.",content:`## A Playable Tech Stack

Instead of just listing the technologies I know in a boring bulleted list, I wanted visitors to *feel* the weight of my tech stack. 

So, I built a fully playable, 2D physics simulation of Jenga blocks using React. Each wooden block represents a tool like Next.js, Tailwind, or Supabase. You can click them, drag them, and watch the entire tower inevitably collapse into chaotic physics-driven destruction.

> [!NOTE] 
> **Why build this?** This is a masterclass in separating a "Physics Engine" from a "Render Engine". We use Matter.js to handle the math, but we render the actual visuals using standard React \`<div>\`s so we can style them beautifully with Tailwind CSS.

---

## The Tech Stack

Here is what we used to build the game:

*   **Matter.js:** A fantastic, lightweight 2D physics engine for the web. It handles all the gravity, collisions, and friction calculations automatically in the background.
*   **React:** Acts as the bridge between the physics engine and the DOM. We read the coordinates from Matter.js 60 times a second and update React state to move our HTML elements.
*   **Tailwind CSS:** Styles the blocks to look like modern, rounded UI components rather than boring, flat Canvas rectangles.

---

## Core Features Breakdown

To make Jenga work in the browser, we need three primary systems:

1.  **The Physics World:** A simulated 2D environment with invisible walls and a solid floor so the blocks don't fall infinitely into the abyss when the tower collapses.
2.  **The Jenga Engine:** A loop that programmatically stacks 20-30 blocks in alternating layers (3 horizontal, then 3 vertical, exactly like the real game).
3.  **Mouse Constraints:** A special tool in Matter.js that links your physical computer mouse to the simulated physical blocks, letting you click and pull them with realistic tension.

---

## Deep Dive: How the Stacking Logic Works (With Code)

Building a Jenga tower manually block-by-block would be incredibly tedious. Instead, we use a loop to build the tower algorithmically.

Here is the exact function that spawns the tower:

\\\`\\\`\\\`javascript
import Matter from 'matter-js';

function createJengaTower(engine, x, y, rows) {
  const blockWidth = 120;
  const blockHeight = 30;
  const blocks = [];

  // 1. Loop through every row we want to build
  for (let i = 0; i < rows; i++) {
    const isHorizontal = i % 2 === 0; // 2. Alternate orientation every row
    
    // 3. Every row has 3 blocks
    for (let j = 0; j < 3; j++) {
      let posX, posY, width, height;

      if (isHorizontal) {
        // Lay them flat
        posX = x + (j * blockWidth);
        posY = y - (i * blockHeight);
        width = blockWidth;
        height = blockHeight;
      } else {
        // Stand them up
        posX = x + (blockWidth) + (j * blockHeight);
        posY = y - (i * blockWidth);
        width = blockHeight;
        height = blockWidth;
      }

      // 4. Create the physics body and add it to our array
      const block = Matter.Bodies.rectangle(posX, posY, width, height, {
        friction: 0.5, // 5. Add friction so the tower doesn't slide apart!
        restitution: 0.1, // Less bouncy, like real wood
      });
      blocks.push(block);
    }
  }

  // 6. Add all the blocks to the world at once
  Matter.World.add(engine.world, blocks);
}
\\\`\\\`\\\`

### Line-by-Line Breakdown:
*   **Line 10 (\\\`i % 2 === 0\\\`)**: This simple modulo operator is the absolute secret to Jenga. If it's an even row, we lay the blocks horizontally. If it's odd, we rotate them vertically.
*   **Line 32 (\\\`Matter.Bodies.rectangle\\\`)**: We ask the physics engine to calculate a rectangle's mass, gravity pull, and collision boundaries based on the coordinates we generated.
*   **Line 33 (\\\`friction: 0.5\\\`)**: Real life has friction. If you set this to 0, the blocks would slide off each other like wet ice the moment they spawned. Setting it to 0.5 gives them that rough, wooden Jenga feel.

---

## Step-by-Step Architecture Guide

Want to build your own physics toy? Here is the exact blueprint:

### Step 1: Initialize the Engine
Install \`matter-js\` and initialize an Engine, World, and Runner inside a React \`useEffect\` hook. Make sure to return a cleanup function that destroys the engine when the component unmounts!

### Step 2: Build the Floor
Create a physical \`Floor\` using \`Matter.Bodies.rectangle(..., { isStatic: true })\`. The \`isStatic: true\` property is crucial—it means gravity will never affect the floor, making it an immovable object.

### Step 3: Stack the Blocks
Call the \`createJengaTower\` function (from the Deep Dive section) to spawn 10-15 rows of blocks directly above your static floor.

### Step 4: The Hand of God
Use a \`Matter.MouseConstraint\` to link the user's cursor to the physics engine. This enables the ability to click on blocks, pull them out, and throw them across the screen.

### Step 5: DOM Synchronization
Instead of using the built-in Matter.js Canvas renderer (which is ugly and hard to style), sync the X, Y, and Angle of every physics body to a React \`<div>\` using \`transform: translate(x,y) rotate(angle)\` on every animation frame. 

### Step 6: Tailwind Styling
Now that your React \`<div>\`s are moving perfectly in sync with the invisible physics bodies, you can style them using Tailwind! Add rounded corners, background colors, and drop shadows to make them look like beautiful UI components.
`,category:"tutorial",tags:["React","Matter.js","Physics"],cover_image:"",published_at:new Date(Date.now()-5e3).toISOString(),read_time:8,views_count:0,likes_count:0},{id:"p10",title:"Building the Ultimate Physics Sandbox",slug:"ultimate-physics-sandbox",excerpt:"How to combine Matter.js and HTML5 Canvas to build a nostalgic, high-performance 2D rigid body sandbox.",content:`## Nostalgic Web Physics

Remember the old Flash game era where you could just toss rigid bodies around a screen, spawn endless bouncy balls, and watch gravity do its thing? There is something incredibly therapeutic about pure digital physics. 

I built the **Ultimate Physics Sandbox** to bring that nostalgic joy back to the modern web. It allows users to click anywhere to spawn randomized polygons and watch them violently collide inside a constrained arena.

> [!NOTE] 
> **Why build this?** This project is an exploration into the limits of browser performance. Rendering 500 moving objects in the DOM with React will crash a browser, but rendering them directly to an HTML5 Canvas allows for flawless 60 FPS performance.

---

## The Tech Stack

Here is what we used to build the sandbox:

*   **Matter.js:** Our trusty 2D physics engine. It runs a continuous loop calculating the velocity, mass, and bounding boxes of every single object on screen.
*   **HTML5 Canvas:** Unlike the Jenga game where we used React \`<div>\` elements, here we use Matter.js's built-in Canvas renderer for raw graphical performance.
*   **React (Next.js):** Manages the lifecycle of the simulation, ensuring it cleans itself up properly when you leave the page so your browser doesn't melt.

---

## Core Features Breakdown

To make the sandbox feel chaotic but controlled, we implemented three key systems:

1.  **The Click Spawner:** Every time you click anywhere on the canvas, the engine calculates your exact mouse coordinates and instantly drops a brand new physics body right at that spot.
2.  **Procedural Generation:** To keep things visually interesting, every spawned object is given a random shape (circle, rectangle, or complex polygon) and a vibrant neon color.
3.  **The Walled Arena:** Invisible boundaries encompass the screen so your objects don't fall off into the digital void, allowing them to stack up into a massive pile at the bottom of your screen.

---

## Deep Dive: How the Click Spawner Works (With Code)

The most important part of a sandbox is the ability to interact with it. Here is exactly how we detect a click and inject a new object into the physics world.

\\\`\\\`\\\`javascript
// 1. Listen for clicks on the main Canvas element
canvasElement.addEventListener('mousedown', (event) => {
  
  // 2. Get the exact X and Y coordinates of the mouse click
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  // 3. Generate a random size and number of sides for our polygon
  const randomSize = Math.floor(Math.random() * 30) + 20; // Between 20 and 50
  const randomSides = Math.floor(Math.random() * 6) + 3;  // Between 3 (triangle) and 8 (octagon)

  // 4. Create the new physics body
  const newBody = Matter.Bodies.polygon(mouseX, mouseY, randomSides, randomSize, {
    restitution: 0.8, // Make it very bouncy!
    render: {
      fillStyle: getRandomVibrantColor(), // Assign a random hex color
      strokeStyle: '#ffffff',
      lineWidth: 2
    }
  });

  // 5. Inject the new body into the active world
  Matter.World.add(engine.world, newBody);
});
\\\`\\\`\\\`

### Line-by-Line Breakdown:
*   **Line 5 (\\\`clientX\\\`)**: We grab the physical location of the user's cursor relative to the browser window.
*   **Line 10 (\\\`randomSides\\\`)**: Instead of just spawning boring squares, we ask the math engine to give us anything from a 3-sided triangle to an 8-sided octagon.
*   **Line 13 (\\\`Matter.Bodies.polygon\\\`)**: We tell the physics engine to calculate the mass and collision points for this new random shape based on the radius we provided.
*   **Line 14 (\\\`restitution\\\`)**: Restitution is the "bounciness" of an object. A restitution of 0 is like dropping a bag of wet sand. A restitution of 0.8 is like dropping a superball!

---

## Step-by-Step Architecture Guide

Ready to build your own digital playground? Here is the exact blueprint:

### Step 1: The Canvas
Set up a full-screen \`<canvas>\` element in your React component. Use a \`useRef\` hook so you can target the raw DOM element.

### Step 2: The Matter Engines
Initialize \`Matter.Engine\`, \`Matter.Render\`, and \`Matter.Runner\`. Attach the \`Render\` module directly to your canvas reference so it can draw the wireframes and colors.

### Step 3: The Arena Walls
Create 4 static rectangles (Top, Bottom, Left, Right) positioned exactly around the edges of the \`window.innerWidth\` and \`window.innerHeight\`. Set them to \`isStatic: true\` so objects bounce off them instead of falling through.

### Step 4: The Spawner
Attach the \`mousedown\` event listener to your canvas, running the logic from our Deep Dive section to spawn random polygons exactly where the user clicks.

### Step 5: The Crucial Cleanup
Inside your React \`useEffect\`, you MUST return a cleanup function that calls \`Matter.Render.stop()\`, \`Matter.Runner.stop()\`, and \`Matter.Engine.clear()\`. If you forget this step, the physics loop will keep running infinitely in the background even if you switch pages, slowly eating up all your computer's RAM!
`,category:"devlog",tags:["Matter.js","Canvas","Games"],cover_image:"",published_at:new Date(Date.now()-6e3).toISOString(),read_time:5,views_count:0,likes_count:0}];async function g(a){return f.find(b=>b.slug===a)||null}async function h({params:a}){let b=await a,c=await g(b.slug);if(!c)return{title:"Post Not Found"};let d=new URL("https://haaamid.art/api/og");return d.searchParams.set("title",c.title),d.searchParams.set("category",c.category),{title:c.title,description:c.excerpt||"Hamid U V — web & software developer blog article.",openGraph:{type:"article",title:c.title,description:c.excerpt,images:[{url:d.toString(),width:1200,height:630,alt:c.title}]},twitter:{card:"summary_large_image",title:c.title,description:c.excerpt,images:[d.toString()]}}}async function i({params:a}){let h=await a,j=await g(h.slug);j||(0,d.notFound)();try{let a=(0,c.createClient)("https://eqndycobhjkfzkunkxda.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbmR5Y29iaGprZnprdW5reGRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1Mzg2NjksImV4cCI6MjA5ODExNDY2OX0.tC-1WFYduEBL69tKgEzpDpfuGgsgOWQvGPPnD7vIb1w");await a.from("posts").update({views_count:(j.views_count||0)+1}).eq("id",j.id)}catch(a){}let k=f.filter(a=>a.slug!==j.slug).slice(0,3),l={"@context":"https://schema.org","@type":"TechArticle",headline:j.title,description:j.excerpt,image:j.cover_image||`https://haaamid.art/api/og?title=${encodeURIComponent(j.title)}&category=${j.category}`,datePublished:j.published_at,author:{"@type":"Person",name:"Hamid U V",url:"https://haaamid.art"},publisher:{"@type":"Organization",name:"haaamid.art",logo:{"@type":"ImageObject",url:"https://haaamid.art/favicon.ico"}}};return(0,b.jsxs)("div",{className:"bg-[#0a0a0a] min-h-screen",children:[(0,b.jsx)("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify(l)}}),(0,b.jsx)(e.default,{post:j,relatedPosts:k})]})}a.s(["default",0,i,"generateMetadata",0,h])},219098,a=>{a.n(a.i(220777))}];

//# sourceMappingURL=_113ikx_._.js.map