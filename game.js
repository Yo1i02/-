// 1. 全局變數定義
let ball, basketSensor, cans, score = 0;
let scoreText, statusText;
let startX, startY;
let currentBounce = 0.4; 
let collectedCans = 0;
const canKeys = ['can_red', 'can_blue', 'can_green']; 

// 💡 重新整理背景圖片陣列，讓 score 對應正確的圖片
// score = 0 對應 bgs[0] ('bg1.jpg')
// score = 1 對應 bgs[1] ('bg2.jpg') ... 依此類推至 score = 5
const bgs = ['bg1.jpg', 'bg2.jpg', 'bg3.jpg', 'bg4.jpg', 'bg5.jpg', 'bg6.jpg'];

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
    // 優先載入圖片，確保遊戲本體能顯示
    this.load.image('basketballKey', 'IMG_0076.PNG');
    this.load.image('can_red', '1.png');
    this.load.image('can_blue', '2.png');
    this.load.image('can_green', '3.png');
}

function create() {
    const sw = this.cameras.main.width;
    const sh = this.cameras.main.height;

    // 💡 檢查寬高，防止在某些手機瀏覽器抓到 0
    if (sw === 0 || sh === 0) {
        console.error("偵測到螢幕寬高為 0，請重新整理");
        return;
    }

    scoreText = document.getElementById('score');
    statusText = document.getElementById('energy-status');

    // 💡 【新增邏輯】遊戲初始化（高度 0）時，立即強制載入第一張背景 bg1.jpg
    const container = document.getElementById('game-container');
    if (container) {
        container.style.backgroundImage = `url('${bgs[0]}')`;
        container.style.backgroundSize = "100% 100%"; 
        container.style.backgroundPosition = "center";
        container.style.backgroundRepeat = "no-repeat";
    }

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

    // 2. 建立球 (加上深度確保它在最前面)
    ball = this.add.image(sw * 0.5, sh * 0.85, 'basketballKey');
    if (ball) {
        ball.setScale((sw * 0.18) / ball.width);
        this.physics.add.existing(ball);
        ball.body.setCircle(ball.width / 2);
        ball.body.setCollideWorldBounds(true);
        ball.body.setBounce(currentBounce);
        ball.setDepth(10); // 確保球不會被背景擋住
    }

    // 3. 碰撞邏輯：罐子
    this.physics.add.overlap(ball, cans, (ballObj, canObj) => {
        const canX = canObj.x;
        const canY = canObj.y;

        canObj.destroy();
        collectedCans++;
        updateLights();
        currentBounce = Math.min(currentBounce + 0.35, 1.5);
        ball.body.setBounce(currentBounce);
        ball.setTint(0xffcc00);
        this.time.delayedCall(200, () => ball.clearTint());
        statusText.innerText = `⚡ 點亮第 ${collectedCans} 顆能量燈！`;

        // 「彈力 +30%」金黃色稍橘飄浮文字提示
        let popupText = this.add.text(canX, canY - 20, '彈力 +30%', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            fill: '#ffaa00', 
            stroke: '#331100', 
            strokeThickness: 4
        });
        popupText.setOrigin(0.5); 
        popupText.setDepth(15);    

        this.tweens.add({
            targets: popupText,
            y: canY - 80,          
            alpha: 0,              
            duration: 800,         
            ease: 'Cubic.easeOut',
            onComplete: () => {
                popupText.destroy(); 
            }
        });
    });

    // 4. 碰撞邏輯：籃框 (進球判定)
    this.physics.add.overlap(ball, basketSensor, () => {
        if (ball.body.velocity.y > 0 && ball.active) {
            ball.setActive(false).setVisible(false);

            if (collectedCans >= 3) {
                document.getElementById('light-basket').classList.add('active');
                score++; // 進球後 score 遞增
                if (scoreText) scoreText.innerText = score;
                statusText.innerText = "🏆 戰馬能量滿載！節點達成";

                // --- 💡 這裡更改背景更換邏輯 ---
                if (container) {
                    // 當 score 變為 1 時，載入 bgs[1] ('bg2.jpg')；當 score 變為 5 時，載入 bgs[5] ('bg6.jpg')
                    if (score < bgs.length) {
                        container.style.backgroundImage = `url('${bgs[score]}')`;
                        container.style.backgroundSize = "100% 100%"; 
                        container.style.backgroundPosition = "center";
                        container.style.backgroundRepeat = "no-repeat";
                    }
                }

                // 高度 5 通關跳轉
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

    // 5. 滑鼠與觸控控制邏輯
    this.input.on('pointerdown', (pointer) => {
        startX = pointer.x;
        startY = pointer.y;
        const guideText = document.getElementById('guide-text');
        if (guideText) guideText.classList.add('hidden');
    });

    this.input.on('pointerup', (pointer) => {
        if (!ball || !ball.active) return;
        const dx = startX - pointer.x;
        const dy = startY - pointer.y;
        
        const forceX = Phaser.Math.Clamp(dx * 3.5, -600, 600);
        const forceY = Phaser.Math.Clamp((dy * 3.5) - 50, -1200, -300);
        
        ball.body.setVelocity(forceX, forceY);
    });
}

function spawnRandomCans(scene, group, sw, sh, keys, count) {
    group.clear(true, true); 
    for (let i = 0; i < count; i++) {
        let randomKey = Phaser.Utils.Array.GetRandom(keys);
        
        let x = Phaser.Math.Between(80, Math.max(sw - 80, 100));
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
