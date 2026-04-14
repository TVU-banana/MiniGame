import { _decorator, Component, director, Node, Prefab, resources, instantiate } from 'cc';
const { ccclass } = _decorator;

@ccclass('Main')
export class Main extends Component {
    start() {
        this.loadParticleEffect();
    }

    loadParticleEffect() {
        resources.load('Prefab/FireParticles', Prefab, (err, prefab) => {
            if (prefab) {
                const particleNode = instantiate(prefab);
                this.node.addChild(particleNode);
                particleNode.setPosition(0, -500, 0);
                particleNode.active = true;
            }
        });
    }

    onBtnPlay() {
        director.loadScene('C1');
    }

    onBtnRecords() {
        director.loadScene('Records');
    }
}