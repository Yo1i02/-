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

    // 內部輔助：過場動畫功能（💡 已針對流暢度全面修復優化）
    const playClearTransition = (scene, currentScore) => {
        const logoImg = scene.add.image(sw / 2, sh / 2, `logo_step_${currentScore + 1}`);
        logoImg.setDepth(100); 
        logoImg.setScale(0);   
        logoImg.setAlpha(0.01); // 💡 修正 1：改為 0.01 讓 GPU 提前預熱貼圖，防止登場瞬間卡頓

        // 動畫序列
        scene.tweens.add({
            targets: logoImg,
            scale: 0.5,        
            alpha: 1,          
            duration: 400,     
            // 💡 修正 2：將 Back.easeOut 改為 Cubic.easeOut，去除了回彈時的計算抖動，放大更絲滑
            ease: 'Cubic.easeOut', 
            onComplete: () => {
                // 停留後消失
                scene.tweens.add({
                    targets: logoImg,
                    scale: 0.8, 
                    alpha: 0,   
                    delay: 300, 
                    duration: 500,
                    ease: 'Quad.easeIn', // 💡 讓淡出時也更平滑流暢
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

    // 重置遊戲到高度 0 的功能
    const restartGame = (scene) => {
        score = 0; 
        if (scoreText) scoreText.innerText = score;
        
        if (container) {
            container.style.backgroundImage = `url('${bgs[0]}
