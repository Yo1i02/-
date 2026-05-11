// 定義全局變數，確保各個函數都能存取
let ball, basketSensor, cans, score = 0;
let scoreText, statusText;
let startX, startY;
let currentBounce = 0.4; // 回到你原本設定的 0.4
let collectedCans = 0;
const canKeys = ['can_red', 'can_blue', 'can_green', 'can_yellow'];

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
    this.load.image('can_red', '1.PNG');
    this.load.image('can_blue', '2.PNG');
    this.load.image('can_green', '3.PNG');
    this.load.image('can_yellow', '4.PNG');
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
        currentBounce = 0.4; // 回到原本重置時的設定
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
        currentBounce = Math.min(currentBounce + 0.35, 1.5); // 原本的增加幅度
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

                // --- 增加：高度 5 通關跳轉功能 ---
                if (score === 5) {
                    this.time.delayedCall(500, () => {
                        if (confirm("恭喜通關！是否接收能量？")) {
                            window.location.href = "https://www.warhorsechina.com.cn/?trk=public_post-text";
                        }
                    });
                }
                // ----------------------------

                this.time.delayedCall(1200, () => {
                    cans.clear(true, true); 
                    spawnRandomCans(this, cans, sw, sh, canKeys, 3);
                    collectedCans = 0;
                    updateLights(); 
                    resetBallPos();
                    document.getElementById('light-basket').classList.remove('active');
                });
                // 在你的進球判定邏輯內
                if (collectedCans >= 3) {
                    document.getElementById('light-basket').classList.add('active');
                    score++;
                    if (scoreText) scoreText.innerText = score;
                    statusText.innerText = "🏆 戰馬能量滿載！節點達成";

                    // --- 新增：動態換背景邏輯 ---
                    const container = document.getElementById('game-container');
                    // 根據 score 分數切換圖片，例如 score 為 1 時換 bg1.jpg
                    // 你可以準備 bg1.jpg, bg2.jpg, bg3.jpg, bg4.jpg, bg5.jpg
                    if (score <= 5) {
                        container.style.backgroundImage = `bg2.jpg`;
                    }
                    // -------------------------

                    // 原有的高度 5 跳轉邏輯
                    if (score === 5) {
                        this.time.delayedCall(500, () => {
                            if (confirm("恭喜通關！是否接收能量？")) {
                                window.location.href = "https://www.warhorsechina.com.cn/?trk=public_post-text";
                            }
                        });
                    }

                    // ... 其餘 resetBallPos 等邏輯 ...
                }
            } else {
                statusText.innerText = "❌ 能量不足！請先點亮 3 顆燈";
                this.time.delayedCall(800, () => resetBallPos());
            }
        }
        
    });

        // 5. 滑鼠控制
    this.input.on('pointerdown', (pointer) => {
        startX = pointer.x;
        startY = pointer.y;

        // --- 新增：碰到/點擊畫面時，隱藏字幕 ---
        const guideText = document.getElementById('guide-text');
        if (guideText) {
            guideText.classList.add('hidden');
        }
    });

    this.input.on('pointerup', (pointer) => {
        const dx = startX - pointer.x;
        const dy = startY - pointer.y;
        ball.body.setVelocity(dx * 3.5, (dy * 3.5) - 50);
    });
}

function spawnRandomCans(scene, group, sw, sh, keys, count) {
    for (let i = 0; i < count; i++) {
        let randomKey = Phaser.Utils.Array.GetRandom(keys);
        let x = Phaser.Math.Between(80, sw - 80);
        let y = Phaser.Math.Between(sh * 0.35, sh * 0.6);
        let can = group.create(x, y, randomKey);
        if (can) {
            can.setScale(0.05); 
            can.body.setAllowGravity(false);
            can.body.setImmovable(true);
            can.setDepth(5);
        }
    }
}

function update() {
    if (ball && ball.body && ball.active) {
        ball.angle += ball.body.velocity.x * 0.08;
    }
}

window.onload = initGame;
