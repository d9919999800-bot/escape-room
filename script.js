/*
 * 主 JavaScript 檔案
 *
 * 這份腳本負責：
 * 1. 定義三個房間的資料（房間標題、物件線索、每個箱子的密碼）。
 * 2. 根據資料動態建立房間頁面，包含物件卡片與密碼箱。
 * 3. 控制頁面切換（首頁 → 房間 → 結尾）。
 * 4. 處理點擊物件顯示線索的彈窗。
 * 5. 驗證密碼箱輸入，記錄通關狀態，並在正確輸入最後箱子密碼時顯示前往下一房按鈕。
 * 6. 在結尾頁提供四個證物選擇，展示不同理解的結局文字。
 */

document.addEventListener('DOMContentLoaded', () => {
    /**
     * 此腳本在載入時會先檢查 localStorage 是否有自訂設定（escapeRoomConfig）。
     * 若存在，將其轉換為遊戲所需的 roomsData 與 endingOptions。
     * 否則使用預設的三房資料與結局選項。
     */

    let roomsData;
    let endingOptions;
    // 自訂首頁與結尾頁文字
    let customHomeTitle;
    let customHomeIntro;
    let customEndingIntro;
    // 獎勵對照表：{'roomId-keySuffix': reward}
    const codeRewards = {};

    try {
        const savedConfig = JSON.parse(localStorage.getItem('escapeRoomConfig'));
        if (savedConfig && Array.isArray(savedConfig.rooms)) {
            // 轉換保存設定到遊戲資料結構
            roomsData = savedConfig.rooms.map(room => {
                const newRoom = {
                    id: room.id,
                    title: room.title || `第${room.id}間`,
                    description: room.description || '',
                    background: room.background || null,
                    objects: [],
                    codes: {}
                };
                // 物件
                if (Array.isArray(room.objects)) {
                    newRoom.objects = room.objects.map(obj => ({
                        name: obj.name || '',
                        clue: obj.clue || '',
                        attachment: obj.attachment || null
                    }));
                }
                // 密碼
                if (Array.isArray(room.codes)) {
                    room.codes.forEach(codeObj => {
                        newRoom.codes[codeObj.key] = codeObj.value || '';
                        // 儲存獎勵資訊：包含文字與附件
                        const suffix = codeObj.key.split('-')[1];
                        codeRewards[`${room.id}-${suffix}`] = {
                            reward: codeObj.reward || '',
                            attachment: codeObj.rewardAttachment || null
                        };
                    });
                }
                return newRoom;
            });
            // 結局選項
            if (Array.isArray(savedConfig.endingOptions)) {
                endingOptions = savedConfig.endingOptions.map(opt => ({
                    name: opt.name || '',
                    message: opt.message || ''
                }));
            }
            // 首頁與結尾頁文字
            customHomeTitle = savedConfig.homeTitle || '';
            customHomeIntro = savedConfig.homeIntro || '';
            customEndingIntro = savedConfig.endingIntro || '';
        }
    } catch (e) {
        // 若 JSON 解析失敗，不使用 savedConfig
    }
    // 若未載入設定，使用預設資料
    if (!roomsData) {
        roomsData = [
            {
                id: 1,
                title: '第一間：活命之屋',
                description: '相信個人努力可以翻身，也相信壓迫來自惡人的惡。',
                objects: [
                    {
                        name: '帳目紙條',
                        clue: '紙條上記錄著每日收支，字跡潦草，但最後寫著「會算，才有路」。這提醒著秦德參只能靠精明算計才能撐下去。',
                        attachment: null
                    },
                    {
                        name: '散落銅錢',
                        clue: '幾枚銅錢散落在床邊，旁邊夾了一張小紙寫著：「惡人，害人無路」。這是秦德參對巡警的怨念。',
                        attachment: null
                    },
                    {
                        name: '竹簍紙條',
                        clue: '竹簍裡壓著一張費用清單，上頭畫了許多圈與叉。末尾寫著：「努力換命」。或許這一切還不是全貌。',
                        attachment: null
                    }
                ],
                codes: {
                    '1-1': '1324',
                    '1-2': '5689',
                    '1-3': '7412'
                }
            },
            {
                id: 2,
                title: '第二間：鏡像輪迴房',
                description: '懷疑失敗未必來自個人不足，也懷疑惡並非單一個人的問題。',
                objects: [
                    {
                        name: '裂痕時鐘',
                        clue: '時鐘的指針亂跳，彷彿時間失序。旁邊貼紙寫著：「換路，仍然無路」。四回重演，結局皆是悲劇。',
                        attachment: null
                    },
                    {
                        name: '鏡像殘影',
                        clue: '鏡子裡映出四個重影，暗示著不同的命運版本。有人低頭有人反抗。紙條提示：「權若無束，人就越養越大」。',
                        attachment: null
                    },
                    {
                        name: '巡警記號',
                        clue: '地上畫著巡警的腳印與路線，每條路終點都是圍牆。紙條寫著：「局勢的惡已經不只是個人」。',
                        attachment: null
                    }
                ],
                codes: {
                    '2-1': '2468',
                    '2-2': '1357',
                    '2-3': '9625'
                }
            },
            {
                id: 3,
                title: '第三間：陰司檔案庫',
                description: '看清位置差異、救濟失靈與制度結構如何共同生成悲劇。',
                objects: [
                    {
                        name: '勤務簿',
                        clue: '巡警勤務簿中，記錄著一條條「依法取締」與「照章辦理」。這些文字顯示制度如何養大施暴者。',
                        attachment: null
                    },
                    {
                        name: '判決文書',
                        clue: '判刑證據載明「罪無可赦」，秦德參的辯白不被採納。這份文書彰顯了救濟失靈。',
                        attachment: null
                    },
                    {
                        name: '四證物陳列',
                        clue: '四件證物依序陳列：破損的稱仔、巡警腰牌、巡警勤務簿、判刑證據。各代表不同的洞察。',
                        attachment: null
                    }
                ],
                codes: {
                    '3-1': '3141',
                    '3-2': '5926',
                    '3-3': '2718'
                }
            }
        ];
        endingOptions = [
            {
                name: '破損的稱仔',
                message: '你帶走了破損的稱仔，記住的是底層生計的脆弱與活路如何被切斷。'
            },
            {
                name: '巡警腰牌',
                message: '你帶走了巡警腰牌，記住的是權力掌握在誰手裡，個人壓迫與身分權力。'
            },
            {
                name: '巡警勤務簿',
                message: '你帶走了勤務簿，記住的是整個制度如何把人養成加害者。'
            },
            {
                name: '判刑證據／判決文書',
                message: '你帶走了判刑文書，記住的是制度如何拒絕弱者，使合法救濟也失效。'
            }
        ];
    }
    // 若未設定 endingOptions，使用預設
    if (!endingOptions) {
        endingOptions = [
            {
                name: '破損的稱仔',
                message: '你帶走了破損的稱仔，記住的是底層生計的脆弱與活路如何被切斷。'
            },
            {
                name: '巡警腰牌',
                message: '你帶走了巡警腰牌，記住的是權力掌握在誰手裡，個人壓迫與身分權力。'
            },
            {
                name: '巡警勤務簿',
                message: '你帶走了勤務簿，記住的是整個制度如何把人養成加害者。'
            },
            {
                name: '判刑證據／判決文書',
                message: '你帶走了判刑文書，記住的是制度如何拒絕弱者，使合法救濟也失效。'
            }
        ];
    }

    // 狀態紀錄
    let currentRoomIndex = null;
    const solvedBoxes = {};

    // DOM 參考
    const homeSection = document.getElementById('home');
    const roomsContainer = document.getElementById('roomsContainer');
    const endingSection = document.getElementById('ending');
    const clueModal = document.getElementById('clueModal');
    const clueTextElem = document.getElementById('clueText');
    const closeModalBtn = document.getElementById('closeModal');

    /**
     * 逃逸 HTML 特殊字元，避免使用者輸入造成潛在的 XSS。與編輯器中的實作相同。
     * @param {string} str
     */
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // 初始化：渲染房間區塊
    function init() {
        roomsData.forEach((room, roomIndex) => {
            const roomSection = document.createElement('section');
            roomSection.id = `room-${room.id}`;
            roomSection.className = 'section room';
            // 如果有自訂背景，設定背景圖片
            if (room.background) {
                roomSection.style.backgroundImage = `url(${room.background})`;
                roomSection.style.backgroundSize = 'cover';
                roomSection.style.backgroundPosition = 'center';
            }

            // 標題與描述
            const container = document.createElement('div');
            container.className = 'container';
            const titleEl = document.createElement('h2');
            titleEl.className = 'room-title';
            titleEl.textContent = room.title;
            const descEl = document.createElement('p');
            descEl.className = 'intro';
            descEl.textContent = room.description;
            container.appendChild(titleEl);
            container.appendChild(descEl);

            // 物件區
            const objectsDiv = document.createElement('div');
            objectsDiv.className = 'objects';
            room.objects.forEach((obj, objIndex) => {
                const objCard = document.createElement('div');
                objCard.className = 'object-card';
                objCard.innerHTML = `<h3>${obj.name}</h3>`;
                objCard.addEventListener('click', () => {
                    showClue(roomIndex, objIndex);
                });
                objectsDiv.appendChild(objCard);
            });
            container.appendChild(objectsDiv);

            // 密碼區
            const codesDiv = document.createElement('div');
            codesDiv.className = 'codes';
            Object.keys(room.codes).forEach((codeKey) => {
                const codeBox = document.createElement('div');
                codeBox.className = 'code-box';
                const codeLabel = document.createElement('h4');
                codeLabel.textContent = `密碼箱 ${codeKey}`;
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = '輸入四位數密碼';
                const btn = document.createElement('button');
                btn.textContent = '確認';
                const status = document.createElement('div');
                status.className = 'status';
                status.textContent = '';
                btn.addEventListener('click', () => {
                    submitCode(roomIndex, codeKey, input, status, codeBox);
                });
                codeBox.appendChild(codeLabel);
                codeBox.appendChild(input);
                codeBox.appendChild(btn);
                codeBox.appendChild(status);
                codesDiv.appendChild(codeBox);
            });
            container.appendChild(codesDiv);

            // 前往下一房按鈕（初始隱藏）
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn';
            nextBtn.style.display = 'none';
            nextBtn.textContent = roomIndex < roomsData.length - 1 ? '前往下一房' : '前往結局';
            nextBtn.addEventListener('click', () => {
                if (roomIndex < roomsData.length - 1) {
                    showRoom(roomIndex + 1);
                } else {
                    showEnding();
                }
            });
            container.appendChild(nextBtn);

            roomSection.appendChild(container);
            roomsContainer.appendChild(roomSection);

            // 初始化 solvedBoxes 狀態
            Object.keys(room.codes).forEach(key => {
                solvedBoxes[`${room.id}-${key.split('-')[1]}`] = false;
            });
        });
    }

    // 顯示房間
    function showRoom(index) {
        currentRoomIndex = index;
        // 隱藏所有區段
        [...document.querySelectorAll('.section')].forEach(s => s.classList.remove('active'));
        const section = document.getElementById(`room-${roomsData[index].id}`);
        if (section) {
            section.classList.add('active');
        }
    }

    // 顯示結尾頁
    function showEnding() {
        // 隱藏所有區段
        [...document.querySelectorAll('.section')].forEach(s => s.classList.remove('active'));
        endingSection.classList.add('active');
        renderEndingOptions();
    }

    // 顯示線索彈窗
    function showClue(roomIndex, objIndex) {
        const obj = roomsData[roomIndex].objects[objIndex];
        const clue = obj.clue || '';
        let html = '';
        // 將線索內文以段落顯示
        html += `<p>${escapeHtml(clue)}</p>`;
        // 如果有附件，根據類型呈現
        if (obj.attachment) {
            // 判斷是否為圖片
            if (obj.attachment.startsWith('data:image/')) {
                html += `<img src="${obj.attachment}" alt="附件" style="max-width:100%;margin-top:0.5rem;">`;
            } else {
                html += `<p><a href="${obj.attachment}" download target="_blank" style="color:#ffe082;text-decoration:underline;">下載附件</a></p>`;
            }
        }
        clueTextElem.innerHTML = html;
        clueModal.style.display = 'block';
    }

    // 關閉彈窗
    closeModalBtn.addEventListener('click', () => {
        clueModal.style.display = 'none';
    });
    // 點擊外層也可關閉
    clueModal.addEventListener('click', (e) => {
        if (e.target === clueModal) {
            clueModal.style.display = 'none';
        }
    });

    // 提交密碼
    function submitCode(roomIndex, codeKey, inputEl, statusEl, codeBoxEl) {
        const room = roomsData[roomIndex];
        const expected = room.codes[codeKey];
        const entered = inputEl.value.trim();
        if (entered === expected) {
            // 正確
            const suffix = codeKey.split('-')[1];
            const rewardInfo = codeRewards[`${room.id}-${suffix}`];
            // 構造提示訊息
            let msg = '密碼正確！';
            if (rewardInfo && rewardInfo.reward) {
                msg += ` 獲得：${escapeHtml(rewardInfo.reward)}`;
            }
            // 如果有附件，添加對應的圖片或下載連結
            let attachHtml = '';
            if (rewardInfo && rewardInfo.attachment) {
                if (rewardInfo.attachment.startsWith('data:image/')) {
                    attachHtml = `<div style="margin-top:0.5rem;"><img src="${rewardInfo.attachment}" alt="獎勵附件" style="max-width:100%;"></div>`;
                } else {
                    attachHtml = `<p style="margin-top:0.5rem;"><a href="${rewardInfo.attachment}" download target="_blank" style="color:#ffe082;text-decoration:underline;">下載獎勵附件</a></p>`;
                }
            }
            statusEl.innerHTML = `${msg}${attachHtml}`;
            statusEl.style.color = '#a8d08d';
            inputEl.disabled = true;
            solvedBoxes[`${room.id}-${suffix}`] = true;
            // 如果這是該房間的最後一個箱子 (-3)，顯示前往下一房按鈕
            if (codeKey.endsWith('3')) {
                const containerEl = codeBoxEl.closest('.container');
                const btn = containerEl.querySelector('button.btn');
                if (btn) {
                    btn.style.display = 'inline-block';
                }
            }
        } else {
            statusEl.textContent = '密碼錯誤，再試一次。';
            statusEl.style.color = '#e57373';
        }
    }

    // 渲染結尾頁選項
    function renderEndingOptions() {
        // 清空既有內容，重新插入
        let optsDiv = endingSection.querySelector('.ending-options');
        let msgDiv = endingSection.querySelector('.ending-message');
        if (!optsDiv) {
            optsDiv = document.createElement('div');
            optsDiv.className = 'ending-options';
            endingSection.querySelector('.container').appendChild(optsDiv);
        }
        optsDiv.innerHTML = '';
        if (!msgDiv) {
            msgDiv = document.createElement('div');
            msgDiv.className = 'ending-message';
            endingSection.querySelector('.container').appendChild(msgDiv);
        }
        msgDiv.textContent = '';
        endingOptions.forEach(option => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.innerHTML = `<h3>${option.name}</h3>`;
            card.addEventListener('click', () => {
                msgDiv.textContent = option.message;
            });
            optsDiv.appendChild(card);
        });
    }

    // 開始遊戲按鈕
    document.getElementById('startButton').addEventListener('click', () => {
        // 隱藏首頁
        homeSection.classList.remove('active');
        // 顯示第一房
        showRoom(0);
    });

    // 若有自訂首頁與結尾頁文字，更新頁面文字
    if (customHomeTitle) {
        const titleEl = document.getElementById('homeTitle');
        if (titleEl) titleEl.textContent = customHomeTitle;
    }
    if (customHomeIntro) {
        const introEl = document.getElementById('homeIntro');
        if (introEl) introEl.textContent = customHomeIntro;
    }
    if (customEndingIntro) {
        const endIntroEl = document.getElementById('endingIntro');
        if (endIntroEl) endIntroEl.textContent = customEndingIntro;
    }

    // 初始化房間
    init();
});