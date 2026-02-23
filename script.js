// Simple Base64 Converter
class Converter {
    constructor() {
        this.mode = 'decode';
        this.imageData = null;
        this.initElements();
        this.initEvents();
    }

    initElements() {
        // Tabs
        this.tabs = document.querySelectorAll('.tab');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Decode elements
        this.base64Input = document.getElementById('base64Input');
        this.decodeBtn = document.getElementById('decodeBtn');
        this.loadExampleBtn = document.getElementById('loadExample');
        this.clearDecodeBtn = document.getElementById('clearDecode');

        // Encode elements
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.formatOptions = document.getElementById('formatOptions');
        this.format = document.getElementById('format');
        this.quality = document.getElementById('quality');
        this.qualityValue = document.getElementById('qualityValue');
        this.qualityOption = document.getElementById('qualityOption');
        this.encodeBtn = document.getElementById('encodeBtn');
        this.clearEncodeBtn = document.getElementById('clearEncode');

        // Result elements
        this.result = document.getElementById('result');
        this.preview = document.getElementById('preview');
        this.imageInfo = document.getElementById('imageInfo');
        this.base64Output = document.getElementById('base64Output');
        this.base64OutputText = document.getElementById('base64OutputText');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyBtn = document.getElementById('copyBtn');

        // Alert
        this.alertContainer = document.getElementById('alertContainer');

        // History elements
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        this.loadHistory();

        // Modal elements
        this.imageViewer = document.getElementById('imageViewer');
        this.viewerImg = document.getElementById('viewerImg');
        this.closeViewer = document.getElementById('closeViewer');
        this.viewerMeta = document.getElementById('viewerMeta');
        this.viewerDownload = document.getElementById('viewerDownload');
    }

