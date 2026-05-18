// 1. 全局變數定義
let ball, basketSensor, cans, score = 0;
let scoreText, statusText;
let startX, startY;
let currentBounce = 0.4; 
let collectedCans = 0;
const canKeys = ['can_red', 'can_blue', 'can_green']; 

// 背景清單
const bgs = ['bg1.jpg', 'bg2.jpg', 'bg3.jpg', 'bg4.jpg', 'bg5.jpg', 'bg6.jpg'];

// 過場動畫 LOGO 清單
const logos = ['LOGO1.png', 'LOGO2.png', 'LOGO3.png', 'LOGO4.png', 'LOGO5.png', 'LOGO6.png'];

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
    
    // 預載 6 個過場 LOGO
    for(let i=1; i<=6; i++) {
        this.load.image(`logo_step_${i}`, `LOGO${i}.png`);
    }
}

function create() {
    const sw = this.cameras.main.width;
    const sh = this.cameras.main.height;

    scoreText = document.getElementById('score');
    statusText = document.getElementById('energy-status');

    // 初始化背景 (高度 0 -> bg1.jpg)
    const container = document.getElementById('game-container');
    if (container) {
        container.style.backgroundImage = `url('${bgs[0]}')`;
        container.style.backgroundSize = "100% 100%"; 
        container.style.backgroundPosition = "center";
        container.style.backgroundRepeat = "no-repeat";
    }

    // 內部輔助：過場動畫功能
    const playClearTransition = (scene, currentScore) => {
        const logoImg = scene.add.image(sw / 2, sh / 2, `logo_step_${currentScore + 1}`);
        logoImg.setDepth(100); 
        logoImg.setScale(0);   
        logoImg.setAlpha(0);   

        scene.tweens.add({
            targets: logoImg,
            scale: 0.5,        
            alpha: 1,          
            duration: 400,     
            ease: 'Back.easeOut',
            onComplete: () => {
                scene.tweens.add({
                    targets: logoImg,
                    scale: 0.8, 
                    alpha: 0,   
                    delay: 300, 
                    duration: 500,
                    onComplete: () => {
                        logoImg.destroy(); 
                    }
                });
            }
        });
    };

    const updateLights = () => {
        document.querySelectorAll('.light').forEach(l => l.classList.remove('active'));
        for (let i = 1; i <= collectedCans; i++) {
            const el = document.getElementById(`light-${i}`);
            if (el) el.classList.add('active');
        }
    };

    const resetBallPos = () => {
        if (!ball) return;
        ball.setPosition(sw * 0.5, sh * 0.85);
        ball.body.setVelocity(0, 0);
        ball.body.setAngularVelocity(0);
        currentBounce = 0.4; 
        ball.body.setBounce(currentBounce);
        ball.setActive(true).setVisible(true);
    };

    // 💡【新增】重置遊戲到高度 0 的功能
    const restartGame = (scene) => {
        score = 0; // 分數歸零
        if (scoreText) scoreText.innerText = score;
        
        // 背景切換回第一張 bg1.jpg
        if (container) {
            container.style.backgroundImage = `url('${bgs[0]}')`;
        }

        // 刷新地圖上的罐子
        cans.clear(true, true);
        spawnRandomCans(scene, cans, sw, sh, canKeys, 3);
        
        // 重置所有狀態與能量燈
        collectedCans = 0;
        updateLights();
        resetBallPos();
        document.getElementById('light-basket').classList.remove('active');
        statusText.innerText = `高度 0m：請收集能量罐`;
    };

    // 1. 建立感應區與罐子群組
    basketSensor = this.add.rectangle(sw / 2, sh * 0.3, 100, 20, 0xffffff, 0);
    this.physics.add.existing(basketSensor, true);
    cans = this.physics.add.group();
    spawnRandomCans(this, cans, sw, sh, canKeys, 3);

    // 2. 建立球
    ball = this.add.image(sw * 0.5, sh * 0.85, 'basketballKey');
    if (ball) {
        ball.setScale((sw * 0.18) / ball.width);
        this.physics.add.existing(ball);
        ball.body.setCircle(ball.width / 2);
        ball.body.setCollideWorldBounds(true);
        ball.body.setBounce(currentBounce);
        ball.setDepth(10);
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

        let popupText = this.add.text(canX, canY - 20, '彈力 +30%', {
            fontSize: '20px', fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffaa00', stroke: '#331100', strokeThickness: 4
        });
        popupText.setOrigin(0.5); popupText.setDepth(15);    
        this.tweens.add({
            targets: popupText, y: canY - 80, alpha: 0, duration: 800, ease: 'Cubic.easeOut', onComplete: () => popupText.destroy()
        });
    });

    // 4. 碰撞邏輯：籃框
    this.physics.add.overlap(ball, basketSensor, () => {
        if (ball.body.velocity.y > 0 && ball.active) {
            ball.setActive(false).setVisible(false);

            if (collectedCans >= 3) {
                playClearTransition(this, score);
                document.getElementById('light-basket').classList.add('active');
                
                this.time.delayedCall(1000, () => {
                    score++;
                    if (scoreText) scoreText.innerText = score;
                    
                    if (container && score < bgs.length) {
                        container.style.backgroundImage = `url('${bgs[score]}')`;
                    }

                    // 當達到高度 5 時
                    if (score === 5) {
                        this.time.delayedCall(1000, () => {
                            if (confirm("恭喜通關！是否接收能量？")) {
                                // 按「是」：跳轉網頁
                                window.location.href = "https://www.warhorsechina.com.cn/?trk=public_post-text";
                            } else {
                                // 💡 按「否」：執行重置遊戲，從頭輪迴
                                restartGame(this);
                            }
                        });
                    }
                });

                // 如果還沒到最終高度 5，走正常的下一關流程
                this.time.delayedCall(2000, () => {
                    if (score < 5) {
                        cans.clear(true, true); 
                        spawnRandomCans(this, cans, sw, sh, canKeys, 3);
                        collectedCans = 0;
                        updateLights(); 
                        resetBallPos();
                        document.getElementById('light-basket').classList.remove('active');
                        statusText.innerText = `高度 ${score}m：請收集能量罐`;
                    }
                });
            } else {
                statusText.innerText = "❌ 能量不足！請先點亮 3 顆燈";

                let retryText = this.add.text(sw / 2, sh / 2, '再加油一下!快成功了!', {
                    fontSize: '20px',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    fill: '#ffaa00',       
                    stroke: '#331100',     
                    strokeThickness: 4
                });
                retryText.setOrigin(0.5);
                retryText.setDepth(15);    

                this.tweens.add({
                    targets: retryText,
                    y: (sh / 2) - 60,      
                    alpha: 0,              
                    duration: 700,        
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        retryText.destroy(); 
                    }
                });

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
            can.setScale(0.08); can.body.setAllowGravity(false);
            can.body.setImmovable(true); can.setDepth(5); 
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
