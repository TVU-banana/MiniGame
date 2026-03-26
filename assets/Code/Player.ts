import { _decorator, Component, Node, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Player')
export class Player extends Component {
    moveTo(targetX: number, targetY: number, speed: number, callback: () => void) {
        const distance = Math.abs(targetX - this.node.position.x);
        const duration = distance / speed;
        
        tween(this.node)
            .to(duration, { position: new Vec3(targetX, targetY, 0) })
            .call(callback)
            .start();
    }

    fallDown(callback: () => void) {
        tween(this.node)
            .to(0.5, { position: new Vec3(this.node.position.x, -500, 0) })
            .call(callback)
            .start();
    }
}
