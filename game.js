// 定義全局變數，確保各個函數都能存取
let ball, basketSensor, cans, score = 0;
let scoreText, statusText;
let startX, startY;
let currentBounce = 0.4; 
let collectedCans = 0;
const canKeys = ['can_red', 'can_blue', 'can_green']; 

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
            default: 'arc// 定義全局變數
let ball, basketSensor, cans, score = 0;
let scoreText, statusText;
let startX, startY;
let currentBounce = 0.4; 
let collectedCans = 0;
const canKeys = ['can_red', 'can_blue', 'can_green']; 

// 宣告音效變數
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
    this.load.image('basketballKey', 'IMG_0076.PNG');
    this.load.image('can_red', '1.png');
    this.load.image('can_blue', '2.png');
    this.load.image('can_green', '3.png');
    
    // --- 音效預載 (已移除 Fail 音效) ---
    this.load.audio('sfx_bounce', 'bounce.mp3');   
    this.load.audio('sfx_goal', 'goal.mp3');       
    this.load.audio('sfx_collect', 'collect.mp3'); 
}

function create() {
    const sw = this.cameras.main.width;
    const sh = this.cameras.main.height;

    scoreText = document.getElementById('score');
    statusText = document.getElementById('energy-status');

    // --- 初始化音效物件 ---
    sfxBounce = this.sound.add('sfx_bounce', { volume: 0.5 });
    sfxGoal = this.sound.add('sfx_goal', { volume: 0.8 });
    sfxCollect = this.sound.add('sfx_collect', { volume: 0.6 });

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

    // 2. 建立球
    ball = this.add.image(sw * 0.5, sh * 0.85, 'basketballKey');
    ball.setScale((sw * 0.18) / ball.width);
    this.physics.add.existing(ball);
    ball.body.setCircle(ball.width / 2);
    ball.body.setCollideWorldBounds(true);
    ball.body.setBounce(currentBounce);

    // 增加牆壁碰撞音效
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
                // 💡 能量不足進球：僅顯示文字並重置，不播放音效
                statusText.innerText = "❌ 能量不足！請先點亮 3 顆燈";
                this.time.delayedCall(800, () => resetBallPos());
            }
        }
    });

    // 5. 控制邏輯
    this.input.on('pointerdown', (pointer) => {
        startX = pointer.x;
        startY = pointer.y;
        const guideText = document.getElementById('guide-text');
        if (guideText) guideText.classList.add('hidden');
    });

    this.input.on('pointerup', (pointer) => {
        const dx = startX - pointer.x;
        const dy = startY - pointer.y;
        ball.body.setVelocity(dx * 3.5, (dy * 3.5) - 50);
        if (sfxBounce) sfxBounce.play(); 
    });
}

function spawnRandomCans(scene, group, sw, sh, keys, count) {
    group.clear(true, true); 
    for (let i = 0; i < count; i++) {
        let randomKey = Phaser.Utils.Array.GetRandom(keys);
        let x = Phaser.Math.Between(100, sw - 100);
        let segmentHeight = (sh * 0.25) / count; 
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

window.onload = initGame;ade',
            arcade: { gravity: { y: 1500 }, debug: false }
        },
        scene: { preload, create, update }
    };
    new Phaser.Game(config);
};

function preload() {
    this.load.image('basketballKey', 'IMG_0076.PNG');
    this.load.image('can_red', '1.png');
    this.load.image('can_blue', '2.png');
    this.load.image('can_green', '3.png');
    
    // 音效預載
    this.load.audio('sfx_bounce', 'bounce.mp3');
    this.load.audio('sfx_goal', 'goal.mp3');
    this.load.audio('sfx_fail', 'fail.mp3');
}

function create() {
    const sw = this.cameras.main.width;
    const sh = this.cameras.main.height;

    scoreText = document.getElementById('score');
    statusText = document.getElementById('energy-status');

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

    // 2. 建立球
    ball = this.add.image(sw * 0.5, sh * 0.85, 'basketballKey');
    ball.setScale((sw * 0.18) / ball.width);
    this.physics.add.existing(ball);
    ball.body.setCircle(ball.width / 2);
    ball.body.setCollideWorldBounds(true);
    ball.body.setBounce(currentBounce);

    // 3. 碰撞邏輯：罐子
    this.physics.add.overlap(ball, cans, (ballObj, canObj) => {
        canObj.destroy();
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
                document.getElementById('light-basket').classList.add('active');
                score++;
                if (scoreText) scoreText.innerText = score;
                statusText.innerText = "🏆 戰馬能量滿載！節點達成";

                // --- 背景更換：保持擠壓模式 ---
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

    // 5. 控制邏輯
    this.input.on('pointerdown', (pointer) => {
        startX = pointer.x;
        startY = pointer.y;
        const guideText = document.getElementById('guide-text');
        if (guideText) guideText.classList.add('hidden');
    });

    this.input.on('pointerup', (pointer) => {
        const dx = startX - pointer.x;
        const dy = startY - pointer.y;
        ball.body.setVelocity(dx * 3.5, (dy * 3.5) - 50);
    });
}

// 罐子生成函式
function spawnRandomCans(scene, group, sw, sh, keys, count) {
    group.clear(true, true); 
    for (let i = 0; i < count; i++) {
        let randomKey = Phaser.Utils.Array.GetRandom(keys);
        
        // 分段生成 y 座標，確保三個罐子不會完全重疊
        let x = Phaser.Math.Between(100, sw - 100);
        let segmentHeight = (sh * 0.25) / count; 
        let y = (sh * 0.38) + (segmentHeight * i) + Phaser.Math.Between(0, 20);
        
        let can = group.create(x, y, randomKey);
        if (can) {
            // 💡 調整縮放比例為 0.08（原本 0.12 縮小一點）
            can.setScale(0.08); 
            
            can.body.setAllowGravity(false);
            can.body.setImmovable(true);
            can.setDepth(5);
            
            // 保持較寬鬆的碰撞判定，讓球容易收集
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
