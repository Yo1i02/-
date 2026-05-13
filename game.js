// 1. 全局變數定義
let ball, basketSensor, cans, score = 0;
let scoreText, statusText;
let startX, startY;
let currentBounce = 0.4; 
let collectedCans = 0;
const canKeys = ['can_red', 'can_blue', 'can_green']; 

// 音效變數
let sfxBounce, sfxGoal, sfxCollect;

const initGame = () => {
    const container = document.getElementById('game-container');
    const cw = container.clientWidth || 375;
    const ch = container.clientHeight || 667;

    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: cw,
        height: ch,
        transparent: true,
        physics: {
            default: 'arcade',
            arcade: { gravity: { y: 1500 }, debug: false }
        },
        scene: { preload, create, update }
    };
    new Phaser.Game(config);
};

function preload() {
    // 💡 確保圖片路徑與大小寫正確
    this.load.image('basketballKey', 'IMG_0076.PNG');
    this.load.image('can_red', '1.png');
    this.load.image('can_blue', '2.png');
    this.load.image('can_green', '3.png');
    
    // --- 音效預載 (加上保護機制) ---
    // 如果這三個檔案還沒準備好，遊戲也不會卡死
    this.load.audio('sfx_bounce', 'bounce.mp3');   
    this.load.audio('sfx_goal', 'goal.mp3');       
    this.load.audio('sfx_collect', 'collect.mp3'); 

    // 監聽載入錯誤，防止當機
    this.load.on('loaderror', (file) => {
        console.warn('資源載入失敗，跳過: ' + file.src);
    });
}

