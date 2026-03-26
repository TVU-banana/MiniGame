import { _decorator, Component, UITransform, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Stick')
export class Stick extends Component {
    private currentLength: number = 0;
    private isGrowing: boolean = false;
    private isFalling: boolean = false;

    grow(deltaTime: number, speed: number) {
        this.currentLength += speed * deltaTime;
        const transform = this.node.getComponent(UITransform);
        if (transform) {
            transform.height = this.currentLength;
        }
    }

    getLength(): number {
        return this.currentLength;
    }

    setGrowing(value: boolean) {
        this.isGrowing = value;
    }

    fallDown(callback: () => void) {
        this.isFalling = true;
        tween(this.node)
            .to(0.5, { eulerAngles: new Vec3(0, 0, -90) })
            .call(() => {
                this.isFalling = false;
                if (callback) {
                    callback();
                }
            })
            .start();
    }

    reset() {
        this.currentLength = 0;
        this.isGrowing = false;
        this.isFalling = false;
        this.node.eulerAngles = new Vec3(0, 0, 0);
        const transform = this.node.getComponent(UITransform);
        if (transform) {
            transform.height = 0;
        }
    }

    getIsFalling(): boolean {
        return this.isFalling;
    }
}
