import { _decorator, Component, Node, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Player')
export class Player extends Component {
    private time: number = 0;
    private isMoving: boolean = false;

    onLoad() {
        this.time = 0;
        this.schedule(this.breath, 0.016);
    }

    private breath() {
        if (this.isMoving) return;
        this.time += 0.016;
        const scaleY = 1 + Math.sin(this.time * 2) * 0.05;
        const scaleX = 1 - Math.sin(this.time * 2) * 0.03;
        this.node.setScale(scaleX, scaleY, 1);
    }

    moveTo(targetX: number, targetY: number, speed: number, callback: () => void) {
        this.isMoving = true;
        const distance = Math.abs(targetX - this.node.position.x);
        const duration = distance / speed;
        
        tween(this.node)
            .to(duration, { position: new Vec3(targetX, targetY, 0) })
            .call(() => {
                this.isMoving = false;
                this.time = 0;
                callback();
            })
            .start();
    }

    fallDown(callback: () => void) {
        this.isMoving = true;
        tween(this.node)
            .to(0.5, { position: new Vec3(this.node.position.x, -500, 0) })
            .call(callback)
            .start();
    }
}
