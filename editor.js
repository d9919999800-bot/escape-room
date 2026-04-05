/*
 * Escape Room Editor
 *
 * 這份腳本提供前端編輯介面，讓使用者自訂三個房間的標題、描述、背景圖片、物件名稱與線索、
 * 各密碼箱的密碼與通關獎勵。設定將儲存在瀏覽器的 localStorage，遊戲頁 index.html 載入時
 * 會使用這些設定覆蓋預設房間資料。
 */

document.addEventListener('DOMContentLoaded', () => {
    // 預設房間結構，用於初始化或重置
    const defaultConfig = {
        // 首頁標題與介紹
        homeTitle: '',
        homeIntro: '',
        // 結尾頁介紹
        endingIntro: '',
        rooms: [
            createEmptyRoom(1),
            createEmptyRoom(2),
            createEmptyRoom(3)
        ],
        endingOptions: [
            { name: '破損的稱仔', message: '你帶走了破損的稱仔，記住的是底層生計的脆弱與活路如何被切斷。' },
            { name: '巡警腰牌', message: '你帶走了巡警腰牌，記住的是權力掌握在誰手裡，個人壓迫與身分權力。' },
            { name: '巡警勤務簿', message: '你帶走了勤務簿，記住的是整個制度如何把人養成加害者。' },
            { name: '判刑證據／判決文書', message: '你帶走了判刑文書，記住的是制度如何拒絕弱者，使合法救濟也失效。' }
        ]
    };

    // 讀取現有設定，若無則使用預設
    let config;
    try {
        config = JSON.parse(localStorage.getItem('escapeRoomConfig')) || defaultConfig;
    } catch (e) {
        config = defaultConfig;
    }

    const editorContainer = document.getElementById('editorContainer');

    // 渲染編輯表單
    renderEditor(config);

    // 儲存按鈕事件
    document.getElementById('saveConfig').addEventListener('click', () => {
        saveConfig();
    });

    // 預覽按鈕事件
    document.getElementById('previewGame').addEventListener('click', () => {
        // 儲存一次以確保更新
        saveConfig();
        // 開啟遊戲頁
        window.location.href = 'index.html';
    });

    // 清除設定事件
    document.getElementById('resetConfig').addEventListener('click', () => {
        if (confirm('確定要清除自訂設定嗎？這將恢復預設值。')) {
            localStorage.removeItem('escapeRoomConfig');
            location.reload();
        }
    });

    /**
     * 建立一個空房間資料結構。
     * @param {number} roomId 房間編號
     */
    function createEmptyRoom(roomId) {
        return {
            id: roomId,
            title: '',
            description: '',
            background: null, // DataURL
            objects: [
                { name: '', clue: '', attachment: null },
                { name: '', clue: '', attachment: null },
                { name: '', clue: '', attachment: null }
            ],
            codes: [
                { key: `${roomId}-1`, value: '', reward: '' },
                { key: `${roomId}-2`, value: '', reward: '' },
                { key: `${roomId}-3`, value: '', reward: '' }
            ]
        };
    }

    /**
     * 產生編輯表單。
     */
    function renderEditor(conf) {
        editorContainer.innerHTML = '';
        // 整體設定區：首頁與結尾頁文字
        const generalDiv = document.createElement('div');
        generalDiv.className = 'general-section';
        generalDiv.style.borderBottom = '1px solid #444';
        generalDiv.style.paddingBottom = '1.5rem';
        generalDiv.innerHTML = `
            <h2>整體設定</h2>
            <label>首頁標題</label>
            <input type="text" id="homeTitleInput" value="${escapeHtml(conf.homeTitle || '')}" placeholder="輸入首頁標題">
            <label>首頁介紹</label>
            <textarea id="homeIntroInput" rows="2" placeholder="輸入首頁介紹">${escapeHtml(conf.homeIntro || '')}</textarea>
            <label>結尾頁介紹</label>
            <textarea id="endingIntroInput" rows="2" placeholder="輸入結尾頁介紹">${escapeHtml(conf.endingIntro || '')}</textarea>
        `;
        editorContainer.appendChild(generalDiv);

        conf.rooms.forEach((room, i) => {
            const roomDiv = document.createElement('div');
            roomDiv.className = 'room-section';
            roomDiv.innerHTML = `
                <h2>房間 ${room.id}</h2>
                <label>房間標題</label>
                <input type="text" id="title-${i}" value="${escapeHtml(room.title)}" placeholder="輸入房間標題">
                <label>房間描述</label>
                <textarea id="desc-${i}" rows="2" placeholder="輸入房間描述">${escapeHtml(room.description)}</textarea>
                <label>背景圖片 (上傳圖片後將自動儲存)</label>
                <input type="file" id="bg-${i}" accept="image/*" />
                ${room.background ? `<p style="margin-top:0.3rem;color:#7cb342;">已上傳背景</p>` : ''}
            `;
            // 物件輸入
            const objectsContainer = document.createElement('div');
            objectsContainer.innerHTML = `<h3>房間物件與線索</h3>`;
            room.objects.forEach((obj, j) => {
                const objDiv = document.createElement('div');
                objDiv.style.border = '1px solid #444';
                objDiv.style.padding = '0.75rem';
                objDiv.style.marginTop = '0.75rem';
                objDiv.innerHTML = `
                    <label>物件 ${j + 1} 名稱</label>
                    <input type="text" id="obj-${i}-${j}-name" value="${escapeHtml(obj.name)}" placeholder="輸入物件名稱">
                    <label>物件 ${j + 1} 線索</label>
                    <textarea id="obj-${i}-${j}-clue" rows="2" placeholder="輸入線索內容">${escapeHtml(obj.clue)}</textarea>
                    <label>物件 ${j + 1} 附件 (可選)</label>
                    <input type="file" id="obj-${i}-${j}-file" />
                    ${obj.attachment ? `<p style="margin-top:0.3rem;color:#7cb342;">已上傳附件</p>` : ''}
                `;
                objectsContainer.appendChild(objDiv);
            });
            roomDiv.appendChild(objectsContainer);

            // 密碼輸入
            const codesContainer = document.createElement('div');
            codesContainer.innerHTML = `<h3>密碼箱與獎勵</h3>`;
            room.codes.forEach((code, k) => {
                const codeDiv = document.createElement('div');
                codeDiv.style.border = '1px solid #444';
                codeDiv.style.padding = '0.75rem';
                codeDiv.style.marginTop = '0.75rem';
                // 新增獎勵附件輸入欄
                codeDiv.innerHTML = `
                    <label>密碼箱 ${code.key} 密碼</label>
                    <input type="text" id="code-${i}-${k}-value" class="small-input" value="${escapeHtml(code.value)}" placeholder="四位數">
                    <label>通關獎勵 (可選，例如得到某道具)</label>
                    <input type="text" id="code-${i}-${k}-reward" class="reward-input" value="${escapeHtml(code.reward)}" placeholder="輸入獎勵敘述">
                    <label>獎勵附件 (可選)</label>
                    <input type="file" id="code-${i}-${k}-file" />
                    ${code.rewardAttachment ? `<p style="margin-top:0.3rem;color:#7cb342;">已上傳獎勵附件</p>` : ''}
                `;
                codesContainer.appendChild(codeDiv);
            });
            roomDiv.appendChild(codesContainer);

            editorContainer.appendChild(roomDiv);
        });

        // 結局選項編輯區（在所有房間設定後顯示）
        const endingDiv = document.createElement('div');
        endingDiv.className = 'ending-section';
        endingDiv.style.borderTop = '1px solid #444';
        endingDiv.style.marginTop = '2rem';
        endingDiv.style.paddingTop = '1.5rem';
        endingDiv.innerHTML = `<h2>結局設定</h2>`;
        // 迭代結局選項並產生輸入欄
        conf.endingOptions.forEach((opt, idx) => {
            const optDiv = document.createElement('div');
            optDiv.style.border = '1px solid #444';
            optDiv.style.padding = '0.75rem';
            optDiv.style.marginTop = '0.75rem';
            optDiv.innerHTML = `
                <label>選項 ${idx + 1} 名稱</label>
                <input type="text" id="end-${idx}-name" value="${escapeHtml(opt.name)}" placeholder="輸入選項名稱">
                <label>選項 ${idx + 1} 描述</label>
                <textarea id="end-${idx}-message" rows="3" placeholder="輸入結局描述">${escapeHtml(opt.message)}</textarea>
            `;
            endingDiv.appendChild(optDiv);
        });
        editorContainer.appendChild(endingDiv);
        // 綁定背景圖片與附件變更事件
        conf.rooms.forEach((room, i) => {
            // 背景
            const bgInput = document.getElementById(`bg-${i}`);
            bgInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        room.background = ev.target.result;
                        // 顯示提示文字
                        renderEditor(conf);
                    };
                    reader.readAsDataURL(file);
                }
            });
            // 物件附件
            room.objects.forEach((obj, j) => {
                const fileInput = document.getElementById(`obj-${i}-${j}-file`);
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            obj.attachment = ev.target.result;
                            renderEditor(conf);
                        };
                        reader.readAsDataURL(file);
                    }
                });
            });

            // 獎勵附件
            room.codes.forEach((code, k) => {
                const rewardFileInput = document.getElementById(`code-${i}-${k}-file`);
                if (rewardFileInput) {
                    rewardFileInput.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                                code.rewardAttachment = ev.target.result;
                                renderEditor(conf);
                            };
                            reader.readAsDataURL(file);
                        }
                    });
                }
            });
        });
    }

    /**
     * 儲存表單內容到 localStorage
     */
    function saveConfig() {
        // 更新整體設定
        const htEl = document.getElementById('homeTitleInput');
        const hiEl = document.getElementById('homeIntroInput');
        const eiEl = document.getElementById('endingIntroInput');
        if (htEl) config.homeTitle = htEl.value.trim();
        if (hiEl) config.homeIntro = hiEl.value.trim();
        if (eiEl) config.endingIntro = eiEl.value.trim();
        // 更新房間內容
        config.rooms.forEach((room, i) => {
            room.title = document.getElementById(`title-${i}`).value.trim();
            room.description = document.getElementById(`desc-${i}`).value.trim();
            // objects
            room.objects.forEach((obj, j) => {
                obj.name = document.getElementById(`obj-${i}-${j}-name`).value.trim();
                obj.clue = document.getElementById(`obj-${i}-${j}-clue`).value.trim();
                // attachment already handled by FileReader
            });
            // codes
            room.codes.forEach((code, k) => {
                code.value = document.getElementById(`code-${i}-${k}-value`).value.trim();
                code.reward = document.getElementById(`code-${i}-${k}-reward`).value.trim();
            });
        });
        // 更新結局選項名稱與描述
        if (Array.isArray(config.endingOptions)) {
            config.endingOptions.forEach((opt, idx) => {
                const nameInput = document.getElementById(`end-${idx}-name`);
                const msgInput = document.getElementById(`end-${idx}-message`);
                if (nameInput) opt.name = nameInput.value.trim();
                if (msgInput) opt.message = msgInput.value.trim();
            });
        }
        // 儲存至 localStorage
        localStorage.setItem('escapeRoomConfig', JSON.stringify(config));
        alert('設定已儲存！可點擊預覽查看效果。');
    }

    /**
     * 逃逸 HTML 特殊字元，避免在 innerHTML 中造成問題。
     * @param {string} str
     */
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
});