    initEvents() {
        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Decode events
        this.decodeBtn.addEventListener('click', () => this.decode());
        this.loadExampleBtn.addEventListener('click', () => this.loadExample());
        this.clearDecodeBtn.addEventListener('click', () => this.clearDecode());
        this.base64Input.addEventListener('input', () => this.updateCharCount());

        // Encode events
        this.uploadZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));
        this.uploadZone.addEventListener('dragover', (e) => e.preventDefault());
        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleFile(e.dataTransfer.files[0]);
        });
        this.format.addEventListener('change', () => this.updateQualityVisibility());
        this.quality.addEventListener('input', (e) => {
            this.qualityValue.textContent = e.target.value;
        });
        this.encodeBtn.addEventListener('click', () => this.encode());
        this.clearEncodeBtn.addEventListener('click', () => this.clearEncode());

        // Result events
        this.downloadBtn.addEventListener('click', () => this.download());
        this.copyBtn.addEventListener('click', () => this.copy());

        // History events
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.historyList.addEventListener('click', (e) => this.handleHistoryClick(e));
        
        // Modal events
        this.closeViewer.addEventListener('click', () => this.imageViewer.classList.add('hidden'));
        this.imageViewer.addEventListener('click', (e) => {
            if (e.target === this.imageViewer) this.imageViewer.classList.add('hidden');
        });

        this.renderHistory();
    }

    switchTab(tab) {
        this.mode = tab;

        // Update tabs
        this.tabs.forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        // Update content
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tab);
        });

        // Clear result
        this.clearResult();
    }

    updateCharCount() {
        const length = this.base64Input.value.length;
        const charCount = this.base64Input.parentElement.querySelector('.char-count');
        charCount.textContent = `${length.toLocaleString()} characters`;
    }

    updateQualityVisibility() {
        const isPNG = this.format.value === 'png';
        this.qualityOption.style.opacity = isPNG ? '0.5' : '1';
        this.qualityOption.style.pointerEvents = isPNG ? 'none' : 'auto';
    }

    async decode() {
        try {
            const input = this.base64Input.value.trim();
            if (!input) {
                this.showAlert('Please paste a Base64 string', 'error');
                return;
            }

            // Clean Base64
            let base64 = input;
            const dataUrlMatch = base64.match(/^data:image\/[a-z]+;base64,(.+)$/i);
            if (dataUrlMatch) base64 = dataUrlMatch[1];
            base64 = base64.replace(/\s/g, '');

            // Validate
            if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
                throw new Error('Invalid Base64 format');
            }

            // Detect format
            const format = this.detectFormat(base64);
            const dataUrl = `data:image/${format};base64,${base64}`;

            // Load image
            await this.loadImage(dataUrl);

            this.imageData = { dataUrl, base64, format };
            this.showResult(dataUrl, format, base64.length);
            this.addToHistory(dataUrl, format, base64.length);
            this.showAlert('Image converted successfully!', 'success');

        } catch (error) {
            this.showAlert(error.message, 'error');
        }
    }

    detectFormat(base64) {
        try {
            const bytes = atob(base64.substring(0, 20));
            if (bytes.startsWith('\x89PNG')) return 'png';
            if (bytes.startsWith('\xFF\xD8\xFF')) return 'jpeg';
            if (bytes.startsWith('GIF')) return 'gif';
            if (bytes.includes('WEBP')) return 'webp';
            return 'png';
        } catch {
            return 'png';
        }
    }

    loadImage(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            setTimeout(() => reject(new Error('Timeout')), 10000);
            img.src = dataUrl;
        });
    }

    async handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showAlert('Please select an image file', 'error');
            return;
        }

        try {
            const dataUrl = await this.readFile(file);

            // Show preview
            this.preview.innerHTML = `<img src="${dataUrl}" alt="Preview">`;
            this.formatOptions.classList.remove('hidden');
            this.encodeBtn.classList.remove('hidden');
            this.clearEncodeBtn.classList.remove('hidden');

            // Store file
            this.uploadedFile = { file, dataUrl };
            this.showAlert('Image uploaded successfully!', 'success');

        } catch (error) {
            this.showAlert('Failed to upload image', 'error');
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async encode() {
        if (!this.uploadedFile) {
            this.showAlert('Please upload an image first', 'error');
            return;
        }

        try {
            const img = new Image();
            img.src = this.uploadedFile.dataUrl;
            await this.loadImage(this.uploadedFile.dataUrl);

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const format = this.format.value;
            const quality = this.quality.value / 100;
            const dataUrl = canvas.toDataURL(`image/${format}`, quality);
            const base64 = dataUrl.split(',')[1];

            this.imageData = { dataUrl, base64, format };
            this.showResult(dataUrl, format, base64.length, true);
            this.addToHistory(dataUrl, format, base64.length);
            this.showAlert('Image encoded successfully!', 'success');

        } catch (error) {
            this.showAlert('Failed to encode image', 'error');
        }
    }

    showResult(dataUrl, format, base64Length, showOutput = false) {
        // Show preview
        this.preview.innerHTML = `<img src="${dataUrl}" alt="Result">`;

        // Show info
        const img = new Image();
        img.onload = () => {
            const fileSize = Math.round((base64Length * 3) / 4);
            document.getElementById('dimensions').textContent = `${img.naturalWidth} × ${img.naturalHeight}px`;
            document.getElementById('formatInfo').textContent = format.toUpperCase();
            document.getElementById('fileSize').textContent = this.formatSize(fileSize);
            this.imageInfo.classList.remove('hidden');
        };
        img.src = dataUrl;

        // Show output for encode mode
        if (showOutput) {
            this.base64OutputText.value = this.imageData.base64;
            this.base64Output.classList.remove('hidden');
        } else {
            this.base64Output.classList.add('hidden');
        }

        // Show result section
        this.result.classList.add('show');
        this.downloadBtn.disabled = false;
        this.copyBtn.disabled = false;
    }

    download() {
        if (!this.imageData) return;

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        
        const timestamp = `${yyyy}-${mm}-${dd}-${hh}-${min}-${ss}`;
        const filename = `${timestamp}-Converted.${this.imageData.format}`;

        const link = document.createElement('a');
        link.href = this.imageData.dataUrl;
        link.download = filename;
        link.click();

        this.showAlert('Image downloaded!', 'success');
    }

    copy() {
        if (!this.imageData) return;

        navigator.clipboard.writeText(this.imageData.base64)
            .then(() => this.showAlert('Base64 copied to clipboard!', 'success'))
            .catch(() => this.showAlert('Failed to copy', 'error'));
    }

    clearDecode() {
        this.base64Input.value = '';
        this.updateCharCount();
        this.clearResult();
    }

    clearEncode() {
        this.fileInput.value = '';
        this.uploadedFile = null;
        this.formatOptions.classList.add('hidden');
        this.encodeBtn.classList.add('hidden');
        this.clearEncodeBtn.classList.add('hidden');
        this.preview.innerHTML = `
            <div class="placeholder">
                <span class="emoji">🖼️</span>
                <p>Your result will appear here</p>
            </div>
        `;
        this.clearResult();
    }

    clearResult() {
        this.result.classList.remove('show');
        this.imageInfo.classList.add('hidden');
        this.base64Output.classList.add('hidden');
        this.downloadBtn.disabled = true;
        this.copyBtn.disabled = true;
        this.imageData = null;
    }

    loadExample() {
        const example = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
        this.base64Input.value = example;
        this.updateCharCount();
        this.showAlert('Example loaded!', 'success');
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.innerHTML = `
            <span>${type === 'error' ? '⚠️' : '✅'}</span>
            <span>${message}</span>
        `;

        this.alertContainer.appendChild(alert);

        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }

    addToHistory(dataUrl, format, base64Length) {
        const img = new Image();
        img.onload = () => {
            const item = {
                id: Date.now(),
                dataUrl,
                format,
                size: base64Length,
                width: img.naturalWidth,
                height: img.naturalHeight,
                timestamp: new Date().toLocaleTimeString()
            };

            // Keep only the last 2 items
            this.history.unshift(item);
            this.history = this.history.slice(0, 2);

            try {
                localStorage.setItem('base64_history', JSON.stringify(this.history));
            } catch (e) {
                console.warn('Failed to save to localStorage (file might be too large)');
            }
            this.renderHistory();
        };
        img.src = dataUrl;
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = `
                <div class="placeholder">
                    <span class="emoji">📝</span>
                    <p>No history yet. Convert some images!</p>
                </div>
            `;
            return;
        }

        this.historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <div class="history-preview">
                    <img src="${item.dataUrl}" alt="History item">
                </div>
                <div class="history-info">
                    <span class="time">${item.timestamp}</span>
                    <span class="meta">${item.width} × ${item.height}px • ${item.format.toUpperCase()}</span>
                    <span class="meta">${this.formatSize(Math.round((item.size * 3) / 4))}</span>
                </div>
                <div class="history-actions">
                    <button class="btn small primary-outline" data-action="view" data-id="${item.id}">🔍 View Original</button>
                    <button class="btn small" data-action="download" data-id="${item.id}">⬇️</button>
                </div>
            </div>
        `).join('');
    }

    loadHistory() {
        try {
            const data = localStorage.getItem('base64_history');
            this.history = JSON.parse(data || '[]');
            
            // If any item has an old format or we want to force refresh for this update
            if (this.history.length > 0 && !this.history[0].timestamp) {
                console.warn('Old history format detected, clearing...');
                this.clearHistory();
            }
        } catch (e) {
            this.history = [];
        }
    }

    handleHistoryClick(e) {
        console.log('History clicked', e.target);
        const btn = e.target.closest('button');
        if (!btn || !btn.dataset.id) return;

        e.preventDefault();
        const id = parseInt(btn.dataset.id);
        const item = this.history.find(i => i.id === id);
        if (!item) return;

        if (btn.dataset.action === 'view') {
            this.viewOriginal(item);
        } else if (btn.dataset.action === 'download') {
            this.downloadItem(item);
        }
    }

    viewOriginal(item) {
        console.log('Opening modal for', item);
        if (!this.imageViewer) {
            console.error('Modal element not found!');
            return;
        }
        this.viewerImg.src = item.dataUrl;
        this.viewerMeta.textContent = `${item.width} × ${item.height}px • ${item.format.toUpperCase()} • ${this.formatSize(Math.round((item.size * 3) / 4))}`;
        
        // Handle download button in modal
        this.viewerDownload.onclick = () => this.downloadItem(item);
        
        this.imageViewer.classList.remove('hidden');
    }

    downloadItem(item) {
        const now = new Date(item.id);
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        
        const timestamp = `${yyyy}-${mm}-${dd}-${hh}-${min}-${ss}`;
        
        const a = document.createElement('a');
        a.href = item.dataUrl;
        a.download = `${timestamp}-History.${item.format}`;
        a.click();
    }

    viewImage(dataUrl) {
        // Redundant now, but keeping for compatibility if called elsewhere
        const item = { dataUrl, format: 'png', id: Date.now(), size: dataUrl.length, width: '?', height: '?' };
        this.viewOriginal(item);
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('base64_history');
        this.renderHistory();
        this.showAlert('History cleared', 'success');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Converter Version 4.0 Loaded');
    new Converter();
});
