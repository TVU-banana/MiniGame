import { _decorator, Component, Node, Label, UITransform, Prefab, instantiate, ScrollView, Button, director, Layout, Size } from 'cc';
const { ccclass, property } = _decorator;

interface ScoreRecord {
    score: number;
    grade: string;
    time: string;
}

@ccclass('Records')
export class Records extends Component {
    @property(Prefab)
    rowPrefab: Prefab = null;

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Button)
    backButton: Button = null;

    @property(Button)
    clearButton: Button = null;

    @property(Label)
    emptyText: Label = null;

    private recordsData: ScoreRecord[] = [];

    start() {
        this.loadRecords();
        this.createRecordsContent();
        this.bindButtons();
    }

    bindButtons() {
        if (this.backButton) {
            this.backButton.node.on(Button.EventType.CLICK, this.onBack, this);
        }
        if (this.clearButton) {
            this.clearButton.node.on(Button.EventType.CLICK, this.onClear, this);
        }
    }

    onBack() {
        director.loadScene('Main');
    }

    onClear() {
        this.recordsData = [];
        localStorage.removeItem('scoreRecords');
        this.createRecordsContent();
    }

    loadRecords() {
        const recordsJson = localStorage.getItem('scoreRecords');
        if (recordsJson) {
            this.recordsData = JSON.parse(recordsJson);
            if (this.recordsData.length > 20) {
                this.recordsData = this.recordsData.slice(-20);
                localStorage.setItem('scoreRecords', JSON.stringify(this.recordsData));
            }
        }
    }

    createRecordsContent() {
        const contentNode = this.scrollView.content;
        if (!contentNode) return;

        contentNode.removeAllChildren();

        let layout = contentNode.getComponent(Layout);
        if (!layout) {
            layout = contentNode.addComponent(Layout);
        }
        layout.type = Layout.Type.VERTICAL;
        layout.spacingY = 10;
        layout.paddingTop = 10;
        layout.paddingBottom = 10;
        

        if (this.emptyText) {
            this.emptyText.node.active = this.recordsData.length === 0;
        }

        if (this.recordsData.length === 0) {
            return;
        }

        const totalRecords = this.recordsData.length;
        const reversedRecords = [...this.recordsData].reverse();
        
        for (let i = 0; i < totalRecords; i++) {
            const record = reversedRecords[i];

            if (this.rowPrefab) {
                const rowNode = instantiate(this.rowPrefab);
                contentNode.addChild(rowNode);

                this.fillRowData(rowNode, record, totalRecords - i);
            }
        }

        layout.updateLayout();
        this.updateContentHeight(contentNode);
        layout.enabled = false;
    }

    // 替换 updateContentHeight 方法为：
private updateContentHeight(contentNode: Node) {
    const uiTransform = contentNode.getComponent(UITransform);
    if (!uiTransform) return;
    
    // 先获取所有子节点的总高度
    let totalChildrenHeight = 0;
    contentNode.children.forEach(child => {
        const childTransform = child.getComponent(UITransform);
        if (childTransform) {
            totalChildrenHeight += childTransform.height;
        }
    });
    
    const layout = contentNode.getComponent(Layout);
    const spacingTotal = (contentNode.children.length - 1) * layout.spacingY;
    const paddingTotal = layout.paddingTop + layout.paddingBottom;
    
    const calculatedHeight = paddingTotal + totalChildrenHeight + spacingTotal;
    
    // 确保高度足够滚动
    uiTransform.height = Math.max(calculatedHeight, 910); // 比 ScrollView 高一点
    
    console.log(`Content 高度: ${uiTransform.height}, 子节点总高: ${totalChildrenHeight}`);
}


    fillRowData(rowNode: Node, record: ScoreRecord, index: number) {
        const labels = rowNode.children;
        if (labels.length >= 4) {
            const scoreLabel = labels[0].getComponent(Label);
            if (scoreLabel) {
                scoreLabel.string = `挑战分数：${record.score}`;
            }

            const timeLabel = labels[1].getComponent(Label);
            if (timeLabel) {
                timeLabel.string = `时间：${record.time}`;
            }

            const indexLabel = labels[2].getComponent(Label);
            if (indexLabel) {
                indexLabel.string = `序号：${index}`;
            }

            const gradeLabel = labels[3].getComponent(Label);
            if (gradeLabel) {
                gradeLabel.string = `评级：${record.grade}`;
            }
        }
    }
}
