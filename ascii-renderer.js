const greyscale = "MW@BHENR#KXDFPQASUZbdehx*8Gm&04LOVYkpq5Tagns69oz$CIu23Jcfry%1v7l+it[]{}?j|()=~!-/<>\\\"^_';,:`. ";

const RGBToHSL = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    const h = s
        ? l === r
        ? (g - b) / s
        : l === g
        ? 2 + (b - r) / s
        : 4 + (r - g) / s
        : 0;
    return [
        60 * h < 0 ? 60 * h + 360 : 60 * h,
        100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
        (100 * (2 * l - s)) / 2,
    ];
};

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function smoothStep(x) {
    return -2 * x * x * x + 3 * x * x;
}

function smootherStep(x) {
    return x * x * x * (x * (x * 6 - 15) + 10);
}

const getColor = (value) => {
    const color = greyscale[Math.floor(greyscale.length * value)];

    return color === undefined ? greyscale[0] : color;
}

const font = document.createElement('link');
font.href = "https://fonts.googleapis.com/css2?family=Space+Mono:wght@700&display=swap";
font.rel = "stylesheet";

const canvas = document.getElementById('demogl');
document.head.appendChild(font);

let gridSize = 4;
let filter = 'hacont';
let fontSize = 3 * gridSize / 2;

function filterChange(select) {
    filter = select.value;
}

function gridSizeChange(select) {
    gridSize = parseInt(select.value);
    fontSize = 3 * gridSize / 2;

    const asciiRenderer = document.getElementById('ascii-renderer');

    asciiRenderer.setAttribute('style', `
        z-index: 100;
        font-family: 'Space Mono', monospace;
        font-weight: bold;
        font-size: ${fontSize}px;
        line-height: ${fontSize * canvas.height / canvas.width}px;
        transform: scaleY(-1);
        text-align: center;
        white-space: pre;
    `);
}

window.addEventListener('load', () => {
    const glCtx = gShaderToy.mEffect.mGLContext;
    const content = document.getElementById('content').querySelector('.block0');
    const pixels = new Uint8Array(glCtx.drawingBufferWidth * glCtx.drawingBufferHeight * 3);

    const asciiContainer = document.createElement('div');
    asciiContainer.setAttribute('style', `
        margin: 20px 0;
        display: flex;
        flex-flow: column;
    `);

    asciiContainer.innerHTML = `
        <div style="
            margin-left: auto;
            margin-top: 10px;
        ">
        <label for="gridsize-select">Grid Size:</label>
        <select id="gridsize-select" onchange="gridSizeChange(this)">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4" selected>4</option>
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
        </select>
        <label for="filter-select">Filter:</label>
        <select id="filter-select" onchange="filterChange(this)">
            <option value="ntsc">ntsc</option>
            <option value="lum">luminance</option>
            <option value="hicont">high contrast</option>
            <option value="hacont" selected>harsh contrast</option>
            <option value="hue">hue</option>
            <option value="sat">saturation</option>
            <option value="r">red</option>
            <option value="g">green</option>
            <option value="b">blue</option>
        </select>
        </div>
    `;

    content.insertBefore(asciiContainer, content.firstElementChild);

    const asciiRenderer = document.createElement('div');
    asciiRenderer.setAttribute('id', 'ascii-renderer');
    asciiRenderer.setAttribute('style', `
        z-index: 100;
        font-family: 'Space Mono', monospace;
        font-weight: bold;
        font-size: ${fontSize}px;
        line-height: ${fontSize * canvas.height / canvas.width}px;
        transform: scaleY(-1);
        text-align: center;
        white-space: pre;
    `);

    asciiContainer.insertBefore(asciiRenderer, asciiContainer.firstElementChild);

    const originalRequestAnimationFrame = Effect.prototype.RequestAnimationFrame;

    Effect.prototype.RequestAnimationFrame = function (id) {
        glCtx.readPixels(
            0, 
            0, 
            glCtx.drawingBufferWidth, 
            glCtx.drawingBufferHeight, 
            glCtx.RGB, 
            glCtx.UNSIGNED_BYTE, 
            pixels
        );

        let text = '';

        for (let i = 0; i < pixels.length - 3; i += 3) {
            const row = Math.floor((i / 3) / canvas.width);
            const col = Math.floor(i / 3) % canvas.width;

            if (row % gridSize === 0 && col % gridSize === 0) {
                const [hue, sat, luminance] = RGBToHSL(pixels[i], pixels[i + 1], pixels[i + 2]);

                if (i !== 0 && Math.floor(i / 3) % canvas.width === 0) {
                    text += '\n';
                }

                switch (filter) {
                    case 'ntsc':
                        text += getColor((0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) / 255);
                        break;
                    case 'hicont':
                        text += getColor(smoothStep(luminance / 100));
                        break;
                    case 'hacont':
                        text += getColor(smootherStep(luminance / 100));
                        break;
                    case 'lum':
                        text += getColor(luminance / 100);
                        break;
                    case 'hue':
                        text += getColor(hue / 360);
                        break;
                    case 'sat':
                        text += getColor(sat / 100);
                        break;
                    case 'r':
                        text += getColor(pixels[i] / 255);
                        break;
                    case 'g':
                        text += getColor(pixels[i + 1] / 255);
                        break;
                    case 'b':
                        text += getColor(pixels[i + 2] / 255);
                        break;
                }

            }
        }

        asciiRenderer.textContent = text;

        originalRequestAnimationFrame.call(this, id);
    }
});
