import { _decorator, Component, Node, Prefab, instantiate, Vec3, Vec2, UITransform, Label, Sprite, Color, Button, tween, systemEvent, SystemEvent, director, AudioSource, Slider } from 'cc';
const { ccclass, property } = _decorator;

enum GameState {
    WAITING = 0,
    GROWING = 1,
    FALLING = 2,
    MOVING = 3,
    GAMEOVER = 4
}

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Prefab)
    platformPrefab: Prefab = null;

    @property(Prefab)
    stickPrefab: Prefab = null;

    @property(Node)
    player: Node = null;

    @property(Node)
    scoreLabel: Node = null;

    @property(Node)
    camera: Node = null;

    @property(Node)
    bg: Node = null;

    @property(Node)
    gameOverPanel: Node = null;

    @property(Node)
    finalScoreLabel: Node = null;

    @property(Node)
    restartButton: Node = null;

    @property(Node)
    homeButton: Node = null;

    @property(AudioSource)
    audioSource: AudioSource = null;

    @property(Node)
    settingButton: Node = null;

    @property(Node)
    settingPanel: Node = null;

    @property(Slider)
    volumeSlider: Slider = null;

    @property
    stickSpeed: number = 300;

    @property
    playerSpeed: number = 400;

    @property
    minPlatformDistance: number = 80;

    @property
    maxPlatformDistance: number = 200;

    @property
    minPlatformWidth: number = 50;

    @property
    maxPlatformWidth: number = 100;

    private platforms: Node[] = [];
    private currentStick: Node = null;
    private gameState: GameState = GameState.WAITING;
    private currentPlatformIndex: number = 0;
    private score: number = 0;
    private isTouching: boolean = false;

    start() {
        this.audioSource = this.node.getComponent(AudioSource);
        
        this.initGame();
        this.setupInput();
        
        if (this.scoreLabel) {
            const label = this.scoreLabel.getComponent(Label);
            if (label) {
                label.color = new Color(0, 255, 0);
            }
        }
        
        if (this.gameOverPanel) {
            this.gameOverPanel.active = false;
        }
        
        if (this.restartButton) {
            const button = this.restartButton.getComponent(Button);
            if (button) {
                button.node.on(Button.EventType.CLICK, this.onRestartClick, this);
            }
            const buttonLabel = this.restartButton.getComponentInChildren(Label);
            if (buttonLabel) {
                buttonLabel.color = new Color(0, 0, 255);
            }
        }
        
        if (this.homeButton) {
            const button = this.homeButton.getComponent(Button);
            if (button) {
                button.node.on(Button.EventType.CLICK, this.onHomeClick, this);
            }
            const buttonLabel = this.homeButton.getComponentInChildren(Label);
            if (buttonLabel) {
                buttonLabel.color = new Color(0, 0, 255);
            }
        }
        
        this.loadVolume();
        
        if (this.audioSource) {
            this.audioSource.play();
        }
        
        if (this.settingButton) {
            const button = this.settingButton.getComponent(Button);
            button?.node.on(Button.EventType.CLICK, this.onSettingClick, this);
        }
        
        if (this.settingPanel) {
            this.settingPanel.active = false;
            const closeBtnNode = this.settingPanel.children.find(child => child.name === 'Out');
            if (closeBtnNode) {
                const closeBtn = closeBtnNode.getComponent(Button);
                closeBtn?.node.on(Button.EventType.CLICK, this.onCloseSetting, this);
            }
        }
    }
    
    onSettingClick() {
        if (this.settingPanel && this.camera) {
            const cameraX = this.camera.position.x;
            this.settingPanel.setPosition(cameraX, 0, 0);
            
            if (this.audioSource && this.volumeSlider) {
                this.volumeSlider.progress = this.audioSource.volume;
            }
            
            this.settingPanel.active = true;
            this.settingPanel.setSiblingIndex(this.settingPanel.parent.children.length - 1);
            director.pause();
        }
    }
    
    onCloseSetting() {
        if (this.settingPanel) {
            this.settingPanel.active = false;
            director.resume();
        }
    }
    
    onVolumeChange(slider: Slider) {
        const volume = slider.progress;
        if (this.audioSource) {
            this.audioSource.volume = volume;
            if (!this.audioSource.playing) {
                this.audioSource.play();
            }
        }
        this.saveVolume(volume);
    }
    
    onSliderSlide(slider: Slider) {
        if (this.audioSource) {
            this.audioSource.volume = slider.progress;
            if (!this.audioSource.playing) {
                this.audioSource.play();
            }
        }
        this.saveVolume(slider.progress);
    }

    onSliderSlideEvent(slider: Slider, customData: string) {
        if (this.audioSource) {
            this.audioSource.volume = slider.progress;
            if (!this.audioSource.playing) {
                this.audioSource.play();
            }
        }
        this.saveVolume(slider.progress);
    }
    
    saveVolume(volume: number) {
        localStorage.setItem('gameVolume', volume.toString());
    }
    
    loadVolume() {
        const saved = localStorage.getItem('gameVolume');
        let volume = 0.2;
        if (saved !== null) {
            volume = parseFloat(saved);
        }
        if (this.audioSource) {
            this.audioSource.volume = volume;
        }
        if (this.volumeSlider) {
            this.volumeSlider.progress = volume;
        }
    }
    
    onHomeClick() {
        director.loadScene('Main');
    }
    
    onRestartClick() {
        if (this.gameOverPanel) {
            this.gameOverPanel.active = false;
        }
        this.initGame();
        this.gameState = GameState.WAITING;
    }

    initGame() {
        this.platforms.forEach(p => p.destroy());
        this.platforms = [];
        if (this.currentStick) {
            this.currentStick.destroy();
            this.currentStick = null;
        }

        this.score = 0;
        this.updateScoreLabel();
        this.currentPlatformIndex = 0;

        const startPlatform = this.createPlatform(-200, 60);
        startPlatform.setPosition(-200, -400, 0);
        this.platforms.push(startPlatform);

        const targetPlatform = this.createRandomPlatform();
        this.platforms.push(targetPlatform);

        this.player.setPosition(-200, -110, 0);

        this.createStick();

        this.camera.setPosition(0, 0, 1000);
    }

    createPlatform(x: number, width: number): Node {
        const platform = instantiate(this.platformPrefab);
        this.node.parent.addChild(platform);
        const transform = platform.getComponent(UITransform);
        if (transform) {
            transform.width = width;
            transform.height = 500;
        }
        platform.setPosition(x, -400, 0);
        return platform;
    }

    createRandomPlatform(): Node {
        const lastPlatform = this.platforms[this.platforms.length - 1];
        const lastTransform = lastPlatform.getComponent(UITransform);
        const lastWidth = lastTransform ? lastTransform.width : 60;
        const lastRight = lastPlatform.position.x + lastWidth / 2;
        
        const width = this.minPlatformWidth + Math.random() * (this.maxPlatformWidth - this.minPlatformWidth);
        const distance = this.minPlatformDistance + Math.random() * (this.maxPlatformDistance - this.minPlatformDistance);
        const x = lastRight + distance + width / 2;
        return this.createPlatform(x, width);
    }

    createStick() {
        if (this.currentStick) {
            this.currentStick.destroy();
        }
        this.currentStick = instantiate(this.stickPrefab);
        const currentPlatform = this.platforms[this.currentPlatformIndex];
        currentPlatform.addChild(this.currentStick);
        
        const platformTransform = currentPlatform.getComponent(UITransform);
        const platformWidth = platformTransform ? platformTransform.width / 2 : 30;
        this.currentStick.setPosition(platformWidth, 250, 0);
        
        const transform = this.currentStick.getComponent(UITransform);
        if (transform) {
            transform.height = 0;
            transform.anchorPoint = new Vec2(0.5, 0);
        }
    }

    setupInput() {
        systemEvent.on(SystemEvent.EventType.TOUCH_START, this.onTouchStart, this);
        systemEvent.on(SystemEvent.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onTouchStart() {
        if (director.isPaused()) return;
        
        if (this.gameState === GameState.GAMEOVER) {
            this.initGame();
            this.gameState = GameState.WAITING;
            return;
        }
        
        if (this.gameState === GameState.WAITING) {
            this.gameState = GameState.GROWING;
            this.isTouching = true;
        }
    }

    onTouchEnd() {
        if (director.isPaused()) return;
        
        if (this.gameState === GameState.GROWING) {
            this.gameState = GameState.FALLING;
            this.isTouching = false;
            this.fallStick();
        }
    }

    fallStick() {
        const stick = this.currentStick.getComponent('Stick') as any;
        if (stick && stick.fallDown) {
            stick.fallDown(() => {
                this.gameState = GameState.MOVING;
                this.movePlayer();
            });
        }
    }

    movePlayer() {
        const playerScript = this.player.getComponent('Player') as any;
        const stick = this.currentStick.getComponent('Stick') as any;
        const stickLength = stick ? stick.getLength() : 0;
        
        const currentPlatform = this.platforms[this.currentPlatformIndex];
        const nextPlatform = this.platforms[this.currentPlatformIndex + 1];
        
        const currentTransform = currentPlatform.getComponent(UITransform);
        const nextTransform = nextPlatform.getComponent(UITransform);
        
        const currentWidth = currentTransform ? currentTransform.width : 60;
        const nextWidth = nextTransform ? nextTransform.width : 60;
        
        const currentRight = currentPlatform.position.x + currentWidth / 2;
        const nextLeft = nextPlatform.position.x - nextWidth / 2;
        const nextRight = nextPlatform.position.x + nextWidth / 2;
        
        const stickRight = currentRight + stickLength;
        
        const currentY = currentPlatform.position.y + 290;

        if (stickRight < nextLeft) {
            const targetX = stickRight;
            if (playerScript && playerScript.moveTo) {
                playerScript.moveTo(targetX, currentY, this.playerSpeed, () => {
                    this.playerFall();
                });
            }
        } else {
            const targetX = stickRight;
            if (playerScript && playerScript.moveTo) {
                playerScript.moveTo(targetX, currentY, this.playerSpeed, () => {
                    if (stickRight <= nextRight) {
                        const nextX = nextPlatform.position.x;
                        if (playerScript && playerScript.moveTo) {
                            playerScript.moveTo(nextX, currentY, this.playerSpeed, () => {
                                this.score++;
                                this.updateScoreLabel();
                                this.currentPlatformIndex++;
                                this.nextRound();
                            });
                        }
                    } else {
                        this.playerFall();
                    }
                });
            }
        }
    }

    playerFall() {
        const playerScript = this.player.getComponent('Player') as any;
        if (playerScript && playerScript.fallDown) {
            playerScript.fallDown(() => {
                this.gameOver();
            });
        }
    }

    nextRound() {
        const newPlatform = this.createRandomPlatform();
        this.platforms.push(newPlatform);
        
        this.createStick();
        this.gameState = GameState.WAITING;
    }

    gameOver() {
        this.gameState = GameState.GAMEOVER;
        console.log('Game Over! Score:', this.score);
        
        if (this.gameOverPanel) {
            this.gameOverPanel.active = true;
            this.gameOverPanel.setPosition(0, 0, 0);
            this.gameOverPanel.setSiblingIndex(this.gameOverPanel.parent.children.length - 1);
        }
        
        if (this.finalScoreLabel) {
            const label = this.finalScoreLabel.getComponent(Label);
            if (label) {
                label.string = '当前分数：' + this.score;
                label.color = new Color(0, 255, 0);
            }
        }
    }

    updateScoreLabel() {
        if (this.scoreLabel) {
            const label = this.scoreLabel.getComponent(Label);
            if (label) {
                label.string = '分数：' + this.score;
            }
        }
    }

    update(deltaTime: number) {
        if (this.gameState === GameState.GROWING && this.isTouching && this.currentStick) {
            const stick = this.currentStick.getComponent('Stick') as any;
            if (stick && stick.grow) {
                stick.grow(deltaTime, this.stickSpeed);
            }
        }

        if (this.player && this.camera) {
            const targetX = this.player.position.x;
            const currentX = this.camera.position.x;
            const newX = currentX + (targetX - currentX) * 0.1;
            this.camera.setPosition(newX, 0, 1000);
            
            if (this.bg) {
                this.bg.setPosition(newX, 0, 0);
                const bgTransform = this.bg.getComponent(UITransform);
                const bgSprite = this.bg.getComponent(Sprite);
                if (bgTransform) {
                    const minWidth = 1500;
                    const neededWidth = Math.max(minWidth, newX + 1000);
                    if (bgTransform.width < neededWidth) {
                        bgTransform.width = neededWidth;
                        if (bgSprite) {
                            bgSprite.color = new Color(255, 255, 255, 255);
                        }
                    }
                }
            }
            
            if (this.scoreLabel) {
                this.scoreLabel.setPosition(newX -  250, 500, 0);
            }
            
            if (this.gameOverPanel && this.gameOverPanel.active) {
                this.gameOverPanel.setPosition(newX, 0, 0);
            }
            
            if (this.settingButton) {
                this.settingButton.setPosition(newX + 280, 550, 0);
            }
            
            if (this.settingPanel && this.settingPanel.active) {
                this.settingPanel.setPosition(newX , 0, 0);
            }
        }
    }
}