function create() {
    const sw = this.cameras.main.width;
    const sh = this.cameras.main.height;

    scoreText = document.getElementById('score');
    statusText = document.getElementById('energy-status');

    // --- 安全初始化音效 (檢查檔案是否存在才建立) ---
    if (this.cache.audio.exists('sfx_bounce')) sfxBounce = this.sound.add('sfx_bounce', { volume: 0.5 });
    if (this.cache.audio.exists('sfx_goal')) sfxGoal = this.sound.add('sfx_goal', { volume: 0.8 });
    if (this.cache.audio.exists('sfx_collect')) sfxCollect = this.sound.add('sfx_collect', { volume: 0.6 });

    // 內部輔助：燈號更新
    const updateLights = () => {
        document.querySelectorAll('.light').forEach(l => l.classList.remove('active'));
        for (let i = 1; i <= collectedCans; i++) {
            const el = document.getElementById(`light-${i}`);
            if (el) el.classList.add('active');
        }
    };

    // 內部輔助：重置球
    const resetBallPos = () => {
        if (!ball) return;
        ball.setPosition(sw * 0.5, sh * 0.85);
        ball.body.setVelocity(0, 0);
        ball.body.setAngularVelocity(0);
        currentBounce = 0.4; 
        ball.body.setBounce(currentBounce);
        ball.setActive(true).setVisible(true);
    };

    // 1. 建立感應區與罐子群組
    basketSensor = this.add.rectangle(sw / 2, sh * 0.3, 100, 20, 0xffffff, 0);
    this.physics.add.existing(basketSensor, true);
    
    cans = this.physics.add.group();
    spawnRandomCans(this, cans, sw, sh, canKeys, 3);

    // 2. 建立球 (加入判斷確保球體建立成功)
    ball = this.add.image(sw * 0.5, sh * 0.85, 'basketballKey');
    ball.setScale((sw * 0.18) / ball.width);
    this.physics.add.existing(ball);
    ball.body.setCircle(ball.width / 2);
    ball.body.setCollideWorldBounds(true);
    ball.body.setBounce(currentBounce);
    ball.setDepth(10); // 確保在最上層

    // 牆壁碰撞音效
    ball.body.onWorldBounds = true;
    this.physics.world.on('worldbounds', () => {
        if (sfxBounce && ball.active) sfxBounce.play();
    });

    // 3. 碰撞邏輯：罐子
    this.physics.add.overlap(ball, cans, (ballObj, canObj) => {
        canObj.destroy();
        if (sfxCollect) sfxCollect.play(); 
        collectedCans++;
        updateLights();
        currentBounce = Math.min(currentBounce + 0.35, 1.5);
        ball.body.setBounce(currentBounce);
        ball.setTint(0xffcc00);
        this.time.delayedCall(200, () => ball.clearTint());
        statusText.innerText = `⚡ 點亮第 ${collectedCans} 顆能量燈！`;
    });

    // 4. 碰撞邏輯：籃框 (進球判定)
    this.physics.add.overlap(ball, basketSensor, () => {
        if (ball.body.velocity.y > 0 && ball.active) {
            ball.setActive(false).setVisible(false);

            if (collectedCans >= 3) {
                if (sfxGoal) sfxGoal.play(); 
                document.getElementById('light-basket').classList.add('active');
                score++;
                if (scoreText) scoreText.innerText = score;
                statusText.innerText = "🏆 戰馬能量滿載！節點達成";

                const container = document.getElementById('game-container');
                if (container) {
                    const bgs = ['「底11.jpg', 'bg1.jpg', 'bg2.jpg', 'bg3.jpg', 'bg4.jpg', 'bg5.jpg'];
                    if (score < bgs.length) {
                        container.style.backgroundImage = `url('${bgs[score]}')`;
                        container.style.backgroundSize = "100% 100%"; 
                        container.style.backgroundPosition = "center";
                        container.style.backgroundRepeat = "no-repeat";
                    }
                }

                if (score === 5) {
                    this.time.delayedCall(500, () => {
                        if (confirm("恭喜通關！是否接收能量？")) {
                            window.location.href = "https://www.warhorsechina.com.cn/?trk=public_post-text";
                        }
                    });
                }

                this.time.delayedCall(1200, () => {
                    cans.clear(true, true); 
                    spawnRandomCans(this, cans, sw, sh, canKeys, 3);
                    collectedCans = 0;
                    updateLights(); 
                    resetBallPos();
                    document.getElementById('light-basket').classList.remove('active');
                });
            } else {
                statusText.innerText = "❌ 能量不足！請先點亮 3 顆燈";
                this.time.delayedCall(800, () => resetBallPos());
            }
        }
    });

    // 5. 控制邏輯 (修正球沒反應的問題)
    this.input.on('pointerdown', (pointer) => {
        startX = pointer.x;
        startY = pointer.y;
        const guideText = document.getElementById('guide-text');
        if (guideText) guideText.classList.add('hidden');
    });

    this.input.on('pointerup', (pointer) => {
        if (!ball.active) return; // 球不可見時不觸發
        const dx = startX - pointer.x;
        const dy = startY - pointer.y;
        
        // 💡 增加力量上限限制，防止球飛太遠
        const forceX = Phaser.Math.Clamp(dx * 3.5, -600, 600);
        const forceY = Phaser.Math.Clamp((dy * 3.5) - 50, -1200, -300);
        
        ball.body.setVelocity(forceX, forceY);
        if (sfxBounce) sfxBounce.play(); 
    });
}

function spawnRandomCans(scene, group, sw, sh, keys, count) {
    group.clear(true, true); 
    for (let i = 0; i < count; i++) {
        let randomKey = Phaser.Utils.Array.GetRandom(keys);
        let x = Phaser.Math.Between(80, sw - 80);
        let segmentHeight = (sh * 0.22) / count; 
        let y = (sh * 0.38) + (segmentHeight * i) + Phaser.Math.Between(0, 20);
        
        let can = group.create(x, y, randomKey);
        if (can) {
            can.setScale(0.08); 
            can.body.setAllowGravity(false);
            can.body.setImmovable(true);
            can.setDepth(5);
            can.body.setSize(can.width * 0.8, can.height * 0.8);
        }
    }
}

function update() {
    if (ball && ball.body && ball.active) {
        ball.angle += ball.body.velocity.x * 0.08;
    }
}

window.onload = initGame;
