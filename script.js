import * as gifuct from 'https://esm.sh/gifuct-js@2.1.2';

const TARGET = { x: 7, y: 7, width: 60, height: 96, maxBytes: 35 * 1024 };
const $ = (id) => document.getElementById(id);
const state = { file:null, frames:[], urls:[], images:[], renderFrames:[], visibleCanvas:0, playing:false, timer:null, lang:'ja' };
const template = new Image();
template.src = 'image/TemplateCapes.png';

function setStatus(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
function setProgress(value, visible = true) { $('progress').style.display = visible ? 'block' : 'none'; $('progress').firstElementChild.style.width = `${value * 100}%`; }
function updateText() { document.querySelectorAll('[data-ja]').forEach((el) => { el.textContent = el.dataset[state.lang]; }); }
function setFrame(index) { if (!state.frames.length) return; const safe = Math.max(0, Math.min(index, state.frames.length - 1)); const images = [$('preview'), $('previewBuffer')]; const targetIndex = 1 - state.visibleCanvas; const target = images[targetIndex]; target.src = state.urls[safe]; images[state.visibleCanvas].classList.remove('active'); target.classList.add('active'); state.visibleCanvas = targetIndex; $('frameSlider').value = safe; $('frameLabel').textContent = `${safe + 1} / ${state.frames.length}`; }
function canvasBlob(canvas) { return new Promise((resolve) => canvas.toBlob(resolve, 'image/png')); }
async function encodeFrame(source) {
	const canvas = document.createElement('canvas'); canvas.width = template.naturalWidth || 512; canvas.height = template.naturalHeight || 288;
	const context = canvas.getContext('2d'); context.drawImage(template, 0, 0);
	let scale = 1;
	while (scale >= .25) {
		context.clearRect(TARGET.x, TARGET.y, TARGET.width, TARGET.height); context.drawImage(template, 0, 0);
		context.imageSmoothingQuality = 'high'; context.drawImage(source, TARGET.x, TARGET.y, TARGET.width * scale, TARGET.height * scale);
		const blob = await canvasBlob(canvas); if (blob.size <= TARGET.maxBytes || scale <= .25) return blob;
		scale -= .1;
	}
	return canvasBlob(canvas);
}
async function loadGif(file) {
	const buffer = await file.arrayBuffer(); const parsed = gifuct.parseGIF(buffer); const frames = gifuct.decompressFrames(parsed, true);
	const canvas = document.createElement('canvas'); canvas.width = parsed.lsd.width; canvas.height = parsed.lsd.height; const ctx = canvas.getContext('2d');
	return frames.map((frame) => { const imageData = new ImageData(new Uint8ClampedArray(frame.patch), frame.dims.width, frame.dims.height); ctx.putImageData(imageData, frame.dims.left, frame.dims.top); const snapshot = document.createElement('canvas'); snapshot.width = canvas.width; snapshot.height = canvas.height; snapshot.getContext('2d').drawImage(canvas, 0, 0); return snapshot; });
}
function seek(video, time) { return new Promise((resolve) => { video.onseeked = resolve; video.currentTime = time; }); }
async function loadMp4(file) {
	const video = document.createElement('video'); video.src = URL.createObjectURL(file); video.muted = true; video.playsInline = true; await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject; });
	const count = Math.max(1, Math.ceil(video.duration * 12)); const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight; const ctx = canvas.getContext('2d'); const frames = [];
	for (let i = 0; i < count; i++) { await seek(video, Math.min(i / 12, Math.max(0, video.duration - .001))); ctx.drawImage(video, 0, 0); frames.push(canvas.toDataURL()); }
	URL.revokeObjectURL(video.src); return frames;
}
async function processFile() {
	if (!state.file || !template.complete) return; $('processBtn').disabled = true; $('downloadBtn').disabled = true; setProgress(0); setStatus(state.lang === 'ja' ? 'フレームを解析しています...' : 'Reading frames...');
	try {
		let sources = state.file.type === 'image/gif' || state.file.name.toLowerCase().endsWith('.gif') ? await loadGif(state.file) : await loadMp4(state.file);
		state.frames = []; state.urls.forEach(URL.revokeObjectURL); state.urls = []; state.images = []; state.renderFrames = [];
		for (let i = 0; i < sources.length; i++) { const source = typeof sources[i] === 'string' ? await new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image); image.src = sources[i]; }) : sources[i]; const blob = await encodeFrame(source); const url = URL.createObjectURL(blob); const image = await new Promise((resolve) => { const previewImage = new Image(); previewImage.onload = () => resolve(previewImage); previewImage.src = url; }); state.frames.push(blob); state.urls.push(url); state.images.push(image); setProgress((i + 1) / sources.length); }
		$('frameCount').textContent = state.frames.length; $('sizeInfo').textContent = `${Math.round(state.frames[0].size / 1024)}KB`; state.visibleCanvas = 0; $('preview').classList.add('active'); $('previewBuffer').classList.remove('active'); $('frameSlider').max = state.frames.length - 1; $('frameSlider').disabled = false; $('playBtn').disabled = false; $('downloadBtn').disabled = false; setFrame(0); setStatus(state.lang === 'ja' ? `${state.frames.length}フレームを変換しました` : `${state.frames.length} frames converted`); setProgress(1, false);
	} catch (error) { console.error(error); setStatus(state.lang === 'ja' ? '変換に失敗しました。GIF/MP4を確認してください。' : 'Conversion failed. Check the GIF or MP4 file.', true); setProgress(0, false); }
	$('processBtn').disabled = false;
}
async function downloadZip() { const zip = new JSZip(); state.frames.forEach((blob, index) => zip.file(`cape${index}.png`, blob)); $('downloadBtn').disabled = true; setStatus(state.lang === 'ja' ? 'ZIPを作成しています...' : 'Creating ZIP...'); const blob = await zip.generateAsync({ type:'blob', compression:'STORE' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'cape-frames.zip'; link.click(); URL.revokeObjectURL(link.href); $('downloadBtn').disabled = false; setStatus(state.lang === 'ja' ? 'ZIPをダウンロードしました' : 'ZIP downloaded'); }
$('fileInput').addEventListener('change', (event) => { state.file = event.target.files[0]; if (!state.file) return; $('fileName').textContent = state.file.name; $('processBtn').disabled = false; setStatus(''); });
$('processBtn').addEventListener('click', processFile); $('downloadBtn').addEventListener('click', downloadZip); $('frameSlider').addEventListener('input', (event) => setFrame(Number(event.target.value)));
$('playBtn').addEventListener('click', () => { state.playing = !state.playing; $('playBtn').textContent = state.playing ? (state.lang === 'ja' ? 'Ⅱ 停止' : 'Ⅱ Pause') : (state.lang === 'ja' ? '▶ 再生' : '▶ Play'); if (state.playing) { state.timer = setInterval(() => setFrame((Number($('frameSlider').value) + 1) % state.frames.length), 100); } else clearInterval(state.timer); });
document.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => { state.lang = button.dataset.lang; document.querySelectorAll('[data-lang]').forEach((item) => item.classList.toggle('active', item === button)); updateText(); }));
['dragenter','dragover'].forEach((eventName) => $('dropZone').addEventListener(eventName, (event) => { event.preventDefault(); $('dropZone').classList.add('dragover'); })); $('dropZone').addEventListener('dragleave', () => $('dropZone').classList.remove('dragover')); $('dropZone').addEventListener('drop', (event) => { event.preventDefault(); $('dropZone').classList.remove('dragover'); const file = event.dataTransfer.files[0]; if (file) { $('fileInput').files = event.dataTransfer.files; $('fileInput').dispatchEvent(new Event('change')); } });