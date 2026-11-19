import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const target = await fetch('http://127.0.0.1:9337/json/new?about:blank', {method: 'PUT'}).then(response => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, {once: true}); socket.addEventListener('error', reject, {once: true}); });
let sequence = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timeout);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
});
socket.addEventListener('close', () => {
    pending.forEach(request => {clearTimeout(request.timeout); request.reject(new Error('Browser closed'));});
    pending.clear();
});
function call(method, params = {}) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {pending.delete(id); reject(new Error(`CDP timeout: ${method}`));}, 20000);
        pending.set(id, {resolve, reject, timeout}); socket.send(JSON.stringify({id, method, params}));
    });
}
async function evaluate(expression) {
    const result = await call('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
}
async function until(expression, timeout = 45000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        if (await evaluate(expression)) return;
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error(`Timed out: ${expression}; body: ${await evaluate('document.body.innerText')}`);
}
async function capture(name) {
    const result = await call('Page.captureScreenshot', {format: 'png', captureBeyondViewport: true});
    await writeFile(new URL(`./${name}.png`, import.meta.url), Buffer.from(result.data, 'base64'));
}

try {
    await call('Page.enable');
    await call('Runtime.enable');
    await call('Emulation.setDeviceMetricsOverride', {width: 1200, height: 900, deviceScaleFactor: 1, mobile: false});
    await call('Page.navigate', {url: 'http://127.0.0.1:5174/procedural-cabinet.html'});
    await until('document.documentElement.dataset.reviewReady === "true"');
    await new Promise(resolve => setTimeout(resolve, 1800));
    assert.equal(await evaluate('document.querySelectorAll("canvas").length'), 1);
    assert.deepEqual(await evaluate('window.reviewErrors'), []);
    await capture('procedural-cabinet-desktop');
    await evaluate('[...document.querySelectorAll("button")].find(button => button.getAttribute("aria-label") === "Rotate cabinet right").click()');
    await new Promise(resolve => setTimeout(resolve, 1300));
    await capture('procedural-cabinet-rotated');
    await evaluate('[...document.querySelectorAll("button")].find(button => button.getAttribute("aria-label") === "Rotate cabinet left").click(); window.setReviewDrawer("")');
    await new Promise(resolve => setTimeout(resolve, 4000));
    await capture('procedural-cabinet-closed');
    for (const [name, steps] of [['front', -1], ['side', 2], ['rear', 5]]) {
        await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent.includes('Reset view')).click(); for(let i=0;i<${Math.abs(1)} * Math.abs(${steps});i++) [...document.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === 'Rotate cabinet ${steps < 0 ? 'left' : 'right'}').click()`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        await capture(`procedural-cabinet-${name}`);
    }
    await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.includes('Reset view')).click(); window.setReviewDrawer('drawer-3')");
    await new Promise(resolve => setTimeout(resolve, 1600));
    await capture('procedural-cabinet-bottom-open');
    await evaluate('window.setReviewDrawer("")');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent === "Current view").click()');
    await until('document.querySelector("[id^=cabinet-filing-preview]") !== null');
    assert.equal(await evaluate('document.querySelectorAll("canvas").length'), 0);
    await capture('procedural-cabinet-current');
    await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent === "3D model").click()');
    await until('document.querySelector("canvas") !== null');
    await new Promise(resolve => setTimeout(resolve, 1300));
    await evaluate('document.documentElement.classList.add("dark")');
    await capture('procedural-cabinet-dark');
    await call('Emulation.setDeviceMetricsOverride', {width: 390, height: 844, deviceScaleFactor: 1, mobile: true});
    await evaluate('document.documentElement.classList.remove("dark"); window.setReviewDrawer("drawer-2")');
    await new Promise(resolve => setTimeout(resolve, 4000));
    await capture('procedural-cabinet-mobile');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({passed: true, checks: ['WebGL render', 'rotation controls', 'drawer open/close', 'current view switch', 'dark mode', 'mobile fit'], errors}));
} finally {
    await call('Browser.close').catch(() => {});
    socket.close();
}

